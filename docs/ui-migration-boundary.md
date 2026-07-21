# UI Migration Boundary (PR0)

This document fixes the line between "research runtime — do not change meaning" and "UI/presentation — safe to restructure," grounded in the actual files found during this audit (see `docs/ui-runtime-inventory.md`, `docs/ui-feature-status.md`). It exists so that PR1 onward can proceed without re-litigating which files are in scope.

## 1. Frozen — research runtime (do not change behavior/meaning)

These directories define field equations, dynamics, seed behavior, scenario conditions, and research-numeric meaning. UI PRs must treat them as read-only dependencies:

- `src/core/` (`AeternaNetwork.js`, `PhysicalDisk.js`, `derivedMetrics.ts`) — the field/network simulation itself.
- `src/organism/` (`state.js`, `actionLoop.js`, `runtimeLoop.ts`, `selfOriginEvents.ts`) — the per-frame simulation loop and organism state. **Exception**: `runtimeLoop.ts`'s `maybeBridgeSignal`/`maybeUpdateUi` throttling and call-order are dynamics-adjacent but are UI-facing scheduling, not physics — touching the *throttle values or call order* requires care and should be flagged as a candidate Runtime PR, not silently changed inside a UI PR.
- `src/world/`, `src/substrate/`, `src/boundary/`, `src/closure/`, `src/plasticity/`, `src/signal/`, `src/bridge/` (the bridge *pipeline* itself, `bridge.ts`'s 13-stage transform — not its *presentation*), `src/body/`, `src/perception/TouchMemory.js`, `src/perception/touchPerception.ts`, `src/perception/touchPatterns.ts` — dynamics, seed, membrane, plasticity, bridge-signal semantics.
- `src/scenario/`, `src/experiments/` — scenario/experiment definitions and conditions.
- `src/observer/*Derive*.ts` (e.g. `deriveCurvatureVortexCoupling.ts`, `deriveObservedRatios.ts`, `deriveNaturalDiagnosticState.ts`) — these compute research-meaningful derived values; their **numeric output** is frozen. Their consumption/presentation (how a UI panel formats/labels/dedupes the result) is not.
- `src/config/aeternaNaturalPresets.ts`, `aeternaNaturalRuntimeConfig.ts`, `coreDynamicsConstantsConfig.ts`, `membraneConfig.ts`, `torusMetricConfig.ts`, `weakPlasticityConfig.ts` — runtime/dynamics configuration semantics (as opposed to `releaseEnvironmentConfig.ts`/`publicResearchModeConfig.ts`, which are UI/release-facing and are NOT frozen — see §2).

Known `||`-vs-`??` zero-value bugs found in this audit (`MajorStateObserver.js`, `phaseCarryingDrive.ts`, scenario harness files) touch presentation/history/seed-plumbing code, not the field equations themselves — they are legitimate P0 bug fixes, not Runtime changes, **except** `src/world/phaseCarryingDrive.ts:31`'s `seedInput || 1`, which sits inside frozen dynamics code (`src/world/`) and reproducibility-affecting seed handling. That one fix should be proposed as a **separate Runtime-adjacent PR** per the kickoff prompt's rule 2, not bundled into a UI PR, even though it's a one-line, uncontroversial fix — because it changes observable simulation output (seed 0 behavior) for anyone who has been relying on today's (buggy) behavior in existing research logs/exports. Flag for maintainer sign-off before changing.

## 2. Open — UI/presentation layer (safe to restructure under this initiative)

Everything else touched in this audit is presentation, wiring, or release/safety configuration, and is in scope for the UI/UX rebuild:

- `src/main.ts`, `index.html`, `src/ui/**` (both the live legacy `.js` files and the entire dead `.tsx` scaffolding tree), `src/utils/cameraControls.js`, `src/utils/slider.js`, `src/render/RealityVisualLayer.js` (visual presentation of the field, not the field itself), `src/state/` (UI-facing selection/observation state, e.g. `selectedObservationState.ts`).
- `src/release/validateReleaseSafety.ts`, `src/config/releaseEnvironmentConfig.ts`, `src/config/publicResearchModeConfig.ts`, `src/config/observationDisplayModeConfig.ts`, `src/config/lensGuideConfig.ts` — release/public-safety gating, currently disconnected from the running app (`docs/current-public-runtime-map.md`); wiring these in is the core of PR2.
- `src/bridge/bridge.ts`'s **presentation** (how/when its output reaches `GuidePanel`/UI — lifecycle, dedupe, cadence of DOM writes) is open; its internal 13-stage signal transform is frozen (§1).
- `src/ui/guide/*` (the rule-based `localGuideEngine.ts`/`deriveGuideExplanation.ts`/`guideClaimGuard.ts` tree) — presentation/explanation layer, safe to connect and prefer over the live LLM-based `GuidePanel.js` path.

## 3. Verification-required gray zone

A few items straddle the line and need explicit confirmation before touching, flagged here rather than silently classified:

- `src/organism/runtimeLoop.ts` throttle constants (`UI_FPS`, `GUIDE_FPS`, `BRIDGE_INTERVAL_MS`) — presentation-performance tuning, but embedded in a file otherwise considered frozen organism code. Treat changes here as UI-layer (Performance Budget, master-spec §16) but keep the diff isolated and call it out explicitly in the PR description.
- `src/ui/observation/ConsciousnessCandidateConditionsPanel.tsx` — the name itself risks running against master-spec §2.3's ban on consciousness/life/intelligence "proof" framing. Before connecting this panel in a future PR, its copy must be reviewed against `docs/scientific-ui-ux-principles.md` and the claim-guard tests; this is a content/copy review, not a runtime-meaning change, but is called out here because it's exactly the kind of thing that must not slip through as "just UI."
- `src/world/phaseCarryingDrive.ts:31` seed fallback — see §1, needs separate Runtime PR + sign-off.
- Existing failing tests in `src/tests/stabilization/energyRealityAuditDocs.test.ts` / `src/tests/world/externalDriveField.test.ts` (the "no life-language" copy guards) are pre-existing failures unrelated to this session's changes; whether the *documentation prose* they check needs fixing or the *test assertions* need updating is a judgment call for the docs owner, not something a UI PR should silently resolve either way.

## 4. Target architecture vs. today's reality

The master spec's target architecture (`ReleaseEnvironment → AppBootstrap → RuntimeAdapter → ObservationSnapshotStore → Observer Derivations → ObservationEventStore → UIStateStore → ObservatoryShell`) **does not exist yet**. Today:

```
index.html (3 independent <script type="module"> entries: main.ts, debugPanels.js, layoutControls.js)
        │
        ├── main.ts → init() → requestAnimationFrame(actionLoop)
        │        └── actionLoop.js → runtimeLoop.ts
        │                 ├── maybeUpdateUi  → updateMetricsUI.js, GuidePanel.update, RealityVisualLayer.update
        │                 └── maybeBridgeSignal → bridge.ts → GuidePanel.updateFromBridge
        │
        ├── debugPanels.js (independent, unconditional)
        └── layoutControls.js (independent, unconditional; also imported by updateMetricsUI.js)
```

No `RuntimeAdapter`/`RuntimeSnapshot`/`RuntimeCommand` boundary, no `ObservationEventStore` (four independent notification decision-makers instead, see `ui-runtime-inventory.md` §6), no `UiStateStore` (state lives in `window`-global-mutated `state` object and scattered DOM classes/`window.*` functions), no `ObservatoryShell`/4-route navigation (today's nav is tab buttons + `window.selectResearchTab`).

**Update (PR3):** `src/app/runtime/{RuntimeSnapshot,RuntimeCommand,RuntimeCapabilities,RuntimeAdapter}.ts` now exist as a thin, tested wrapper around the legacy `state` singleton and `pointerHandlers.js`. `main.ts`'s command-shaped `window.*` globals (`applyPreset`, `resetTouchMemory`, `injectMassiveError`, `toggleVisualLayer`, `toggleDebugLabels`) route through `dispatchRuntimeCommand` — real, not aspirational. `RuntimeSnapshot`/`RuntimeCapabilities` are built and unit-tested but have **no consumer in the live UI yet** (see `docs/ui-feature-status.md` addendum) — the boundary exists but nothing reads through it yet. `ObservationEventStore` and `UiStateStore` remain unbuilt (PR4/PR5).

**Update (PR4):** `src/app/events/{ObservationEvent,ObservationEventStore,eventDedupe,eventLifecycle,adaptAeternaEvent}.ts` now exist. `deriveAeternaEvents.ts` (already live) feeds every event it produces into `observationEventStore`, so the store has a real, live producer — but `MajorStateObserver`, `GuidePanel`, and `ObservationDisplay` still run their own separate, undeduped decision logic (`ui-runtime-inventory.md` §6's "four independent systems" finding is only 1/4 addressed). Toast/History/Guide do **not** yet all read from one place — that requires migrating the other three producers and then migrating at least one consumer (a panel that reads from the store instead of its own state), which is PR8-scoped work.

**Update (PR5):** `src/app/state/{UiState,UiStore}.ts` and `src/app/interaction/interactionPredicates.ts` now exist. This closes the literal P0 gap ("no interaction-mode gate ties [stimulation] to the separate CameraControls' view/touch toggle" — `ui-runtime-inventory.md` §7): `pointerHandlers.js`'s Runtime-affecting tap effects (`touchMem.recordTouch` → `network.injectSTDPExternal`, and `network.injectPredictionError`) are now gated on `uiStore.getState().interactionMode === 'stimulate'`, the default, so today's UX is unchanged. This does **not** merge `CameraControls`' independent pointer/drag tracking with `pointerHandlers.js`'s — both still maintain separate low-level pointer state (`this._pointers` vs `state.activeTouches`); only the Runtime-affecting side effect is now gated. A true single `InteractionController` owning all pointer state (master spec §10) is still future work — `UiState` currently has exactly one field (`interactionMode`); the rest of the target `UiState` interface (`primaryRoute`, `contextPanel`, `selectedCellId`, etc.) has no live consumer yet and was deliberately not added as dead fields.

**Update (PR6):** `src/ui/shell/{TopBar,NavigationRail,BottomNavigation}.ts` and `src/app/AppShell.ts` now exist and genuinely mount — the target architecture's `ObservatoryShell` box in the master-spec §8 diagram is no longer purely aspirational, but it is **opt-in** (`src/app/shellFeatureFlag.ts`, off by default) and mounted *alongside* the legacy DOM graph shown earlier in this document, not replacing it. `UiState.primaryRoute` was added as the Shell's first real consumer. The Shell currently renders no Field Stage content (the legacy canvas shows through underneath by design — no duplicate Three.js scene) and an empty Context Pane — real panel content requires `ObservationSnapshotStore`/`ObservationEventStore` consumers, which is PR8-scoped. The legacy `index.html` boot graph (§4's diagram) is completely unchanged when the flag is off; this PR does not touch it.

**Update (PR7):** The Context Pane is no longer empty — `src/app/onboarding/FirstObservationFlow.ts` implements master spec §6's WELCOME→FREE_EXPLORATION state machine and mounts there. This is the first thing in the new architecture to actually read `RuntimeSnapshot` (PR3's `getRuntimeSnapshot`, previously built but unconsumed) and the first thing to react to a real user stimulation event (`src/app/interaction/stimulationEvents.ts`, emitted from the already-gated PR5 stimulate branch in `pointerHandlers.js`). Still scoped narrowly: this is the onboarding flow only, not a general panel-content system — `ObservationEventStore`/`ObservationSnapshotStore` still have no panel consumer (Now Summary, Cell Inspector, etc. remain PR8 work).

**Update (PR8a):** The first of master spec §8's 9 Context Panel Migration items (Now Summary) is done — `src/ui/shell/NowSummaryPanel.ts` shows once `FirstObservationFlow` reaches `FREE_EXPLORATION` on the `'observe'` route. It reads the legacy `deriveNowSummary` output (exposed via a new `state.lastNowSummary`) rather than reimplementing that derivation — the legacy DOM path (`layoutControls.js`'s `updateNowSummary`) is untouched and keeps running in parallel, both reading the same underlying computed value. 8/9 panels (Cell Inspector, Lens, Replay, Difference, Causal Trace, Layer Correlation, Ratio Involvement, Guide) remain — each is its own follow-up PR, not bundled here.

**Update (PR8b):** Item 2/9 (Cell Inspector) is done. This is the first PR to add a genuinely new *interaction* capability rather than only migrating existing derived state: `UiState.selectedCellId` plus a new `'inspect'` branch in `pointerHandlers.js`'s `handlePointerUp` that raycasts and selects a cell **without** calling any Runtime-mutating function — the existing `'stimulate'` branch (PR5) is untouched, and the two are mutually exclusive (`if/else if`). `RuntimeAdapter.getCellValue` is a strictly read-only accessor onto `AeternaNetwork.currentBuffer`/`spikeTrace`. 7/9 panels remain (Lens, Replay, Difference, Causal Trace, Layer Correlation, Ratio Involvement, Guide).

**Update (PR8c):** Item 3/9 (Lens) is done, scoped honestly rather than against the existing `src/ui/lens/metricLensRegistry.ts` (17 lenses, requires observer-derivation data not yet wired into `RuntimeAdapter` — see PR8b's note). `UiState.activeLensId` covers only the 2 real per-cell metrics; each Cell Inspector row is its own lens toggle. 6/9 panels remain (Replay, Difference, Causal Trace, Layer Correlation, Ratio Involvement, Guide).

Migration must build the new boundary **alongside** this graph (PR3–PR6), prove it with real Runtime data end-to-end for one panel at a time (PR8's stated order: Now Summary → Cell Inspector → Lens → Replay → Difference → Causal Trace → Layer Correlation → Ratio Involvement → Guide), and only delete the corresponding legacy path once its replacement is VERIFIED via the Playwright suite introduced in PR1 — not before.

## 5. Constraints this boundary implies for PR1/PR2

- PR1's new `tsconfig.ui.json`/`tsconfig.app.json` should start by including the **live** legacy files (`main.ts`, `src/ui/*.js`, `src/organism/actionLoop.js`) plus the new `src/app/**` scaffolding as it's built — not the currently-dead `.tsx` tree wholesale, since much of it (per `ui-feature-status.md`) needs content/architecture revision before it's worth type-checking strictly, and some of it (`CausalTraceOverlay.tsx`) may be deleted rather than promoted.
- PR2's public-safety fixes (API key removal from public build, Bridge gating, Debug gating) require **first** wiring `validateReleaseSafety`/`releaseEnvironmentConfig` into `main.ts`'s actual boot path — today there is no branch point in `main.ts` at which a channel check could even be inserted without restructuring `init()` slightly. This is a UI-layer bootstrap change (§2), not a Runtime change, but it is the first real connection between the "new" config tree and the "old" live app and should be reviewed as such.
- Any PR that fixes `src/ui/MajorStateObserver.js`'s empty-candidate crash or `||`-vs-`??` bugs must not change the *numeric derivation* of `dyn.energy`/`dyn.collapseRisk`/etc. themselves (those come from frozen `src/organism`/`src/core` code) — only the *fallback-when-missing* behavior in the UI-layer observer file.
