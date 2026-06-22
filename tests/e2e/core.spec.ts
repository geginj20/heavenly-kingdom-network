import { test, expect } from '@playwright/test';

test.describe('Core User Journeys', () => {
  test('prayer wall page renders with form', async ({ page }) => {
    await page.goto('/#/prayer-wall');
    await expect(page.locator('h1', { hasText: 'Prayer Wall' })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('bible page renders with search', async ({ page }) => {
    await page.goto('/#/bible');
    await expect(page.locator('h1', { hasText: 'Holy Bible' })).toBeVisible();
    await page.click('button[title="Search"]');
    await expect(page.locator('input[placeholder*="Search scripture"]')).toBeVisible();
  });

  test('events page renders', async ({ page }) => {
    await page.goto('/#/events');
    await expect(page.locator('h1', { hasText: 'Events' })).toBeVisible();
  });

  test('home page has featured content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('page title is set correctly', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toBe('');
  });
});
