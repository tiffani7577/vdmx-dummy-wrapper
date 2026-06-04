import { Router, Request, Response } from 'express';
import OSCSender from '../services/osc-sender.js';
import AbletonOSCService from '../services/ableton-osc.js';
import { OSCQueryDiscovery } from '../services/oscquery-discovery.js';
import { buildIntersectMappings } from '../../shared/intersect-osc-mapping.js';
import {
  EFFECTS,
  GENERATORS,
  AUDIO_MAPPINGS,
  BLEND_MODES,
  MASTER_CONTROLS,
} from '../../shared/intersect-configs.js';
import { resolveIntersectFxOsc, discoverFxOscPairs, buildVdmxOscDiagnostics } from '../../shared/intersect-fx-osc.js';
import { INTERSECT_TEMPLATE_EFFECTS } from '../../shared/intersect-template-effects.js';
import { generateVdmxControlSurfaceJson, generateSetupGuideMarkdown } from '../../shared/vdmx-control-surface.js';
import { listSongs, createSong, deleteSong } from '../services/songs-store.js';

const router = Router();

// Cache for last sent values to prevent feedback loops
const lastSentValues: Record<string, any> = {};

// ─── VDMX OSC Configuration ───────────────────────────────────────────────────
let vdmxConfig = {
  host: process.env.VDMX_HOST || 'localhost',
  oscPort: parseInt(process.env.VDMX_OSC_PORT || '1234'),
  oscQueryPort: parseInt(process.env.VDMX_OSCQUERY_PORT || '2345'),
};

const discovery = new OSCQueryDiscovery(vdmxConfig.host, vdmxConfig.oscQueryPort);

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
  discovery.updateTarget(vdmxConfig.host, vdmxConfig.oscQueryPort);
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
  
  // Prevent feedback loops: skip only exact duplicate sends (same address + args)
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

// ─── Dynamic Song Management (JSON file store — no MySQL required) ───────────
router.get('/songs', async (_req: Request, res: Response) => {
  try {
    const allSongs = await listSongs();
    res.json(allSongs);
  } catch (e) {
    console.error('[Songs] Fetch failed:', e);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

router.post('/songs', async (req: Request, res: Response) => {
  try {
    const { name, bpm, mediaBinPage, vdmxPreset } = req.body;
    const song = await createSong({ name, bpm, mediaBinPage, vdmxPreset });
    res.json(song);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create song";
    console.error('[Songs] Create failed:', e);
    res.status(message.includes("required") ? 400 : 500).json({ error: message });
  }
});

router.delete('/songs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid song id" });
    }
    const removed = await deleteSong(id);
    if (!removed) {
      return res.status(404).json({ error: "Song not found" });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('[Songs] Delete failed:', e);
    res.status(500).json({ error: "Failed to delete song" });
  }
});

// ─── OSCQuery Discovery ───────────────────────────────────────────────────────
router.get('/discover', async (_req: Request, res: Response) => {
  try {
    const tree = await discovery.discover();
    const parameters = tree ? discovery.getAllParameters(tree) : [];
    const shaders = tree ? await discovery.getInstalledShaders() : [];
    const templateEffectControls = INTERSECT_TEMPLATE_EFFECTS.map((effect) => ({
      id: effect.id,
      name: effect.intersectLabel,
      osc: resolveIntersectFxOsc(effect.id) ?? effect.osc,
      aliases: [effect.vdmxIsfName, effect.isfFilename],
    }));

    const mappings = buildIntersectMappings(parameters, {
      effects: templateEffectControls,
      generators: GENERATORS,
      audio: AUDIO_MAPPINGS,
      blend: BLEND_MODES,
      master: MASTER_CONTROLS,
    });

    const fxOscPairs = discoverFxOscPairs(parameters);
    const diagnostics = buildVdmxOscDiagnostics(parameters);

    res.json({
      tree,
      parameters,
      shaders,
      mappings,
      fxOscPairs,
      diagnostics,
      oscQueryPort: vdmxConfig.oscQueryPort,
    });
  } catch (e) {
    res.status(500).json({ error: "OSCQuery discovery failed" });
  }
});

// ─── VDMX Control Surface Template ───────────────────────────────────────────
router.get('/control-surface-template', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="INTERSECT-Control-Surface.json"');
  res.send(generateVdmxControlSurfaceJson());
});

router.get('/setup-guide', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="INTERSECT-VDMX-Setup-Guide.md"');
  res.send(generateSetupGuideMarkdown());
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
