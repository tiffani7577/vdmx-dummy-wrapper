import { Router, Request, Response } from 'express';
import OSCSender from '../services/osc-sender.js';
import AbletonOSCService from '../services/ableton-osc.js';
import { SONG_PRESETS, getSongById, getProgramSlot } from '../services/song-presets.js';

const router = Router();

// ─── VDMX OSC Configuration ───────────────────────────────────────────────────
let vdmxConfig = {
  host: process.env.VDMX_HOST || 'localhost',
  oscPort: parseInt(process.env.VDMX_OSC_PORT || '1234'),
  oscQueryPort: parseInt(process.env.VDMX_OSCQUERY_PORT || '8000'),
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

// ─── Generic OSC Send ─────────────────────────────────────────────────────────
router.post('/send', async (req: Request, res: Response) => {
  const { address, args } = req.body;
  if (!address) return res.status(400).json({ error: 'Missing OSC address' });
  try {
    await oscSender.send({ address, args: args || [] });
    res.json({ success: true, sent: { address, args } });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── Song Presets ─────────────────────────────────────────────────────────────
router.get('/songs', (_req: Request, res: Response) => {
  res.json({ songs: SONG_PRESETS });
});

router.post('/songs/:songId/activate', async (req: Request, res: Response) => {
  const { songId } = req.params;
  const song = getSongById(songId);
  if (!song) return res.status(404).json({ error: `Song "${songId}" not found` });
  try {
    await oscSender.triggerMediaBinPage(song.mediaBinPage);
    if (song.vdmxPreset) await oscSender.triggerPreset(song.vdmxPreset);
    await oscSender.sendInt(song.oscAddress, 1);
    console.log(`[vdmx] Activated song: ${song.name} → page ${song.mediaBinPage}`);
    res.json({ success: true, song });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── Program Slots ────────────────────────────────────────────────────────────
router.post('/songs/:songId/programs/:programId/trigger', async (req: Request, res: Response) => {
  const { songId, programId } = req.params;
  const program = getProgramSlot(songId, programId);
  if (!program) return res.status(404).json({ error: `Program "${programId}" not found in song "${songId}"` });
  try {
    if (program.mediaBinPage !== undefined) await oscSender.triggerMediaBinPage(program.mediaBinPage);
    if (program.vdmxPreset) await oscSender.triggerPreset(program.vdmxPreset);
    await oscSender.sendInt(program.oscAddress, 1);
    console.log(`[vdmx] Triggered program: ${program.label} → ${program.oscAddress}`);
    res.json({ success: true, program });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── VDMX Parameters ─────────────────────────────────────────────────────────
router.get('/parameters', async (_req: Request, res: Response) => {
  const parameters = [
    ...SONG_PRESETS.map((s) => ({
      address: s.oscAddress,
      type: 'i',
      description: `Activate song: ${s.name}`,
      category: 'song',
    })),
    ...SONG_PRESETS.flatMap((s) =>
      s.programs.map((p) => ({
        address: p.oscAddress,
        type: 'i',
        description: `${s.name} → ${p.label}: ${p.description}`,
        category: 'program',
        songId: s.id,
        programId: p.id,
      }))
    ),
    { address: '/vdmx/mediaBin/page', type: 'i', description: 'Media Bin page index', category: 'mediaBin' },
    { address: '/vdmx/preset/load', type: 's', description: 'Load VDMX preset by name', category: 'preset' },
    { address: '/vdmx/layer/0/opacity', type: 'f', description: 'Layer 0 opacity (0.0–1.0)', category: 'layer' },
    { address: '/vdmx/layer/1/opacity', type: 'f', description: 'Layer 1 opacity (0.0–1.0)', category: 'layer' },
    { address: '/vdmx/master/brightness', type: 'f', description: 'Master brightness (0.0–1.0)', category: 'master' },
  ];
  res.json({ parameters });
});

// ─── Ableton Live Grid ────────────────────────────────────────────────────────
router.get('/ableton/state', (_req: Request, res: Response) => {
  res.json({ state: abletonService.getState() });
});

router.post('/ableton/config', (req: Request, res: Response) => {
  const { host, sendPort, listenPort } = req.body;
  if (host) abletonConfig.host = host;
  if (sendPort) abletonConfig.sendPort = Number(sendPort);
  if (listenPort) abletonConfig.listenPort = Number(listenPort);
  abletonService.updateConfig(abletonConfig.host, abletonConfig.sendPort, abletonConfig.listenPort);
  res.json({ success: true, config: abletonConfig });
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

// ─── Effects / LFO / Macro ────────────────────────────────────────────────────
router.post('/lfo', async (req: Request, res: Response) => {
  const { effectId, shape, speed, intensity } = req.body;
  try {
    await oscSender.send({
      address: `/vdmx/lfo/${effectId}`,
      args: [
        { type: 's', value: shape },
        { type: 'f', value: parseFloat(speed) },
        { type: 'f', value: parseFloat(intensity) / 100 },
      ],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/macro', async (req: Request, res: Response) => {
  const { macroId, value } = req.body;
  try {
    await oscSender.sendFloat(`/vdmx/macro/${macroId}`, parseFloat(value) / 100);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/scene', async (req: Request, res: Response) => {
  const { sceneName } = req.body;
  try {
    await oscSender.triggerPreset(sceneName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
export { oscSender, abletonService };
