import type { TestResult } from '@zosmaai/zosma-qa-core';
import type { Browser } from 'webdriverio';

/**
 * Test execution context passed to test functions.
 */
export interface TestContext {
  driver: Browser;
}

/**
 * Test function signature.
 */
export type TestFn = (context: TestContext) => Promise<void>;

/**
 * Test case definition.
 */
export interface TestCase {
  name: string;
  fn: TestFn;
}

/**
 * Hook definitions.
 */
interface HookRegistry {
  beforeEach: TestFn[];
  afterEach: TestFn[];
}

/**
 * Test suite definition.
 */
export interface TestSuite {
  name: string;
  tests: TestCase[];
  hooks: HookRegistry;
}

/**
 * Executes a single test with hooks and error handling.
 */
export async function executeTest(
  testCase: TestCase,
  context: TestContext,
  beforeEachHooks: TestFn[],
  afterEachHooks: TestFn[],
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    name: testCase.name,
    status: 'passed',
    duration: 0,
  };

  try {
    // Run beforeEach hooks
    for (const hook of beforeEachHooks) {
      try {
        await hook(context);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.status = 'failed';
        result.error = `beforeEach hook failed: ${errorMessage}`;
        result.duration = Date.now() - startTime;
        return result;
      }
    }

    // Run test
    await testCase.fn(context);
  } catch (error) {
    result.status = 'failed';
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    // Run afterEach hooks (always run, even if test fails)
    for (const hook of afterEachHooks) {
      try {
        await hook(context);
      } catch (error) {
        // Log but don't fail the test due to afterEach failure
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`afterEach hook failed: ${errorMessage}`);
      }
    }

    result.duration = Date.now() - startTime;
  }

  return result;
}

/**
 * Executes all tests in a suite.
 */
export async function executeTestSuite(
  suite: TestSuite,
  context: TestContext,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log(`Running test suite: ${suite.name}`);

  for (const testCase of suite.tests) {
    console.log(`  Running test: ${testCase.name}`);
    const result = await executeTest(
      testCase,
      context,
      suite.hooks.beforeEach,
      suite.hooks.afterEach,
    );
    results.push(result);

    if (result.status === 'failed') {
      console.error(`    ✗ FAILED: ${result.error}`);
    } else {
      console.log(`    ✓ PASSED (${result.duration}ms)`);
    }
  }

  return results;
}
