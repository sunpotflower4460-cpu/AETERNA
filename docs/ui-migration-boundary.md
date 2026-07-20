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

Migration must build the new boundary **alongside** this graph (PR3–PR6), prove it with real Runtime data end-to-end for one panel at a time (PR8's stated order: Now Summary → Cell Inspector → Lens → Replay → Difference → Causal Trace → Layer Correlation → Ratio Involvement → Guide), and only delete the corresponding legacy path once its replacement is VERIFIED via the Playwright suite introduced in PR1 — not before.

## 5. Constraints this boundary implies for PR1/PR2

- PR1's new `tsconfig.ui.json`/`tsconfig.app.json` should start by including the **live** legacy files (`main.ts`, `src/ui/*.js`, `src/organism/actionLoop.js`) plus the new `src/app/**` scaffolding as it's built — not the currently-dead `.tsx` tree wholesale, since much of it (per `ui-feature-status.md`) needs content/architecture revision before it's worth type-checking strictly, and some of it (`CausalTraceOverlay.tsx`) may be deleted rather than promoted.
- PR2's public-safety fixes (API key removal from public build, Bridge gating, Debug gating) require **first** wiring `validateReleaseSafety`/`releaseEnvironmentConfig` into `main.ts`'s actual boot path — today there is no branch point in `main.ts` at which a channel check could even be inserted without restructuring `init()` slightly. This is a UI-layer bootstrap change (§2), not a Runtime change, but it is the first real connection between the "new" config tree and the "old" live app and should be reviewed as such.
- Any PR that fixes `src/ui/MajorStateObserver.js`'s empty-candidate crash or `||`-vs-`??` bugs must not change the *numeric derivation* of `dyn.energy`/`dyn.collapseRisk`/etc. themselves (those come from frozen `src/organism`/`src/core` code) — only the *fallback-when-missing* behavior in the UI-layer observer file.
