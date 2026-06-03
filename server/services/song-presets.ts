/**
 * Per-Song Media Bin Preset Configuration
 *
 * Each song maps to:
 * - A VDMX Media Bin page index (0-indexed)
 * - A VDMX preset name (for full scene recall)
 * - A set of mappable program slots (e.g. "her scene", "verse", "chorus")
 * - A default BPM
 * - OSC trigger addresses for each program slot
 *
 * To add a new song, add an entry to SONG_PRESETS below.
 * To add a new program slot, add it to the `programs` array.
 *
 * OSC address format for VDMX Control Surface:
 *   /vdmx/program/<song_id>/<program_id>
 *
 * These addresses should be mapped in VDMX's Control Surface plugin
 * to the corresponding Media Bin page or layer preset.
 */

export interface ProgramSlot {
  id: string;
  label: string;
  oscAddress: string;
  description: string;
  // VDMX media bin page to switch to when this program is triggered
  mediaBinPage?: number;
  // VDMX preset name to load (optional, overrides mediaBinPage)
  vdmxPreset?: string;
  // Color for UI display
  color: string;
}

export interface SongPreset {
  id: string;
  name: string;
  defaultBpm: number;
  // Media Bin page index for this song's visuals (0-indexed)
  mediaBinPage: number;
  // VDMX preset name for full scene recall
  vdmxPreset: string;
  // OSC address to trigger this song's preset
  oscAddress: string;
  // Color for UI display
  color: string;
  // Mappable program slots for this song
  programs: ProgramSlot[];
}

export const SONG_PRESETS: SongPreset[] = [
  {
    id: 'am_i_ok',
    name: 'Am I OK',
    defaultBpm: 124,
    mediaBinPage: 0,
    vdmxPreset: 'AmIOK_Visuals',
    oscAddress: '/vdmx/song/am_i_ok',
    color: '#8b5cf6',
    programs: [
      {
        id: 'her_scene',
        label: 'Her Scene',
        oscAddress: '/vdmx/program/am_i_ok/her_scene',
        description: 'Main visual scene for "her" narrative — soft purples, close-up textures',
        mediaBinPage: 0,
        color: '#a78bfa',
      },
      {
        id: 'verse',
        label: 'Verse',
        oscAddress: '/vdmx/program/am_i_ok/verse',
        description: 'Verse visual — ambient, low energy',
        mediaBinPage: 0,
        color: '#7c3aed',
      },
      {
        id: 'chorus',
        label: 'Chorus',
        oscAddress: '/vdmx/program/am_i_ok/chorus',
        description: 'Chorus visual — high energy, glitch burst',
        mediaBinPage: 0,
        color: '#6d28d9',
      },
      {
        id: 'bridge',
        label: 'Bridge',
        oscAddress: '/vdmx/program/am_i_ok/bridge',
        description: 'Bridge visual — stripped back, raw',
        mediaBinPage: 0,
        color: '#5b21b6',
      },
      {
        id: 'outro',
        label: 'Outro',
        oscAddress: '/vdmx/program/am_i_ok/outro',
        description: 'Outro visual — fade to black, slow dissolve',
        mediaBinPage: 0,
        color: '#4c1d95',
      },
    ],
  },
  {
    id: 'gutter',
    name: 'Gutter',
    defaultBpm: 140,
    mediaBinPage: 1,
    vdmxPreset: 'Gutter_Visuals',
    oscAddress: '/vdmx/song/gutter',
    color: '#ef4444',
    programs: [
      {
        id: 'intro',
        label: 'Intro',
        oscAddress: '/vdmx/program/gutter/intro',
        description: 'Gutter intro — dark, gritty textures',
        mediaBinPage: 1,
        color: '#dc2626',
      },
      {
        id: 'verse',
        label: 'Verse',
        oscAddress: '/vdmx/program/gutter/verse',
        description: 'Gutter verse — raw, distorted',
        mediaBinPage: 1,
        color: '#b91c1c',
      },
      {
        id: 'chorus',
        label: 'Chorus',
        oscAddress: '/vdmx/program/gutter/chorus',
        description: 'Gutter chorus — strobe, aggressive',
        mediaBinPage: 1,
        color: '#991b1b',
      },
      {
        id: 'drop',
        label: 'Drop',
        oscAddress: '/vdmx/program/gutter/drop',
        description: 'Gutter drop — full chaos mode',
        mediaBinPage: 1,
        color: '#7f1d1d',
      },
    ],
  },
  {
    id: 'luv_me_down',
    name: 'Luv Me Down',
    defaultBpm: 96,
    mediaBinPage: 2,
    vdmxPreset: 'LuvMeDown_Visuals',
    oscAddress: '/vdmx/song/luv_me_down',
    color: '#ec4899',
    programs: [
      {
        id: 'verse',
        label: 'Verse',
        oscAddress: '/vdmx/program/luv_me_down/verse',
        description: 'Luv Me Down verse — warm, intimate',
        mediaBinPage: 2,
        color: '#db2777',
      },
      {
        id: 'chorus',
        label: 'Chorus',
        oscAddress: '/vdmx/program/luv_me_down/chorus',
        description: 'Luv Me Down chorus — dreamy, saturated',
        mediaBinPage: 2,
        color: '#be185d',
      },
      {
        id: 'bridge',
        label: 'Bridge',
        oscAddress: '/vdmx/program/luv_me_down/bridge',
        description: 'Luv Me Down bridge — slow burn',
        mediaBinPage: 2,
        color: '#9d174d',
      },
    ],
  },
  {
    id: 'let_u_go',
    name: 'Let U Go',
    defaultBpm: 110,
    mediaBinPage: 3,
    vdmxPreset: 'LetUGo_Visuals',
    oscAddress: '/vdmx/song/let_u_go',
    color: '#06b6d4',
    programs: [
      {
        id: 'verse',
        label: 'Verse',
        oscAddress: '/vdmx/program/let_u_go/verse',
        description: 'Let U Go verse — cool blues, distance',
        mediaBinPage: 3,
        color: '#0891b2',
      },
      {
        id: 'chorus',
        label: 'Chorus',
        oscAddress: '/vdmx/program/let_u_go/chorus',
        description: 'Let U Go chorus — release, expansive',
        mediaBinPage: 3,
        color: '#0e7490',
      },
      {
        id: 'breakdown',
        label: 'Breakdown',
        oscAddress: '/vdmx/program/let_u_go/breakdown',
        description: 'Let U Go breakdown — sparse, emotional',
        mediaBinPage: 3,
        color: '#155e75',
      },
    ],
  },
  {
    id: 'idoit2',
    name: 'Idoit 2',
    defaultBpm: 128,
    mediaBinPage: 4,
    vdmxPreset: 'Idoit2_Visuals',
    oscAddress: '/vdmx/song/idoit2',
    color: '#10b981',
    programs: [
      {
        id: 'intro',
        label: 'Intro',
        oscAddress: '/vdmx/program/idoit2/intro',
        description: 'Idoit 2 intro — chaotic energy',
        mediaBinPage: 4,
        color: '#059669',
      },
      {
        id: 'verse',
        label: 'Verse',
        oscAddress: '/vdmx/program/idoit2/verse',
        description: 'Idoit 2 verse — glitchy, off-kilter',
        mediaBinPage: 4,
        color: '#047857',
      },
      {
        id: 'chorus',
        label: 'Chorus',
        oscAddress: '/vdmx/program/idoit2/chorus',
        description: 'Idoit 2 chorus — peak chaos',
        mediaBinPage: 4,
        color: '#065f46',
      },
    ],
  },
];

export function getSongById(id: string): SongPreset | undefined {
  return SONG_PRESETS.find((s) => s.id === id);
}

export function getProgramSlot(
  songId: string,
  programId: string
): ProgramSlot | undefined {
  const song = getSongById(songId);
  return song?.programs.find((p) => p.id === programId);
}

export function getAllOSCAddresses(): string[] {
  const addresses: string[] = [];
  for (const song of SONG_PRESETS) {
    addresses.push(song.oscAddress);
    for (const prog of song.programs) {
      addresses.push(prog.oscAddress);
    }
  }
  return addresses;
}
