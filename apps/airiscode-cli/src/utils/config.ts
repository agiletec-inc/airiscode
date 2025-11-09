/**
 * Configuration management
 */

import Conf from 'conf';
import { ApprovalsLevel, TrustLevel } from '@airiscode/policies';
import type { CLIConfig } from '../types.js';
import { homedir } from 'os';
import { join } from 'path';

const DEFAULT_CONFIG: CLIConfig = {
  defaultDriver: 'ollama',
  defaultAdapter: 'claude-code',
  defaultPolicy: {
    approvals: ApprovalsLevel.ON_REQUEST,
    trust: TrustLevel.SANDBOXED,
    guardStrict: true,
  },
  sessionDir: join(homedir(), '.airiscode', 'sessions'),
  telemetry: false,
};

/**
 * Configuration store
 */
export class ConfigStore {
  private store: Conf<CLIConfig>;

  constructor() {
    this.store = new Conf<CLIConfig>({
      projectName: 'airiscode',
      defaults: DEFAULT_CONFIG,
    });
  }

  /**
   * Get full config
   */
  getAll(): CLIConfig {
    return this.store.store;
  }

  /**
   * Get config value
   */
  get<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
    return this.store.get(key);
  }

  /**
   * Set config value
   */
  set<K extends keyof CLIConfig>(key: K, value: CLIConfig[K]): void {
    this.store.set(key, value);
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.store.clear();
  }

  /**
   * Get config path
   */
  getPath(): string {
    return this.store.path;
  }
}

/**
 * Global config instance
 */
export const config = new ConfigStore();
