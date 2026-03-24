import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['appium'],
  baseURL: 'http://localhost:4723',
  browsers: ['chromium'], // ignored by Appium — required by config schema
  // Appium-specific overrides (cast to allow extended keys)
  ...({
    platformName: 'Android',
    automationName: 'UIAutomator2',
  } as Record<string, unknown>),
});
