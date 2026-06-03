import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Zap, 
  Waves, 
  Layers, 
  Music, 
  Activity, 
  Trash2, 
  Wind,
  Settings,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { GENERATORS, EFFECTS, CHAINS, AUDIO_MAPPINGS, BLEND_MODES } from '@/../../shared/intersect-configs';

export default function IntersectPerformance() {
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [activeAudio, setActiveAudio] = useState<string[]>([]);
  const [masterOpacity, setMasterOpacity] = useState(100);
  const [feedback, setFeedback] = useState(50);
  const [colorIntensity, setColorIntensity] = useState(100);
  const [installedShaders, setInstalledShaders] = useState<string[]>([]);

  // Discover shaders on mount
  useEffect(() => {
    const discover = async () => {
      try {
        const res = await fetch('/api/vdmx/discover');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.shaders)) {
            setInstalledShaders(data.shaders);
          }
        }
      } catch (e) {
        console.error('[INTERSECT] Discovery failed:', e);
      }
    };
    discover();
  }, []);

  const sendOSC = async (address: string, value: number | string) => {
    try {
      await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          args: [typeof value === 'number' ? { type: 'f', value } : { type: 's', value }]
        }),
      });
    } catch (e) {
      toast.error(`Failed to send OSC to ${address}`);
    }
  };

  const toggleEffect = (id: string, osc: string) => {
    const isActive = activeEffects.includes(id);
    const newActive = isActive 
      ? activeEffects.filter(e => e !== id) 
      : [...activeEffects, id];
    
    setActiveEffects(newActive);
    sendOSC(osc, isActive ? 0 : 1);
  };

  const triggerGenerator = (osc: string) => {
    sendOSC(osc, 1);
    toast.success('Generator Loaded');
  };

  const clearAllFX = async () => {
    // Send 0 to all active effects
    for (const id of activeEffects) {
      const fx = EFFECTS.find(e => e.id === id);
      if (fx) sendOSC(fx.osc, 0);
    }
    setActiveEffects([]);
    toast.info('All Effects Cleared');
  };

  const triggerChain = async (chain: typeof CHAINS[0]) => {
    await clearAllFX();
    
    // Trigger new effects
    if (chain.fx) {
      for (const fxId of chain.fx) {
        const fx = EFFECTS.find(e => e.id === fxId);
        if (fx) {
          sendOSC(fx.osc, 1);
        }
      }
      setActiveEffects(chain.fx);
    }
    
    if (chain.generator) {
      const gen = GENERATORS.find(g => g.id === chain.generator);
      if (gen) sendOSC(gen.osc, 1);
    }
    
    toast.success(`Chain Activated: ${chain.name}`);
  };

  const isInstalled = (id: string) => {
    if (!installedShaders || !Array.isArray(installedShaders)) return true;
    return installedShaders.includes(id) || true;
  };

  return (
    <div className="space-y-6">
      {/* Master Controls - Always Visible */}
      <Card className="p-4 bg-gray-950 border-gray-800 sticky top-14 z-40 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Master Opacity</label>
              <Slider 
                value={[masterOpacity]} 
                onValueChange={(v) => { setMasterOpacity(v[0]); sendOSC('/intersect/master/opacity', v[0]/100); }} 
                max={100} 
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Feedback</label>
              <Slider 
                value={[feedback]} 
                onValueChange={(v) => { setFeedback(v[0]); sendOSC('/intersect/master/feedback', v[0]/100); }} 
                max={100} 
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Color</label>
              <Slider 
                value={[colorIntensity]} 
                onValueChange={(v) => { setColorIntensity(v[0]); sendOSC('/intersect/master/color', v[0]/100); }} 
                max={100} 
              />
            </div>
          </div>
          <Button 
            variant="destructive" 
            className="bg-red-900/50 hover:bg-red-800 text-red-200 font-bold uppercase text-xs px-8"
            onClick={clearAllFX}
          >
            Clear All FX
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="chains" className="w-full">
        <TabsList className="grid grid-cols-5 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <TabsTrigger value="chains" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">Chains</TabsTrigger>
          <TabsTrigger value="generators" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Generators</TabsTrigger>
          <TabsTrigger value="effects" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Effects</TabsTrigger>
          <TabsTrigger value="audio" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Audio</TabsTrigger>
          <TabsTrigger value="blend" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Blend</TabsTrigger>
        </TabsList>

        {/* Chains Tab */}
        <TabsContent value="chains" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHAINS.map(chain => (
              <Button
                key={chain.id}
                onClick={() => triggerChain(chain)}
                className="h-32 flex flex-col items-center justify-center gap-2 bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-pink-500/50 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-lg font-bold tracking-tight">{chain.name}</span>
                <div className="flex flex-wrap justify-center gap-1">
                  {chain.fx.map(f => (
                    <span key={f} className="text-[8px] uppercase px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
                      {EFFECTS.find(e => e.id === f)?.name}
                    </span>
                  ))}
                </div>
              </Button>
            ))}
          </div>
        </TabsContent>

        {/* Generators Tab */}
        <TabsContent value="generators" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {GENERATORS.map(gen => (
              <Button
                key={gen.id}
                onClick={() => triggerGenerator(gen.osc)}
                variant="outline"
                className="h-20 bg-gray-950 border-gray-800 hover:border-blue-500/50 flex flex-col items-center justify-center gap-1"
              >
                <span className="text-sm font-bold">{gen.name}</span>
                <span className="text-[9px] text-gray-600 uppercase font-mono">{gen.id}</span>
              </Button>
            ))}
          </div>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {EFFECTS.map(fx => {
              const isActive = activeEffects.includes(fx.id);
              const installed = isInstalled(fx.id);
              return (
                <Button
                  key={fx.id}
                  onClick={() => toggleEffect(fx.id, fx.osc)}
                  className={`h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                    isActive 
                      ? 'bg-purple-900/40 border-purple-500 text-white' 
                      : 'bg-gray-950 border-gray-900 text-gray-400 hover:border-gray-700'
                  } ${!installed ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {installed ? <ShieldCheck className="w-3 h-3 text-green-500" /> : <ShieldAlert className="w-3 h-3 text-amber-500" />}
                    <span className="text-xs font-bold uppercase tracking-wider">{fx.name}</span>
                  </div>
                  {!installed && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 rounded font-bold">Not Installed</span>}
                </Button>
              );
            })}
          </div>
        </TabsContent>

        {/* Audio Tab */}
        <TabsContent value="audio" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUDIO_MAPPINGS.map(map => (
              <Button
                key={map.id}
                variant="outline"
                className="h-16 flex items-center justify-between px-6 bg-gray-950 border-gray-800 hover:border-orange-500/50"
                onClick={() => {
                  const isActive = activeAudio.includes(map.id);
                  setActiveAudio(isActive ? activeAudio.filter(a => a !== map.id) : [...activeAudio, map.id]);
                  sendOSC(map.osc, isActive ? 0 : 1);
                }}
              >
                <div className="text-left">
                  <p className="text-sm font-bold">{map.name}</p>
                  <p className="text-[10px] text-gray-600 font-mono uppercase">{map.osc}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${activeAudio.includes(map.id) ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-gray-800'}`} />
              </Button>
            ))}
          </div>
        </TabsContent>

        {/* Blend Tab */}
        <TabsContent value="blend" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {BLEND_MODES.map(mode => (
              <Button
                key={mode.id}
                onClick={() => sendOSC(mode.osc, 1)}
                className="h-20 bg-gray-950 border-gray-800 hover:border-green-500/50 flex flex-col items-center justify-center gap-1"
              >
                <span className="text-sm font-bold">{mode.name}</span>
                <span className="text-[9px] text-gray-600 uppercase font-mono">{mode.id}</span>
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
