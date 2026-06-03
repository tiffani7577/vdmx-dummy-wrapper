import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Volume2, Zap, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [brightness, setBrightness] = useState([50]);
  const [speed, setSpeed] = useState([50]);
  const [effectsEnabled, setEffectsEnabled] = useState({
    bloom: false,
    glitch: false,
    kaleidoscope: false,
  });

  useEffect(() => {
    // Initialize connection to VDMX
    const initConnection = async () => {
      try {
        const response = await fetch('/api/vdmx/connect');
        if (response.ok) {
          setConnected(true);
          toast.success('Connected to VDMX!');
        }
      } catch (error) {
        toast.error('Failed to connect to VDMX');
      }
    };

    initConnection();
  }, []);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    toast.success(isPlaying ? 'Paused' : 'Playing');
  };

  const handleEffectToggle = (effect: keyof typeof effectsEnabled) => {
    setEffectsEnabled(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));
  };

  const handleBrightnessChange = (value: number[]) => {
    setBrightness(value);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VJ Control Center</h1>
          <p className="text-gray-600">
            {connected ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connected to VDMX
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Disconnected
              </span>
            )}
          </p>
        </div>

        {/* Main Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Play/Pause Card */}
          <Card className="lg:col-span-1 p-6 animate-spring-in shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Now Playing</h3>
              <Button
                onClick={handlePlayPause}
                size="lg"
                className={`rounded-full w-20 h-20 ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>
              <p className="mt-4 text-sm text-gray-600">
                {isPlaying ? 'Playing' : 'Paused'}
              </p>
            </div>
          </Card>

          {/* Brightness Control */}
          <Card className="lg:col-span-1 p-6 animate-spring-in shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: '50ms' }}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Brightness
            </h3>
            <Slider
              value={brightness}
              onValueChange={handleBrightnessChange}
              max={100}
              step={1}
              className="mb-2"
            />
            <p className="text-2xl font-bold text-blue-600">{brightness[0]}%</p>
          </Card>

          {/* Speed Control */}
          <Card className="lg:col-span-1 p-6 animate-spring-in shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-500" />
              Speed
            </h3>
            <Slider
              value={speed}
              onValueChange={handleSpeedChange}
              max={100}
              step={1}
              className="mb-2"
            />
            <p className="text-2xl font-bold text-purple-600">{speed[0]}%</p>
          </Card>
        </div>

        {/* Effects Section */}
        <Tabs defaultValue="effects" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="effects">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(effectsEnabled).map(([effect, enabled], index) => (
                <Card
                  key={effect}
                  className="p-6 animate-spring-in shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleEffectToggle(effect as keyof typeof effectsEnabled)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 capitalize">
                        {effect}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {enabled ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() =>
                        handleEffectToggle(effect as keyof typeof effectsEnabled)
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6 animate-spring-in">
              <div className="flex items-center gap-4">
                <Settings className="w-6 h-6 text-gray-600" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Configuration</h4>
                  <p className="text-sm text-gray-600">
                    Configure your VDMX connection and preferences
                  </p>
                </div>
                <Button variant="outline" className="ml-auto">
                  Configure
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Bar */}
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-900">
                {connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Playback</p>
              <p className="font-semibold text-gray-900">
                {isPlaying ? 'Playing' : 'Paused'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Effects Active</p>
              <p className="font-semibold text-gray-900">
                {Object.values(effectsEnabled).filter(Boolean).length}/3
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
