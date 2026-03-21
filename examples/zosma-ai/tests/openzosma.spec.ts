import { expect, test } from '@playwright/test';

test.describe('OpenZosma page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/openzosma');
    await page.waitForLoadState('networkidle');
  });

  test('page title identifies the OpenZosma product', async ({ page }) => {
    await expect(page).toHaveTitle(/openzosma/i);
  });

  test('hero heading is visible', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('GitHub link is present', async ({ page }) => {
    const githubLink = page.getByRole('link', { name: /star on github/i }).first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com/i);
  });
});
