import type { RunnerConfig, TestResult } from '@zosmaai/zosma-qa-core';
import { loadAppiumConfig } from './config/loader';
import type { ResolvedAppiumConfig } from './config/types';
import { DeviceManager } from './device/device-manager';
import { findAppiumTests } from './discovery';
import { AppiumServer } from './server/appium-server';
import { SessionManager } from './webdriver/session-manager';
import { executeTestSuite } from './webdriver/test-executor';
import { clearTestRegistry, TestLoader } from './webdriver/test-loader';

/**
 * AppiumRunner orchestrates Appium test execution.
 * Manages:
 * - Config loading & validation
 * - Appium server lifecycle
 * - Device detection & management
 * - WebdriverIO session creation
 * - Test discovery, loading & execution
 * - Result aggregation
 */
export class AppiumRunner {
  private config: ResolvedAppiumConfig | null = null;
  private server: AppiumServer | null = null;
  private deviceManager: DeviceManager | null = null;
  private sessionManager: SessionManager | null = null;

  constructor(private baseConfig: RunnerConfig) {}

  /**
   * Execute the test suite.
   * 1. Load & validate config
   * 2. Start Appium server
   * 3. Prepare device (launch simulator if needed)
   * 4. Discover tests
   * 5. Load tests and initialize WebdriverIO session
   * 6. Run tests with fixtures
   * 7. Cleanup
   * 8. Return results
   */
  async execute(): Promise<TestResult[]> {
    try {
      // 1. Load config
      console.log(`Loading Appium configuration...`);
      this.config = await loadAppiumConfig(this.baseConfig);
      console.log(`Config loaded successfully`);

      // 2. Start server
      console.log(`Starting Appium server...`);
      this.server = new AppiumServer({
        host: this.config.appiumHost,
        port: this.config.appiumPort,
        logLevel: this.config.verbose ? 'debug' : 'warn',
      });
      await this.server.start();

      // 3. Initialize device manager
      this.deviceManager = new DeviceManager();

      // 4. Discover tests
      const testFiles = findAppiumTests(this.config.testDir);
      if (testFiles.length === 0) {
        console.warn(`No Appium tests found in ${this.config.testDir}`);
        return [];
      }
      console.log(`Found ${testFiles.length} test file(s)`);

      // 5. Load tests and initialize WebdriverIO session
      console.log(`Initializing WebdriverIO session...`);
      this.sessionManager = new SessionManager(this.config);
      const driver = await this.sessionManager.initialize();

      // Clear test registry before loading new tests
      clearTestRegistry();

      const testLoader = new TestLoader();
      const testSuites = await testLoader.loadTestFiles(testFiles);

      if (testSuites.length === 0) {
        console.warn(`No test suites loaded from ${testFiles.length} file(s)`);
        return [];
      }

      console.log(`Loaded ${testSuites.length} test suite(s)`);

      // 6. Run tests with fixtures
      console.log(`Running tests...`);
      const results: TestResult[] = [];

      for (const suite of testSuites) {
        const suiteResults = await executeTestSuite(suite, { driver });
        results.push(...suiteResults);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Test execution failed: ${errorMessage}`);
      return [
        {
          name: 'Test Suite Initialization',
          status: 'failed',
          duration: 0,
          error: errorMessage,
        },
      ];
    } finally {
      // 7. Cleanup
      await this.cleanup();
    }
  }

  /**
   * Cleanup resources.
   */
  private async cleanup(): Promise<void> {
    if (this.sessionManager) {
      await this.sessionManager.cleanup();
    }
    if (this.deviceManager) {
      await this.deviceManager.cleanup();
    }
    if (this.server) {
      await this.server.stop();
    }
  }
}
