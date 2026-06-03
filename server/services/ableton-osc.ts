import { Client, Message, Server } from 'node-osc';
import { EventEmitter } from 'events';

export interface ClipSlot {
  trackIndex: number;
  clipIndex: number;
  name: string;
  // 0 = empty, 1 = stopped, 2 = playing, 3 = recording
  status: 0 | 1 | 2 | 3;
  color?: string;
  hasClip: boolean;
}

export interface AbletonState {
  isPlaying: boolean;
  tempo: number;
  tracks: string[];
  numTracks: number;
  numScenes: number;
  clips: ClipSlot[][];
}

const DEFAULT_STATE: AbletonState = {
  isPlaying: false,
  tempo: 120,
  tracks: [],
  numTracks: 0,
  numScenes: 0,
  clips: [],
};

/**
 * AbletonOSCService
 *
 * Connects to AbletonOSC (https://github.com/ideoforms/AbletonOSC)
 * - Sends queries to Ableton Live on port 11000
 * - Listens for replies on port 11001
 * - Emits 'state' events when clip grid changes
 */
class AbletonOSCService extends EventEmitter {
  private client: Client;
  private server: Server | null = null;
  private state: AbletonState = { ...DEFAULT_STATE };
  private abletonHost: string;
  private abletonSendPort: number;
  private listenPort: number;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(
    abletonHost = 'localhost',
    abletonSendPort = 11000,
    listenPort = 11001
  ) {
    super();
    this.abletonHost = abletonHost;
    this.abletonSendPort = abletonSendPort;
    this.listenPort = listenPort;
    this.client = new Client(abletonHost, abletonSendPort);
  }

  /**
   * Start the OSC reply server and begin polling Ableton
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.server = new Server(this.listenPort, '0.0.0.0', () => {
          console.log(`[AbletonOSC] Listening for replies on port ${this.listenPort}`);
          this.setupMessageHandlers();
          this.startPolling();
          resolve();
        });
      } catch (err) {
        console.warn('[AbletonOSC] Could not start reply server:', err);
        resolve(); // Non-fatal — dashboard still works, just no live updates
      }
    });
  }

  private setupMessageHandlers(): void {
    if (!this.server) return;

    this.server.on('message', (msg: any[]) => {
      const address: string = msg[0];
      const args = msg.slice(1);

      try {
        if (address === '/live/song/get/is_playing') {
          this.state.isPlaying = args[0] === 1;
          this.emit('state', this.state);
        } else if (address === '/live/song/get/tempo') {
          this.state.tempo = Number(args[0]);
          this.emit('state', this.state);
        } else if (address === '/live/song/get/num_tracks') {
          this.state.numTracks = Number(args[0]);
        } else if (address === '/live/song/get/num_scenes') {
          this.state.numScenes = Number(args[0]);
          this.initClipGrid();
        } else if (address === '/live/song/get/track_names') {
          this.state.tracks = args as string[];
          this.emit('state', this.state);
        } else if (address === '/live/clip_slot/get/has_clip') {
          const [trackIdx, clipIdx, hasClip] = args;
          this.updateClipSlot(Number(trackIdx), Number(clipIdx), {
            hasClip: hasClip === 1,
          });
        } else if (address === '/live/clip_slot/get/playing_status') {
          const [trackIdx, clipIdx, status] = args;
          this.updateClipSlot(Number(trackIdx), Number(clipIdx), {
            status: Number(status) as 0 | 1 | 2 | 3,
          });
        } else if (address === '/live/clip/get/name') {
          const [trackIdx, clipIdx, name] = args;
          this.updateClipSlot(Number(trackIdx), Number(clipIdx), {
            name: String(name),
          });
        } else if (address === '/live/clip/get/color') {
          const [trackIdx, clipIdx, color] = args;
          this.updateClipSlot(Number(trackIdx), Number(clipIdx), {
            color: String(color),
          });
        }
      } catch (e) {
        // Ignore malformed messages
      }
    });
  }

  private initClipGrid(): void {
    const { numTracks, numScenes } = this.state;
    if (numTracks === 0 || numScenes === 0) return;

    this.state.clips = Array.from({ length: numTracks }, (_, t) =>
      Array.from({ length: numScenes }, (_, s) => ({
        trackIndex: t,
        clipIndex: s,
        name: '',
        status: 0 as const,
        hasClip: false,
      }))
    );
    this.emit('state', this.state);
  }

  private updateClipSlot(
    trackIdx: number,
    clipIdx: number,
    update: Partial<ClipSlot>
  ): void {
    if (!this.state.clips[trackIdx]) return;
    if (!this.state.clips[trackIdx][clipIdx]) return;
    this.state.clips[trackIdx][clipIdx] = {
      ...this.state.clips[trackIdx][clipIdx],
      ...update,
    };
    this.emit('state', this.state);
  }

  /**
   * Poll Ableton for current state every 2 seconds
   */
  private startPolling(): void {
    const poll = () => {
      this.query('/live/song/get/is_playing');
      this.query('/live/song/get/tempo');
      this.query('/live/song/get/num_tracks');
      this.query('/live/song/get/num_scenes');
      this.query('/live/song/get/track_names');
    };

    poll();
    this.pollInterval = setInterval(poll, 2000);
  }

  /**
   * Refresh clip slot statuses for visible grid
   */
  async refreshClipGrid(maxTracks = 8, maxScenes = 8): Promise<void> {
    for (let t = 0; t < Math.min(maxTracks, this.state.numTracks); t++) {
      for (let s = 0; s < Math.min(maxScenes, this.state.numScenes); s++) {
        this.query('/live/clip_slot/get/has_clip', t, s);
        this.query('/live/clip_slot/get/playing_status', t, s);
        this.query('/live/clip/get/name', t, s);
      }
    }
  }

  /**
   * Fire (launch) a clip slot
   */
  async fireClip(trackIndex: number, clipIndex: number): Promise<void> {
    const msg = new Message('/live/clip/fire');
    msg.append(trackIndex);
    msg.append(clipIndex);
    return new Promise((resolve, reject) => {
      this.client.send(msg, (err: any) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * Stop a clip slot
   */
  async stopClip(trackIndex: number, clipIndex: number): Promise<void> {
    const msg = new Message('/live/clip/stop');
    msg.append(trackIndex);
    msg.append(clipIndex);
    return new Promise((resolve, reject) => {
      this.client.send(msg, (err: any) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * Start session record on a clip slot (live looping)
   */
  async recordClip(trackIndex: number, clipIndex: number): Promise<void> {
    const msg = new Message('/live/clip_slot/get/is_recording');
    msg.append(trackIndex);
    msg.append(clipIndex);
    return new Promise((resolve, reject) => {
      this.client.send(msg, (err: any) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * Set Ableton tempo
   */
  async setTempo(bpm: number): Promise<void> {
    const msg = new Message('/live/song/set/tempo');
    msg.append(bpm);
    return new Promise((resolve, reject) => {
      this.client.send(msg, (err: any) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * Generic query helper
   */
  private query(address: string, ...args: any[]): void {
    try {
      const msg = new Message(address);
      for (const arg of args) msg.append(arg);
      this.client.send(msg, (err: any) => {
        if (err) console.warn(`[AbletonOSC] Query error ${address}:`, err);
      });
    } catch (e) {
      // Ableton not running — ignore
    }
  }

  getState(): AbletonState {
    return this.state;
  }

  updateConfig(host: string, sendPort: number, listenPort: number): void {
    this.stop();
    this.abletonHost = host;
    this.abletonSendPort = sendPort;
    this.listenPort = listenPort;
    this.client = new Client(host, sendPort);
    this.start();
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.client.close();
  }
}

export default AbletonOSCService;
