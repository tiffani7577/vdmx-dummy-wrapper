import axios from 'axios';
import type { OscQueryParameter } from '../../shared/intersect-osc-mapping.js';

export interface OSCQueryNode {
  FULL_PATH?: string;
  TYPE?: string;
  VALUE?: unknown;
  DESCRIPTION?: string;
  CONTENTS?: Record<string, OSCQueryNode>;
}

export class OSCQueryDiscovery {
  private host: string;
  private port: number;

  constructor(host = '127.0.0.1', port = 2345) {
    this.host = host;
    this.port = port;
  }

  updateTarget(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  async discover(): Promise<OSCQueryNode | null> {
    try {
      const response = await axios.get(`http://${this.host}:${this.port}/`, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.warn(`[OSCQuery] Failed to connect to VDMX at ${this.host}:${this.port}`);
      return null;
    }
  }

  /**
   * Flatten the OSCQuery tree into addressable parameters.
   */
  getAllParameters(root: OSCQueryNode): OscQueryParameter[] {
    const params: OscQueryParameter[] = [];

    const traverse = (node: OSCQueryNode, basePath: string) => {
      const address = node.FULL_PATH || basePath;

      if (node.TYPE && address) {
        const name = address.split('/').filter(Boolean).pop() ?? address;
        params.push({
          address,
          name,
          type: node.TYPE,
          value: node.VALUE,
          description: node.DESCRIPTION,
        });
      }

      if (node.CONTENTS) {
        for (const [key, child] of Object.entries(node.CONTENTS)) {
          const childPath = (child.FULL_PATH || `${basePath}/${key}`).replace(/\/+/g, '/');
          traverse(child, childPath);
        }
      }
    };

    traverse(root, '');
    return params;
  }

  async fetchParameters(): Promise<OscQueryParameter[]> {
    const root = await this.discover();
    if (!root) return [];
    return this.getAllParameters(root);
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
      const path = node.FULL_PATH ?? '';
      if (path.includes('/isf/')) {
        shaders.push(path.split('/').pop() || '');
      }
      if (node.CONTENTS) {
        Object.values(node.CONTENTS).forEach(traverse);
      }
    };

    traverse(root);
    return Array.from(new Set(shaders));
  }
}
