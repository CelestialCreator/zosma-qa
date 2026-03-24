/**
 * Test builder for Appium tests.
 * Exports a Playwright-compatible test() function with driver fixture.
 * Integrates with WebdriverIO and test registry for full test execution.
 */

import type { Browser } from 'webdriverio';
import type { TestCase, TestFn, TestSuite } from './webdriver/test-executor';
import { getTestRegistry } from './webdriver/test-loader';

/**
 * Test context with driver fixture.
 */
export interface TestContext {
  driver: Browser;
}

/**
 * Test builder that mimics Playwright's API.
 * Tests are registered in a global registry during module load.
 * The AppiumRunner then executes them via SessionManager & TestExecutor.
 */
export const test = Object.assign(
  (name: string, fn: TestFn) => {
    const registry = getTestRegistry();
    if (!registry.currentSuite) {
      console.error(`Cannot register test outside of describe block: ${name}`);
      return;
    }

    const testCase: TestCase = { name, fn };
    registry.currentSuite.tests.push(testCase);
  },
  {
    describe: (name: string, fn: () => void) => {
      const registry = getTestRegistry();

      // Create a new test suite
      const suite: TestSuite = {
        name,
        tests: [],
        hooks: {
          beforeEach: [],
          afterEach: [],
        },
      };

      // Set as current suite for test registration
      registry.currentSuite = suite;
      const previousSuite = registry.currentSuite;

      // Run the describe block to register tests
      try {
        fn();
      } finally {
        // Restore previous suite context
        registry.currentSuite = previousSuite;
      }

      // Add suite to registry
      registry.suites.push(suite);
    },

    beforeEach: (fn: TestFn) => {
      const registry = getTestRegistry();
      if (!registry.currentSuite) {
        console.error(`Cannot register beforeEach hook outside of describe block`);
        return;
      }
      registry.currentSuite.hooks.beforeEach.push(fn);
    },

    afterEach: (fn: TestFn) => {
      const registry = getTestRegistry();
      if (!registry.currentSuite) {
        console.error(`Cannot register afterEach hook outside of describe block`);
        return;
      }
      registry.currentSuite.hooks.afterEach.push(fn);
    },
  },
);

/**
 * Basic assertion helper.
 * More assertions can be added as needed.
 */
export const expect = {
  toBe: (actual: unknown, expected: unknown): void => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}`);
    }
  },
  toEqual: (actual: unknown, expected: unknown): void => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  toBeTruthy: (actual: unknown): void => {
    if (!actual) {
      throw new Error(`Expected truthy value, got ${actual}`);
    }
  },
  toBeFalsy: (actual: unknown): void => {
    if (actual) {
      throw new Error(`Expected falsy value, got ${actual}`);
    }
  },
};
