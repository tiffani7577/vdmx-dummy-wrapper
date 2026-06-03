import axios from 'axios';

export interface OSCParameter {
  path: string;
  type: string;
  value?: any;
  range?: [number, number];
  description?: string;
}

export interface VDMXConfig {
  host: string;
  oscQueryPort: number;
  oscPort: number;
}

class OSCQueryService {
  private config: VDMXConfig;
  private parameterCache: Map<string, OSCParameter> = new Map();

  constructor(config: VDMXConfig) {
    this.config = config;
  }

  /**
   * Fetch available parameters from VDMX OSCQuery server
   */
  async fetchParameters(): Promise<OSCParameter[]> {
    try {
      const url = `http://${this.config.host}:${this.config.oscQueryPort}/`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });

      const params = this.parseOSCTree(response.data, '');
      params.forEach(p => this.parameterCache.set(p.path, p));
      return params;
    } catch (error) {
      console.error('Failed to fetch OSCQuery parameters:', error);
      return Array.from(this.parameterCache.values());
    }
  }

  /**
   * Recursively parse OSC address tree
   */
  private parseOSCTree(node: any, basePath: string): OSCParameter[] {
    const params: OSCParameter[] = [];

    if (node.CONTENTS) {
      for (const [key, value] of Object.entries(node.CONTENTS)) {
        const path = `${basePath}/${key}`;
        const item = value as any;

        if (item.CONTENTS) {
          // Container - recurse
          params.push(...this.parseOSCTree(item, path));
        } else if (item.TYPE) {
          // Parameter
          params.push({
            path,
            type: item.TYPE,
            value: item.VALUE,
            range: item.RANGE,
            description: item.DESCRIPTION
          });
        }
      }
    }

    return params;
  }

  /**
   * Get cached parameters
   */
  getParameters(): OSCParameter[] {
    return Array.from(this.parameterCache.values());
  }

  /**
   * Get parameter by path
   */
  getParameter(path: string): OSCParameter | undefined {
    return this.parameterCache.get(path);
  }

  /**
   * Update config (e.g., when user changes VDMX host)
   */
  updateConfig(config: Partial<VDMXConfig>) {
    this.config = { ...this.config, ...config };
    this.parameterCache.clear();
  }
}

export default OSCQueryService;
