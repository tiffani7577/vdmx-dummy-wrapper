import { Router, Request, Response } from 'express';
import OSCSender from '../services/osc-sender.js';
import AbletonOSCService from '../services/ableton-osc.js';
import { OSCQueryDiscovery } from '../services/oscquery-discovery.js';
import { db } from '../db.js';
import { songs, programSlots } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();
const discovery = new OSCQueryDiscovery();

// Cache for last sent values to prevent feedback loops
const lastSentValues: Record<string, any> = {};

// ─── VDMX OSC Configuration ───────────────────────────────────────────────────
let vdmxConfig = {
  host: process.env.VDMX_HOST || 'localhost',
  oscPort: parseInt(process.env.VDMX_OSC_PORT || '1234'),
  oscQueryPort: parseInt(process.env.VDMX_OSCQUERY_PORT || '2345'),
};

// ─── Ableton OSC Configuration ────────────────────────────────────────────────
let abletonConfig = {
  host: process.env.ABLETON_HOST || 'localhost',
  sendPort: parseInt(process.env.ABLETON_SEND_PORT || '11000'),
  listenPort: parseInt(process.env.ABLETON_LISTEN_PORT || '11001'),
};

// ─── Service Instances ────────────────────────────────────────────────────────
let oscSender = new OSCSender(vdmxConfig.host, vdmxConfig.oscPort);
let abletonService = new AbletonOSCService(
  abletonConfig.host,
  abletonConfig.sendPort,
  abletonConfig.listenPort
);

// Start Ableton OSC service (non-blocking)
abletonService.start().catch((e: any) =>
  console.warn('[vdmx.ts] Ableton OSC start failed (Ableton may not be running):', e)
);

// ─── VDMX Config ──────────────────────────────────────────────────────────────
router.get('/config', (_req: Request, res: Response) => {
  res.json({ vdmx: vdmxConfig, ableton: abletonConfig });
});

router.post('/config', (req: Request, res: Response) => {
  const { host, oscPort, oscQueryPort } = req.body;
  if (host) vdmxConfig.host = host;
  if (oscPort) vdmxConfig.oscPort = Number(oscPort);
  if (oscQueryPort) vdmxConfig.oscQueryPort = Number(oscQueryPort);
  oscSender.updateTarget(vdmxConfig.host, vdmxConfig.oscPort);
  res.json({ success: true, config: vdmxConfig });
});

// ─── VDMX Connection Test ─────────────────────────────────────────────────────
router.get('/connect', async (_req: Request, res: Response) => {
  try {
    await oscSender.sendInt('/vdmx/ping', 1);
    res.json({ connected: true, config: vdmxConfig });
  } catch (error) {
    res.json({
      connected: false,
      error: String(error),
      note: 'UDP is connectionless — check VDMX is running and OSC port is correct',
      config: vdmxConfig,
    });
  }
});

// ─── Generic OSC Send with Feedback Loop Prevention ──────────────────────────
router.post('/send', async (req: Request, res: Response) => {
  const { address, args } = req.body;
  if (!address) return res.status(400).json({ error: 'Missing OSC address' });
  
  // Prevent feedback loops: don't send if the value is identical to the last one sent
  const valKey = `${address}:${JSON.stringify(args)}`;
  if (lastSentValues[address] === valKey) {
    return res.json({ success: true, skipped: true });
  }
  
  try {
    await oscSender.send({ address, args: args || [] });
    lastSentValues[address] = valKey;
    res.json({ success: true, sent: { address, args } });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── Dynamic Song Management ──────────────────────────────────────────────────
router.get('/songs', async (req: Request, res: Response) => {
  try {
    const allSongs = await db.select().from(songs).orderBy(songs.order);
    res.json(allSongs);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

router.post('/songs', async (req: Request, res: Response) => {
  try {
    const { name, bpm, mediaBinPage, vdmxPreset } = req.body;
    const [newSong] = await db.insert(songs).values({ name, bpm, mediaBinPage, vdmxPreset });
    res.json({ id: newSong.insertId });
  } catch (e) {
    res.status(500).json({ error: "Failed to create song" });
  }
});

router.delete('/songs/:id', async (req: Request, res: Response) => {
  try {
    await db.delete(songs).where(eq(songs.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete song" });
  }
});

// ─── OSCQuery Discovery ───────────────────────────────────────────────────────
router.get('/discover', async (req: Request, res: Response) => {
  try {
    const tree = await discovery.discover();
    const shaders = await discovery.getInstalledShaders();
    res.json({ tree, shaders });
  } catch (e) {
    res.status(500).json({ error: "OSCQuery discovery failed" });
  }
});

// ─── Ableton Live Grid ────────────────────────────────────────────────────────
router.get('/ableton/state', (_req: Request, res: Response) => {
  res.json({ state: abletonService.getState() });
});

router.post('/ableton/clip/fire', async (req: Request, res: Response) => {
  const { trackIndex, clipIndex } = req.body;
  if (trackIndex === undefined || clipIndex === undefined)
    return res.status(400).json({ error: 'Missing trackIndex or clipIndex' });
  try {
    await abletonService.fireClip(Number(trackIndex), Number(clipIndex));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/ableton/clip/stop', async (req: Request, res: Response) => {
  const { trackIndex, clipIndex } = req.body;
  if (trackIndex === undefined || clipIndex === undefined)
    return res.status(400).json({ error: 'Missing trackIndex or clipIndex' });
  try {
    await abletonService.stopClip(Number(trackIndex), Number(clipIndex));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/ableton/tempo', async (req: Request, res: Response) => {
  const { bpm } = req.body;
  if (!bpm) return res.status(400).json({ error: 'Missing bpm' });
  try {
    await abletonService.setTempo(Number(bpm));
    res.json({ success: true, bpm });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/ableton/refresh', async (_req: Request, res: Response) => {
  try {
    await abletonService.refreshClipGrid();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
export { oscSender, abletonService };
