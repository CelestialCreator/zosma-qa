import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page title identifies the brand', async ({ page }) => {
    await expect(page).toHaveTitle(/zosma/i);
  });

  test('navigation links are visible', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: /openzosma/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /contact/i })).toBeVisible();
  });

  test('hero section has a heading', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('footer is visible with copyright', async ({ page }) => {
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    await expect(page.getByText(/© 2026 Zosma/i).first()).toBeVisible();
  });
});
