// AETERNA's index.html loads Three.js and Tailwind from third-party CDNs
// (see docs/ui-runtime-inventory.md §1 — a pre-existing reliability issue,
// not something introduced by this test suite). Some sandboxed/CI network
// policies block these hosts outright. Rather than hard-fail canvas-dependent
// tests in that situation, probe reachability once and skip with a clear,
// honest reason — this keeps the gate meaningful in normal environments
// while not silently reporting green nor silently reporting a false red.
export async function isExternalCdnReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
