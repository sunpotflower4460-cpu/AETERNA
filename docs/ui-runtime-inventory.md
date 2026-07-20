# UI Runtime Inventory (PR0)

Status: as observed in this session's read-only audit of `sunpotflower4460-cpu/AETERNA` at commit `5b66f96`. This document describes **what the shipped app actually does**, not what design documents or headless models describe it as doing. Where a claim could not be verified in a real browser (no Playwright/E2E infra exists — see §14), it is marked accordingly and is **not** promoted to VERIFIED anywhere in this repo's docs.

---

## 1. Current canonical launch path

`index.html` is the single Vite build entry (`vite.config.ts` → `build.rollupOptions.input: 'index.html'`). It loads, in order:

1. `index.html:7` — Tailwind CDN `<script src="https://cdn.tailwindcss.com">` (no build-time purge/tree-shake; ships the full runtime CSS engine to the client).
2. `index.html:8` — Three.js r128 CDN `<script src="https://cdnjs.cloudflare.com/.../three.min.js">` (global `THREE`, not the `three` npm package pinned in `package.json` — two different Three.js sources exist in the project: the CDN build actually used by `main.ts`/`AeternaNetwork.js` and the `^0.170.0` npm package that `@types/three` types against and that the dead `.tsx` tree presumably assumes).
3. `index.html:1672` — `<script type="module" src="./src/main.ts">` — the real application entry.
4. `index.html:1673` — `<script type="module" src="./src/ui/debugPanels.js">` — loaded **unconditionally**, independent of `main.ts`, independent of any release/public flag.
5. `index.html:1674` — `<script type="module" src="./src/ui/layout/layoutControls.js">` — same, unconditional, independent module.

These three module scripts are **not** connected to each other via imports; they are three separate entry points that only communicate through `window.*` globals and shared DOM ids (see §4, §6).

## 2. Files loaded from `index.html`

Besides the three `<script>` entries above, `index.html` (1676 lines) is ~740 lines of inline `<style>` and ~900 lines of inline HTML markup with inline `onclick=`/`onchange=`/`onpointerdown=` attributes that call into the `window.*` globals assigned by `main.ts`, `debugPanels.js`, and `layoutControls.js`. There is no external stylesheet and no template/component system — the DOM structure is entirely static, hand-written HTML.

## 3. Features initialized in `src/main.ts`

`main.ts` (119 lines) imports only legacy plain-JS/`.ts` modules — **none of the `.tsx` component tree**:

```
organism/state.js, core/PhysicalDisk.js, perception/TouchMemory.js, core/AeternaNetwork.js,
ui/domCache.js, ui/accordion.js, utils/slider.js, perception/pointerHandlers.js,
render/RealityVisualLayer.js, ui/GuidePanel.js, organism/actionLoop.js, utils/cameraControls.js,
ui/MajorStateObserver.js, ui/ObservationDisplay.js, ui/camera/createTorusCameraControls.js
```

`init()` (`main.ts:63-117`), called unconditionally at module load (`main.ts:119`), wrapped in a single top-level `try/catch` that only `console.error`s on failure (§9):

- Builds a THREE `Scene`/`PerspectiveCamera`/`WebGLRenderer`, appends the canvas to `#canvas-container` (line 68).
- Sets pixel ratio directly from `window.devicePixelRatio` with **no clamp** (`main.ts:67`).
- Constructs `AeternaNetwork(72)` and `TouchMemory(72)`, builds a particle system.
- Registers **document-level** `pointermove`/`pointerdown`/`pointerup`/`pointercancel` listeners (`main.ts:82`) plus a `window resize` listener (`main.ts:83`).
- Constructs `PhysicalDisk`, `RealityVisualLayer`, `GuidePanel`, `CameraControls` (bound separately to the renderer's canvas — see §7), `MajorStateObserver`, `ObservationDisplay`.
- Wires `input` listeners on the three physics sliders (`omega-t`, `omega-p`, `r`).
- Starts the frame loop: `requestAnimationFrame(actionLoop)`.

`main.ts:23-50` assigns ~17 functions onto `window.*` so that `index.html`'s inline `onclick` attributes can reach them (full list in this section's companion, §4).

## 4. Actually mounted UI

The **only** UI actually mounted/rendered in the running app is:

- The static DOM already present in `index.html` (canvas container, HUD chips, research panel/tabs, mobile bottom nav, event strip, sliders, API key + Raw tab, etc.) — nothing is created via `createElement`-based component mounting; everything pre-exists in markup and is shown/hidden via class toggles.
- `src/ui/domCache.js` populates a single `UI = {}` object with **395 hardcoded DOM id lookups** at `DOMContentLoaded` (`initDOMCache()`, called once from `main.ts:54`, never again — no teardown/remount handling exists anywhere in the codebase).
- `src/ui/GuidePanel.js`, `src/ui/MajorStateObserver.js`, `src/ui/ObservationDisplay.js` update pre-existing DOM nodes (via `.textContent`/`.innerHTML`) each frame, throttled per §5.
- `src/ui/updateMetricsUI.js` (imported transitively via `actionLoop.js` → `runtimeLoop.ts`) updates the Field/World/Medium tab metric rows, Now Summary, and Event Timeline, and additionally renders **5 live `.tsx` files** — but note these are not JSX/React components (no file under `src/ui/` imports `react`; `package.json` has no React dependency at all), they are plain TypeScript functions that return HTML strings for string-based rendering:
  - `src/ui/natural/RuntimeModeBadge.tsx`
  - `src/ui/natural/ValueKindBadge.tsx`
  - `src/ui/natural/InterpretationNote.tsx`
  - `src/ui/natural/NaturalWarningList.tsx`
  - `src/ui/natural/ObservationDashboard.tsx`
- `src/ui/layout/layoutControls.js` (loaded directly by `index.html:1674`, and separately imported by `updateMetricsUI.js`) drives the research-panel/mobile-sheet toggles, event strip, Now Summary rendering, and Event Timeline rendering.
- `src/ui/debugPanels.js` (loaded directly by `index.html:1673`) wires signal-runtime debug UI, **unconditionally, with no release/public gate** (see §9 in `current-public-runtime-map.md`).

Everything under `src/ui/observation/`, `src/ui/onboarding/`, `src/ui/public/`, `src/ui/research/`, `src/ui/system/`, `src/ui/replay/`, `src/ui/comparison/`, and the `use*CameraControls` hooks in `src/ui/camera/` — i.e. essentially the entire design-spec-aligned "new UI" tree described in `AETERNA_UIUX_MASTER_IMPLEMENTATION_SPEC.md` §3.1 — has **zero non-test importers**. It is reachable only from `src/tests/**`. See `docs/ui-feature-status.md` for the per-file breakdown.

## 5. Runtime → DOM direct-write paths

Frame loop: `main.ts:113` `requestAnimationFrame(actionLoop)` → `src/organism/actionLoop.js` → `src/organism/runtimeLoop.ts`, which on each frame calls, in order:

```
updateTensionState(dyn)
engineState = deriveEngineState(dyn)
maybeUpdateUi(now, dyn, engineState)      // throttled to UI_FPS = 15
maybeBridgeSignal(now, dyn, engineState)  // throttled to BRIDGE_INTERVAL_MS = 100
```

- `maybeUpdateUi` calls `updateMetricsUI(dyn, engineState)` and `state.realityVisualLayer.update(dyn)` (throttled 15fps), and `state.guidePanel.update(dyn, engineState)` (throttled `GUIDE_FPS = 10`).
- `maybeBridgeSignal` unconditionally (gated only by elapsed time, not by any state change or release flag) runs the full Bridge pipeline `bridgeTorusToSignal(packet)` every ~100ms, then calls `state.guidePanel.updateFromBridge(bridgeResult, packet)`.
- `updateMetricsUI` writes directly into cached `UI[id]` DOM nodes (via `domCache.js`), and separately calls `deriveNowSummary`/`updateNowSummary` and `deriveAeternaEvents`/`updateEventTimeline`, which write into `#now-summary-lines` / `#event-timeline-list` through `layoutControls.js`.

There is **no Runtime→UI adapter or snapshot boundary** as described in the master spec §8.1 — `updateMetricsUI.js`, `GuidePanel.js`, and `MajorStateObserver.js` each read directly from the live `dyn`/`state.network`/`state` objects and write directly into cached DOM nodes. Nothing routes through a `RuntimeSnapshot`/`RuntimeCommand` boundary; none of that boundary code (`src/release`, hypothetical `src/app/runtime/*`) exists yet.

## 6. Notification / Guide / Event / Summary — all paths

Four **independent** decision systems currently compute "what's significant right now," each with its own thresholds/cooldowns and no shared event store (contradicts master spec §9.1's single-event-source requirement):

1. **`MajorStateObserver.analyzeDominantProcess`** (`src/ui/MajorStateObserver.js:12-108`) — own scoring across ~15 candidate processes → HUD badge (`#major-process-indicator`).
2. **`GuidePanel.update`** (`src/ui/GuidePanel.js:16-84`) — a single `let ev = null` reassigned by up to 5 independent `if` blocks (white-engine, heartbeat, tension, eye, sigma-out-of-range); only the **last** truthy assignment reaches `handleEvent`/`addLog`, so if two conditions are true in the same tick, the earlier one is dropped from GuidePanel's own history (though `ObservationDisplay.showNetworkEvent(...)` is called inline within each branch, so ObservationDisplay itself doesn't lose these — only GuidePanel's own log does). Also independently drives `GuidePanel.updateFromBridge` (§ below).
3. **`ObservationDisplay.showMessage`/`showNetworkEvent`/`showStateChange`** (`src/ui/ObservationDisplay.js`) — its own hysteresis state (`lastSystemState`, `lastSigma`), dedupe only holds `if (this.currentMessage === message && this.isShowing) return;` — i.e. an **identical** message can reappear as soon as the prior instance's display timer (`hide()`) elapses, even with no actual state change.
4. **`deriveAeternaEvents`/`deriveNowSummary`** (`src/ui/timeline/deriveAeternaEvents.ts`, `src/ui/summary/deriveNowSummary.ts`) — imported and called live by `src/ui/updateMetricsUI.js:6-7,854-870`, rendered via `layoutControls.js`'s `updateNowSummary`/`updateEventTimeline` into `#now-summary-lines` / `#event-timeline-list`.

**Bridge surfacing**: `maybeBridgeSignal` (`runtimeLoop.ts:45-51`) runs the full bridge pipeline unconditionally every ~100ms (gated only by elapsed time). `GuidePanel.updateFromBridge` (`GuidePanel.js:110-139`) then unconditionally `addLog`s every firing — a raw ~10x/second stream, capped to keeping only the 5 most recent entries in `this.history`, with **no lifecycle model** (no started/updated/resolved) and **no equality-based dedupe**. This is exactly the "100ms duplicate log" pattern the master spec (§9.5) calls out to fix.

## 7. Pointer / Touch / Camera listener inventory

| Location | Target | Events |
|---|---|---|
| `main.ts:82` | `document` | `pointermove`, `pointerdown`, `pointerup`, `pointercancel` |
| `main.ts:83` | `window` | `resize` |
| `main.ts:96` | slider `<input>`s | `input` |
| `utils/cameraControls.js:113-118` | renderer canvas (`this.domElement`) | `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `wheel` (`{passive:false}`), `contextmenu` |
| `ui/camera/createTorusCameraControls.ts:26` | `window` | `keydown` (keyboard shortcuts only) |

**Confirmed input conflict, no shared interaction-mode gate**: `pointerHandlers.js`'s document-level `handlePointerUp` unconditionally calls `state.network.injectPredictionError(...)` (a real stimulation of the physics field) whenever a non-dragging pointerup lands on the `<canvas>` — this is entirely independent of `CameraControls`'s own `viewMode` (`'view'|'touch'`, set via `setViewMode()`). `CameraControls`'s own doc comment (`cameraControls.js:333-337`) states this explicitly: *"Tap-based torus perturbation input is unaffected in both modes."* There is no `InteractionMode` concept (`observe`/`inspect`/`stimulate`/`camera` per master-spec §10) anywhere in the live code — stimulation fires on every qualifying tap regardless of any "mode."

## 8. Public Release Config → real startup connection

**Not connected.** `src/release/validateReleaseSafety.ts` and `src/config/releaseEnvironmentConfig.ts` define a complete safety-gate model (channel resolution, `externalApiEnabled`, `nodeBridgeEnabled`, `showDebugPanels`, `showRawDiagnostics`, `experimentalFeaturesEnabled`, etc.), but a repo-wide search for callers of `validateReleaseSafety` outside `src/tests/release/**` returns **zero results**. It is never imported by `main.ts`, `actionLoop.js`, `runtimeLoop.ts`, `bridge.ts`, `GuidePanel.js`, `pointerHandlers.js`, or `debugPanels.js`. Full detail in `docs/current-public-runtime-map.md`.

## 9. External API and Bridge — actually disabled in Public?

**No — both are live and unconditional today** (there being no distinct "public build" in the actual build pipeline — `vite build` always produces the same `dist/` regardless of any channel setting, because nothing reads the channel setting):

- `index.html:1488` ships a live `<input type="password" id="api-key">` in the `#tab-raw` tab, paired with a provider `<select>` and a `TEST` button (`onclick="testAPIConnection()"`).
- `src/perception/pointerHandlers.js:172-199` (`testAPIConnection`) sends the entered key directly to Google Gemini (`?key=...` query param) or OpenAI (`Authorization: Bearer`) from client JS.
- `src/ui/GuidePanel.js:89-99` stores the key in memory and **automatically** re-sends it on every subsequent bridge/organism-event cycle once set — not just on manual "TEST" clicks.
- None of these paths check `externalApiEnabled`, any release channel, or any public-mode flag.
- `src/organism/runtimeLoop.ts`'s `maybeBridgeSignal` runs the Bridge pipeline unconditionally (§6); `nodeBridgeEnabled` is never consumed anywhere in the live call chain.
- `src/ui/debugPanels.js` is loaded unconditionally by `index.html:1673`; `showDebugPanels` is never consumed anywhere.

## 10. Headless-model maturity classification

See `docs/ui-feature-status.md` for the full per-feature table. Summary: the vast majority of the design-spec-aligned components (`ObservationWorkspace`, `PublicResearchLanding`, `FirstRunGuide`, `AppErrorBoundary`, `FallbackScreen`, `SafeResetButton`, the Research/Replay/Causal-Trace/Layer-Correlation panels, the `use*CameraControls` hooks) sit at **DEFINED/RENDERABLE** — they exist as importable, sometimes well-tested-in-isolation TypeScript, but have **zero import path from the running app** — not CONNECTED, and therefore cannot be VERIFIED.

## 11. Legacy / Remove candidates

- **Legacy, live, keep-and-migrate-carefully**: `main.ts`, `pointerHandlers.js`, `GuidePanel.js`, `MajorStateObserver.js`, `ObservationDisplay.js`, `domCache.js`, `updateMetricsUI.js`, `layoutControls.js`, `debugPanels.js`, `cameraControls.js`, `accordion.js`, `trendSparkline.js`. These are the actual running app; PR11 ("Cutover") is the only point at which any of this should be deleted, and only after the new stack reaches VERIFIED parity.
- **REMOVE candidates (dead, no runtime value, safe to delete once confirmed no other consumer)**: none should be deleted in PR0/PR1/PR2 — deletion is explicitly out of scope until "Legacy を削除する前に新UIのE2Eを完了" is satisfied (master-spec §19.12). For future PRs, `src/ui/observation/CausalTraceOverlay.tsx` (superseded by `CausalTracePanel.tsx`, itself also unreferenced) is the clearest duplicate/orphan candidate.
- **DEFINED/RENDERABLE, candidate migration targets (not legacy, not dead — intended future UI)**: the entire `src/ui/observation/`, `src/ui/onboarding/`, `src/ui/public/`, `src/ui/research/`, `src/ui/system/`, `src/ui/replay/` trees, plus `src/ui/camera/use*CameraControls.ts`. These should be treated as scaffolding for PR6+ (Observatory Shell) migration, not as legacy to remove.

## 12. P0 bug re-confirmation

All 13 items from the kickoff prompt were checked against current code; full detail is folded into `docs/ui-feature-status.md` bug rows and `docs/current-public-runtime-map.md` §Safety Gaps. Headline confirmations:

1. **`MajorStateObserver` empty-candidate fallback** (`MajorStateObserver.js:90-108`) — the empty-`processes` early-return only covers `dyn.arousal < 0.02`; for `processes.length === 0 && dyn.arousal >= 0.02` (reachable), `processes[0]` is `undefined` and `dominant.type` throws `TypeError`, uncaught, live every UI frame (no try/catch around `actionLoop`/`maybeUpdateUi`).
2. **`||` destroying valid 0s** — confirmed real risky instances at `MajorStateObserver.js:50,55,79,82,150` (`dreamReplayStrength||0.5`, `actionPulseLevel||0.5`, `collapseRisk||0.5`, `replaySuppression||1`, `energy||1.0`), `world/phaseCarryingDrive.ts:31` (`seedInput||1`, breaks seed-0 reproducibility), `tests/scenario/runLongRunEmergenceScenario.ts:65` (same seed-0 issue), and a double-fallback bug at `tests/scenario/perturbationComparisonScenario.ts:139` where `(x ?? 0) || 0.5` defeats the `?? 0` safeguard it was clearly written to provide. (The much larger set of `x || 0` numeric-formatting fallbacks elsewhere are not risky: `0 || 0 === 0`, no distortion.)
3. **Bridge 100ms duplicate logging** — confirmed, §6/§9 above; unconditional, no lifecycle, no dedupe, capped only by a length-5 ring buffer in `GuidePanel.history`.
4. **`ObservationDisplay` dedupe only while displayed** — confirmed, §6 above; `hide()` resets `currentMessage`/`isShowing`, so identical messages reappear once the timer elapses.
5. **`GuidePanel` single `ev` overwritten by multiple events** — confirmed, §6 above.
6. **`innerHTML` on external/generated text** — confirmed live XSS-shaped risk at `GuidePanel.js:100-108`: LLM response text (`resText`) is written into `innerHTML` (both `#guide-latest` and `#guide-history`) **without escaping**. Also `layoutControls.js`'s `_renderEventStrip` interpolates `e.text` into `innerHTML` unescaped (inconsistent with the properly-escaped `_renderEventTimeline` sibling function in the same file) — currently only fed internally-derived text, but the escaping gap is latent.
7. **Public UI API Key input** — confirmed live and unguarded, §9 above.
8. **Public config vs. real UI mismatch** — confirmed total disconnect, §8 above.
9. **document pointer handler vs. CameraControls conflict** — confirmed, §7 above.
10. **Reset leaves stale history/summary** — confirmed: the only live reset (`resetTouchMemory()`, `pointerHandlers.js:121-131`, wired to `index.html:1411`) clears only the touch-memory trace buffer and shows a transient toast; it does **not** clear `GuidePanel.history`, `MajorStateObserver.stateHistory` (a 200-entry buffer), or `ObservationDisplay`'s `lastSystemState`/`lastSigma`. A second reset function, `resetObservationState()` (`src/state/selectedObservationState.ts:156-160`), is correctly written but **never called from anywhere** — dead code. `SafeResetButton.tsx` (the spec-aligned "Return to Safe Baseline") is likewise unreachable from the live app despite `docs/manual-release-checklist.md` claiming it's accessible.
11. **`mobile-bottom-sheet` reference vs. real DOM mismatch** — confirmed: `layoutControls.js` (`openMobileSheet`/`closeMobileSheet`/`setMobileSheetFull`/drag handlers) all do `document.getElementById('mobile-bottom-sheet')`, and this id **does not exist anywhere in `index.html`** — every call silently no-ops (`if (!sheet) return;`). The actual mobile-sheet DOM in `index.html` is `#research-panel` (repurposed via a `max-width:768px` media query) plus `#sheet-drag-handle`/`#sheet-close-btn`, which are only partially wired (the drag-handle's `pointerdown` fires, but the corresponding `pointermove` handler looks up the same nonexistent id and does nothing). This directly contradicts `docs/manual-release-checklist.md`'s "Mobile: Bottom sheet / panel can be opened and closed" claim.
12. **Boot failure silently console-only** — confirmed, `main.ts:64,114-116`; no fallback UI, no WebGL capability pre-check, no user-facing message. `AppErrorBoundary.tsx`/`FallbackScreen.tsx` exist but are unreachable dead code.
13. **DPR unclamped** — confirmed, `main.ts:67`: `state.renderer.setPixelRatio(window.devicePixelRatio)`, no `Math.min(...)` cap anywhere in the codebase.
14. **Large DOM cache remount problem** — confirmed as a latent (not currently triggered) risk: `domCache.js` populates 395 ids once at `DOMContentLoaded` with no re-population/teardown mechanism (`initDOMCache` is called exactly once, nowhere else). Currently safe only because `index.html` never remounts/replaces DOM subtrees; would become a real staleness bug the moment any dynamic re-render (e.g. wiring in the currently-dead `.tsx` tree) is introduced without also re-running `initDOMCache()`.

## 13. TypeScript scope gap

`tsconfig.json`'s `include` is limited to `src/bridge/**/*.ts`, `src/signal/**/*.ts`, `src/types/**/*.ts`. **Everything else — `main.ts`, all of `src/organism`, `src/ui` (both the live legacy files and the entire dead `.tsx` tree), `src/perception`, `src/render`, `src/config`, `src/release` — is outside the TypeScript compile/type-check scope entirely.** `npm run build` does run `tsc --noEmit` first, but since these files aren't in `include`, they are not type-checked by it; `vite build`'s esbuild-based transpile is what actually processes them (transpile-only, no type errors surfaced). This means the entire live UI wiring (`main.ts`, `GuidePanel.js`, `MajorStateObserver.js`, `pointerHandlers.js`, `updateMetricsUI.js`, `layoutControls.js`) currently has **zero compile-time type safety**, despite `strict: true` being set in the same `tsconfig.json`.

## 14. Browser E2E gaps

`package.json` devDependencies contain only `vitest`/`eslint`/`typescript`/`vite` — **no Playwright, no browser E2E harness of any kind**, confirmed via search (no `playwright` string anywhere in the repo, no `tests/e2e`-style directory). 215 test files exist under `src/tests/**`, all vitest unit/logic-level tests. None of them load `index.html` in a real browser or click a DOM button. Concretely, this means:

- The reset-leaves-stale-history bug (§12 item 10) is not caught by any test.
- The `mobile-bottom-sheet` dead-DOM-id bug (§12 item 11) is not caught by any test.
- The pointer/camera interaction conflict (§7) is not caught by any test.
- Boot-failure/WebGL-failure behavior (§12 item 12) is not caught by any test.
- `npm run check:release` (`scripts/run-release-checks.ts`) performs only shallow existence/grep-style checks (file exists, no forbidden substring, no disallowed import) — not behavioral verification; it currently reports 61/0 passing when run manually via `npx tsx` (see below), but this says nothing about whether the flags it validates are actually wired into runtime behavior (they are not, per §8).

This is precisely the gap PR1 ("Quality Gates") is meant to close.

## Verification run in this session

- `npm run build` — **PASS** (`tsc --noEmit && vite build`; 137 modules, `dist/` produced; a Vite warning notes `src/signal/runSignalRuntime.ts` is both statically and dynamically imported, preventing a separate chunk — informational, not an error).
- `npm run test:run` — **6 test files failed / 209 passed; 8 tests failed / 3499 passed** (215 files, 3507 tests total). Failures are all in existing "no forbidden claims / no life-language" copy-guard tests (e.g. `src/tests/stabilization/energyRealityAuditDocs.test.ts`, `src/tests/world/externalDriveField.test.ts`) — **pre-existing, not caused by this session** (no source files were modified in this session prior to the check).
- `npm run check:release` — **fails to run as configured**: the script invokes `tsx` directly, but `tsx` is **not listed in `package.json` devDependencies** and is absent after a plain `npm install` (`sh: 1: tsx: not found`). Running the underlying script manually via `npx tsx scripts/run-release-checks.ts` (which auto-fetches `tsx`) shows the checks themselves currently report `61 passed, 0 failed` — but see §14: these are shallow static checks, not evidence the runtime respects release flags.

These are pre-existing repository issues (missing `tsx` devDependency, pre-existing failing copy-guard tests), not something introduced by this PR0 documentation-only change. They are flagged here as candidates for PR1/PR2, per the kickoff instructions to report — not fix — them in PR0.
