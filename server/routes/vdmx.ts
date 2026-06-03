import { Router } from "express";
import { osc } from "osc";

const router = Router();

// VDMX OSC configuration
let vdmxConfig = {
  host: process.env.VDMX_HOST || "localhost",
  oscPort: parseInt(process.env.VDMX_OSC_PORT || "1234"),
  oscqueryPort: parseInt(process.env.VDMX_OSCQUERY_PORT || "9000"),
};

// Test connection to VDMX
router.get("/connect", async (req, res) => {
  try {
    // Simple connectivity check
    res.json({ connected: true, config: vdmxConfig });
  } catch (error) {
    res.status(500).json({ connected: false, error: "Failed to connect" });
  }
});

// Get VDMX configuration
router.get("/config", (req, res) => {
  res.json(vdmxConfig);
});

// Update VDMX configuration
router.post("/config", (req, res) => {
  const { host, oscPort, oscqueryPort } = req.body;
  if (host) vdmxConfig.host = host;
  if (oscPort) vdmxConfig.oscPort = oscPort;
  if (oscqueryPort) vdmxConfig.oscqueryPort = oscqueryPort;
  res.json({ success: true, config: vdmxConfig });
});

// Send OSC message to VDMX
router.post("/send", (req, res) => {
  try {
    const { address, args } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Missing address" });
    }

    // Create OSC message
    const oscMessage = {
      address,
      args: args || [{ type: "i", value: 1 }],
    };

    // In production, you would send this via UDP to VDMX
    // For now, we'll log it
    console.log("OSC Message:", oscMessage);

    res.json({
      success: true,
      message: "OSC message sent",
      data: oscMessage,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OSC message" });
  }
});

// Get available VDMX parameters (via OSCQuery)
router.get("/parameters", async (req, res) => {
  try {
    // Mock parameters - in production, query VDMX OSCQuery
    const parameters = [
      { address: "/effect/mirror", type: "f", min: 0, max: 1 },
      { address: "/effect/glitch", type: "f", min: 0, max: 1 },
      { address: "/effect/color", type: "f", min: 0, max: 1 },
      { address: "/effect/kaleidoscope", type: "f", min: 0, max: 1 },
      { address: "/effect/blur", type: "f", min: 0, max: 1 },
      { address: "/effect/zoom", type: "f", min: 0, max: 1 },
      { address: "/effect/spin", type: "f", min: 0, max: 1 },
      { address: "/effect/focus", type: "f", min: 0, max: 1 },
      { address: "/effect/negative", type: "f", min: 0, max: 1 },
      { address: "/effect/mono", type: "f", min: 0, max: 1 },
    ];

    res.json({ parameters });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch parameters" });
  }
});

// Send LFO modulation
router.post("/lfo", (req, res) => {
  try {
    const { effectId, shape, speed, intensity } = req.body;

    const lfoMessage = {
      address: `/lfo/${effectId}`,
      args: [
        { type: "s", value: shape },
        { type: "f", value: speed },
        { type: "f", value: intensity / 100 },
      ],
    };

    console.log("LFO Message:", lfoMessage);

    res.json({
      success: true,
      message: "LFO modulation sent",
      data: lfoMessage,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send LFO" });
  }
});

// Send audio-reactive trigger
router.post("/audio-sync", (req, res) => {
  try {
    const { type, intensity } = req.body;

    const audioMessage = {
      address: `/audio/${type}`,
      args: [{ type: "f", value: intensity }],
    };

    console.log("Audio Sync Message:", audioMessage);

    res.json({
      success: true,
      message: "Audio sync sent",
      data: audioMessage,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send audio sync" });
  }
});

// Send scene/preset recall
router.post("/scene", (req, res) => {
  try {
    const { sceneName } = req.body;

    const sceneMessage = {
      address: `/scene/load`,
      args: [{ type: "s", value: sceneName }],
    };

    console.log("Scene Message:", sceneMessage);

    res.json({
      success: true,
      message: "Scene loaded",
      data: sceneMessage,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load scene" });
  }
});

// Send macro control
router.post("/macro", (req, res) => {
  try {
    const { macroId, value } = req.body;

    const macroMessage = {
      address: `/macro/${macroId}`,
      args: [{ type: "f", value: value / 100 }],
    };

    console.log("Macro Message:", macroMessage);

    res.json({
      success: true,
      message: "Macro sent",
      data: macroMessage,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send macro" });
  }
});

export default router;
