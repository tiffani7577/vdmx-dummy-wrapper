import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Trash2, RefreshCw, Download } from 'lucide-react';
import {
  GENERATORS,
  CHAINS,
  AUDIO_MAPPINGS,
  BLEND_MODES,
  MASTER_CONTROLS,
} from '@shared/intersect-configs';
import { INTERSECT_TEMPLATE_EFFECTS } from '@shared/intersect-template-effects';
import {
  generateVdmxControlSurfaceJson,
  getTemplateDownloadFilename,
} from '@shared/vdmx-control-surface';
import type { IntersectOscMappings, MappedControl } from '@shared/intersect-osc-mapping';
import { downloadTextFile } from '@/lib/download';
import IntersectHelp from '@/components/IntersectHelp';

type ControlCategory = 'effects' | 'generators' | 'audio' | 'blend' | 'master';

function buildFallbackMappings(): IntersectOscMappings {
  const toMapped = (items: { id: string; name: string; osc: string }[]): MappedControl[] =>
    items.map((item) => ({ ...item, address: item.osc, mapped: false }));

  const templateEffects = INTERSECT_TEMPLATE_EFFECTS.map((e) => ({
    id: e.id,
    name: e.intersectLabel,
    osc: e.osc,
  }));

  return {
    effects: toMapped(templateEffects),
    generators: toMapped(GENERATORS),
    audio: toMapped(AUDIO_MAPPINGS),
    blend: toMapped(BLEND_MODES),
    master: toMapped(MASTER_CONTROLS),
    parameterCount: 0,
    mappedCount: 0,
  };
}

function MasterFader({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-xs font-semibold text-gray-300">{label}</label>
        <span className="text-sm font-mono text-purple-300 tabular-nums">{value}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        onValueCommit={(v) => onCommit(v[0])}
        max={100}
        step={1}
      />
    </div>
  );
}

export default function IntersectPerformance() {
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [activeAudio, setActiveAudio] = useState<string[]>([]);
  const [masterOpacity, setMasterOpacity] = useState(100);
  const [feedback, setFeedback] = useState(50);
  const [colorIntensity, setColorIntensity] = useState(100);
  const [mappings, setMappings] = useState<IntersectOscMappings>(buildFallbackMappings);
  const [refreshing, setRefreshing] = useState(false);
  const pendingOscRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const refreshConnection = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/vdmx/discover');
      if (!res.ok) throw new Error('Discovery failed');

      const data = await res.json();
      if (data?.mappings) {
        setMappings(data.mappings);
        const { mappedCount, parameterCount } = data.mappings;
        if (parameterCount === 0) {
          toast.info('VDMX not found — import the Control Surface template first (Help tab)');
        } else if (mappedCount > 0) {
          toast.success(`${mappedCount} of ${INTERSECT_TEMPLATE_EFFECTS.length} effects connected to VDMX`);
        } else {
          toast.warning('VDMX found but no effects matched — check OSCQuery is enabled');
        }
      }
    } catch (e) {
      console.error('[INTERSECT] Discovery failed:', e);
      toast.error('Could not reach VDMX OSCQuery on port 2345');
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  const resolveAddress = useCallback(
    (category: ControlCategory, id: string, fallbackOsc: string) => {
      const control = mappings[category].find((item) => item.id === id);
      return control?.address ?? fallbackOsc;
    },
    [mappings]
  );

  const sendOSC = useCallback(async (address: string, value: number | string) => {
    try {
      await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          args: [
            typeof value === 'number' ? { type: 'f', value } : { type: 's', value },
          ],
        }),
      });
    } catch {
      toast.error(`Could not reach VDMX (${labelFromAddress(address)})`);
    }
  }, []);

  const sendOscSmooth = useCallback(
    (address: string, value: number) => {
      const pending = pendingOscRef.current;
      const existing = pending.get(address);
      if (existing) clearTimeout(existing);
      pending.set(
        address,
        setTimeout(() => {
          pending.delete(address);
          sendOSC(address, value);
        }, 80)
      );
    },
    [sendOSC]
  );

  const sendMaster = useCallback(
    (id: string, fallbackOsc: string, percent: number, immediate = false) => {
      const address = resolveAddress('master', id, fallbackOsc);
      const value = percent / 100;
      if (immediate) {
        const pending = pendingOscRef.current.get(address);
        if (pending) clearTimeout(pending);
        pendingOscRef.current.delete(address);
        sendOSC(address, value);
      } else {
        sendOscSmooth(address, value);
      }
    },
    [resolveAddress, sendOSC, sendOscSmooth]
  );

  const mappedEffects = useMemo(() => mappings.effects, [mappings.effects]);
  const mappedById = useMemo(
    () => new Map(mappedEffects.map((fx) => [fx.id, fx])),
    [mappedEffects]
  );

  const toggleEffect = (id: string, fallbackOsc: string) => {
    const address = resolveAddress('effects', id, fallbackOsc);
    const isActive = activeEffects.includes(id);
    setActiveEffects(isActive ? activeEffects.filter((e) => e !== id) : [...activeEffects, id]);
    sendOSC(address, isActive ? 0 : 1);
  };

  const triggerGenerator = (id: string, fallbackOsc: string) => {
    sendOSC(resolveAddress('generators', id, fallbackOsc), 1);
    toast.success('Generator loaded');
  };

  const clearAllFX = async () => {
    for (const id of activeEffects) {
      const fx = mappedById.get(id);
      if (fx) sendOSC(fx.address, 0);
    }
    setActiveEffects([]);
    toast.info('All effects off');
  };

  const triggerChain = async (chain: (typeof CHAINS)[0]) => {
    for (const id of activeEffects) {
      const fx = mappedById.get(id);
      if (fx) sendOSC(fx.address, 0);
    }

    if (chain.fx) {
      for (const fxId of chain.fx) {
        const fx = mappedById.get(fxId);
        if (fx) sendOSC(fx.address, 1);
      }
      setActiveEffects(chain.fx);
    }

    if (chain.generator) {
      const gen = mappings.generators.find((g) => g.id === chain.generator);
      if (gen) sendOSC(gen.address, 1);
    }

    toast.success(`${chain.name} activated`);
  };

  const downloadTemplate = () => {
    downloadTextFile(getTemplateDownloadFilename(), generateVdmxControlSurfaceJson());
    toast.success('Template downloaded — import in VDMX Control Surface');
  };

  const connectedCount = mappedEffects.filter((fx) => fx.mapped).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshConnection}
            disabled={refreshing}
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Connection
          </Button>
          <span className="text-xs text-gray-500">
            {connectedCount}/{mappedEffects.length} effects linked
            {connectedCount > 0 && (
              <span className="text-green-400 ml-1">● live</span>
            )}
          </span>
        </div>
        <Button size="sm" onClick={downloadTemplate} className="bg-pink-600 hover:bg-pink-700 text-xs font-bold">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Generate VDMX Template
        </Button>
      </div>

      <Tabs defaultValue="perform" className="w-full">
        <TabsList className="grid grid-cols-2 bg-gray-900 p-1 rounded-xl border border-gray-800 h-auto max-w-xs">
          <TabsTrigger value="perform" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-2">
            Perform
          </TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-2">
            Help & Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="help" className="mt-4">
          <IntersectHelp />
        </TabsContent>

        <TabsContent value="perform" className="mt-4 space-y-4">
          <Card className="p-4 bg-gray-950 border-gray-800 sticky top-14 z-40 backdrop-blur-md">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-6 flex-1">
                <MasterFader
                  label="Overall Brightness"
                  value={masterOpacity}
                  onChange={(v) => {
                    setMasterOpacity(v);
                    sendMaster('opacity', MASTER_CONTROLS[0].osc, v, false);
                  }}
                  onCommit={(v) => sendMaster('opacity', MASTER_CONTROLS[0].osc, v, true)}
                />
                <MasterFader
                  label="Trail / Echo"
                  value={feedback}
                  onChange={(v) => {
                    setFeedback(v);
                    sendMaster('feedback', MASTER_CONTROLS[1].osc, v, false);
                  }}
                  onCommit={(v) => sendMaster('feedback', MASTER_CONTROLS[1].osc, v, true)}
                />
                <MasterFader
                  label="Color Intensity"
                  value={colorIntensity}
                  onChange={(v) => {
                    setColorIntensity(v);
                    sendMaster('color', MASTER_CONTROLS[2].osc, v, false);
                  }}
                  onCommit={(v) => sendMaster('color', MASTER_CONTROLS[2].osc, v, true)}
                />
              </div>
              <Button
                variant="destructive"
                className="bg-red-900/50 hover:bg-red-800 text-red-200 font-bold uppercase text-xs px-6 h-10"
                onClick={clearAllFX}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear FX
              </Button>
            </div>
          </Card>

          <Tabs defaultValue="chains" className="w-full">
            <TabsList className="grid grid-cols-4 bg-gray-900 p-1 rounded-xl border border-gray-800 h-auto">
              <TabsTrigger value="chains" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white py-2.5">
                Quick Scenes
              </TabsTrigger>
              <TabsTrigger value="generators" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white py-2.5">
                Backgrounds
              </TabsTrigger>
              <TabsTrigger value="effects" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-2.5">
                Effects
              </TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white py-2.5">
                Audio Reactive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chains" className="mt-4">
              <p className="text-xs text-gray-500 mb-3">One tap loads a full look — multiple effects at once.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CHAINS.map((chain) => (
                  <Button
                    key={chain.id}
                    onClick={() => triggerChain(chain)}
                    className="h-28 flex flex-col items-center justify-center gap-2 bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-pink-500/50"
                  >
                    <span className="text-base font-bold">{chain.name}</span>
                    <span className="text-[10px] text-gray-500">
                      {chain.fx.map((f) => mappedById.get(f)?.name).filter(Boolean).join(' · ')}
                    </span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="generators" className="mt-4">
              <p className="text-xs text-gray-500 mb-3">Load a moving background pattern.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {mappings.generators.map((gen) => (
                  <Button
                    key={gen.id}
                    onClick={() => triggerGenerator(gen.id, gen.osc)}
                    variant="outline"
                    className={`h-16 text-sm font-semibold ${
                      gen.mapped
                        ? 'bg-green-950/30 border-green-700 text-green-100'
                        : 'bg-gray-950 border-gray-800 hover:border-blue-500/50'
                    }`}
                  >
                    {gen.name}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="effects" className="mt-4">
              <p className="text-xs text-gray-500 mb-3">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                Green = connected to VDMX · Purple = active
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {mappedEffects.map((fx) => {
                  const isActive = activeEffects.includes(fx.id);
                  const isConnected = fx.mapped;
                  return (
                    <Button
                      key={fx.id}
                      onClick={() => toggleEffect(fx.id, fx.osc)}
                      className={`h-14 text-xs font-bold uppercase tracking-wide border-2 ${
                        isActive
                          ? 'bg-purple-700 border-purple-400 text-white'
                          : isConnected
                            ? 'bg-green-950/40 border-green-600 text-green-100 hover:bg-green-900/50'
                            : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {fx.name}
                    </Button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-4">
              <p className="text-xs text-gray-500 mb-3">Link visuals to kick, bass, mids, or highs.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mappings.audio.map((map) => {
                  const isActive = activeAudio.includes(map.id);
                  return (
                    <Button
                      key={map.id}
                      variant="outline"
                      className={`h-14 justify-between px-5 ${
                        isActive
                          ? 'bg-orange-950/40 border-orange-600 text-orange-100'
                          : map.mapped
                            ? 'bg-green-950/30 border-green-700 text-green-100'
                            : 'bg-gray-950 border-gray-800 text-gray-300'
                      }`}
                      onClick={() => {
                        setActiveAudio(
                          isActive ? activeAudio.filter((a) => a !== map.id) : [...activeAudio, map.id]
                        );
                        sendOSC(map.address, isActive ? 0 : 1);
                      }}
                    >
                      <span className="text-sm font-medium text-left">{map.name}</span>
                      <span className={`text-[10px] uppercase ${isActive ? 'text-orange-400' : 'text-gray-600'}`}>
                        {isActive ? 'On' : 'Off'}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function labelFromAddress(address: string): string {
  return address.split('/').filter(Boolean).pop() ?? address;
}
