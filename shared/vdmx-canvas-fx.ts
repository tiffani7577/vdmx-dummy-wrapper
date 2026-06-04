/** Canonical VDMX Canvas FX chain naming for zero-mapping INTERSECT setups */

export const VDMX_CANVAS_NAME = "Canvas";
export const VDMX_FX_CHAIN_LABEL = "Video FX";
export const VDMX_WET_DRY_PARAM = "Wet / Dry";
export const VDMX_DEFAULT_OSC_INPUT_PORT = 1234;
export const VDMX_LOOPBACK_OSC_LABEL = "VDMX OSC Input";

/** Native OSC / data-source path for a Canvas FX Wet/Dry slider (no `.fs` in path) */
export function canvasFxWetDryOsc(isfFilename: string, canvasName = VDMX_CANVAS_NAME): string {
  return `/${canvasName}/${VDMX_FX_CHAIN_LABEL}/${isfStem(isfFilename)}/${VDMX_WET_DRY_PARAM}`;
}

export function isfStem(isfFilename: string): string {
  return isfFilename.replace(/\.fs$/i, "");
}
