import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import DynamicSongManager from '@/components/DynamicSongManager';
import IntersectPerformance from '@/components/IntersectPerformance';
import VDMXStatus from '@/components/VDMXStatus';
import SetupWizard from '@/components/SetupWizard';

export default function ProDashboard() {
  const [bpm, setBpm] = useState(120);
  const [showMode, setShowMode] = useState(false);
  const [showWizard, setShowWizard] = useState(() => !localStorage.getItem('intersect_setup_complete'));
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
      {showWizard && (
        <SetupWizard onComplete={() => {
          localStorage.setItem('intersect_setup_complete', 'true');
          setShowWizard(false);
        }} />
      )}
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
            <Button 
              onClick={() => setShowMode(!showMode)}
              className={`text-[10px] font-bold uppercase px-4 h-8 rounded-full transition-all ${
                showMode 
                ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(255,45,120,0.4)]' 
                : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              {showMode ? 'Show Mode Active' : 'Enable Show Mode'}
            </Button>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full border border-gray-800">
              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">System Live</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Setlist & Grid */}
          <div className={`${showMode ? 'hidden' : 'lg:col-span-4'} space-y-6 transition-all`}>
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Performance Setlist</h2>
              </div>
              <DynamicSongManager />
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Ableton Grid</h2>
              </div>
              <AbletonGrid />
            </section>
          </div>

          {/* Right Column: INTERSECT Performance Interface */}
          <div className={`${showMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6 transition-all`}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-pink-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Intersect Command Surface</h2>
                </div>
                {showMode && (
                  <div className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.3em] animate-pulse">
                    Live Performance Mode
                  </div>
                )}
              </div>
              <IntersectPerformance />
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
