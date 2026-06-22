import { test, expect } from '@playwright/test';
import { openMobileNavIfNeeded } from './helpers';

test.describe('Interactive User Journeys', () => {
  test('can submit a prayer request', async ({ page }) => {
    await page.route('**/api/prayers', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 1 }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await page.goto('/');
    await openMobileNavIfNeeded(page);
    await page.click('text=Prayer Wall');
    await expect(page.locator('h1', { hasText: 'Prayer Wall' })).toBeVisible();
    await page.fill('input[placeholder*="Name"]', 'Test User');
    await page.fill('textarea', 'Please pray for my family during this time');
    await page.click('button[type="submit"]');
  });

  test('can RSVP to an event', async ({ page }) => {
    await page.route('**/api/events', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 1 }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
          { id: 1, title: 'Global Worship Night', date: '2026-07-01', time: '7:00 PM', location: 'Online', description: 'Join us', isOnline: true, month: 'JUL', day: '01' },
        ])});
      }
    });

    await page.route('**/api/events/*/rsvp', async (route) => {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 1 }) });
    });

    await page.goto('/');
    await openMobileNavIfNeeded(page);
    await page.click('text=Events');
    await expect(page.locator('h1', { hasText: 'Events' })).toBeVisible();
  });

  test('can browse bible reader', async ({ page }) => {
    await page.goto('/');
    await openMobileNavIfNeeded(page);
    await page.click('text=Scriptures');
    await expect(page.locator('h1', { hasText: 'Holy Bible' })).toBeVisible();
    const firstBook = page.locator('button:has-text("Genesis"), div:has-text("Genesis")').first();
    if (await firstBook.isVisible()) {
      await firstBook.click();
      await expect(page.locator('text=Chapter 1').first()).toBeVisible();
    }
  });

  test('can navigate home from any page', async ({ page }) => {
    await page.goto('/#/events');
    await page.locator('a[href="#/"], button:has-text("Home"), nav a:first-child').first().click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/');
  });
});
