import type { Browser } from 'webdriverio';
import { remote } from 'webdriverio';
import { buildCapabilities } from '../config/capabilities';
import type { ResolvedAppiumConfig } from '../config/types';

/**
 * WebdriverIO session manager.
 * Handles driver initialization, session creation, and cleanup.
 */
export class SessionManager {
  private driver: Browser | null = null;
  private config: ResolvedAppiumConfig;

  constructor(config: ResolvedAppiumConfig) {
    this.config = config;
  }

  /**
   * Initialize a WebdriverIO session.
   * Connects to Appium server and creates a new session.
   */
  async initialize(): Promise<Browser> {
    if (this.driver) {
      console.warn('Session already initialized; returning existing driver');
      return this.driver;
    }

    console.log(
      `Initializing WebdriverIO session at ${this.config.appiumHost}:${this.config.appiumPort}`,
    );

    const capabilities = buildCapabilities(this.config);
    const wdioConfig = {
      hostname: this.config.appiumHost,
      port: this.config.appiumPort,
      path: '/wd/hub',
      capabilities,
      logLevel: this.config.verbose ? ('debug' as const) : ('warn' as const),
      connectionRetryCount: 3,
      connectionRetryTimeout: 120000,
    };

    try {
      this.driver = await remote(wdioConfig);
      console.log(`WebdriverIO session initialized: ${this.driver.sessionId}`);
      return this.driver;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize WebdriverIO session: ${errorMessage}`);
    }
  }

  /**
   * Get the current driver instance.
   */
  getDriver(): Browser {
    if (!this.driver) {
      throw new Error('Session not initialized. Call initialize() first.');
    }
    return this.driver;
  }

  /**
   * Check if session is active.
   */
  isActive(): boolean {
    return this.driver !== null;
  }

  /**
   * Cleanup and close the session.
   */
  async cleanup(): Promise<void> {
    if (this.driver) {
      try {
        console.log(`Closing WebdriverIO session...`);
        await this.driver.deleteSession();
        this.driver = null;
        console.log(`Session closed`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error closing session: ${errorMessage}`);
      }
    }
  }
}
