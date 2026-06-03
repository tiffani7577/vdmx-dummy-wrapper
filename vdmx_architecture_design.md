# VDMX 6+ Dummy Wrapper & Ableton Sync Architecture

This document defines the architecture, protocol mappings, and implementation plan for the updated VDMX 6+ Dummy Wrapper. The goal is to establish a fully functioning bridge between **VDMX 6+** [1] and **Ableton Live** [2] via **AbletonOSC** [3].

---

## 1. Core Communication Layer

### 1.1 The Communication Problem
The previous build failed to control VDMX 6+ because:
1. The Express server in `server/index.ts` was bypassed or conflicted with the main server `server/_core/index.ts` which uses tRPC and only mounts `/api/trpc`.
2. The `/api/vdmx/send` route in `server/routes/vdmx.ts` was a mock route that only logged messages to the console instead of sending actual UDP packets.
3. The custom `OSCSender` class lacked robust support for complex OSC bundles and address patterns required by VDMX 6+\'s Metal-based architecture [4].

### 1.2 The Solution
We will:
- Implement a robust OSC Service using the industry-standard `node-osc` or a fully compliant UDP-based OSC encoder.
- Correctly register the REST endpoints in `server/_core/index.ts` under `/api/vdmx` so they route correctly.
- Add bi-directional OSC feedback so the dashboard updates when VDMX parameters change [1].

---

## 2. Per-Song Media Bin Presets

To manage visuals dynamically on a per-song basis, we will implement a dedicated **Preset Manager**. Each song will map to a specific Media Bin page or preset index in VDMX.

### 2.1 OSC Address Mapping for VDMX Media Bin
VDMX 6+ exposes its Media Bin parameters via OSCQuery [1]. The standard address patterns are:

| Action | OSC Address | Data Type | Value Range |
| :--- | :--- | :--- | :--- |
| **Select Media Bin Page** | `/vdmx/mediaBin/page` | `i` (Integer) | `0` to `N` |
| **Trigger Clip in Grid** | `/vdmx/mediaBin/grid/x/y` | `i` (Integer) | `1` (Trigger) |
| **Select Layer Source** | `/vdmx/layer/source` | `i` (Integer) | Layer Index |
| **Load Preset** | `/vdmx/preset/load` | `s` (String) | Preset Name |

### 2.2 Song Preset Configuration
We will define a per-song preset system where each song has a distinct visual profile:

```json
[
  {
    "id": "am_i_ok",
    "name": "Am I OK",
    "mediaBinPage": 0,
    "defaultBpm": 124,
    "mappableScene": "her scene",
    "vdmxPreset": "AmIOK_Visuals"
  },
  {
    "id": "gutter",
    "name": "Gutter",
    "mediaBinPage": 1,
    "defaultBpm": 140,
    "mappableScene": "gutter strobe",
    "vdmxPreset": "Gutter_Visuals"
  }
]
```

---

## 3. Ableton Live-Looping Grid Sync

To display the Ableton grid live looping state, we will establish a connection to **AbletonOSC** (listening on UDP port 11000, sending feedback on UDP port 11001) [3].

### 3.1 Ableton Live Session Grid Protocol
We will query and listen to the following AbletonOSC endpoints [3]:

| OSC Address | Direction | Query/Response Params | Description |
| :--- | :--- | :--- | :--- |
| `/live/song/get/track_names` | Query | `[]` | Get names of all tracks |
| `/live/clip/get/name` | Query | `[track_index, clip_index]` | Get name of specific clip slot |
| `/live/clip/get/playing_status` | Query | `[track_index, clip_index]` | Get playing status (`0`=stopped, `1`=playing, `2`=recording) |
| `/live/clip/fire` | Send | `[track_index, clip_index]` | Trigger/launch clip slot |
| `/live/clip/stop` | Send | `[track_index, clip_index]` | Stop clip slot |

### 3.2 Live Looping State Visualization
The dashboard will render an interactive **Ableton Session Grid** (8 tracks x 8 scenes) with color-coded states matching Ableton\'s native behavior:
- **Grey/Empty**: Empty slot.
- **Green (Pulse)**: Playing clip.
- **Red (Pulse)**: Recording / Live Looping clip.
- **Amber/Orange**: Triggered / Cueing clip.

---

## 4. Mappable Programs & Scenes (\"her scene\")

To make visual scenes \"easily identifiable\" and mappable, we will build a **Mappable Program Router**. 

### 4.1 Concept
Instead of mapping raw OSC paths directly in Ableton, the dashboard exposes high-level, human-readable **Virtual Program Slots** (e.g., `\"her scene\"`, `\"verse\"`, `\"chorus\"`, `\"bridge\"`, `\"outro\"`).
- Ableton launches a clip or sends a program change to `/vdmx/program/trigger [index]`.
- The Dummy Wrapper receives this trigger and routes it to the currently active song\'s mapped VDMX preset or media bin page.

### 4.2 UI Design
A dedicated **MIDI/OSC Mapping Panel** will show:
1. **Active Program**: Large, clear display of the current active program (e.g., `\"her scene\"` is active).
2. **Trigger Path**: The exact OSC path or MIDI CC to trigger this program (e.g., `/vdmx/program/her_scene`).
3. **Mappable Status**: Indicator showing whether the slot has been successfully mapped and received a trigger.

---

## References

[1] [VDMX OSCQuery Protocol and VDMX Docs](https://docs.vidvox.net/vdmx/vdmx_oscquery)  
[2] [Ableton Live Session View Reference Manual](https://www.ableton.com/en/manual/session-view/)  
[3] [AbletonOSC: Control Ableton Live with OSC GitHub Project](https://github.com/ideoforms/AbletonOSC)  
[4] [Announcing VDMX6 and VDMX6 Plus Metal Engine](https://vdmx.vidvox.net/blog/vdmx6)
