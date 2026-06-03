import axios from 'axios';

export interface OSCQueryNode {
  FULL_PATH: string;
  TYPE?: string;
  VALUE?: any;
  CONTENTS?: Record<string, OSCQueryNode>;
}

export class OSCQueryDiscovery {
  private host: string;
  private port: number;

  constructor(host = '127.0.0.1', port = 2345) {
    this.host = host;
    this.port = port;
  }

  async discover(): Promise<OSCQueryNode | null> {
    try {
      const response = await axios.get(`http://${this.host}:${this.port}/`, { timeout: 2000 });
      return response.data;
    } catch (error) {
      console.warn(`[OSCQuery] Failed to connect to VDMX at ${this.host}:${this.port}`);
      return null;
    }
  }

  /**
   * Scans the OSCQuery tree for installed ISF shaders.
   * Assumes shaders are exposed under paths like /vdmx/isf/...
   */
  async getInstalledShaders(): Promise<string[]> {
    const root = await this.discover();
    if (!root) return [];

    const shaders: string[] = [];
    const traverse = (node: OSCQueryNode) => {
      if (node.FULL_PATH.includes('/isf/')) {
        shaders.push(node.FULL_PATH.split('/').pop() || '');
      }
      if (node.CONTENTS) {
        Object.values(node.CONTENTS).forEach(traverse);
      }
    };

    traverse(root);
    return Array.from(new Set(shaders));
  }
}
