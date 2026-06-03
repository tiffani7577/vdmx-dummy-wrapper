import React from "react";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SONGS = [
  { name: 'am_i_ok', address: '/preset/am_i_ok' },
  { name: 'gutter', address: '/preset/gutter' },
  { name: 'luv_me_down', address: '/preset/luv_me_down' },
  { name: 'let_u_go', address: '/preset/let_u_go' },
  { name: 'idoit2', address: '/preset/idoit2' },
];

export default function SongSwitcher() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSong, setLastSong] = useState<string | null>(null);

  // Check connection on mount
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/vdmx/connect');
        if (response.ok) {
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    };
    checkConnection();
  }, []);

  const sendOSC = async (songName: string, address: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          args: [{ type: 'i', value: 1 }],
        }),
      });

      if (response.ok) {
        setLastSong(songName);
        toast.success(`Sent: ${address}`);
      } else {
        toast.error('Failed to send');
      }
    } catch (error) {
      toast.error('Error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '/test',
          args: [{ type: 'i', value: 1 }],
        }),
      });

      if (response.ok) {
        toast.success('Test sent: /test');
      } else {
        toast.error('Failed to send test');
      }
    } catch (error) {
      toast.error('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Preset Loader</h1>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <p className="text-gray-600">
              {connected ? 'Connected to VDMX' : 'Disconnected'}
            </p>
          </div>
          {lastSong && (
            <p className="text-sm text-green-600 mt-2">
              Last loaded: <strong>{lastSong}</strong>
            </p>
          )}
        </div>

        {/* Song Buttons */}
        <div className="space-y-3 mb-8">
          {SONGS.map((song) => (
            <div key={song.address}>
              <Button
                onClick={() => sendOSC(song.name, song.address)}
                disabled={loading}
                className={`w-full h-14 text-lg font-semibold transition-all ${
                  lastSong === song.name
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {song.name}
              </Button>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {song.address}
              </p>
            </div>
          ))}
        </div>

        {/* Test Button */}
        <div>
          <Button
            onClick={sendTest}
            disabled={loading}
            variant="outline"
            className="w-full h-12 text-base font-semibold"
          >
            Test
          </Button>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            /test
          </p>
        </div>
      </div>
    </div>
  );
}
