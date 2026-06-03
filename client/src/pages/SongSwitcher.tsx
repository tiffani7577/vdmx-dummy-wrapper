import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Music } from 'lucide-react';

const SONGS = [
  { name: 'Song 1', id: 'song1' },
  { name: 'Song 2', id: 'song2' },
  { name: 'Song 3', id: 'song3' },
  { name: 'Song 4', id: 'song4' },
  { name: 'Song 5', id: 'song5' },
];

export default function SongSwitcher() {
  const [loading, setLoading] = useState(false);
  const [lastSong, setLastSong] = useState<string | null>(null);

  const handleSongClick = async (songName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '/pl/vdmx/snapshot',
          args: [{ type: 's', value: songName }],
        }),
      });

      if (response.ok) {
        setLastSong(songName);
        toast.success(`Loaded: ${songName}`);
      } else {
        toast.error('Failed to send OSC message');
      }
    } catch (error) {
      toast.error('Connection error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Song Switcher</h1>
          </div>
          <p className="text-gray-600">Click a song to load its preset</p>
          {lastSong && (
            <p className="text-sm text-green-600 mt-2">
              Currently playing: <strong>{lastSong}</strong>
            </p>
          )}
        </div>

        <div className="space-y-3">
          {SONGS.map((song) => (
            <Button
              key={song.id}
              onClick={() => handleSongClick(song.name)}
              disabled={loading}
              className={`w-full h-16 text-lg font-semibold transition-all ${
                lastSong === song.name
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {song.name}
            </Button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 text-sm text-gray-600">
          <p>
            <strong>OSC Message:</strong> <br />
            Address: <code className="bg-gray-100 px-2 py-1 rounded">/pl/vdmx/snapshot</code>
            <br />
            Type: String
          </p>
        </div>
      </div>
    </div>
  );
}
