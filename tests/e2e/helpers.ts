import type { Page } from '@playwright/test';

export async function openMobileNavIfNeeded(page: Page) {
  const hamburger = page.locator('button:has(svg.lucide-menu)');
  if (await hamburger.isVisible({ timeout: 200 }).catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(300);
  }
}
