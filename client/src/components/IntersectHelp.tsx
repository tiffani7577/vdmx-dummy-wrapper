import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  INTERSECT_TEMPLATE_EFFECTS,
  EFFECTS_NEEDING_DOWNLOAD,
  INTERSECT_SETUP_TIME_MINUTES,
  VDMX_CONTROL_SURFACE_NAME,
} from '@shared/intersect-template-effects';
import {
  generateVdmxControlSurfaceJson,
  generateSetupGuideMarkdown,
  getTemplateDownloadFilename,
  getSetupGuideFilename,
} from '@shared/vdmx-control-surface';
import { downloadTextFile } from '@/lib/download';
import { Download, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function IntersectHelp() {
  const handleDownload = () => {
    downloadTextFile(getTemplateDownloadFilename(), generateVdmxControlSurfaceJson());
    toast.success('Control Surface template downloaded');
  };

  const handleDownloadGuide = () => {
    downloadTextFile(getSetupGuideFilename(), generateSetupGuideMarkdown());
    toast.success('Setup guide downloaded');
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gray-950 border-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Plug-and-Play Setup</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Download the Control Surface JSON and one-page setup guide. Import into VDMX, build the
              Canvas FX chain from the guide, enable OSCQuery, and INTERSECT connects automatically.
              Every button sends OSC to the native Canvas Video FX Wet/Dry address — no manual mapping.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Estimated setup time: ~{INTERSECT_SETUP_TIME_MINUTES} minutes
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownloadGuide} variant="outline" className="border-gray-700 font-bold">
              <Download className="w-4 h-4 mr-2" />
              Setup Guide
            </Button>
            <Button onClick={handleDownload} className="bg-pink-600 hover:bg-pink-700 font-bold">
              <Download className="w-4 h-4 mr-2" />
              Control Surface JSON
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-gray-950 border-gray-800">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
            Where to find Control Surface in VDMX
          </h4>
          <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4 font-mono text-[11px] text-gray-300 space-y-2">
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">1.</span>
              <span>Workspace Inspector → <strong className="text-white">Plugins</strong></span>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">2.</span>
              <span>Click <strong className="text-white">+ Add Plugin</strong> → Control Surface</span>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">3.</span>
              <span>Inspector → <strong className="text-white">Import JSON Layout</strong></span>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">4.</span>
              <span>Enable <strong className="text-white">OSCQuery</strong> on the plugin</span>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-400 shrink-0">5.</span>
              <span>Rename plugin to <strong className="text-green-400">{VDMX_CONTROL_SURFACE_NAME}</strong></span>
            </div>
          </div>

          {/* Visual mockup */}
          <div className="mt-4 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 px-3 py-1.5 text-[10px] text-gray-400 border-b border-gray-700">
              VDMX — Workspace Inspector
            </div>
            <div className="flex min-h-[180px]">
              <div className="w-28 bg-gray-900 border-r border-gray-800 p-2 space-y-1">
                <div className="text-[9px] text-gray-500 uppercase">Plugins</div>
                <div className="text-[10px] bg-purple-900/40 text-purple-200 px-2 py-1 rounded border border-purple-700">
                  + Control Surface
                </div>
                <div className="text-[10px] text-green-400 px-2 py-1 rounded bg-green-950/30 border border-green-800">
                  {VDMX_CONTROL_SURFACE_NAME}
                </div>
              </div>
              <div className="flex-1 bg-gray-950 p-3">
                <div className="text-[9px] text-gray-500 mb-2">Control Surface Inspector</div>
                <div className="grid grid-cols-3 gap-1">
                  {['Kaleidoscope', 'RGB Shift', 'Bloom', 'Vignette', 'Strobe', 'Mirror'].map((label) => (
                    <div
                      key={label}
                      className="h-7 rounded bg-yellow-600/20 border border-yellow-700/50 flex items-center justify-center text-[8px] text-yellow-200"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[8px] text-blue-400">✓ OSCQuery Enabled</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gray-950 border-gray-800">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
            Quick Setup Steps
          </h4>
          <ol className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold">1</span>
              <span>Download the <strong className="text-white">Setup Guide</strong> and add each ISF file to <strong className="text-white">Canvas → Video FX</strong> (Wet/Dry at 0).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold">2</span>
              <span>Import <strong className="text-white">INTERSECT-Control-Surface.json</strong> in VDMX → Control Surface → Import JSON Layout.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold">3</span>
              <span>Enable <strong className="text-white">OSCQuery</strong>, rename the plugin to <strong className="text-green-400">{VDMX_CONTROL_SURFACE_NAME}</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold">4</span>
              <span>In INTERSECT Perform tab, click <strong className="text-white">Refresh Connection</strong> — mapped buttons turn green.</span>
            </li>
          </ol>
        </Card>
      </div>

      <Card className="p-5 bg-gray-950 border-gray-800">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
          Effect Name Reference
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Each button toggles the native <strong className="text-gray-400">Wet / Dry</strong> OSC address for its ISF in the Canvas FX chain.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase text-gray-500 border-b border-gray-800">
                <th className="pb-2 pr-4">INTERSECT Button</th>
                <th className="pb-2 pr-4">VDMX Button</th>
                <th className="pb-2 pr-4">ISF File</th>
                <th className="pb-2 pr-4">Native Wet/Dry OSC</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {INTERSECT_TEMPLATE_EFFECTS.map((effect) => (
                <tr key={effect.id} className="border-b border-gray-900/80">
                  <td className="py-2 pr-4 text-gray-300">{effect.intersectLabel}</td>
                  <td className="py-2 pr-4 font-medium text-white">{effect.vdmxIsfName}</td>
                  <td className="py-2 pr-4 font-mono text-[11px] text-blue-300">{effect.isfFilename}</td>
                  <td className="py-2 pr-4 font-mono text-[11px] text-gray-500">{effect.osc}</td>
                  <td className="py-2">
                    {effect.bundledInVdmx ? (
                      <Badge variant="outline" className="text-green-400 border-green-800 bg-green-950/30 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Built-in
                      </Badge>
                    ) : (
                      <a
                        href={effect.downloadUrl ?? effect.downloadSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[10px] text-orange-400 hover:text-orange-300"
                      >
                        Download ISF <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 bg-amber-950/20 border-amber-900/50">
        <h4 className="text-sm font-bold text-amber-200 mb-2">Faders twitching or jumping?</h4>
        <p className="text-xs text-amber-200/80 mb-3">
          On <strong className="text-amber-100">localhost:2345/index.html?HTML</strong>, the left column
          (<strong className="text-amber-100">APC Bottom</strong> faders) will twitch if your APC hardware is plugged in —
          MIDI and the web page fight each other. INTERSECT only talks to <strong className="text-amber-100">Control_Surface_3</strong>, not APC.
        </p>
        <ol className="space-y-2 text-xs text-amber-200/70 list-decimal list-inside">
          <li>
            <strong className="text-amber-100">Do not use the VDMX web page for live control</strong> — close{' '}
            <span className="font-mono text-amber-100/90">index.html?HTML</span> and use INTERSECT (port 3010/3011) instead.
          </li>
          <li>
            In VDMX: on <strong className="text-amber-100">APC Bottom</strong> / <strong className="text-amber-100">APC Buttons</strong> plugins, turn off <strong className="text-amber-100">OSCQuery Enabled</strong> so they stop appearing on that page.
          </li>
          <li>
            Only <strong className="text-amber-100">Control_Surface_3</strong> should publish OSCQuery for INTERSECT.
          </li>
          <li>
            In VDMX, <strong className="text-amber-100">click the twitchy fader</strong> → UI Inspector → <strong className="text-amber-100">Receiving</strong> tab. Each line is a source (Audio Analysis filter, LFO, MIDI, OSC, etc.). Remove unwanted receivers with the <strong className="text-amber-100">−</strong> button.
          </li>
          <li>
            Check <strong className="text-amber-100">Workspace → Plugins → Audio Analysis</strong>. If filters were dragged onto sliders, those sliders will bounce with the music until you disconnect them.
          </li>
          <li>
            Look for <strong className="text-amber-100">LFO</strong> or <strong className="text-amber-100">NumFX</strong> plugins feeding the same parameter — disable or remove those receivers too.
          </li>
          <li>
            On Control Surface sliders: turn off <strong className="text-amber-100">Enable Echo on all Receivers</strong> if MIDI hardware and OSC are both updating the same control.
          </li>
        </ol>
        <p className="text-[11px] text-amber-200/50 mt-3">
          Quick test: disable the Audio Analysis plugin entirely. If twitching stops, an audio receiver is the culprit — re-enable and clear receivers one by one.
        </p>
      </Card>

      {EFFECTS_NEEDING_DOWNLOAD.length > 0 && (
        <Card className="p-5 bg-orange-950/20 border-orange-900/50">
          <h4 className="text-sm font-bold text-orange-200 mb-2">
            Effects to download from editor.isf.video
          </h4>
          <p className="text-xs text-orange-200/70 mb-3">
            These shaders aren&apos;t bundled with VDMX. Download and install them before your first show.
          </p>
          <div className="flex flex-wrap gap-2">
            {EFFECTS_NEEDING_DOWNLOAD.map((effect) => (
              <a
                key={effect.id}
                href={effect.downloadUrl ?? effect.downloadSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="outline" className="border-orange-800 text-orange-300 hover:bg-orange-950/50 cursor-pointer">
                  {effect.vdmxIsfName} ↗
                </Badge>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
