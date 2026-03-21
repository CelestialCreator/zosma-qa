import { expect, test } from '@playwright/test';

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
  });

  test('page title includes "About"', async ({ page }) => {
    await expect(page).toHaveTitle(/about/i);
  });

  test('page has a main heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('founder Arjun Nayak is listed', async ({ page }) => {
    await expect(page.getByText(/arjun nayak/i).first()).toBeVisible();
  });

  test('navigation links are accessible', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: /contact/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /openzosma/i })).toBeVisible();
  });
});
