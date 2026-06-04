import {
  INTERSECT_TEMPLATE_EFFECTS,
  INTERSECT_TEMPLATE_MASTERS,
  VDMX_CONTROL_SURFACE_NAME,
} from "./intersect-template-effects.js";
import {
  VDMX_CANVAS_NAME,
  VDMX_DEFAULT_OSC_INPUT_PORT,
  VDMX_FX_CHAIN_LABEL,
  VDMX_LOOPBACK_OSC_LABEL,
  VDMX_WET_DRY_PARAM,
  canvasFxWetDryOsc,
} from "./vdmx-canvas-fx.js";

/** 25 effect buttons (excludes Rutt-Etra — not in the live Canvas FX chain) */
export const CONTROL_SURFACE_EFFECTS = INTERSECT_TEMPLATE_EFFECTS.filter(
  (effect) => effect.id !== "rutt_etra"
);

type OscSender = {
  enabled: boolean;
  senderType: number;
  dataSenderType: number;
  msgAddress: string;
  outputIPAddress: string;
  outputPort: number;
  outputLabel: string;
  normalizeFlag: boolean;
  floatInvertFlag: boolean;
  boolThreshVal: number;
  boolInvertFlag: boolean;
  intInvertFlag: boolean;
  lowIntVal: number;
  highIntVal: number;
};

type UiBuilder = Record<string, unknown> & {
  VVGridSize: string;
  VVGridMode: boolean;
};

function gridFrame(col: number, row: number, width: number, height: number): string {
  return `{{${col}, ${row}}, {${width}, ${height}}}`;
}

/**
 * OSC sender — button toggle sends normalized float 0/1 to the Canvas FX Wet/Dry path.
 * Uses VDMX loopback (127.0.0.1:1234) so imported buttons drive FX with no manual mapping.
 */
function wetDryOscSender(wetDryAddress: string): OscSender[] {
  return [
    {
      enabled: true,
      senderType: 4,
      dataSenderType: 2,
      msgAddress: wetDryAddress,
      outputIPAddress: "127.0.0.1",
      outputPort: VDMX_DEFAULT_OSC_INPUT_PORT,
      outputLabel: VDMX_LOOPBACK_OSC_LABEL,
      normalizeFlag: true,
      floatInvertFlag: false,
      boolThreshVal: 0.5,
      boolInvertFlag: false,
      intInvertFlag: false,
      lowIntVal: 0,
      highIntVal: 100,
    },
  ];
}

function oscReceiver(address: string) {
  return [
    {
      src: address,
      wantsEnbl: true,
      ltch: false,
      tog: false,
      thr: 0.5,
    },
  ];
}

function fxToggleButton(wetDrySendAddress: string, col: number, row: number, width = 2, height = 1) {
  return {
    grdFrm: gridFrame(col, row, width, height),
    sendEnabled: true,
    toggle: true,
    val: false,
    mtxFlg: false,
    mtxGrp: "INTERSECT FX",
    /** Sending OSC address — drives Canvas FX Wet/Dry when toggled */
    sndrs: wetDryOscSender(wetDrySendAddress),
    wetDrySendAddress,
  };
}

function masterSlider(address: string, col: number, row: number, width = 2, height = 2, defaultVal = 1) {
  return {
    grdFrm: gridFrame(col, row, width, height),
    sendEnabled: true,
    minRange: 0,
    maxRange: 1,
    val: defaultVal,
    publishNorm: true,
    markArray: [{ mval: 0.5 }],
    rcvrs: oscReceiver(address),
  };
}

export function buildEffectSendMap() {
  return CONTROL_SURFACE_EFFECTS.map((effect) => ({
    button: effect.vdmxIsfName,
    isfFile: effect.isfFilename,
    sendAddress: canvasFxWetDryOsc(effect.isfFilename),
  }));
}

/** VDMX imports Control Surface layouts as JSON (Workspace → Control Surface → Import JSON Layout). */
export function generateVdmxControlSurfaceTemplate() {
  const keyArray: string[] = [];
  const classArray: string[] = [];
  const uiBuilder: UiBuilder = {
    VVGridSize: "{6, 14}",
    VVGridMode: true,
  };

  INTERSECT_TEMPLATE_MASTERS.forEach((master, index) => {
    keyArray.push(master.label);
    classArray.push("Slider");
    uiBuilder[master.label] = masterSlider(master.osc, index * 2, 0, 2, 2, master.id === "opacity" ? 1 : 0.5);
  });

  const effectStartRow = 3;
  const colsPerRow = 3;
  const buttonWidth = 2;

  const effectSendMap = buildEffectSendMap();

  CONTROL_SURFACE_EFFECTS.forEach((effect, index) => {
    const wetDrySendAddress = canvasFxWetDryOsc(effect.isfFilename);
    const row = effectStartRow + Math.floor(index / colsPerRow);
    const col = (index % colsPerRow) * buttonWidth;
    keyArray.push(effect.vdmxIsfName);
    classArray.push("Button");
    uiBuilder[effect.vdmxIsfName] = fxToggleButton(wetDrySendAddress, col, row, buttonWidth, 1);
  });

  return {
    _meta: {
      name: VDMX_CONTROL_SURFACE_NAME,
      description:
        "INTERSECT Control Surface — 25 FX toggles with OSC senders wired to Canvas Video FX Wet/Dry paths.",
      generatedBy: "vdmx-dummy-wrapper",
      oscQueryEnabled: true,
      pluginRenameHint: `Rename the Control Surface plugin to "${VDMX_CONTROL_SURFACE_NAME}" after import.`,
      canvasFxChain: `${VDMX_CANVAS_NAME} → ${VDMX_FX_CHAIN_LABEL}`,
      wetDryParameter: VDMX_WET_DRY_PARAM,
      oscInputPort: VDMX_DEFAULT_OSC_INPUT_PORT,
      loopbackOscLabel: VDMX_LOOPBACK_OSC_LABEL,
      effectSendMap,
      setupGuide: generateSetupGuideMarkdown(),
    },
    keyArray,
    uiBuilder,
    classArray,
  };
}

export function generateVdmxControlSurfaceJson(pretty = true): string {
  const template = generateVdmxControlSurfaceTemplate();
  return JSON.stringify(template, null, pretty ? 2 : 0);
}

export function getTemplateDownloadFilename(): string {
  return "INTERSECT-Control-Surface.json";
}

export function getSetupGuideFilename(): string {
  return "INTERSECT-VDMX-Setup-Guide.md";
}

/** One-page setup guide — which ISF file each button controls */
export function generateSetupGuideMarkdown(): string {
  const lines = [
    "# INTERSECT × VDMX — One-Page Setup Guide",
    "",
    "Import **INTERSECT-Control-Surface.json** — each button already **sends OSC** to its Canvas FX Wet/Dry address.",
    "",
    "## Before you import (~5 min)",
    "",
    `1. In VDMX, open **${VDMX_CANVAS_NAME}** → **${VDMX_FX_CHAIN_LABEL}** and add each ISF below (top to bottom).`,
    "2. Set every effect's **Wet / Dry** slider to **0** (dry / bypassed).",
    `3. Enable VDMX **OSC Input** on port **${VDMX_DEFAULT_OSC_INPUT_PORT}** (Preferences → OSC).`,
    "",
    "## Import (~2 min)",
    "",
    "1. Workspace Inspector → **Plugins** → **+ Add Plugin** → **Control Surface**.",
    "2. Inspector → **Import JSON Layout** → `INTERSECT-Control-Surface.json`.",
    "3. Enable **OSCQuery** on the plugin.",
    "",
    "Each toggle **sends float 0 or 1** to its Wet/Dry path — no manual Send tab wiring needed.",
    "",
    "## Button → ISF file → Sending OSC address",
    "",
    "| Button | ISF file | Send address (Canvas FX Wet/Dry) |",
    "|---|---|---|",
  ];

  CONTROL_SURFACE_EFFECTS.forEach((effect) => {
    const sendAddress = canvasFxWetDryOsc(effect.isfFilename);
    const bundled = effect.bundledInVdmx ? "built-in" : "download ISF";
    lines.push(
      `| ${effect.vdmxIsfName} | \`${effect.isfFilename}\` (${bundled}) | \`${sendAddress}\` |`
    );
  });

  lines.push(
    "",
    "## Examples",
    "",
    "- **Kaleidoscope** → `/Canvas/Video FX/Kaleidoscope/Wet / Dry`",
    "- **RGB Shift** → `/Canvas/Video FX/Glitch Shifter/Wet / Dry`",
    "- **Feedback** → `/Canvas/Video FX/Zooming Feedback/Wet / Dry`",
    "- **Datamosh** → `/Canvas/Video FX/FastMosh/Wet / Dry`",
    "- **Pixel Sort** → `/Canvas/Video FX/Sorting Smear/Wet / Dry`",
    "",
    "## Notes",
    "",
    `- Canvas must be named **${VDMX_CANVAS_NAME}** and ISF filenames must match exactly.`,
    `- Toggle ON = Wet/Dry **1.0**. Toggle OFF = **0.0**.`,
    ""
  );

  return lines.join("\n");
}
