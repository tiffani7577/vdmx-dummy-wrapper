# VDMX 6+ Command Center & Ableton Sync Bridge

A high-performance, dark-themed middleware dashboard designed for **VDMX 6+** and **Ableton Live**. This bridge provides a unified interface for per-song visual presets, live-looping grid synchronization, and mappable program slots.

## 🚀 Key Features

- **Per-Song Media Bin Presets**: Automatically switch VDMX Media Bin pages and recall presets when selecting a song.
- **Ableton Live Grid**: Real-time visualization of your Ableton Session View. See which clips are playing, recording (live looping), or stopped.
- **Mappable Program Slots**: Human-readable triggers (e.g., "Her Scene", "Verse", "Chorus") that map to specific OSC addresses.
- **OSC Routing Table**: Instant visibility of all OSC addresses for easy mapping in VDMX's Control Surface.
- **Metal Engine Optimized**: Built for the performance requirements of VDMX 6+'s Metal-based architecture.

## 🛠 Setup Instructions

### 1. Ableton Live Setup
1. Download and install [AbletonOSC](https://github.com/ideoforms/AbletonOSC).
2. In Ableton Live, go to `Preferences > Link / Tempo / MIDI`.
3. Select `AbletonOSC` as a **Control Surface**.
4. Live will now listen on port `11000` and send feedback to this dashboard on port `11001`.

### 2. VDMX 6+ Setup
1. Open VDMX 6+.
2. Go to `Preferences > OSC`.
3. Ensure VDMX is listening for OSC on port `1234` (default).
4. Use the **OSC Mapping Table** in this dashboard to find the addresses you want to map.
5. In VDMX, use the **Control Surface** plugin to bind these OSC addresses to your parameters, media bin pages, or presets.

### 3. Dashboard Installation
```bash
# Install dependencies
pnpm install

# Start the development server
pnpm run dev
```
Open `http://localhost:3000` to access the Command Center.

## 🎹 OSC Address Spec

| Category | Address Pattern | Type | Description |
| :--- | :--- | :--- | :--- |
| **Song** | `/vdmx/song/<song_id>` | `i` | Activate song & recall presets |
| **Program** | `/vdmx/program/<song_id>/<prog_id>` | `i` | Trigger specific visual scene |
| **Media Bin** | `/vdmx/mediaBin/page` | `i` | Switch Media Bin page (0-indexed) |
| **Preset** | `/vdmx/preset/load` | `s` | Load VDMX preset by name |

## 📁 Project Structure

- `server/services/osc-sender.ts`: Robust UDP OSC delivery via `node-osc`.
- `server/services/ableton-osc.ts`: Bi-directional sync with Ableton Live.
- `server/services/song-presets.ts`: Configuration file for your setlist and program slots.
- `client/src/components/AbletonGrid.tsx`: Interactive clip launcher and state visualizer.

---
Built for professional VJ performance.
