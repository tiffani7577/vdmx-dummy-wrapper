export interface OscQueryParameter {
  address: string;
  name: string;
  type: string;
  value?: unknown;
  description?: string;
}

export interface MappableControl {
  id: string;
  name: string;
  osc: string;
  /** Extra names to match against OSCQuery parameters (e.g. VDMX ISF names) */
  aliases?: string[];
}

export interface MappedControl extends MappableControl {
  address: string;
  mapped: boolean;
  matchedName?: string;
}

export interface IntersectOscMappings {
  effects: MappedControl[];
  generators: MappedControl[];
  audio: MappedControl[];
  blend: MappedControl[];
  master: MappedControl[];
  parameterCount: number;
  mappedCount: number;
}

/** Normalize for fuzzy name matching: "Mirror Fold" / "Kaleidoscope" → comparable tokens */
export function normalizeOscName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

const EXCLUDED_PATH_FRAGMENTS = [
  "/apc ",
  "/apcbottom",
  "/apcbuttons",
  "/audio analysis",
  "/audioanalysis",
  "/lfo",
  "/numfx",
];
const GENERIC_WIDGET_NAMES = new Set([
  "slider",
  "button",
  "toggle",
  "fader",
  "fadectrl",
  "fadectrls",
  "multislider",
  "multibutton",
  "clipstop",
  "mute",
  "recarm",
  "select",
  "shift",
  "solo",
  "stopall",
]);

/** Strip VDMX hardware control surfaces and generic UI widgets from auto-mapping. */
export function filterMappableParameters(parameters: OscQueryParameter[]): OscQueryParameter[] {
  return parameters.filter((param) => {
    const addr = param.address.toLowerCase();
    if (EXCLUDED_PATH_FRAGMENTS.some((fragment) => addr.includes(fragment))) {
      return false;
    }

    const leaf = normalizeOscName(param.name);
    if (GENERIC_WIDGET_NAMES.has(leaf)) {
      return false;
    }

    return true;
  });
}

function matchKeys(item: MappableControl): string[] {
  const keys = new Set<string>();
  const candidates = [
    item.id,
    item.name,
    ...(item.aliases ?? []),
    ...item.name.split(/\s+/),
    item.id.replace(/_/g, " "),
  ];
  for (const candidate of candidates) {
    const normalized = normalizeOscName(candidate);
    if (normalized) keys.add(normalized);
  }
  return Array.from(keys);
}

function isWetDryParameter(param: OscQueryParameter): boolean {
  const name = param.name.toLowerCase();
  const address = param.address.toLowerCase();
  return (
    name.includes("wet") && name.includes("dry") ||
    address.includes("wet / dry") ||
    address.includes("wet/dry")
  );
}

function scoreParameterMatch(
  item: MappableControl,
  param: OscQueryParameter,
  options?: { requireExact?: boolean }
): number {
  const keys = matchKeys(item);
  const paramName = normalizeOscName(param.name);
  const paramDesc = param.description ? normalizeOscName(param.description) : "";
  const addressLeaf = normalizeOscName(param.address.split("/").pop() ?? "");
  const addressNorm = normalizeOscName(param.address);

  let best = 0;

  for (const key of keys) {
    if (!key) continue;
    if (paramName === key || paramDesc === key || addressLeaf === key) {
      best = Math.max(best, 100);
    } else if (!options?.requireExact) {
      if (paramName.includes(key) || key.includes(paramName)) {
        best = Math.max(best, 60);
      } else if (paramDesc.includes(key) || key.includes(paramDesc)) {
        best = Math.max(best, 40);
      }
      if (addressNorm.includes(key)) {
        best = Math.max(best, 70);
      }
    }
  }

  if (isWetDryParameter(param)) {
    for (const key of keys) {
      if (key && addressNorm.includes(key)) {
        best = Math.max(best, 130);
      }
    }
  }

  if (addressNorm.includes("control_surface")) {
    for (const key of keys) {
      if (key && (addressNorm.includes(key) || paramName.includes(key))) {
        best = Math.max(best, 140);
      }
    }
  }

  return best;
}

export function findBestParameter(
  item: MappableControl,
  parameters: OscQueryParameter[]
): OscQueryParameter | null {
  let best: OscQueryParameter | null = null;
  let bestScore = 0;

  for (const param of parameters) {
    const score = scoreParameterMatch(item, param);
    if (score > bestScore) {
      bestScore = score;
      best = param;
    }
  }

  return bestScore >= 60 ? best : null;
}

export function mapControls(
  controls: MappableControl[],
  parameters: OscQueryParameter[],
  options?: { requireExact?: boolean; minScore?: number }
): MappedControl[] {
  const minScore = options?.minScore ?? (options?.requireExact ? 100 : 60);
  const usedAddresses = new Set<string>();

  return controls.map((control) => {
    const candidates = parameters
      .filter((p) => !usedAddresses.has(p.address))
      .map((p) => ({
        param: p,
        score: scoreParameterMatch(control, p, options),
      }))
      .filter((c) => c.score >= minScore)
      .sort((a, b) => b.score - a.score);

    const match = candidates[0]?.param ?? null;

    if (match) {
      usedAddresses.add(match.address);
      return {
        ...control,
        address: match.address,
        mapped: true,
        matchedName: match.name,
      };
    }

    return {
      ...control,
      address: control.osc,
      mapped: false,
    };
  });
}

export function buildIntersectMappings(
  parameters: OscQueryParameter[],
  config: {
    effects: MappableControl[];
    generators: MappableControl[];
    audio: MappableControl[];
    blend: MappableControl[];
    master: MappableControl[];
  }
): IntersectOscMappings {
  const mappable = filterMappableParameters(parameters);

  const effects = mapControls(config.effects, mappable);
  const generators = mapControls(config.generators, mappable);
  const audio = mapControls(config.audio, mappable, { requireExact: true, minScore: 100 });
  const blend = mapControls(config.blend, mappable);
  const master = mapControls(config.master, mappable, { requireExact: true, minScore: 100 });

  const mappedCount =
    [...effects, ...generators, ...audio, ...blend, ...master].filter((c) => c.mapped).length;

  return {
    effects,
    generators,
    audio,
    blend,
    master,
    parameterCount: mappable.length,
    mappedCount,
  };
}
