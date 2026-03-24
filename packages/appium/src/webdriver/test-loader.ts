import type { TestSuite } from './test-executor';

/**
 * Global test registry for test discovery.
 * This is populated by the test-builder module.
 */
export interface GlobalTestRegistry {
  suites: TestSuite[];
  currentSuite: TestSuite | null;
}

// Global test registry stored with a well-known key
const REGISTRY_KEY = '__APPIUM_TEST_REGISTRY__';

/**
 * Initialize the global test registry.
 */
export function initializeTestRegistry(): void {
  const gw = globalThis as Record<string, unknown>;
  if (!gw[REGISTRY_KEY]) {
    gw[REGISTRY_KEY] = {
      suites: [],
      currentSuite: null,
    } as GlobalTestRegistry;
  }
}

/**
 * Get the global test registry.
 */
export function getTestRegistry(): GlobalTestRegistry {
  initializeTestRegistry();
  const gw = globalThis as Record<string, unknown>;
  return gw[REGISTRY_KEY] as GlobalTestRegistry;
}

/**
 * Clear the test registry (useful between test runs).
 */
export function clearTestRegistry(): void {
  const gw = globalThis as Record<string, unknown>;
  gw[REGISTRY_KEY] = {
    suites: [],
    currentSuite: null,
  } as GlobalTestRegistry;
}

/**
 * Dynamic test loader for Appium tests.
 * Loads TypeScript/JavaScript test files and extracts test suites.
 */
export class TestLoader {
  /**
   * Load a test file and extract its test suite.
   * Supports both .appium.ts and .appium.js files.
   */
  async loadTestFile(filePath: string): Promise<TestSuite[]> {
    console.log(`Loading test file: ${filePath}`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const testModule = require(filePath);
      const suites: TestSuite[] = [];

      // The test module should export test cases via the global test() function
      // This is populated by the test-builder module
      if (testModule.default) {
        // If file has a default export, it might be a test suite
        console.warn(`Test file has default export; using global test registry instead`);
      }

      // Tests are registered globally via test() calls during module load
      // We'll retrieve them from a global registry that test-builder populates
      const globalTestRegistry = getTestRegistry();

      if (globalTestRegistry.suites.length === 0) {
        console.warn(`No test suites found in ${filePath}`);
      }

      suites.push(...globalTestRegistry.suites);
      return suites;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load test file ${filePath}: ${errorMessage}`);
    }
  }

  /**
   * Load multiple test files.
   */
  async loadTestFiles(filePaths: string[]): Promise<TestSuite[]> {
    const allSuites: TestSuite[] = [];

    for (const filePath of filePaths) {
      const suites = await this.loadTestFile(filePath);
      allSuites.push(...suites);
    }

    return allSuites;
  }
}
