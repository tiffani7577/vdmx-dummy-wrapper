/** VDMX Control Surface template — canonical effect list for plug-and-play setup */

import { canvasFxWetDryOsc } from "./vdmx-canvas-fx.js";

export interface IntersectTemplateEffect {
  id: string;
  /** Friendly label shown in INTERSECT dashboard */
  intersectLabel: string;
  /** Label on the VDMX Control Surface button (ISF / effect name) */
  vdmxIsfName: string;
  /** Exact `.fs` file to add to Canvas → Video FX (must match chain order) */
  isfFilename: string;
  /** Native VDMX OSC address for this effect's Canvas FX Wet/Dry slider */
  osc: string;
  /** Shipped with VDMX 6+ — no download needed */
  bundledInVdmx?: boolean;
  /** Direct ISF download when available */
  downloadUrl?: string;
  /** Fallback search on editor.isf.video */
  downloadSearchUrl: string;
}

export const VDMX_CONTROL_SURFACE_NAME = "INTERSECT";
export const INTERSECT_SETUP_TIME_MINUTES = 15;

export const INTERSECT_TEMPLATE_EFFECTS: IntersectTemplateEffect[] = [
  { id: "kaleidoscope", intersectLabel: "Mirror Fold", vdmxIsfName: "Kaleidoscope", isfFilename: "Kaleidoscope.fs", osc: canvasFxWetDryOsc("Kaleidoscope.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=kaleidoscope" },
  { id: "rgb_shift", intersectLabel: "Color Split", vdmxIsfName: "RGB Shift", isfFilename: "Glitch Shifter.fs", osc: canvasFxWetDryOsc("Glitch Shifter.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=rgb+shift" },
  { id: "bloom", intersectLabel: "Glow", vdmxIsfName: "Bloom", isfFilename: "Bloom.fs", osc: canvasFxWetDryOsc("Bloom.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=bloom" },
  { id: "vignette", intersectLabel: "Frame", vdmxIsfName: "Vignette", isfFilename: "v002 Vignette.fs", osc: canvasFxWetDryOsc("v002 Vignette.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=vignette" },
  { id: "blur", intersectLabel: "Blur", vdmxIsfName: "Gaussian Blur", isfFilename: "Multi Pass Gaussian Blur.fs", osc: canvasFxWetDryOsc("Multi Pass Gaussian Blur.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=gaussian+blur" },
  { id: "strobe", intersectLabel: "Strobe", vdmxIsfName: "Strobe", isfFilename: "Strobe.fs", osc: canvasFxWetDryOsc("Strobe.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=strobe" },
  { id: "invert", intersectLabel: "Invert", vdmxIsfName: "Color Invert", isfFilename: "Color Invert.fs", osc: canvasFxWetDryOsc("Color Invert.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=color+invert" },
  { id: "hue_rotate", intersectLabel: "Color Spin", vdmxIsfName: "Hue Rotate", isfFilename: "Multi Hue Shift.fs", osc: canvasFxWetDryOsc("Multi Hue Shift.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=hue+rotate" },
  { id: "fisheye", intersectLabel: "Fisheye", vdmxIsfName: "Barrel Distortion", isfFilename: "Bump Distortion.fs", osc: canvasFxWetDryOsc("Bump Distortion.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=barrel+distortion" },
  { id: "halftone", intersectLabel: "Dots", vdmxIsfName: "Halftone", isfFilename: "RGB Halftone.fs", osc: canvasFxWetDryOsc("RGB Halftone.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=halftone" },
  { id: "posterize", intersectLabel: "Flat", vdmxIsfName: "Posterize", isfFilename: "Posterize.fs", osc: canvasFxWetDryOsc("Posterize.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=posterize" },
  { id: "solarize", intersectLabel: "Solar", vdmxIsfName: "Solarize", isfFilename: "Solarize.fs", osc: canvasFxWetDryOsc("Solarize.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=solarize" },
  { id: "blowout", intersectLabel: "Blow Out", vdmxIsfName: "Color Blowout", isfFilename: "Color Blowout.fs", osc: canvasFxWetDryOsc("Color Blowout.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=color+blowout" },
  { id: "mirror", intersectLabel: "Symmetry", vdmxIsfName: "Mirror", isfFilename: "Mirror.fs", osc: canvasFxWetDryOsc("Mirror.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=mirror" },
  { id: "edge_detect", intersectLabel: "Wireframe", vdmxIsfName: "Edge Detect", isfFilename: "Edges.fs", osc: canvasFxWetDryOsc("Edges.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=edge+detect" },
  { id: "glitch_morph", intersectLabel: "Morph", vdmxIsfName: "Glitch Analog", isfFilename: "v002 Glitch Analog.fs", osc: canvasFxWetDryOsc("v002 Glitch Analog.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=glitch+analog" },
  { id: "scanlines", intersectLabel: "CRT", vdmxIsfName: "Scan Lines", isfFilename: "v002-CRT-Mask.fs", osc: canvasFxWetDryOsc("v002-CRT-Mask.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=scan+lines" },
  { id: "feedback_echo", intersectLabel: "Ghost Trails", vdmxIsfName: "Feedback", isfFilename: "Zooming Feedback.fs", osc: canvasFxWetDryOsc("Zooming Feedback.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=feedback" },
  { id: "pixel_sort", intersectLabel: "Digital Melt", vdmxIsfName: "Pixel Sort", isfFilename: "Sorting Smear.fs", osc: canvasFxWetDryOsc("Sorting Smear.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=pixel+sort" },
  { id: "datamosh", intersectLabel: "Datamosh", vdmxIsfName: "Datamosh", isfFilename: "FastMosh.fs", osc: canvasFxWetDryOsc("FastMosh.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=datamosh" },
  { id: "rutt_etra", intersectLabel: "Wireframe 3D", vdmxIsfName: "Rutt-Etra", isfFilename: "Rutt-Etra.fs", osc: canvasFxWetDryOsc("Rutt-Etra.fs"), downloadSearchUrl: "https://editor.isf.video/shaders?q=rutt+etra" },
  { id: "optical_flow", intersectLabel: "Liquid Motion", vdmxIsfName: "Optical Flow", isfFilename: "Optical Flow Distort.fs", osc: canvasFxWetDryOsc("Optical Flow Distort.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=optical+flow" },
  { id: "time_glitch", intersectLabel: "Rainbow Ghost", vdmxIsfName: "Zoom Feedback", isfFilename: "Time Glitch RGB.fs", osc: canvasFxWetDryOsc("Time Glitch RGB.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=time+glitch+rgb" },
  { id: "zoom_blur", intersectLabel: "Rush", vdmxIsfName: "Zoom Blur", isfFilename: "VVMotionBlur 3.0.fs", osc: canvasFxWetDryOsc("VVMotionBlur 3.0.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=zoom+blur" },
  { id: "displacement", intersectLabel: "Warp", vdmxIsfName: "Displacement Map", isfFilename: "Displacement.fs", osc: canvasFxWetDryOsc("Displacement.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=displacement+map" },
  { id: "audio_warp", intersectLabel: "Audio Warp", vdmxIsfName: "Waveform Displace", isfFilename: "Waveform Displace.fs", osc: canvasFxWetDryOsc("Waveform Displace.fs"), bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=waveform+displace" },
];

export const INTERSECT_TEMPLATE_MASTERS = [
  { id: "opacity", label: "Master Opacity", osc: "/OSCQUERY/Control_Surface_3/Master Opacity" },
  { id: "feedback", label: "Master Feedback", osc: "/OSCQUERY/Control_Surface_3/Master Feedback" },
  { id: "color", label: "Color Intensity", osc: "/OSCQUERY/Control_Surface_3/Color Intensity" },
] as const;

export const EFFECTS_NEEDING_DOWNLOAD = INTERSECT_TEMPLATE_EFFECTS.filter((e) => !e.bundledInVdmx);
