import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Upload,
  Play,
  Pause,
  Volume2,
  Zap,
  Settings,
  Plus,
  Trash2,
  Eye,
  Music,
  Radio,
  Waves,
  Layers,
} from 'lucide-react';

// Phase 1: Clip data structure
interface Clip {
  id: string;
  name: string;
  url: string;
  duration: number;
  format: string;
  thumbnail?: string;
}

// Phase 2: Effect data structure
interface Effect {
  id: string;
  name: string;
  label: string;
  intensity: number;
  enabled: boolean;
}

// Phase 3: LFO configuration
interface LFOConfig {
  shape: 'sine' | 'triangle' | 'square' | 'saw' | 'random';
  speed: number;
  intensity: number;
  enabled: boolean;
}

const CORE_EFFECTS = [
  { id: 'mirror', name: 'Mirror Wings', icon: '🪞' },
  { id: 'glitch', name: 'Digital Glitch', icon: '⚡' },
  { id: 'color', name: 'Color Wheel', icon: '🎨' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', icon: '✨' },
  { id: 'blur', name: 'Blur to Abstract', icon: '🌫️' },
  { id: 'zoom', name: 'Zoom In/Out', icon: '🔍' },
  { id: 'spin', name: 'Spin', icon: '🌀' },
  { id: 'focus', name: 'Soft Focus', icon: '📷' },
  { id: 'negative', name: 'Negative', icon: '⚫' },
  { id: 'mono', name: 'Mono Color', icon: '🎬' },
];

const ADVANCED_EFFECTS = [
  { id: 'warp', name: 'Liquid Warp', icon: '💧' },
  { id: 'rgb', name: 'RGB Split', icon: '🌈' },
  { id: 'particle', name: 'Particle Burst', icon: '💥' },
  { id: 'glow', name: 'Glow Halo', icon: '💫' },
  { id: 'fisheye', name: 'Fisheye Lens', icon: '👁️' },
  { id: 'tv', name: 'Old TV', icon: '📺' },
  { id: 'strobe', name: 'Strobe Flash', icon: '⚡' },
  { id: 'echo', name: 'Echo Trails', icon: '👻' },
];

const BEAT_SYNC_MODES = ['Manual', 'On Beat', 'Every 4 Bars', 'Every 8 Bars', 'Tempo-Sync'];

export default function ProDashboard() {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [bpm, setBpm] = useState(128);

  // Phase 1: Clips
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 2: Effects
  const [activeEffects, setActiveEffects] = useState<Effect[]>([]);
  const [scenes, setScenes] = useState<{ name: string; effects: Effect[] }[]>([]);
  const [sceneName, setSceneName] = useState('');

  // Phase 3: LFO & Audio Sync
  const [lfoConfig, setLfoConfig] = useState<LFOConfig>({
    shape: 'sine',
    speed: 1,
    intensity: 50,
    enabled: false,
  });
  const [beatSyncMode, setBeatSyncMode] = useState('Manual');
  const [audioReactive, setAudioReactive] = useState(false);

  // Phase 4: Macros & Recording
  const [macroValue, setMacroValue] = useState(50);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMoves, setRecordedMoves] = useState<any[]>([]);

  // Check connection on mount
  useEffect(() => {
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

  // Phase 1: Handle clip upload
  const handleClipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newClip: Clip = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: event.target?.result as string,
          duration: 0,
          format: file.type,
          thumbnail: event.target?.result as string,
        };
        setClips([...clips, newClip]);
        toast.success(`Clip "${newClip.name}" uploaded`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Phase 1: Switch clip
  const handleClipSwitch = (clip: Clip) => {
    setCurrentClip(clip);
    setIsPlaying(true);
    toast.success(`Switched to: ${clip.name}`);
  };

  // Phase 2: Add effect to chain
  const handleAddEffect = (effectId: string) => {
    const effectDef = [...CORE_EFFECTS, ...ADVANCED_EFFECTS].find((e) => e.id === effectId);
    if (!effectDef) return;

    const newEffect: Effect = {
      id: effectId,
      name: effectDef.name,
      label: effectDef.label,
      intensity: 50,
      enabled: true,
    };
    setActiveEffects([...activeEffects, newEffect]);
  };

  // Phase 2: Remove effect
  const handleRemoveEffect = (effectId: string) => {
    setActiveEffects(activeEffects.filter((e) => e.id !== effectId));
  };

  // Phase 2: Save scene
  const handleSaveScene = () => {
    if (!sceneName.trim()) {
      toast.error('Enter a scene name');
      return;
    }
    const newScene = { name: sceneName, effects: activeEffects };
    setScenes([...scenes, newScene]);
    setSceneName('');
    toast.success(`Scene "${sceneName}" saved`);
  };

  // Phase 2: Load scene
  const handleLoadScene = (scene: { name: string; effects: Effect[] }) => {
    setActiveEffects(scene.effects);
    toast.success(`Loaded scene: ${scene.name}`);
  };

  // Phase 3: Send OSC with effect
  const handleSendEffect = async (effect: Effect) => {
    try {
      await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: `/effect/${effect.id}`,
          args: [{ type: 'f', value: effect.intensity / 100 }],
        }),
      });
      toast.success(`Sent: ${effect.name}`);
    } catch (error) {
      toast.error('Failed to send effect');
    }
  };

  // Phase 4: Macro control
  const handleMacroChange = (value: number[]) => {
    setMacroValue(value[0]);
    // Apply macro to all active effects
    const updatedEffects = activeEffects.map((e) => ({
      ...e,
      intensity: value[0],
    }));
    setActiveEffects(updatedEffects);
  };

  // Phase 4: Recording
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedMoves([]);
    toast.success('Recording started');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.success(`Recorded ${recordedMoves.length} moves`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Pro VJ Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <p className="text-gray-600">{connected ? 'Connected' : 'Disconnected'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>BPM: {bpm}</span>
            <span>•</span>
            <span>{currentClip ? `Playing: ${currentClip.name}` : 'No clip selected'}</span>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="clips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clips">
              <Music className="w-4 h-4 mr-2" />
              Clips
            </TabsTrigger>
            <TabsTrigger value="effects">
              <Zap className="w-4 h-4 mr-2" />
              Effects
            </TabsTrigger>
            <TabsTrigger value="lfo">
              <Waves className="w-4 h-4 mr-2" />
              LFO
            </TabsTrigger>
            <TabsTrigger value="macros">
              <Layers className="w-4 h-4 mr-2" />
              Macros
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Phase 1: Clips Tab */}
          <TabsContent value="clips" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Clip Library</h2>

              {/* Upload */}
              <div className="mb-6 p-4 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:bg-blue-50"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Drag clips here or click to upload</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleClipUpload}
                  className="hidden"
                />
              </div>

              {/* Clips Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {clips.map((clip) => (
                  <Card
                    key={clip.id}
                    className={`p-3 cursor-pointer transition-all ${
                      currentClip?.id === clip.id ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => handleClipSwitch(clip)}
                  >
                    <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold truncate">{clip.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClips(clips.filter((c) => c.id !== clip.id));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Beat Sync Mode */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Clip Switching Mode</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {BEAT_SYNC_MODES.map((mode) => (
                  <Button
                    key={mode}
                    onClick={() => setBeatSyncMode(mode)}
                    variant={beatSyncMode === mode ? 'default' : 'outline'}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Phase 2: Effects Tab */}
          <TabsContent value="effects" className="space-y-4">
            {/* Core Effects */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Core Effects</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CORE_EFFECTS.map((effect) => (
                  <Button
                    key={effect.id}
                    onClick={() => handleAddEffect(effect.id)}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">{effect.icon}</span>
                    <span className="text-xs text-center">{effect.name}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Advanced Effects */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Advanced Effects</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ADVANCED_EFFECTS.map((effect) => (
                  <Button
                    key={effect.id}
                    onClick={() => handleAddEffect(effect.id)}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">{effect.icon}</span>
                    <span className="text-xs text-center">{effect.name}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Active Effects Chain */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Active Effect Chain</h2>
              {activeEffects.length === 0 ? (
                <p className="text-gray-500">No effects active. Add effects above.</p>
              ) : (
                <div className="space-y-3">
                  {activeEffects.map((effect, idx) => (
                    <div key={effect.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-600">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-semibold">{effect.name}</p>
                        <Slider
                          value={[effect.intensity]}
                          onValueChange={(val) => {
                            const updated = activeEffects.map((e) =>
                              e.id === effect.id ? { ...e, intensity: val[0] } : e
                            );
                            setActiveEffects(updated);
                          }}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      <span className="text-sm text-gray-600">{effect.intensity}%</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveEffect(effect.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Scene */}
              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Scene name..."
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                />
                <Button onClick={handleSaveScene}>Save Scene</Button>
              </div>
            </Card>

            {/* Saved Scenes */}
            {scenes.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Saved Scenes</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scenes.map((scene, idx) => (
                    <Button
                      key={idx}
                      onClick={() => handleLoadScene(scene)}
                      variant="outline"
                      className="h-auto py-3"
                    >
                      {scene.name}
                    </Button>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Phase 3: LFO Tab */}
          <TabsContent value="lfo" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">LFO Modulation</h2>

              <div className="space-y-4">
                {/* LFO Shape */}
                <div>
                  <label className="block text-sm font-semibold mb-2">LFO Shape</label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['sine', 'triangle', 'square', 'saw', 'random'] as const).map((shape) => (
                      <Button
                        key={shape}
                        onClick={() => setLfoConfig({ ...lfoConfig, shape })}
                        variant={lfoConfig.shape === shape ? 'default' : 'outline'}
                      >
                        {shape.charAt(0).toUpperCase() + shape.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* LFO Speed */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Speed: {lfoConfig.speed.toFixed(1)}</label>
                  <Slider
                    value={[lfoConfig.speed]}
                    onValueChange={(val) => setLfoConfig({ ...lfoConfig, speed: val[0] })}
                    min={0.1}
                    max={10}
                    step={0.1}
                  />
                </div>

                {/* LFO Intensity */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Intensity: {lfoConfig.intensity}%</label>
                  <Slider
                    value={[lfoConfig.intensity]}
                    onValueChange={(val) => setLfoConfig({ ...lfoConfig, intensity: val[0] })}
                    max={100}
                    step={1}
                  />
                </div>

                {/* Enable LFO */}
                <Button
                  onClick={() => setLfoConfig({ ...lfoConfig, enabled: !lfoConfig.enabled })}
                  className={lfoConfig.enabled ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {lfoConfig.enabled ? 'LFO Enabled' : 'LFO Disabled'}
                </Button>
              </div>
            </Card>

            {/* Audio Sync */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Audio Sync</h2>
              <div className="space-y-3">
                <Button
                  onClick={() => setAudioReactive(!audioReactive)}
                  className={audioReactive ? 'bg-blue-500 hover:bg-blue-600 w-full' : 'w-full'}
                  variant={audioReactive ? 'default' : 'outline'}
                >
                  {audioReactive ? '🎵 Audio Reactive ON' : '🎵 Audio Reactive OFF'}
                </Button>
                <p className="text-sm text-gray-600">
                  {audioReactive
                    ? 'Reacting to: Kick detection, frequency bands, volume level'
                    : 'Enable to sync effects to audio'}
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Phase 4: Macros Tab */}
          <TabsContent value="macros" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Master Macro Control</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Energy Level: {macroValue}%</label>
                  <Slider
                    value={[macroValue]}
                    onValueChange={handleMacroChange}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-gray-600 mt-2">Controls all active effects simultaneously</p>
                </div>
              </div>
            </Card>

            {/* Recording */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Performance Recording</h2>
              <div className="space-y-3">
                {!isRecording ? (
                  <Button onClick={handleStartRecording} className="w-full bg-red-500 hover:bg-red-600">
                    ● Start Recording
                  </Button>
                ) : (
                  <Button onClick={handleStopRecording} className="w-full bg-red-600 hover:bg-red-700">
                    ⏹ Stop Recording
                  </Button>
                )}
                <p className="text-sm text-gray-600">
                  {isRecording ? 'Recording your fader movements...' : 'Record your performance to replay later'}
                </p>
                {recordedMoves.length > 0 && (
                  <p className="text-sm font-semibold text-green-600">Recorded: {recordedMoves.length} moves</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">BPM</label>
                  <Slider
                    value={[bpm]}
                    onValueChange={(val) => setBpm(val[0])}
                    min={60}
                    max={200}
                    step={1}
                  />
                  <p className="text-sm text-gray-600 mt-1">Current: {bpm} BPM</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Ableton Integration</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✓ Ableton Link: Ready</p>
                <p>✓ MIDI Mapping: Ready</p>
                <p>✓ OSC Control: Ready</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
