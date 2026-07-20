import { test, expect } from '@playwright/test';

// Public-safety baseline. As of PR2, the default (publicResearch) channel
// resolved by src/release/resolveReleaseEnvironment.ts gates the API key
// input, Bridge, and debug panels off — see docs/current-public-runtime-map.md.

test('no external network request fires without user interaction', async ({ page }) => {
  const externalHosts: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      externalHosts.push(url.hostname);
    }
  });

  await page.goto('/');
  await page.waitForTimeout(3000);

  // Tailwind/Three CDN <script> tags are a known, separate issue
  // (docs/ui-runtime-inventory.md §1) — not part of this check's scope.
  const nonCdnHosts = externalHosts.filter(
    (h) => h !== 'cdn.tailwindcss.com' && h !== 'cdnjs.cloudflare.com'
  );

  expect(
    nonCdnHosts,
    `Unexpected external network requests fired without any user action: ${nonCdnHosts.join(', ')}`
  ).toEqual([]);
});

test('API key input is removed from the DOM in the default (public) channel', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#api-key')).not.toBeAttached();
  await expect(page.locator('#guide-api-config-section')).not.toBeAttached();
});
