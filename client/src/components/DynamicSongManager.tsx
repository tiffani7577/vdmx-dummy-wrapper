import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Music, Save, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Song {
  id: number;
  name: string;
  bpm: number;
  mediaBinPage: number;
  vdmxPreset: string;
}

export default function DynamicSongManager() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [newSong, setNewSong] = useState({ name: '', bpm: 120, mediaBinPage: 0, vdmxPreset: '' });

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/vdmx/songs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSongs(data);
        } else if (data && Array.isArray(data.songs)) {
          setSongs(data.songs);
        }
      }
    } catch (e) {
      console.error('[SONGS] Fetch failed:', e);
    }
  };

  useEffect(() => { fetchSongs(); }, []);

  const addSong = async () => {
    if (!newSong.name) return toast.error('Song name is required');
    const res = await fetch('/api/vdmx/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSong),
    });
    if (res.ok) {
      toast.success('Song added to setlist');
      setNewSong({ name: '', bpm: 120, mediaBinPage: 0, vdmxPreset: '' });
      fetchSongs();
    }
  };

  const deleteSong = async (id: number) => {
    const res = await fetch(`/api/vdmx/songs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Song removed');
      fetchSongs();
    }
  };

  const activateSong = async (song: Song) => {
    try {
      await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: `/vdmx/song/${song.id}`,
          args: [{ type: 'i', value: 1 }]
        }),
      });
      // Also trigger media bin and preset
      await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '/vdmx/mediaBin/page',
          args: [{ type: 'i', value: song.mediaBinPage }]
        }),
      });
      if (song.vdmxPreset) {
        await fetch('/api/vdmx/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: '/vdmx/preset/load',
            args: [{ type: 's', value: song.vdmxPreset }]
          }),
        });
      }
      toast.success(`Active Song: ${song.name}`);
    } catch (e) {
      toast.error('Failed to activate song');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gray-950 border-gray-800">
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 flex items-center gap-2">
          <Plus className="w-3 h-3" /> Add New Song
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input 
            placeholder="Song Name" 
            value={newSong.name} 
            onChange={e => setNewSong({...newSong, name: e.target.value})}
            className="bg-gray-900 border-gray-800 text-white"
          />
          <Input 
            type="number" 
            placeholder="BPM" 
            value={newSong.bpm} 
            onChange={e => setNewSong({...newSong, bpm: parseInt(e.target.value)})}
            className="bg-gray-900 border-gray-800 text-white"
          />
          <Input 
            type="number" 
            placeholder="Bin Page" 
            value={newSong.mediaBinPage} 
            onChange={e => setNewSong({...newSong, mediaBinPage: parseInt(e.target.value)})}
            className="bg-gray-900 border-gray-800 text-white"
          />
          <Button onClick={addSong} className="bg-pink-600 hover:bg-pink-700 font-bold uppercase text-xs">
            Add Song
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-2">
        {songs.map(song => (
          <div key={song.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg group">
            <div className="flex items-center gap-4">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-pink-500 hover:text-pink-400"
                onClick={() => activateSong(song)}
              >
                <Play className="w-4 h-4" />
              </Button>
              <div>
                <p className="text-sm font-bold text-white">{song.name}</p>
                <p className="text-[10px] text-gray-500 uppercase font-mono">
                  {song.bpm} BPM • PAGE {song.mediaBinPage} {song.vdmxPreset && `• PRESET: ${song.vdmxPreset}`}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-opacity"
              onClick={() => deleteSong(song.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
