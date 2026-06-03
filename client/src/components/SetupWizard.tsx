import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  ChevronLeft,
  MonitorPlay,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generateVdmxControlSurfaceJson,
  getTemplateDownloadFilename,
} from '@shared/vdmx-control-surface';
import { downloadTextFile } from '@/lib/download';

const STEPS = [
  {
    title: "Download the VDMX Control Surface file",
    content:
      "Click below to generate INTERSECT-Control-Surface.json. This file contains toggle buttons for every effect with the correct OSC addresses pre-wired.",
    icon: <Download className="w-8 h-8 text-pink-500" />,
    action: "download" as const,
  },
  {
    title: "Import into VDMX",
    content:
      "In VDMX: Workspace Inspector → Add Plugin → Control Surface. In the plugin inspector, click Import JSON Layout and select the file you just downloaded. Enable OSCQuery and rename the plugin to INTERSECT.",
    icon: <Upload className="w-8 h-8 text-blue-500" />,
  },
  {
    title: "Refresh in INTERSECT",
    content:
      "Return to this dashboard. Open the Perform tab and click Refresh Connection. INTERSECT reads all parameters from OSCQuery on port 2345.",
    icon: <RefreshCw className="w-8 h-8 text-purple-500" />,
  },
  {
    title: "You're connected",
    content:
      "Effect buttons that match VDMX parameters turn green automatically. No manual OSC mapping required — you're ready to perform.",
    icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
  },
  {
    title: "Skip the OSCQuery browser tab",
    content:
      "Don't use VDMX's raw OSCQuery page (port 2345) for live control — it fights with hardware and faders twitch. Use this Command Center instead.",
    icon: <Zap className="w-8 h-8 text-amber-500" />,
  },
];

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const downloadTemplate = () => {
    downloadTextFile(getTemplateDownloadFilename(), generateVdmxControlSurfaceJson());
    toast.success('Template downloaded — import it in VDMX');
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onComplete();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gray-950 border-gray-800 p-8 shadow-2xl shadow-pink-500/10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800">
            {current.icon}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-white">{current.title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{current.content}</p>
          </div>

          {current.action === 'download' && (
            <Button
              onClick={downloadTemplate}
              className="w-full bg-pink-600 hover:bg-pink-700 font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate VDMX Template
            </Button>
          )}

          <div className="flex gap-2 w-full pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={prev} className="flex-1 border-gray-800 text-gray-400">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button onClick={next} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold">
              {step === STEPS.length - 1 ? "Let's Go!" : 'Next Step'}{' '}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-colors ${i === step ? 'bg-pink-500' : 'bg-gray-800'}`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
