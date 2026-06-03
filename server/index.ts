import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import OSCQueryService, { VDMXConfig } from "./services/oscquery.js";
import OSCSender from "./services/osc-sender.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default VDMX config - can be updated via API
let vdmxConfig: VDMXConfig = {
  host: process.env.VDMX_HOST || "localhost",
  oscQueryPort: parseInt(process.env.VDMX_OSCQUERY_PORT || "8000"),
  oscPort: parseInt(process.env.VDMX_OSC_PORT || "9000"),
};

let oscQueryService = new OSCQueryService(vdmxConfig);
let oscSender = new OSCSender(vdmxConfig.host, vdmxConfig.oscPort);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // VDMX API Routes
  app.post("/api/vdmx/config", (req, res) => {
    try {
      const { host, oscQueryPort, oscPort } = req.body;
      vdmxConfig = {
        host: host || vdmxConfig.host,
        oscQueryPort: oscQueryPort || vdmxConfig.oscQueryPort,
        oscPort: oscPort || vdmxConfig.oscPort,
      };
      oscQueryService.updateConfig(vdmxConfig);
      oscSender = new OSCSender(vdmxConfig.host, vdmxConfig.oscPort);
      res.json({ success: true, config: vdmxConfig });
    } catch (error) {
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/vdmx/config", (_req, res) => {
    res.json(vdmxConfig);
  });

  app.get("/api/vdmx/connect", async (_req, res) => {
    try {
      const params = await oscQueryService.fetchParameters();
      res.json({
        success: true,
        connected: params.length > 0,
        parameterCount: params.length,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/vdmx/parameters", async (_req, res) => {
    try {
      const params = await oscQueryService.fetchParameters();
      res.json({ success: true, parameters: params });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post("/api/vdmx/send", async (req, res) => {
    try {
      const { address, args } = req.body;
      if (!address) {
        return res.status(400).json({ success: false, error: "Missing address" });
      }

      await oscSender.send({
        address,
        args: args || [],
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(
      `VDMX connected to ${vdmxConfig.host}:${vdmxConfig.oscQueryPort}`
    );
  });
}

startServer().catch(console.error);
