import { test, expect } from '@playwright/test';

// Documents the CURRENT (pre-PR2) network baseline. See
// docs/current-public-runtime-map.md: today there is no public/research
// channel distinction, so this only records what's actually reachable
// without user interaction — it intentionally does NOT assert the
// external-API path is absent yet (it exists today, gated only by the user
// needing to type a key). PR2 should tighten this test once
// externalApiEnabled actually gates the fetch calls in pointerHandlers.js /
// GuidePanel.js.

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

test('API key input exists in the DOM today (pre-PR2 baseline — must be removed/gated by PR2)', async ({ page }) => {
  await page.goto('/');
  const apiKeyInput = page.locator('#api-key');
  // This assertion documents today's known public-safety gap
  // (docs/current-public-runtime-map.md §2). When PR2 gates or removes this
  // input for the public channel, update or remove this test accordingly —
  // do not leave it silently asserting the gap is fine.
  await expect(apiKeyInput).toBeAttached();
});
