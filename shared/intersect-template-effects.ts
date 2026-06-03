/** VDMX Control Surface template — canonical effect list for plug-and-play setup */

export interface IntersectTemplateEffect {
  id: string;
  /** Friendly label shown in INTERSECT dashboard */
  intersectLabel: string;
  /** Label on the VDMX Control Surface button (ISF / effect name) */
  vdmxIsfName: string;
  /** OSC address INTERSECT sends and expects via OSCQuery */
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
  { id: "kaleidoscope", intersectLabel: "Mirror Fold", vdmxIsfName: "Kaleidoscope", osc: "/intersect/fx/kaleidoscope", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=kaleidoscope" },
  { id: "rgb_shift", intersectLabel: "Color Split", vdmxIsfName: "RGB Shift", osc: "/intersect/fx/rgb_shift", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=rgb+shift" },
  { id: "bloom", intersectLabel: "Glow", vdmxIsfName: "Bloom", osc: "/intersect/fx/bloom", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=bloom" },
  { id: "vignette", intersectLabel: "Frame", vdmxIsfName: "Vignette", osc: "/intersect/fx/vignette", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=vignette" },
  { id: "blur", intersectLabel: "Blur", vdmxIsfName: "Gaussian Blur", osc: "/intersect/fx/blur", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=gaussian+blur" },
  { id: "strobe", intersectLabel: "Strobe", vdmxIsfName: "Strobe", osc: "/intersect/fx/strobe", downloadSearchUrl: "https://editor.isf.video/shaders?q=strobe" },
  { id: "invert", intersectLabel: "Invert", vdmxIsfName: "Color Invert", osc: "/intersect/fx/invert", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=color+invert" },
  { id: "hue_rotate", intersectLabel: "Color Spin", vdmxIsfName: "Hue Rotate", osc: "/intersect/fx/hue_rotate", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=hue+rotate" },
  { id: "fisheye", intersectLabel: "Fisheye", vdmxIsfName: "Barrel Distortion", osc: "/intersect/fx/fisheye", downloadSearchUrl: "https://editor.isf.video/shaders?q=barrel+distortion" },
  { id: "halftone", intersectLabel: "Dots", vdmxIsfName: "Halftone", osc: "/intersect/fx/halftone", downloadSearchUrl: "https://editor.isf.video/shaders?q=halftone" },
  { id: "posterize", intersectLabel: "Flat", vdmxIsfName: "Posterize", osc: "/intersect/fx/posterize", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=posterize" },
  { id: "solarize", intersectLabel: "Solar", vdmxIsfName: "Solarize", osc: "/intersect/fx/solarize", downloadSearchUrl: "https://editor.isf.video/shaders?q=solarize" },
  { id: "blowout", intersectLabel: "Blow Out", vdmxIsfName: "Color Blowout", osc: "/intersect/fx/blowout", downloadSearchUrl: "https://editor.isf.video/shaders?q=color+blowout" },
  { id: "mirror", intersectLabel: "Symmetry", vdmxIsfName: "Mirror", osc: "/intersect/fx/mirror", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=mirror" },
  { id: "edge_detect", intersectLabel: "Wireframe", vdmxIsfName: "Edge Detect", osc: "/intersect/fx/edge_detect", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=edge+detect" },
  { id: "glitch_morph", intersectLabel: "Morph", vdmxIsfName: "Glitch Analog", osc: "/intersect/fx/glitch_morph", downloadSearchUrl: "https://editor.isf.video/shaders?q=glitch+analog" },
  { id: "scanlines", intersectLabel: "CRT", vdmxIsfName: "Scan Lines", osc: "/intersect/fx/scanlines", downloadSearchUrl: "https://editor.isf.video/shaders?q=scan+lines" },
  { id: "feedback_echo", intersectLabel: "Ghost Trails", vdmxIsfName: "Feedback", osc: "/intersect/fx/feedback_echo", bundledInVdmx: true, downloadSearchUrl: "https://editor.isf.video/shaders?q=feedback" },
  { id: "pixel_sort", intersectLabel: "Digital Melt", vdmxIsfName: "Pixel Sort", osc: "/intersect/fx/pixel_sort", downloadSearchUrl: "https://editor.isf.video/shaders?q=pixel+sort" },
  { id: "datamosh", intersectLabel: "Datamosh", vdmxIsfName: "Datamosh", osc: "/intersect/fx/datamosh", downloadSearchUrl: "https://editor.isf.video/shaders?q=datamosh" },
  { id: "rutt_etra", intersectLabel: "Wireframe 3D", vdmxIsfName: "Rutt-Etra", osc: "/intersect/fx/rutt_etra", downloadSearchUrl: "https://editor.isf.video/shaders?q=rutt+etra" },
  { id: "optical_flow", intersectLabel: "Liquid Motion", vdmxIsfName: "Optical Flow", osc: "/intersect/fx/optical_flow", downloadSearchUrl: "https://editor.isf.video/shaders?q=optical+flow" },
  { id: "time_glitch", intersectLabel: "Rainbow Ghost", vdmxIsfName: "Zoom Feedback", osc: "/intersect/fx/time_glitch", downloadSearchUrl: "https://editor.isf.video/shaders?q=zoom+feedback" },
  { id: "zoom_blur", intersectLabel: "Rush", vdmxIsfName: "Zoom Blur", osc: "/intersect/fx/zoom_blur", downloadSearchUrl: "https://editor.isf.video/shaders?q=zoom+blur" },
  { id: "displacement", intersectLabel: "Warp", vdmxIsfName: "Displacement Map", osc: "/intersect/fx/displacement", downloadSearchUrl: "https://editor.isf.video/shaders?q=displacement+map" },
  { id: "audio_warp", intersectLabel: "Audio Warp", vdmxIsfName: "Waveform Displace", osc: "/intersect/fx/audio_warp", downloadSearchUrl: "https://editor.isf.video/shaders?q=waveform+displace" },
];

export const INTERSECT_TEMPLATE_MASTERS = [
  { id: "opacity", label: "Master Opacity", osc: "/intersect/master/opacity" },
  { id: "feedback", label: "Master Feedback", osc: "/intersect/master/feedback" },
  { id: "color", label: "Color Intensity", osc: "/intersect/master/color" },
] as const;

export const EFFECTS_NEEDING_DOWNLOAD = INTERSECT_TEMPLATE_EFFECTS.filter((e) => !e.bundledInVdmx);
