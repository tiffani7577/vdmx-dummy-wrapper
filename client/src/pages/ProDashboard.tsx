import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Zap, 
  Waves, 
  Layers, 
  Settings, 
  LayoutGrid, 
  Map, 
  MonitorPlay,
  Activity
} from 'lucide-react';

// New Components
import AbletonGrid from '@/components/AbletonGrid';
import SongPresets from '@/components/SongPresets';
import MappablePrograms from '@/components/MappablePrograms';
import VDMXStatus from '@/components/VDMXStatus';

export default function ProDashboard() {
  const [bpm, setBpm] = useState(120);
  const [activeSong, setActiveSong] = useState<string | null>(null);

  // Fetch current state periodically
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/vdmx/ableton/state');
        if (res.ok) {
          const data = await res.json();
          if (data.state.tempo) setBpm(data.state.tempo);
        }
      } catch (e) {}
    };
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-purple-500/30">
      {/* Top Status Bar */}
      <div className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <MonitorPlay className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                VDMX 6+ COMMAND CENTER
              </h1>
            </div>
            <div className="h-4 w-[1px] bg-gray-800 mx-2" />
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Global Tempo</span>
                <span className="text-sm font-mono text-purple-400">{bpm.toFixed(1)} BPM</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Engine</span>
                <span className="text-sm font-mono text-blue-400">Metal v6.0.4</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <VDMXStatus />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full border border-gray-800">
              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">System Live</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Song Presets & Program Slots (Mappable Programs) */}
          <div className="lg:col-span-4 space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Performance Setlist</h2>
              </div>
              <SongPresets />
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Map className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">OSC Mapping Table</h2>
              </div>
              <MappablePrograms />
            </section>
          </div>

          {/* Right Column: Ableton Grid & Performance Controls */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Ableton Grid - Full Width in right col */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Ableton Live Session Grid</h2>
              </div>
              <AbletonGrid />
            </section>

            {/* Performance Controls Tabs */}
            <section>
              <Tabs defaultValue="fx" className="w-full">
                <div className="flex items-center justify-between mb-4 bg-gray-950 p-1 rounded-lg border border-gray-800">
                  <TabsList className="bg-transparent border-none">
                    <TabsTrigger value="fx" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-500 text-xs uppercase font-bold px-6">
                      <Zap className="w-3.5 h-3.5 mr-2" /> FX Rack
                    </TabsTrigger>
                    <TabsTrigger value="lfo" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-500 text-xs uppercase font-bold px-6">
                      <Waves className="w-3.5 h-3.5 mr-2" /> Modulation
                    </TabsTrigger>
                    <TabsTrigger value="macros" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-500 text-xs uppercase font-bold px-6">
                      <Layers className="w-3.5 h-3.5 mr-2" /> Master Macros
                    </TabsTrigger>
                  </TabsList>
                  <div className="px-4 text-[10px] text-gray-600 font-mono uppercase font-bold">
                    Control Surface v2.1
                  </div>
                </div>

                <TabsContent value="fx" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Active FX Chain</h3>
                      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-900 rounded-lg">
                        <Zap className="w-8 h-8 text-gray-800 mb-2" />
                        <p className="text-sm text-gray-600">No effects currently active in chain</p>
                        <p className="text-[10px] text-gray-700 mt-1 uppercase">Map FX to Program Slots for Auto-Recall</p>
                      </div>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Quick Triggers</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['Strobe', 'Glitch', 'Invert', 'Freeze', 'RGB Split', 'Mirror'].map(fx => (
                          <button key={fx} className="h-12 rounded bg-gray-900 border border-gray-800 text-[10px] font-bold uppercase hover:bg-gray-800 transition-colors">
                            {fx}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="lfo" className="mt-0">
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 text-center">
                    <Waves className="w-12 h-12 text-blue-900 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-500 text-sm">LFO Modulation Engines 1-4 Ready</p>
                    <p className="text-[10px] text-gray-700 mt-1 uppercase tracking-widest">Awaiting Parameter Mapping</p>
                  </div>
                </TabsContent>

                <TabsContent value="macros" className="mt-0">
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 text-center">
                    <Layers className="w-12 h-12 text-purple-900 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-500 text-sm">Master Performance Macros (A/B/C)</p>
                    <p className="text-[10px] text-gray-700 mt-1 uppercase tracking-widest">Global Intensity: 100%</p>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

          </div>
        </div>
      </main>

      {/* Footer / Meta */}
      <footer className="max-w-[1600px] mx-auto px-6 py-8 border-t border-gray-900 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-gray-600 uppercase font-bold tracking-[0.2em]">
            VDMX 6+ Dummy Wrapper — Advanced VJ Middleware
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] text-gray-600 hover:text-white uppercase font-bold tracking-widest transition-colors">Documentation</a>
            <a href="#" className="text-[10px] text-gray-600 hover:text-white uppercase font-bold tracking-widest transition-colors">OSC Spec</a>
            <a href="#" className="text-[10px] text-gray-600 hover:text-white uppercase font-bold tracking-widest transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
