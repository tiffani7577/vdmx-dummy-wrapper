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
  getTemplateDownloadFilename,
} from '@shared/vdmx-control-surface';
import { downloadTextFile } from '@/lib/download';
import { Download, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function IntersectHelp() {
  const handleDownload = () => {
    downloadTextFile(getTemplateDownloadFilename(), generateVdmxControlSurfaceJson());
    toast.success('Control Surface template downloaded');
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gray-950 border-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Plug-and-Play Setup</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Download one file, import it into VDMX, enable OSCQuery, and INTERSECT connects automatically.
              VDMX uses JSON layout files (Import JSON Layout in the Control Surface inspector).
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Estimated setup time: ~{INTERSECT_SETUP_TIME_MINUTES} minutes
            </div>
          </div>
          <Button onClick={handleDownload} className="bg-pink-600 hover:bg-pink-700 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Generate VDMX Template
          </Button>
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
              <span>Click <strong className="text-white">Generate VDMX Template</strong> above and save the JSON file.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold">2</span>
              <span>In VDMX: Workspace → Add Plugin → Control Surface → Import JSON Layout.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold">3</span>
              <span>Back in INTERSECT, open the Perform tab and click <strong className="text-white">Refresh Connection</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold">4</span>
              <span>Mapped effect buttons turn <strong className="text-green-400">green</strong> — you&apos;re live.</span>
            </li>
          </ol>
        </Card>
      </div>

      <Card className="p-5 bg-gray-950 border-gray-800">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
          Effect Name Reference
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Each INTERSECT button maps to the VDMX ISF name below. OSC addresses are pre-configured in the template.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase text-gray-500 border-b border-gray-800">
                <th className="pb-2 pr-4">INTERSECT Button</th>
                <th className="pb-2 pr-4">VDMX ISF Name</th>
                <th className="pb-2 pr-4">OSC Address</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {INTERSECT_TEMPLATE_EFFECTS.map((effect) => (
                <tr key={effect.vdmxIsfName + effect.osc} className="border-b border-gray-900/80">
                  <td className="py-2 pr-4 text-gray-300">{effect.intersectLabel}</td>
                  <td className="py-2 pr-4 font-medium text-white">{effect.vdmxIsfName}</td>
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
