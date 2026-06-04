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
import {
  buildAllEffectsOffOscMessages,
  buildChainTriggerPhases,
  buildEffectToggleOscMessages,
  chainFxIdsToOscAddresses,
  resolveIntersectFxOsc,
  CHAIN_OSC_BURST_WINDOW_MS,
  EFFECT_OSC_ARG_TYPE,
  MASTER_OSC_ARG_TYPE,
  CONTROL_SURFACE_MASTER_OSC,
  isAllowedIntersectOutboundOsc,
  type FxOscPairRegistry,
  type OscMessage,
  type VdmxOscDiagnostics,
} from '@shared/intersect-fx-osc';
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
  const toMapped = (
    items: { id: string; name: string; osc: string }[],
    preMapped = false
  ): MappedControl[] =>
    items.map((item) => ({
      ...item,
      address: item.osc,
      mapped: preMapped,
    }));

  const templateEffects = INTERSECT_TEMPLATE_EFFECTS.map((e) => ({
    id: e.id,
    name: e.intersectLabel,
    osc: resolveIntersectFxOsc(e.id) ?? e.osc,
  }));

  return {
    effects: toMapped(templateEffects, true),
    generators: toMapped(GENERATORS),
    audio: toMapped(AUDIO_MAPPINGS),
    blend: toMapped(BLEND_MODES),
    master: toMapped(MASTER_CONTROLS, true),
    parameterCount: 0,
    mappedCount: templateEffects.length + MASTER_CONTROLS.length,
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
  const [activeChainId, setActiveChainId] = useState<string | null>(null);
  const [fxOscPairs, setFxOscPairs] = useState<FxOscPairRegistry>({});
  const [vdmxDiagnostics, setVdmxDiagnostics] = useState<VdmxOscDiagnostics | null>(null);
  const pendingOscRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const refreshConnection = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/vdmx/discover');
      if (!res.ok) throw new Error('Discovery failed');

      const data = await res.json();
      if (data?.fxOscPairs && typeof data.fxOscPairs === 'object') {
        setFxOscPairs(data.fxOscPairs);
      }
      if (data?.diagnostics) {
        setVdmxDiagnostics(data.diagnostics);
      }
      if (data?.mappings) {
        setMappings(data.mappings);
        const { mappedCount, parameterCount } = data.mappings;
        if (parameterCount === 0) {
          toast.info('VDMX not found — import the Control Surface template first (Help tab)');
        } else if (data?.diagnostics?.needsCanvasWiring) {
          toast.warning(
            'VDMX connected — Control Surface works, but Canvas FX needs one-time wiring (see banner below)',
            { duration: 8000 }
          );
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

  const sendOSC = useCallback(
    async (
      address: string,
      value: number | string,
      argType: 'i' | 'f' | 's' = typeof value === 'string' ? 's' : 'f'
    ): Promise<boolean> => {
      if (!isAllowedIntersectOutboundOsc(address)) {
        console.warn('[INTERSECT OSC] blocked send to non-INTERSECT path:', address);
        return false;
      }
      try {
        const res = await fetch('/api/vdmx/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            args: [
              typeof value === 'number'
                ? { type: argType, value }
                : { type: 's' as const, value },
            ],
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          console.error('[INTERSECT OSC] send failed:', address, data);
          return false;
        }
        return true;
      } catch (error) {
        console.error('[INTERSECT OSC] send error:', address, error);
        toast.error(`Could not reach VDMX (${labelFromAddress(address)})`);
        return false;
      }
    },
    []
  );

  const sendEffectOsc = useCallback(
    (address: string, value: 0 | 1) => sendOSC(address, value, EFFECT_OSC_ARG_TYPE),
    [sendOSC]
  );

  /** Fire many OSC messages in parallel within CHAIN_OSC_BURST_WINDOW_MS */
  const sendOscBurst = useCallback(
    async (messages: OscMessage[]) => {
      if (messages.length === 0) return true;
      const started = performance.now();
      const results = await Promise.all(
        messages.map(({ address, value, argType = EFFECT_OSC_ARG_TYPE }) =>
          sendOSC(address, value, argType)
        )
      );
      const elapsed = performance.now() - started;
      if (elapsed > CHAIN_OSC_BURST_WINDOW_MS) {
        console.warn(`[INTERSECT] OSC burst took ${elapsed.toFixed(0)}ms (target ≤${CHAIN_OSC_BURST_WINDOW_MS}ms)`);
      }
      return results.every(Boolean);
    },
    [sendOSC]
  );

  /** Run phases sequentially so off/on never race on the same address */
  const sendOscPhased = useCallback(
    async (phases: OscMessage[][]) => {
      for (const phase of phases) {
        const ok = await sendOscBurst(phase);
        if (!ok) return false;
      }
      return true;
    },
    [sendOscBurst]
  );

  /** OSCQuery int + Canvas Wet/Dry float — both fire in parallel */
  const sendEffectToggle = useCallback(
    async (effectId: string, on: boolean) => {
      const messages = buildEffectToggleOscMessages(effectId, on, fxOscPairs);
      if (messages.length === 0) {
        toast.error('Unknown effect');
        return;
      }
      const ok = await sendOscBurst(messages);
      if (!ok) {
        toast.error('OSC send failed — check VDMX is running on port 1234');
      }
    },
    [fxOscPairs, sendOscBurst]
  );

  const clearAllIntersectFx = useCallback(async () => {
    await sendOscBurst(buildAllEffectsOffOscMessages(fxOscPairs));
  }, [fxOscPairs, sendOscBurst]);

  const sendOscSmooth = useCallback(
    (address: string, value: number) => {
      const pending = pendingOscRef.current;
      const existing = pending.get(address);
      if (existing) clearTimeout(existing);
      pending.set(
        address,
        setTimeout(() => {
          pending.delete(address);
          sendOSC(address, value, MASTER_OSC_ARG_TYPE);
        }, 80)
      );
    },
    [sendOSC]
  );

  const sendMaster = useCallback(
    (id: string, fallbackOsc: string, percent: number, immediate = false) => {
      const address =
        id === 'opacity'
          ? CONTROL_SURFACE_MASTER_OSC.opacity
          : id === 'feedback'
            ? CONTROL_SURFACE_MASTER_OSC.feedback
            : id === 'color'
              ? CONTROL_SURFACE_MASTER_OSC.color
              : resolveAddress('master', id, fallbackOsc);
      const value = percent / 100;
      if (immediate) {
        const pending = pendingOscRef.current.get(address);
        if (pending) clearTimeout(pending);
        pendingOscRef.current.delete(address);
        sendOSC(address, value, MASTER_OSC_ARG_TYPE);
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

  const toggleEffect = (id: string) => {
    if (!resolveIntersectFxOsc(id)) {
      toast.error('Unknown effect');
      return;
    }
    const isActive = activeEffects.includes(id);
    setActiveChainId(null);
    setActiveEffects(isActive ? activeEffects.filter((e) => e !== id) : [...activeEffects, id]);
    sendEffectToggle(id, !isActive);
  };

  const triggerGenerator = (id: string, fallbackOsc: string) => {
    sendOSC(resolveAddress('generators', id, fallbackOsc), 1);
    toast.success('Generator loaded');
  };

  const clearAllFX = async () => {
    await clearAllIntersectFx();
    setActiveEffects([]);
    setActiveChainId(null);
    toast.info('All effects cleared');
  };

  const triggerChain = async (chain: (typeof CHAINS)[0]) => {
    const onAddresses = chain.fx ? chainFxIdsToOscAddresses(chain.fx) : [];
    const phases = chain.fx ? buildChainTriggerPhases(chain.fx, fxOscPairs) : [buildAllEffectsOffOscMessages(fxOscPairs)];

    const ok = await sendOscPhased(phases);
    if (!ok) {
      toast.error('Chain OSC failed — refresh connection and check VDMX ports');
      return;
    }

    if (chain.fx) {
      setActiveEffects(chain.fx.filter((id) => resolveIntersectFxOsc(id)));
    } else {
      setActiveEffects([]);
    }
    setActiveChainId(chain.id);

    if (chain.generator) {
      const gen = mappings.generators.find((g) => g.id === chain.generator);
      if (gen) sendOSC(gen.address, 1);
    }

    toast.success(`${chain.name} — ${onAddresses.length} effects ON`);
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
        <Card className="mb-4 p-4 bg-amber-950/30 border-amber-800/50">
          <p className="text-xs text-amber-100/90 leading-relaxed">
            <strong className="text-amber-200">Twitchy faders on the VDMX web page?</strong> That page syncs with APC hardware.
            Close <span className="font-mono">localhost:2345/index.html?HTML</span> and perform from here only. Disable OSCQuery on APC plugins in VDMX.
          </p>
        </Card>

        {vdmxDiagnostics?.needsCanvasWiring && (
          <Card className="mb-4 p-4 bg-amber-950/40 border-amber-700/60">
            <p className="text-sm text-amber-100 font-semibold">One-time VDMX wiring needed</p>
            <p className="text-xs text-amber-200/80 mt-2 leading-relaxed">
              INTERSECT is talking to VDMX ({vdmxDiagnostics.controlSurfaceEffectsFound} Control Surface
              buttons found). Buttons update in VDMX, but Canvas FX Wet/Dry sliders are not linked yet.
            </p>
            <ol className="text-xs text-amber-100/90 mt-3 space-y-1.5 list-decimal list-inside">
              <li>In VDMX, open your <strong>Control Surface</strong> and <strong>Canvas → Video FX</strong> side by side.</li>
              <li>
                <strong>Right-click-drag</strong> each Control Surface button onto its matching Wet/Dry slider
                (e.g. Kaleidoscope button → Kaleidoscope Wet/Dry).
              </li>
              <li>Repeat for your effects, then tap Refresh Connection here.</li>
            </ol>
          </Card>
        )}

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
                  onChange={setMasterOpacity}
                  onCommit={(v) => {
                    setMasterOpacity(v);
                    sendMaster('opacity', MASTER_CONTROLS[0].osc, v, true);
                  }}
                />
                <MasterFader
                  label="Trail / Echo"
                  value={feedback}
                  onChange={setFeedback}
                  onCommit={(v) => {
                    setFeedback(v);
                    sendMaster('feedback', MASTER_CONTROLS[1].osc, v, true);
                  }}
                />
                <MasterFader
                  label="Color Intensity"
                  value={colorIntensity}
                  onChange={setColorIntensity}
                  onCommit={(v) => {
                    setColorIntensity(v);
                    sendMaster('color', MASTER_CONTROLS[2].osc, v, true);
                  }}
                />
              </div>
              <Button
                variant="destructive"
                className="bg-red-900/50 hover:bg-red-800 text-red-200 font-bold uppercase text-xs px-6 h-10"
                onClick={clearAllFX}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear All
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
              <p className="text-xs text-gray-500 mb-3">
                One tap clears all effects (OSCQuery int 0 + Wet/Dry float 0), then fires the chain
                (both addresses int 1 / float 1.0) — within 50ms.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CHAINS.map((chain) => {
                  const isChainActive = activeChainId === chain.id;
                  return (
                  <Button
                    key={chain.id}
                    onClick={() => triggerChain(chain)}
                    className={`h-28 flex flex-col items-center justify-center gap-2 border-2 ${
                      isChainActive
                        ? 'bg-pink-950/50 border-pink-500 hover:bg-pink-950/60'
                        : 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-pink-500/50'
                    }`}
                  >
                    <span className={`text-base font-bold ${isChainActive ? 'text-pink-200' : ''}`}>
                      {chain.name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {chain.fx?.map((f) => mappedById.get(f)?.name).filter(Boolean).join(' · ')}
                    </span>
                  </Button>
                  );
                })}
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
                Green = VDMX linked ·{' '}
                <span className="inline-block w-2 h-2 rounded-full bg-pink-500 mr-1.5" />
                Pink = active (OSCQuery + Wet/Dry)
                {activeEffects.length > 0 && (
                  <span className="ml-2 text-pink-400">{activeEffects.length} ON</span>
                )}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {mappedEffects.map((fx) => {
                  const isActive = activeEffects.includes(fx.id);
                  const isConnected = fx.mapped;
                  return (
                    <Button
                      key={fx.id}
                      onClick={() => toggleEffect(fx.id)}
                      className={`h-14 text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                        isActive
                          ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.45)]'
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
                        sendEffectOsc(map.address, isActive ? 0 : 1);
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
