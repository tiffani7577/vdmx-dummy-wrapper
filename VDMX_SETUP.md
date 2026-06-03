# VDMX Dummy Wrapper - Setup Guide

## Overview

VDMX Dummy Wrapper is a simplified web dashboard for VDMX 6 Plus that uses the OSCQuery protocol to provide a "dummy-proof" interface with a friendly, playful design.

## Design Philosophy

**"Friendly Dashboard" Approach** - The interface prioritizes accessibility and joy over technical complexity:

- **Color Palette**: Soft blue (#3b82f6), coral (#ff6b6b), mint (#10b981)
- **Typography**: Poppins Bold for headings, Inter for body text
- **Animations**: Spring-based easing, 300-500ms durations
- **Tone**: Conversational, encouraging, never technical

## Architecture

### Frontend
- React 19 + TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components
- Framer Motion for animations

### Backend
- Express.js server
- OSCQuery client (HTTP queries to VDMX)
- OSC sender (UDP messages to VDMX)
- Bi-directional communication support

### Communication Flow

```
Browser Dashboard
    ↓ (HTTP/WebSocket)
Express Backend
    ↓ (HTTP)
VDMX OSCQuery Server (queries parameters)
    ↓ (UDP)
VDMX OSC Server (receives control messages)
```

## Setup Instructions

### Prerequisites

- VDMX 6 Plus installed and running
- Node.js 22+ and pnpm installed
- VDMX machine accessible on network

### 1. Configure VDMX

In VDMX Preferences → OSC:
- Enable OSCQuery
- Note the OSCQuery HTTP port (default: 8000)
- Note the OSC UDP port (default: 9000)
- Enable Control Surface plugin with OSCQuery publishing

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
VDMX_HOST=192.168.1.100        # IP of VDMX machine
VDMX_OSCQUERY_PORT=8000        # OSCQuery HTTP port
VDMX_OSC_PORT=9000             # OSC UDP port
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Development

```bash
pnpm dev
```

Visit `http://localhost:5173` for the frontend.

### 5. Production Build

```bash
pnpm build
pnpm start
```

## API Endpoints

### Configuration
- `GET /api/vdmx/config` - Get current VDMX config
- `POST /api/vdmx/config` - Update VDMX config

### Connection
- `GET /api/vdmx/connect` - Test connection to VDMX

### Parameters
- `GET /api/vdmx/parameters` - Fetch available OSC parameters

### Control
- `POST /api/vdmx/send` - Send OSC message to VDMX
  - Body: `{ "address": "/path/to/param", "args": [{ "type": "f", "value": 0.5 }] }`

## Features

### Current Implementation
- Play/Pause control
- Brightness slider (0-100%)
- Speed slider (0-100%)
- Effect toggles (Bloom, Glitch, Kaleidoscope)
- Connection status indicator
- Responsive design for desktop and tablet

### Extensibility
- Add new parameter controls by querying `/api/vdmx/parameters`
- Create custom UI cards for specific VDMX parameters
- Implement real-time feedback via WebSocket

## Troubleshooting

### Connection Issues
1. Verify VDMX is running and OSCQuery is enabled
2. Check firewall allows UDP on OSC port and HTTP on OSCQuery port
3. Confirm IP address and ports in environment variables
4. Test connection: `curl http://VDMX_IP:OSCQUERY_PORT/`

### Parameter Not Showing
1. Ensure Control Surface plugin is active in VDMX
2. Check that parameters are published via OSCQuery
3. Refresh browser and check `/api/vdmx/parameters`

### OSC Messages Not Received
1. Verify OSC port is correct
2. Check VDMX is listening on the specified port
3. Review server logs for send errors

## Next Steps

1. **Customize Parameters**: Modify `Dashboard.tsx` to add/remove controls
2. **Add Presets**: Create preset buttons that send multiple OSC messages
3. **Real-time Sync**: Implement WebSocket for bi-directional updates
4. **Mobile Optimization**: Enhance touch interactions for tablets
5. **Advanced Effects**: Build complex effect chains with visual feedback

## Resources

- [VDMX OSCQuery Documentation](https://docs.vidvox.net/vdmx/vdmx_oscquery)
- [OSCQuery Protocol Spec](https://github.com/Vidvox/OSCQueryProposal)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

## License

MIT
