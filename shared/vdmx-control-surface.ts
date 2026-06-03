import {
  INTERSECT_TEMPLATE_EFFECTS,
  INTERSECT_TEMPLATE_MASTERS,
  VDMX_CONTROL_SURFACE_NAME,
} from "./intersect-template-effects.js";

type OscReceiver = {
  src: string;
  wantsEnbl: boolean;
  ltch: boolean;
  tog: boolean;
  thr: number;
};

type UiBuilder = Record<string, unknown> & {
  VVGridSize: string;
  VVGridMode: boolean;
};

function gridFrame(col: number, row: number, width: number, height: number): string {
  return `{{${col}, ${row}}, {${width}, ${height}}}`;
}

function oscReceiver(address: string): OscReceiver[] {
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

function toggleButton(address: string, col: number, row: number, width = 2, height = 1) {
  return {
    grdFrm: gridFrame(col, row, width, height),
    sendEnabled: true,
    toggle: true,
    val: false,
    mtxFlg: false,
    mtxGrp: "INTERSECT FX",
    rcvrs: oscReceiver(address),
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

  INTERSECT_TEMPLATE_EFFECTS.forEach((effect, index) => {
    const row = effectStartRow + Math.floor(index / colsPerRow);
    const col = (index % colsPerRow) * buttonWidth;
    keyArray.push(effect.vdmxIsfName);
    classArray.push("Button");
    uiBuilder[effect.vdmxIsfName] = toggleButton(effect.osc, col, row, buttonWidth, 1);
  });

  return {
    _meta: {
      name: VDMX_CONTROL_SURFACE_NAME,
      description: "INTERSECT plug-and-play Control Surface — import in VDMX, enable OSCQuery, then Refresh in INTERSECT.",
      generatedBy: "vdmx-dummy-wrapper",
      oscQueryEnabled: true,
      pluginRenameHint: `Rename the Control Surface plugin to "${VDMX_CONTROL_SURFACE_NAME}" after import.`,
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
