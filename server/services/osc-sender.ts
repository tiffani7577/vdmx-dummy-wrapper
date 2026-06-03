import dgram from 'dgram';

export interface OSCMessage {
  address: string;
  args: Array<{ type: string; value: any }>;
}

class OSCSender {
  private host: string;
  private port: number;
  private client: dgram.Socket;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.client = dgram.createSocket('udp4');
  }

  /**
   * Send OSC message to VDMX
   */
  async send(message: OSCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const buffer = this.encodeOSCMessage(message);
        this.client.send(buffer, 0, buffer.length, this.port, this.host, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Encode OSC message to binary format
   * Simplified OSC encoder (handles basic types: f, i, s)
   */
  private encodeOSCMessage(message: OSCMessage): Buffer {
    const parts: Buffer[] = [];

    // Address
    parts.push(this.encodeString(message.address));

    // Type tag string
    const typeTag = ',' + message.args.map(arg => arg.type).join('');
    parts.push(this.encodeString(typeTag));

    // Arguments
    for (const arg of message.args) {
      if (arg.type === 'f') {
        parts.push(this.encodeFloat(arg.value));
      } else if (arg.type === 'i') {
        parts.push(this.encodeInt(arg.value));
      } else if (arg.type === 's') {
        parts.push(this.encodeString(arg.value));
      }
    }

    return Buffer.concat(parts);
  }

  /**
   * Encode string with null termination and padding
   */
  private encodeString(str: string): Buffer {
    const len = str.length + 1;
    const padded = len + (4 - (len % 4)) % 4;
    const buf = Buffer.alloc(padded);
    buf.write(str, 0, 'utf8');
    return buf;
  }

  /**
   * Encode 32-bit float (big-endian)
   */
  private encodeFloat(value: number): Buffer {
    const buf = Buffer.alloc(4);
    buf.writeFloatBE(value, 0);
    return buf;
  }

  /**
   * Encode 32-bit integer (big-endian)
   */
  private encodeInt(value: number): Buffer {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(value, 0);
    return buf;
  }

  /**
   * Close the socket
   */
  close(): void {
    this.client.close();
  }
}

export default OSCSender;
