import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Music2, Layers, Zap, ChevronRight } from 'lucide-react';

interface ProgramSlot {
  id: string;
  label: string;
  oscAddress: string;
  description: string;
  mediaBinPage?: number;
  vdmxPreset?: string;
  color: string;
}

interface SongPreset {
  id: string;
  name: string;
  defaultBpm: number;
  mediaBinPage: number;
  vdmxPreset: string;
  oscAddress: string;
  color: string;
  programs: ProgramSlot[];
}

export default function SongPresets() {
  const [songs, setSongs] = useState<SongPreset[]>([]);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/vdmx/songs')
      .then((r) => r.json())
      .then((d) => setSongs(d.songs ?? []))
      .catch(() => toast.error('Could not load song presets'));
  }, []);

  const activateSong = async (song: SongPreset) => {
    setLoading(`song-${song.id}`);
    try {
      const res = await fetch(`/api/vdmx/songs/${song.id}/activate`, {
        method: 'POST',
      });
      if (res.ok) {
        setActiveSongId(song.id);
        setActiveProgramId(null);
        toast.success(`🎬 ${song.name} → Media Bin page ${song.mediaBinPage}`);
      } else {
        toast.error(`Failed to activate ${song.name}`);
      }
    } catch {
      toast.error('OSC send error — is VDMX running?');
    } finally {
      setLoading(null);
    }
  };

  const triggerProgram = async (song: SongPreset, program: ProgramSlot) => {
    setLoading(`prog-${song.id}-${program.id}`);
    try {
      const res = await fetch(
        `/api/vdmx/songs/${song.id}/programs/${program.id}/trigger`,
        { method: 'POST' }
      );
      if (res.ok) {
        setActiveSongId(song.id);
        setActiveProgramId(program.id);
        toast.success(`✨ ${song.name} → ${program.label}`);
      } else {
        toast.error(`Failed to trigger ${program.label}`);
      }
    } catch {
      toast.error('OSC send error — is VDMX running?');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Music2 className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold text-white">Per-Song Media Bin Presets</span>
        {activeSongId && (
          <Badge variant="outline" className="ml-auto text-xs border-purple-600 text-purple-300">
            Active: {songs.find((s) => s.id === activeSongId)?.name}
          </Badge>
        )}
      </div>

      {songs.map((song) => {
        const isActiveSong = activeSongId === song.id;

        return (
          <Card
            key={song.id}
            className={`p-3 border transition-all duration-200 ${
              isActiveSong
                ? 'border-opacity-80 bg-gray-900'
                : 'border-gray-800 bg-gray-950 hover:border-gray-700'
            }`}
            style={{
              borderColor: isActiveSong ? song.color : undefined,
              boxShadow: isActiveSong ? `0 0 12px ${song.color}30` : undefined,
            }}
          >
            {/* Song Header Row */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: song.color }}
              />
              <span className="text-sm font-semibold text-white flex-1">{song.name}</span>
              <span className="text-xs text-gray-500 font-mono">{song.defaultBpm} BPM</span>
              <span className="text-xs text-gray-600 font-mono">
                <Layers className="w-3 h-3 inline mr-0.5" />
                pg {song.mediaBinPage}
              </span>
              <Button
                size="sm"
                onClick={() => activateSong(song)}
                disabled={loading === `song-${song.id}`}
                className="h-6 px-2 text-xs font-mono"
                style={{
                  backgroundColor: isActiveSong ? song.color : undefined,
                  borderColor: song.color,
                }}
                variant={isActiveSong ? 'default' : 'outline'}
              >
                {loading === `song-${song.id}` ? '...' : isActiveSong ? 'Active' : 'Load'}
              </Button>
            </div>

            {/* OSC Address */}
            <div className="text-xs text-gray-600 font-mono mb-2 pl-5">
              {song.oscAddress}
            </div>

            {/* Program Slots */}
            <div className="flex flex-wrap gap-1.5 pl-5">
              {song.programs.map((program) => {
                const isActiveProgram = isActiveSong && activeProgramId === program.id;
                const isLoadingThis = loading === `prog-${song.id}-${program.id}`;

                return (
                  <button
                    key={program.id}
                    onClick={() => triggerProgram(song, program)}
                    disabled={!!loading}
                    title={`${program.description}\nOSC: ${program.oscAddress}`}
                    className={`
                      relative px-2.5 py-1 rounded text-xs font-semibold
                      border transition-all duration-150
                      ${isActiveProgram
                        ? 'text-white shadow-lg'
                        : 'text-gray-300 bg-gray-800 border-gray-700 hover:border-gray-500 hover:text-white'
                      }
                      ${isLoadingThis ? 'opacity-50' : ''}
                    `}
                    style={
                      isActiveProgram
                        ? {
                            backgroundColor: program.color,
                            borderColor: program.color,
                            boxShadow: `0 0 8px ${program.color}60`,
                          }
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-1">
                      {isActiveProgram && <Zap className="w-2.5 h-2.5" />}
                      {program.label}
                    </span>
                    {isActiveProgram && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      {songs.length === 0 && (
        <div className="text-center py-8 text-gray-600 text-sm">
          <Music2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Loading song presets…</p>
        </div>
      )}
    </div>
  );
}
