import { test, expect } from '@playwright/test';
import { isExternalCdnReachable } from './cdnReachability.ts';

// PR1 baseline smoke test: confirms the shipped app actually boots in a real
// browser. This is the first browser-level check in the repo (see
// docs/ui-runtime-inventory.md §14 — no E2E existed before this).

test('app boots, canvas mounts, no uncaught console errors', async ({ page }) => {
  test.skip(
    !(await isExternalCdnReachable()),
    'index.html loads Three.js/Tailwind from third-party CDNs (docs/ui-runtime-inventory.md §1) ' +
      'and this environment\'s egress policy blocks them (403) — cannot verify canvas mount here. ' +
      'Runs normally wherever the CDNs are reachable.'
  );

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/AETERNA/);

  const canvasContainer = page.locator('#canvas-container');
  await expect(canvasContainer).toBeAttached();

  // main.ts appends a WebGLRenderer canvas into #canvas-container on boot.
  const canvas = canvasContainer.locator('canvas');
  await expect(canvas).toBeAttached({ timeout: 10_000 });

  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(0);
  expect(box?.height ?? 0).toBeGreaterThan(0);

  // Let the app run a few frames before asserting on console state.
  await page.waitForTimeout(2000);

  expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});

test('intro guide fades and HUD title is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hud-title-row h1')).toBeVisible();
});
