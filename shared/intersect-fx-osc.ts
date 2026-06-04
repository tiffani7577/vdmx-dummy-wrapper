/** Live VDMX Control Surface OSCQuery + Canvas FX Wet/Dry dual addressing */

import { INTERSECT_TEMPLATE_EFFECTS, type IntersectTemplateEffect } from "./intersect-template-effects.js";
import {
  filterMappableParameters,
  findBestParameter,
  type OscQueryParameter,
} from "./intersect-osc-mapping.js";
import { canvasFxWetDryOsc, isfStem } from "./vdmx-canvas-fx.js";

export const VDMX_CONTROL_SURFACE_OSCQUERY_PLUGIN = "Control_Surface_3";

/** 25 live Canvas FX effects (excludes Rutt-Etra) */
export const CONTROL_SURFACE_EFFECTS = INTERSECT_TEMPLATE_EFFECTS.filter(
  (effect) => effect.id !== "rutt_etra"
);

export function controlSurfaceOscQuery(buttonLabel: string): string {
  return `/OSCQUERY/${VDMX_CONTROL_SURFACE_OSCQUERY_PLUGIN}/${buttonLabel}`;
}

/** Master sliders on the Control Surface */
export const CONTROL_SURFACE_MASTER_OSC = {
  opacity: controlSurfaceOscQuery("Master Opacity"),
  feedback: controlSurfaceOscQuery("Master Feedback"),
  color: controlSurfaceOscQuery("Color Intensity"),
} as const;

/** Dashboard / chain effect id → Control Surface OSCQuery button address */
export const INTERSECT_FX_OSC_BY_ID: Record<string, string> = Object.fromEntries(
  INTERSECT_TEMPLATE_EFFECTS.map((effect) => [
    effect.id,
    controlSurfaceOscQuery(effect.vdmxIsfName),
  ])
);

// Chain aliases → Control Surface button labels
Object.assign(INTERSECT_FX_OSC_BY_ID, {
  feedback: controlSurfaceOscQuery("Feedback"),
  blur: controlSurfaceOscQuery("Gaussian Blur"),
  invert: controlSurfaceOscQuery("Color Invert"),
  fisheye: controlSurfaceOscQuery("Barrel Distortion"),
  glitch_morph: controlSurfaceOscQuery("Glitch Analog"),
  scanlines: controlSurfaceOscQuery("Scan Lines"),
  time_glitch: controlSurfaceOscQuery("Zoom Feedback"),
  audio_warp: controlSurfaceOscQuery("Waveform Displace"),
  vhs: controlSurfaceOscQuery("Scan Lines"),
  tunnel: controlSurfaceOscQuery("Zoom Feedback"),
  rutt_etra: controlSurfaceOscQuery("Edge Detect"),
  freeze: controlSurfaceOscQuery("Waveform Displace"),
});

/** Every Control Surface effect button address — OSCQuery only */
export const INTERSECT_FX_OSC_ALL: string[] = Array.from(
  new Set(CONTROL_SURFACE_EFFECTS.map((effect) => controlSurfaceOscQuery(effect.vdmxIsfName)))
);

export type IntersectFxOscAddress = string;

export type OscMessage = {
  address: string;
  value: number;
  argType: "i" | "f";
};

export type FxOscPair = {
  oscQuery: string;
  wetDry: string;
};

export type FxOscPairRegistry = Record<string, FxOscPair>;

export function resolveIntersectFxOsc(effectId: string): string | undefined {
  return INTERSECT_FX_OSC_BY_ID[effectId];
}

function vdmxButtonLabelFromOscQuery(oscQueryPath: string): string | undefined {
  const parts = oscQueryPath.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0].toLowerCase() !== "oscquery") return undefined;
  return parts.slice(2).join("/");
}

/** Canvas FX Wet/Dry path for an effect id (follows alias → button label → ISF file) */
export function resolveIntersectFxWetDryOsc(effectId: string): string | undefined {
  const oscQuery = resolveIntersectFxOsc(effectId);
  if (!oscQuery) return undefined;

  const buttonLabel = vdmxButtonLabelFromOscQuery(oscQuery);
  if (!buttonLabel) return undefined;

  const templateEffect = INTERSECT_TEMPLATE_EFFECTS.find(
    (effect) => effect.vdmxIsfName === buttonLabel
  );
  return templateEffect?.osc;
}

function effectMatchAliases(effect: IntersectTemplateEffect): string[] {
  return [effect.vdmxIsfName, isfStem(effect.isfFilename), effect.intersectLabel];
}

export function isCanvasVideoFxWetDry(param: OscQueryParameter): boolean {
  const address = param.address.toLowerCase();
  const name = param.name.toLowerCase();
  if (!address.includes("/canvas/") || !address.includes("/video fx")) return false;
  return (
    (name.includes("wet") && name.includes("dry")) ||
    address.includes("wet / dry") ||
    address.includes("wet/dry")
  );
}

/** Resolve live OSCQuery + Wet/Dry paths from VDMX discovery (falls back to templates). */
export function discoverFxOscPairs(parameters: OscQueryParameter[]): FxOscPairRegistry {
  const mappable = filterMappableParameters(parameters);
  const registry: FxOscPairRegistry = {};

  const oscQueryPool = mappable.filter((param) => param.address.toLowerCase().includes("/oscquery/"));
  const controlSurfacePool = oscQueryPool.filter((param) =>
    param.address.toLowerCase().includes("control_surface")
  );
  const wetDryPool = mappable.filter(isCanvasVideoFxWetDry);

  for (const effect of CONTROL_SURFACE_EFFECTS) {
    const control = {
      id: effect.id,
      name: effect.intersectLabel,
      osc: controlSurfaceOscQuery(effect.vdmxIsfName),
      aliases: effectMatchAliases(effect),
    };

    const oscMatch = findBestParameter(
      control,
      controlSurfacePool.length > 0 ? controlSurfacePool : oscQueryPool
    );
    const wetDryMatch = findBestParameter(control, wetDryPool);

    registry[effect.id] = {
      oscQuery: oscMatch?.address ?? controlSurfaceOscQuery(effect.vdmxIsfName),
      wetDry: wetDryMatch?.address ?? effect.osc,
    };
  }

  for (const aliasId of Object.keys(INTERSECT_FX_OSC_BY_ID)) {
    if (registry[aliasId]) continue;

    const oscQuery = INTERSECT_FX_OSC_BY_ID[aliasId];
    const buttonLabel = vdmxButtonLabelFromOscQuery(oscQuery);
    const templateEffect = INTERSECT_TEMPLATE_EFFECTS.find(
      (effect) => effect.vdmxIsfName === buttonLabel
    );

    if (templateEffect && registry[templateEffect.id]) {
      registry[aliasId] = registry[templateEffect.id];
      continue;
    }

    const wetDry = resolveIntersectFxWetDryOsc(aliasId);
    if (wetDry) {
      registry[aliasId] = { oscQuery, wetDry };
    }
  }

  return registry;
}

export function countCanvasWetDryParameters(parameters: OscQueryParameter[]): number {
  return filterMappableParameters(parameters).filter(isCanvasVideoFxWetDry).length;
}

export type VdmxOscDiagnostics = {
  oscQueryReachable: boolean;
  canvasWetDryParameterCount: number;
  needsCanvasWiring: boolean;
  controlSurfaceEffectsFound: number;
};

export function buildVdmxOscDiagnostics(parameters: OscQueryParameter[]): VdmxOscDiagnostics {
  const mappable = filterMappableParameters(parameters);
  const canvasWetDryParameterCount = mappable.filter(isCanvasVideoFxWetDry).length;
  const controlSurfaceEffectsFound = mappable.filter(
    (param) =>
      param.address.toLowerCase().includes("/oscquery/") &&
      param.address.toLowerCase().includes("control_surface") &&
      param.type === "i"
  ).length;

  return {
    oscQueryReachable: parameters.length > 0,
    canvasWetDryParameterCount,
    needsCanvasWiring: canvasWetDryParameterCount === 0,
    controlSurfaceEffectsFound,
  };
}

export function resolveFxOscPair(
  effectId: string,
  registry?: FxOscPairRegistry
): FxOscPair | null {
  if (registry?.[effectId]) return registry[effectId];

  const oscQuery = resolveIntersectFxOsc(effectId);
  const wetDry = resolveIntersectFxWetDryOsc(effectId);
  if (!oscQuery || !wetDry) return null;

  return { oscQuery, wetDry };
}

export function chainFxIdsToOscAddresses(fxIds: string[]): string[] {
  const seen = new Set<string>();
  const addresses: string[] = [];
  for (const id of fxIds) {
    const address = resolveIntersectFxOsc(id);
    if (address && !seen.has(address)) {
      seen.add(address);
      addresses.push(address);
    }
  }
  return addresses;
}

/** OSCQuery int + Canvas Wet/Dry float for one effect toggle */
export function buildEffectToggleOscMessages(
  effectId: string,
  on: boolean,
  registry?: FxOscPairRegistry
): OscMessage[] {
  const pair = resolveFxOscPair(effectId, registry);
  if (!pair) return [];

  return [
    { address: pair.oscQuery, value: on ? 1 : 0, argType: EFFECT_OSC_ARG_TYPE },
    { address: pair.wetDry, value: on ? 1.0 : 0.0, argType: CANVAS_FX_OSC_ARG_TYPE },
  ];
}

/** Turn off all 25 effects on both OSCQuery and Canvas Wet/Dry */
export function buildAllEffectsOffOscMessages(registry?: FxOscPairRegistry): OscMessage[] {
  const messages: OscMessage[] = [];
  const seen = new Set<string>();

  for (const effect of CONTROL_SURFACE_EFFECTS) {
    const pair = resolveFxOscPair(effect.id, registry) ?? {
      oscQuery: controlSurfaceOscQuery(effect.vdmxIsfName),
      wetDry: effect.osc,
    };

    const oscQueryKey = `i:${pair.oscQuery}`;
    if (!seen.has(oscQueryKey)) {
      seen.add(oscQueryKey);
      messages.push({ address: pair.oscQuery, value: 0, argType: EFFECT_OSC_ARG_TYPE });
    }

    const wetDryKey = `f:${pair.wetDry}`;
    if (!seen.has(wetDryKey)) {
      seen.add(wetDryKey);
      messages.push({ address: pair.wetDry, value: 0.0, argType: CANVAS_FX_OSC_ARG_TYPE });
    }
  }

  return messages;
}

export function chainFxIdsToOscMessages(
  fxIds: string[],
  on: boolean,
  registry?: FxOscPairRegistry
): OscMessage[] {
  const messages: OscMessage[] = [];
  const seen = new Set<string>();

  for (const id of fxIds) {
    for (const message of buildEffectToggleOscMessages(id, on, registry)) {
      const key = `${message.argType}:${message.address}`;
      if (!seen.has(key)) {
        seen.add(key);
        messages.push(message);
      }
    }
  }

  return messages;
}

/** Chain trigger: phase 1 = all off, phase 2 = chain on (never parallel off+on on same address) */
export function buildChainTriggerPhases(
  fxIds: string[],
  registry?: FxOscPairRegistry
): OscMessage[][] {
  return [buildAllEffectsOffOscMessages(registry), chainFxIdsToOscMessages(fxIds, true, registry)];
}

export function isControlSurfaceOscQueryPath(address: string): boolean {
  return address.toLowerCase().includes(`/oscquery/${VDMX_CONTROL_SURFACE_OSCQUERY_PLUGIN.toLowerCase()}/`);
}

/** Block APC / other OSCQuery surfaces — prevents twitch when hardware + web UI fight */
export function isAllowedIntersectOutboundOsc(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower.includes("/apc")) return false;
  if (lower.includes("/oscquery/") && !isControlSurfaceOscQueryPath(address)) return false;
  return true;
}

/** Max spread between first and last OSC message in a chain burst (ms) */
export const CHAIN_OSC_BURST_WINDOW_MS = 50;

/** Control Surface UI toggles — integer 0 / 1 */
export const EFFECT_OSC_ARG_TYPE = "i" as const;

/** Canvas FX Wet/Dry sliders — normalized float 0.0–1.0 */
export const CANVAS_FX_OSC_ARG_TYPE = "f" as const;

/** Master sliders use normalized float 0.0–1.0 */
export const MASTER_OSC_ARG_TYPE = "f" as const;

/** Example dual-address pair for Kaleidoscope (documented in tests) */
export const KALEIDOSCOPE_DUAL_OSC = {
  oscQuery: controlSurfaceOscQuery("Kaleidoscope"),
  wetDry: canvasFxWetDryOsc("Kaleidoscope.fs"),
} as const;
