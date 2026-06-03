import { Client, Message } from 'node-osc';

export interface OSCArg {
  type: 'f' | 'i' | 's' | 'b';
  value: number | string | boolean;
}

export interface OSCMessage {
  address: string;
  args: OSCArg[];
}

class OSCSender {
  private host: string;
  private port: number;
  private client: Client;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.client = new Client(host, port);
    console.log(`[OSCSender] Initialized → ${host}:${port}`);
  }

  /**
   * Send a single OSC message to VDMX via UDP
   */
  async send(message: OSCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const msg = new Message(message.address);
        for (const arg of message.args) {
          if (arg.type === 'f') {
            msg.append(parseFloat(String(arg.value)));
          } else if (arg.type === 'i') {
            msg.append(parseInt(String(arg.value), 10));
          } else if (arg.type === 's') {
            msg.append(String(arg.value));
          } else if (arg.type === 'b') {
            msg.append(Boolean(arg.value));
          }
        }
        this.client.send(msg, (err: any) => {
          if (err) {
            console.error(`[OSCSender] Error sending to ${message.address}:`, err);
            reject(err);
          } else {
            console.log(`[OSCSender] Sent → ${message.address}`, message.args);
            resolve();
          }
        });
      } catch (error) {
        console.error('[OSCSender] Encode error:', error);
        reject(error);
      }
    });
  }

  /** Send a float value to a VDMX parameter address */
  async sendFloat(address: string, value: number): Promise<void> {
    return this.send({ address, args: [{ type: 'f', value }] });
  }

  /** Send an integer value to a VDMX parameter address */
  async sendInt(address: string, value: number): Promise<void> {
    return this.send({ address, args: [{ type: 'i', value }] });
  }

  /** Send a string value to a VDMX parameter address */
  async sendString(address: string, value: string): Promise<void> {
    return this.send({ address, args: [{ type: 's', value }] });
  }

  /** Trigger a VDMX Media Bin page change (0-indexed) */
  async triggerMediaBinPage(pageIndex: number): Promise<void> {
    return this.sendInt('/vdmx/mediaBin/page', pageIndex);
  }

  /** Trigger a VDMX preset by name */
  async triggerPreset(presetName: string): Promise<void> {
    return this.sendString('/vdmx/preset/load', presetName);
  }

  /** Trigger a VDMX layer source change */
  async triggerLayerSource(layerIndex: number, sourceIndex: number): Promise<void> {
    return this.send({
      address: `/vdmx/layer/${layerIndex}/source`,
      args: [{ type: 'i', value: sourceIndex }],
    });
  }

  /** Update host/port when user changes VDMX connection settings */
  updateTarget(host: string, port: number): void {
    this.host = host;
    this.port = port;
    this.client.close();
    this.client = new Client(host, port);
    console.log(`[OSCSender] Reconnected → ${host}:${port}`);
  }

  close(): void {
    this.client.close();
  }
}

export default OSCSender;
