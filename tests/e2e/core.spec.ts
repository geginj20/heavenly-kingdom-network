import { test, expect } from '@playwright/test';

test.describe('Core User Journeys', () => {
  test('can navigate to prayer wall and see request form', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Prayer Wall');
    await expect(page.locator('h1', { hasText: 'Prayer Wall' })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('can navigate to Bible and search', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Scriptures');
    await expect(page.locator('h1', { hasText: 'Holy Bible' })).toBeVisible();
    await page.click('button[title="Search"]');
    await expect(page.locator('input[placeholder*="Search scripture"]')).toBeVisible();
  });

  test('can view events', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Events');
    await expect(page.locator('h1', { hasText: 'Events' })).toBeVisible();
  });

  test('can navigate to Give section', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Give');
    await expect(page.locator('h2', { hasText: 'Support the Mission' })).toBeVisible();
  });

  test('can navigate home and see featured content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('page title is set correctly', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toBe('');
  });
});
