import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Play, Square, Radio } from 'lucide-react';

interface ClipSlot {
  trackIndex: number;
  clipIndex: number;
  name: string;
  // 0=empty, 1=stopped, 2=playing, 3=recording
  status: 0 | 1 | 2 | 3;
  hasClip: boolean;
  color?: string;
}

interface AbletonState {
  isPlaying: boolean;
  tempo: number;
  tracks: string[];
  numTracks: number;
  numScenes: number;
  clips: ClipSlot[][];
}

const CLIP_STATUS_COLORS = {
  0: 'bg-gray-800 border-gray-700 text-gray-600',           // empty
  1: 'bg-gray-700 border-gray-600 text-gray-300',           // stopped (has clip)
  2: 'bg-green-600 border-green-400 text-white animate-pulse', // playing
  3: 'bg-red-600 border-red-400 text-white animate-pulse',  // recording / live looping
};

const CLIP_STATUS_ICONS = {
  0: null,
  1: <Square className="w-3 h-3" />,
  2: <Play className="w-3 h-3" />,
  3: <Radio className="w-3 h-3" />,
};

const CLIP_STATUS_LABELS = {
  0: 'Empty',
  1: 'Stopped',
  2: 'Playing',
  3: 'Recording',
};

const MAX_TRACKS = 8;
const MAX_SCENES = 8;

export default function AbletonGrid() {
  const [state, setState] = useState<AbletonState>({
    isPlaying: false,
    tempo: 120,
    tracks: [],
    numTracks: 0,
    numScenes: 0,
    clips: [],
  });
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/vdmx/ableton/state');
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setConnected(data.state.numTracks > 0 || data.state.tempo !== 120);
        setLastRefresh(new Date());
      }
    } catch {
      setConnected(false);
    }
  }, []);

  const refreshGrid = async () => {
    setLoading(true);
    try {
      await fetch('/api/vdmx/ableton/refresh', { method: 'POST' });
      await new Promise((r) => setTimeout(r, 500));
      await fetchState();
      toast.success('Ableton grid refreshed');
    } catch {
      toast.error('Could not reach Ableton — is AbletonOSC installed?');
    } finally {
      setLoading(false);
    }
  };

  const fireClip = async (trackIndex: number, clipIndex: number) => {
    try {
      await fetch('/api/vdmx/ableton/clip/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIndex, clipIndex }),
      });
      toast.success(`Fired clip ${trackIndex}:${clipIndex}`);
      setTimeout(fetchState, 300);
    } catch {
      toast.error('Failed to fire clip');
    }
  };

  const stopClip = async (trackIndex: number, clipIndex: number) => {
    try {
      await fetch('/api/vdmx/ableton/clip/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIndex, clipIndex }),
      });
      toast.success(`Stopped clip ${trackIndex}:${clipIndex}`);
      setTimeout(fetchState, 300);
    } catch {
      toast.error('Failed to stop clip');
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Build display grid (up to MAX_TRACKS x MAX_SCENES)
  const displayTracks = Math.max(state.numTracks, 4);
  const displayScenes = Math.max(state.numScenes, 4);
  const visibleTracks = Math.min(displayTracks, MAX_TRACKS);
  const visibleScenes = Math.min(displayScenes, MAX_SCENES);

  const getClipSlot = (t: number, s: number): ClipSlot => {
    return state.clips?.[t]?.[s] ?? {
      trackIndex: t,
      clipIndex: s,
      name: '',
      status: 0,
      hasClip: false,
    };
  };

  return (
    <Card className="p-4 bg-gray-950 border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}
            />
            <span className="text-sm font-semibold text-white">
              Ableton Live Grid
            </span>
          </div>
          {connected && (
            <span className="text-xs text-gray-400 font-mono">
              {state.tempo.toFixed(1)} BPM
            </span>
          )}
          {state.isPlaying && (
            <span className="text-xs text-green-400 font-mono flex items-center gap-1">
              <Play className="w-3 h-3" /> Playing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-gray-600">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={refreshGrid}
            disabled={loading}
            className="h-7 px-2 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {!connected && (
        <div className="text-center py-6 text-gray-500 text-sm">
          <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="font-medium">Ableton Live not detected</p>
          <p className="text-xs mt-1 text-gray-600">
            Install{' '}
            <a
              href="https://github.com/ideoforms/AbletonOSC"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline"
            >
              AbletonOSC
            </a>{' '}
            and set it as a Control Surface in Live's MIDI preferences.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshGrid}
            disabled={loading}
            className="mt-3 border-gray-700 text-gray-400"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Retry Connection
          </Button>
        </div>
      )}

      {connected && (
        <>
          {/* Track Headers */}
          <div
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: `80px repeat(${visibleTracks}, 1fr)` }}
          >
            <div className="text-xs text-gray-600 text-center py-1">Scene</div>
            {Array.from({ length: visibleTracks }, (_, t) => (
              <div
                key={t}
                className="text-xs text-gray-400 text-center truncate px-1 py-1 bg-gray-900 rounded"
              >
                {state.tracks[t] ?? `T${t + 1}`}
              </div>
            ))}
          </div>

          {/* Clip Grid */}
          {Array.from({ length: visibleScenes }, (_, s) => (
            <div
              key={s}
              className="grid gap-1 mb-1"
              style={{ gridTemplateColumns: `80px repeat(${visibleTracks}, 1fr)` }}
            >
              {/* Scene label */}
              <div className="text-xs text-gray-600 text-center py-2 flex items-center justify-center">
                S{s + 1}
              </div>

              {/* Clip slots */}
              {Array.from({ length: visibleTracks }, (_, t) => {
                const clip = getClipSlot(t, s);
                const statusClass = CLIP_STATUS_COLORS[clip.status];
                const isActive = clip.status === 2 || clip.status === 3;

                return (
                  <button
                    key={t}
                    onClick={() =>
                      isActive ? stopClip(t, s) : clip.hasClip ? fireClip(t, s) : undefined
                    }
                    className={`
                      relative h-10 rounded border text-xs font-mono
                      transition-all duration-150 overflow-hidden
                      ${statusClass}
                      ${clip.hasClip || clip.status === 0 ? 'cursor-pointer hover:brightness-125' : 'cursor-default opacity-40'}
                    `}
                    title={
                      clip.hasClip
                        ? `${clip.name || `Clip ${t}:${s}`} — ${CLIP_STATUS_LABELS[clip.status]}`
                        : 'Empty slot'
                    }
                  >
                    <div className="flex flex-col items-center justify-center h-full px-1 gap-0.5">
                      {CLIP_STATUS_ICONS[clip.status]}
                      {clip.name && (
                        <span className="text-[9px] truncate w-full text-center leading-none">
                          {clip.name}
                        </span>
                      )}
                    </div>
                    {/* Recording pulse overlay */}
                    {clip.status === 3 && (
                      <div className="absolute inset-0 bg-red-500 opacity-20 animate-ping rounded" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex gap-3 mt-3 pt-3 border-t border-gray-800">
            {Object.entries(CLIP_STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1">
                <span
                  className={`w-3 h-3 rounded border ${CLIP_STATUS_COLORS[Number(status) as 0 | 1 | 2 | 3].split(' ').slice(0, 2).join(' ')}`}
                />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
