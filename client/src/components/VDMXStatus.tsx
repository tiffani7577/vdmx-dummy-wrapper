import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Wifi, WifiOff, Settings, Send } from 'lucide-react';

interface VDMXConfig {
  host: string;
  oscPort: number;
  oscQueryPort: number;
}

interface AbletonConfig {
  host: string;
  sendPort: number;
  listenPort: number;
}

export default function VDMXStatus() {
  const [vdmxConfig, setVdmxConfig] = useState<VDMXConfig>({
    host: 'localhost',
    oscPort: 1234,
    oscQueryPort: 8000,
  });
  const [abletonConfig, setAbletonConfig] = useState<AbletonConfig>({
    host: 'localhost',
    sendPort: 11000,
    listenPort: 11001,
  });
  const [vdmxConnected, setVdmxConnected] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/vdmx/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.vdmx) setVdmxConfig(d.vdmx);
        if (d.ableton) setAbletonConfig(d.ableton);
      })
      .catch(() => {});
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/vdmx/connect');
      const data = await res.json();
      setVdmxConnected(data.connected);
      if (data.connected) {
        toast.success(`VDMX reachable at ${vdmxConfig.host}:${vdmxConfig.oscPort}`);
      } else {
        toast.warning(
          `UDP sent to ${vdmxConfig.host}:${vdmxConfig.oscPort} — check VDMX OSC settings`
        );
      }
    } catch {
      setVdmxConnected(false);
      toast.error('Server error — is the backend running?');
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    try {
      await fetch('/api/vdmx/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vdmxConfig),
      });
      await fetch('/api/vdmx/ableton/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(abletonConfig),
      });
      toast.success('Connection settings saved');
      setShowSettings(false);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  return (
    <Card className="p-3 bg-gray-950 border-gray-800">
      <div className="flex items-center gap-3">
        {/* VDMX Status */}
        <div className="flex items-center gap-2">
          {vdmxConnected === null ? (
            <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
          ) : vdmxConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-sm font-semibold text-white">VDMX 6+</span>
          <Badge
            variant="outline"
            className="text-xs font-mono border-gray-700 text-gray-400"
          >
            {vdmxConfig.host}:{vdmxConfig.oscPort}
          </Badge>
        </div>

        {/* Ableton Status */}
        <div className="flex items-center gap-2 ml-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-400">Ableton</span>
          <Badge
            variant="outline"
            className="text-xs font-mono border-gray-700 text-gray-500"
          >
            :{abletonConfig.sendPort}
          </Badge>
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={testConnection}
            disabled={testing}
            className="h-7 px-2 border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
          >
            <Send className="w-3 h-3 mr-1" />
            {testing ? 'Testing…' : 'Test OSC'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-300"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">VDMX OSC Settings</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-600">Host</label>
                <Input
                  value={vdmxConfig.host}
                  onChange={(e) => setVdmxConfig({ ...vdmxConfig, host: e.target.value })}
                  className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">OSC Port</label>
                <Input
                  type="number"
                  value={vdmxConfig.oscPort}
                  onChange={(e) =>
                    setVdmxConfig({ ...vdmxConfig, oscPort: Number(e.target.value) })
                  }
                  className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">OSCQuery Port</label>
                <Input
                  type="number"
                  value={vdmxConfig.oscQueryPort}
                  onChange={(e) =>
                    setVdmxConfig({ ...vdmxConfig, oscQueryPort: Number(e.target.value) })
                  }
                  className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Ableton OSC Settings</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-600">Host</label>
                <Input
                  value={abletonConfig.host}
                  onChange={(e) =>
                    setAbletonConfig({ ...abletonConfig, host: e.target.value })
                  }
                  className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Send Port (→ Ableton)</label>
                <Input
                  type="number"
                  value={abletonConfig.sendPort}
                  onChange={(e) =>
                    setAbletonConfig({ ...abletonConfig, sendPort: Number(e.target.value) })
                  }
                  className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Listen Port (← Ableton)</label>
                <Input
                  type="number"
                  value={abletonConfig.listenPort}
                  onChange={(e) =>
                    setAbletonConfig({ ...abletonConfig, listenPort: Number(e.target.value) })
                  }
                  className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={saveConfig}
              className="h-7 text-xs bg-blue-700 hover:bg-blue-600 text-white"
            >
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
