# Manual Release Checklist

AETERNA-NATURAL v1.5 — Pre-Deployment Manual QA

Use this checklist before every public release or deployment.
Run `npm run check:release` first; this checklist covers items that require human judgment.

---

## Startup

- [ ] App opens without JavaScript console errors
- [ ] Public landing page (`PublicResearchLanding`) appears on first load
- [ ] First Run Guide is accessible (button or panel opens)
- [ ] `safeBaseline` is the active preset on initial load
- [ ] `quietBaseline` is the default scenario on initial load
- [ ] No error boundary / fallback screen appears on startup

---

## Safety

- [ ] `complexRuntime` mode is disabled in public mode (fieldRuntimeMode ≠ complexRuntime)
- [ ] `weakPlasticity resistanceOnly` mode is disabled in public mode
- [ ] Legacy constants (`externalConstantsMode=legacy`) are disabled in public mode
- [ ] External API is disabled (no API calls in network tab on startup)
- [ ] Node bridge is disabled (no bridge connection attempts)
- [ ] Experimental panels / advanced config panels are NOT visible by default
- [ ] Interpretation notes are visible (PublicInterpretationNote is rendered)
- [ ] "Not proof" note is present in the UI

---

## Observation

- [ ] Overview panel opens without errors
- [ ] Runtime mode badges are visible (Safe Baseline, etc.)
- [ ] Value kind badges are visible (Raw, Derived, Proxy, Check, Reference)
- [ ] Scenario panel opens and shows available scenarios
- [ ] Export panel opens

---

## Mobile (manual device check)

- [ ] Main torus visualization is visible on mobile screen
- [ ] Bottom sheet / panel can be opened and closed
- [ ] Buttons are tappable (adequate touch target size)
- [ ] Warning / note banners do not block the entire screen
- [ ] Text is readable at mobile font size
- [ ] Horizontal scroll is not required for core panels

---

## Export

- [ ] JSON export works and produces valid JSON
- [ ] Markdown export works and is readable
- [ ] JSON export includes: seed, config, scenario, ticks
- [ ] Markdown export includes: seed, config, scenario, ticks
- [ ] Interpretation guardrails are included in export
- [ ] Export file can be saved or downloaded

---

## Claims Check

- [ ] No assertion that the system has demonstrated consciousness appears in UI or docs
- [ ] No assertion that the system has demonstrated life appears in UI or docs
- [ ] No assertion that the system has demonstrated intelligence appears in UI or docs
- [ ] No claims about therapeutic benefits, healing, or clinical use appear in UI or docs
- [ ] No mystical or spiritual claims appear in UI or docs
- [ ] No claim that the system is a living entity appears in UI or docs
- [ ] No claim that the system has subjective experience appears in UI or docs
- [ ] No anthropomorphic agency claims appear in UI or docs
- [ ] "Observations are observations — not proof" is visible

---

## Build / CI

- [ ] `npm run build` passes with no errors
- [ ] `npm run check:release` passes with no failures
- [ ] `npm run test:run` passes (excluding pre-existing known failures)
- [ ] `npm run lint` shows only known pre-existing warnings/errors
- [ ] Production build bundle is within acceptable size
- [ ] No sensitive data (API keys, credentials) in build output

---

## Error Boundary

- [ ] Error boundary component exists (`AppErrorBoundary.tsx`)
- [ ] Fallback screen shows on simulated error
- [ ] Fallback screen does not show fake observation values
- [ ] Fallback screen shows "Return to Safe Baseline" suggestion

---

## Safe Reset

- [ ] "Return to Safe Baseline" button is accessible
- [ ] Activating safe reset returns preset to `safeBaseline`
- [ ] Activating safe reset returns scenario to `quietBaseline`
- [ ] Activating safe reset disables experimental mode
- [ ] Activating safe reset enables interpretation notes

---

## Post-Deploy Smoke Test

After deploying to preview / production:

- [ ] Load the URL in a fresh browser tab (no cache)
- [ ] Confirm public landing appears
- [ ] Confirm no JavaScript errors in console
- [ ] Run Quiet Baseline scenario (seed=1000, ticks=2000)
- [ ] Confirm `semanticLeakCount = 0`
- [ ] Confirm `nanOrInfinityCount = 0`
- [ ] Export as Markdown and verify contents
- [ ] Check mobile view (DevTools device emulation or real device)
