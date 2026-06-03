import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Zap, Map, ChevronDown, ChevronRight } from 'lucide-react';

interface Parameter {
  address: string;
  type: string;
  description: string;
  category: string;
  songId?: string;
  programId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  song: 'bg-purple-900/40 border-purple-700 text-purple-300',
  program: 'bg-blue-900/40 border-blue-700 text-blue-300',
  mediaBin: 'bg-amber-900/40 border-amber-700 text-amber-300',
  preset: 'bg-green-900/40 border-green-700 text-green-300',
  layer: 'bg-cyan-900/40 border-cyan-700 text-cyan-300',
  master: 'bg-red-900/40 border-red-700 text-red-300',
  transport: 'bg-orange-900/40 border-orange-700 text-orange-300',
};

const CATEGORY_LABELS: Record<string, string> = {
  song: 'Song Trigger',
  program: 'Program / Scene',
  mediaBin: 'Media Bin',
  preset: 'Preset Recall',
  layer: 'Layer Control',
  master: 'Master',
  transport: 'Transport',
};

export default function MappablePrograms() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['program', 'song'])
  );

  useEffect(() => {
    fetch('/api/vdmx/parameters')
      .then((r) => r.json())
      .then((d) => setParameters(d.parameters ?? []))
      .catch(() => toast.error('Could not load VDMX parameters'));
  }, []);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success(`Copied: ${address}`);
  };

  const sendTrigger = async (param: Parameter) => {
    try {
      const res = await fetch('/api/vdmx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: param.address,
          args: [{ type: param.type === 's' ? 's' : param.type === 'f' ? 'f' : 'i', value: param.type === 'f' ? 1.0 : param.type === 's' ? 'trigger' : 1 }],
        }),
      });
      if (res.ok) {
        setActiveAddress(param.address);
        setTimeout(() => setActiveAddress(null), 1500);
        toast.success(`Sent: ${param.address}`);
      }
    } catch {
      toast.error('OSC send failed');
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group parameters by category
  const grouped = parameters.reduce<Record<string, Parameter[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const categoryOrder = ['program', 'song', 'mediaBin', 'preset', 'layer', 'master', 'transport'];

  return (
    <Card className="p-4 bg-gray-950 border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Map className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">Mappable Programs & OSC Addresses</span>
        <Badge variant="outline" className="ml-auto text-xs border-gray-700 text-gray-400">
          {parameters.length} addresses
        </Badge>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Map these OSC addresses in VDMX's <strong className="text-gray-300">Control Surface</strong> plugin,
        or use them in Ableton's MIDI Remote Scripts / TouchOSC / Lemur.
        <br />
        <strong className="text-gray-300">Program / Scene</strong> slots are the primary mappable targets
        (e.g. "Her Scene", "Chorus", "Drop").
      </p>

      <div className="space-y-2">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          const isExpanded = expandedCategories.has(cat);
          const colorClass = CATEGORY_COLORS[cat] ?? 'bg-gray-900 border-gray-700 text-gray-300';

          return (
            <div key={cat} className="rounded border border-gray-800 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <Badge className={`text-xs px-2 py-0 ${colorClass}`}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </Badge>
                <span className="text-xs text-gray-500 ml-auto">{items.length} addresses</span>
              </button>

              {/* Parameter Rows */}
              {isExpanded && (
                <div className="divide-y divide-gray-800/50">
                  {items.map((param) => {
                    const isActive = activeAddress === param.address;
                    return (
                      <div
                        key={param.address}
                        className={`flex items-start gap-2 px-3 py-2 transition-colors ${
                          isActive ? 'bg-blue-950/40' : 'hover:bg-gray-900/50'
                        }`}
                      >
                        {/* OSC Address */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code
                              className={`text-xs font-mono truncate ${
                                isActive ? 'text-blue-300' : 'text-green-400'
                              }`}
                            >
                              {param.address}
                            </code>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 border-gray-700 text-gray-500 flex-shrink-0"
                            >
                              {param.type}
                            </Badge>
                            {isActive && (
                              <Zap className="w-3 h-3 text-blue-400 animate-pulse flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {param.description}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyAddress(param.address)}
                            className="h-6 w-6 p-0 text-gray-600 hover:text-gray-300"
                            title="Copy OSC address"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendTrigger(param)}
                            className="h-6 w-6 p-0 text-gray-600 hover:text-blue-400"
                            title="Send test trigger"
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
