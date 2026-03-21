import { expect, test } from '@playwright/test';

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
  });

  test('page title includes "Contact"', async ({ page }) => {
    await expect(page).toHaveTitle(/contact/i);
  });

  test('page has a main heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('contact form is rendered with input fields', async ({ page }) => {
    // Check that input fields and a submit button are present
    await expect(page.locator('input').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button').last()).toBeVisible();
  });

  test('navigation links are accessible', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /openzosma/i })).toBeVisible();
  });
});
