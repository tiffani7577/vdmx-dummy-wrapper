import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronLeft, 
  MonitorPlay, 
  Map, 
  CheckCircle2, 
  Copy,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  {
    title: "Welcome to INTERSECT",
    content: "This wizard will help you map INTERSECT's OSC addresses to your VDMX 6+ setup. It only takes a few minutes.",
    icon: <MonitorPlay className="w-8 h-8 text-pink-500" />
  },
  {
    title: "Enable OSCQuery in VDMX",
    content: "Open VDMX 6+ Preferences > OSC. Ensure 'Enable OSCQuery' is checked and the port is set to 2345.",
    icon: <Zap className="w-8 h-8 text-blue-500" />
  },
  {
    title: "Mapping Your First Control",
    content: "In VDMX, right-click any parameter (like Layer Opacity), select 'Detect OSC', then click the 'Test' button next to the address in the Mapping Table.",
    icon: <Map className="w-8 h-8 text-purple-500" />
  }
];

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onComplete();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gray-950 border-gray-800 p-8 shadow-2xl shadow-pink-500/10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800">
            {STEPS[step].icon}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">{STEPS[step].title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {STEPS[step].content}
            </p>
          </div>

          <div className="flex gap-2 w-full pt-4">
            {step > 0 && (
              <Button variant="outline" onClick={prev} className="flex-1 border-gray-800 text-gray-400">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button onClick={next} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold">
              {step === STEPS.length - 1 ? "Let's Go!" : "Next Step"} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i === step ? 'bg-pink-500' : 'bg-gray-800'}`} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
