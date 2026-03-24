import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { AppiumServerConfig } from '../config/types';

/**
 * AppiumServer manages the Appium WebDriver server lifecycle.
 * Handles:
 * - Starting/stopping the Appium server
 * - Health checks via HTTP status endpoint
 * - Port allocation if conflicts
 * - Process management
 */
export class AppiumServer {
  private config: AppiumServerConfig;
  private process: ReturnType<typeof spawn> | null = null;
  private url: string;
  private retries = 0;
  private maxRetries = 3;

  constructor(config: Partial<AppiumServerConfig> = {}) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 4723,
      logLevel: config.logLevel || 'warn',
      basePath: config.basePath || '/wd/hub',
      remoteUrl: config.remoteUrl,
    };

    this.url = `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * Start the Appium server.
   * If remoteUrl is configured, skip local server startup.
   * If port is in use, try next port.
   */
  async start(): Promise<void> {
    // If connecting to a remote server, skip startup
    if (this.config.remoteUrl) {
      console.log(`Connecting to remote Appium server: ${this.config.remoteUrl}`);
      this.url = this.config.remoteUrl;
      await this.waitForHealth(10000);
      return;
    }

    // Check if server is already running
    if (await this.isHealthy()) {
      console.log(`Appium server already running at ${this.url}`);
      return;
    }

    // Start the Appium server
    console.log(`Starting Appium server on ${this.url}...`);
    this.startServerProcess();

    // Wait for server to be healthy
    await this.waitForHealth(30000);
    console.log(`Appium server started successfully`);
  }

  /**
   * Stop the Appium server.
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    console.log(`Stopping Appium server...`);
    this.process.kill();

    // Wait a bit for graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.process = null;
  }

  /**
   * Get the server URL.
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Check if server is healthy via HTTP status endpoint.
   */
  async isHealthy(): Promise<boolean> {
    const statusPath = this.config.basePath ? `${this.config.basePath}/status` : '/status';
    return new Promise((resolve) => {
      const req = http.get(`${this.url}${statusPath}`, { timeout: 3000 }, (res) => {
        resolve((res.statusCode === 200 || res.statusCode === 404) ?? false);
      });
      req.on('error', () => {
        resolve(false);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Start the Appium server process.
   * Appium is expected to be installed globally or via npm.
   */
  private startServerProcess(): void {
    const args = [
      'server',
      `--address=${this.config.host}`,
      `--port=${this.config.port}`,
      `--log-level=${this.config.logLevel}`,
      `--base-path=${this.config.basePath}`,
    ];

    // Try: appium (global) or npx appium
    const processCmd = process.platform === 'win32' ? 'appium.cmd' : 'appium';

    // Ensure APPIUM_HOME is set so the spawned server finds globally installed
    // drivers. Without this, Appium v3 auto-detects home based on cwd and may
    // use a project-local cache (node_modules/.cache/appium) with no drivers.
    const appiumHome = process.env.APPIUM_HOME || path.join(os.homedir(), '.appium');

    this.process = spawn(processCmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: { ...process.env, APPIUM_HOME: appiumHome },
    });

    if (!this.process) {
      throw new Error(
        `Failed to start Appium server. Is Appium installed? (npm install -g appium)`,
      );
    }

    // Log server output if verbose
    if (this.config.logLevel === 'debug') {
      this.process.stdout?.on('data', (data) => {
        console.log(`[Appium] ${data}`);
      });
      this.process.stderr?.on('data', (data) => {
        console.error(`[Appium] ${data}`);
      });
    }

    // Always capture stderr to diagnose driver issues
    this.process.stderr?.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        console.error(`[Appium stderr] ${msg.trim()}`);
      }
    });

    this.process.on('error', (err) => {
      console.error(`Appium server process error: ${err.message}`);
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.warn(`Appium server exited with code ${code}`);
      }
    });
  }

  /**
   * Wait for the server to become healthy.
   * Retries with exponential backoff.
   */
  private async waitForHealth(timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const isHealthy = await this.isHealthy();
        if (isHealthy) {
          return;
        }
      } catch {
        // Continue retrying
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 500 * (this.retries + 1)));
      this.retries += 1;

      if (this.retries > this.maxRetries) {
        this.retries = 0;
      }
    }

    throw new Error(
      `Appium server did not become healthy within ${timeoutMs}ms. ` +
        `Check that Appium is installed: npm install -g appium`,
    );
  }
}

/**
 * Check if Appium is installed on the system.
 * Returns true if 'appium --version' succeeds.
 */
export function isAppiumInstalled(): boolean {
  try {
    const processCmd = process.platform === 'win32' ? 'appium.cmd' : 'appium';
    const result = spawnSync(processCmd, ['--version'], {
      stdio: 'pipe',
      timeout: 5000,
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Get installed Appium version.
 * Returns the version string or null if Appium is not installed.
 */
export function getAppiumVersion(): string | null {
  try {
    const processCmd = process.platform === 'win32' ? 'appium.cmd' : 'appium';
    const result = spawnSync(processCmd, ['--version'], {
      stdio: 'pipe',
      timeout: 5000,
      encoding: 'utf-8',
    });
    if (result.status === 0 && result.stdout) {
      return result.stdout.toString().trim();
    }
  } catch {
    // Ignore errors
  }
  return null;
}
