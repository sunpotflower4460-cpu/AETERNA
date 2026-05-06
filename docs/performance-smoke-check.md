# Performance Smoke Check

AETERNA-NATURAL v1.5 — Performance Smoke Check Guide

This is a manual performance verification guide.
No automated benchmark numbers are enforced here; the goal is to confirm
that key interactions feel responsive and do not stall.

---

## 1. Initial Load

**Target**: App is usable within a few seconds on a standard desktop browser.

Steps:
1. Open a fresh browser tab (no cache, no service worker)
2. Navigate to the app URL
3. Observe time until public landing is visible
4. Open browser DevTools → Performance tab → confirm no long tasks > 500ms on startup

Pass criteria:
- [ ] Public landing appears without visible delay
- [ ] No JavaScript errors in console
- [ ] No long blocking tasks > 500ms on initial load

---

## 2. Scenario Panel Open

**Target**: Scenario panel opens immediately without jank.

Steps:
1. App is on public landing
2. Click / tap "Open Research Scenarios"
3. Observe panel open animation / render time

Pass criteria:
- [ ] Panel opens without visible lag
- [ ] Scenario list renders in < 200ms (subjective)

---

## 3. Overview Panel Open

**Target**: Overview panel opens and renders metrics without stall.

Steps:
1. App is running a scenario (safeBaseline + quietBaseline, seed=1000, ticks=200)
2. Open Overview panel
3. Observe render time for all metric rows

Pass criteria:
- [ ] Overview opens without visible lag
- [ ] All metric rows render immediately
- [ ] No NaN / undefined values displayed

---

## 4. Torus Render Active

**Target**: Torus visualization renders at acceptable frame rate.

Steps:
1. App is running a scenario
2. Open the torus visualization panel
3. Observe frame rate (DevTools → Performance → FPS)

Pass criteria:
- [ ] Torus renders without stalling
- [ ] Frame rate acceptable for current device (≥ 10 FPS subjective minimum)
- [ ] No WebGL errors in console

---

## 5. Guide Panel Open

**Target**: First Run Guide opens quickly.

Steps:
1. Open the First Run Guide
2. Navigate through steps

Pass criteria:
- [ ] Guide opens without delay
- [ ] All 5 steps are readable
- [ ] No layout overflow

---

## 6. Export Action

**Target**: JSON and Markdown export complete quickly.

Steps:
1. Run a short scenario (seed=1000, ticks=500)
2. Trigger JSON export
3. Trigger Markdown export
4. Observe completion time

Pass criteria:
- [ ] JSON export completes in < 1 second
- [ ] Markdown export completes in < 1 second
- [ ] Exported files include seed, config, scenario, ticks
- [ ] No errors during export

---

## 7. Long-Run Test Profile (Manual — Not CI Default)

**Note**: Full long-run is NOT part of CI default. Run manually only when needed.

Steps:
1. Enable `longRunComparisonEnabled=true` manually (internalResearch or experimental channel)
2. Run the long-run comparison suite with a lightweight test profile
3. Observe completion time and memory usage

Pass criteria:
- [ ] Long-run completes without stalling
- [ ] Memory usage is within acceptable bounds
- [ ] No NaN / Infinity in long-run results
- [ ] saturationRate < 2%
- [ ] collapseRate < 5%

---

## 8. Mobile Smoke Check

Steps:
1. Open app in Chrome DevTools → Device emulation (iPhone SE or similar)
2. Confirm main torus visualization is visible
3. Confirm panels are scrollable
4. Confirm buttons are tappable (adequate target size)
5. Confirm text is readable

Pass criteria:
- [ ] Torus visible on mobile viewport
- [ ] No horizontal scroll required
- [ ] Touch targets ≥ 44px
- [ ] No text overflow / clipping

---

## Known Performance Constraints

- Full long-run comparison suite is expensive; do not run in CI default.
- Torus render with WebGL is GPU-dependent; performance varies by device.
- Complex field observer mode (`complexObserver`) has higher CPU cost than scalar mode.
- Curved torus metric (`curved`) has higher CPU cost than flat metric.
- `safeBaseline` (flat + scalar) is the lightest performance profile.
