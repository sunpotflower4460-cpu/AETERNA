# UI Feature Status (PR0)

Classification legend (per kickoff prompt):

- **DEFINED** — type/copy/model exists only; no renderer.
- **RENDERABLE** — can produce HTML/a view, but is not wired to the live runtime or DOM.
- **CONNECTED** — actually wired into the running app's real Runtime/UI state.
- **VERIFIED** — confirmed working via a real browser check (none exist in this repo yet — see `docs/ui-runtime-inventory.md` §14 — so **nothing in this table is marked VERIFIED**, even where code comments or docs claim completion).
- **LEGACY** — old, live, working code that should eventually be replaced by the new architecture, but is currently load-bearing.
- **REMOVE** — dead weight with no future role (distinct from "DEFINED/RENDERABLE scaffolding for later migration").

Nothing below is promoted past what was directly confirmed by import-graph tracing and code reading in this session.

## Legacy live app (currently running in production today)

| Feature | File | Status | Notes |
|---|---|---|---|
| App bootstrap | `src/main.ts` | **LEGACY / CONNECTED** | Sole real entry point invoked as a module script from `index.html`. No compile-time type checking (outside `tsconfig` include). |
| Debug panels loader | `src/ui/debugPanels.js` | **LEGACY / CONNECTED** | Loaded unconditionally by `index.html:1673`, independent of `main.ts`; not gated by any release flag. |
| Layout controls | `src/ui/layout/layoutControls.js` | **LEGACY / CONNECTED** | Loaded unconditionally by `index.html:1674`; also imported by `updateMetricsUI.js`. Drives research panel, mobile sheet toggles (partially broken — see feature row below), event strip, Now Summary, Event Timeline. |
| DOM cache | `src/ui/domCache.js` | **LEGACY / CONNECTED** | 395 hardcoded ids cached once at `DOMContentLoaded`; no teardown/remount (P0 risk #14). |
| Pointer handlers (stimulate field) | `src/perception/pointerHandlers.js` | **LEGACY / CONNECTED** | Document-level; unconditionally injects field stimulation on tap, no interaction-mode gate (P0 #9). |
| Camera controls | `src/utils/cameraControls.js` | **LEGACY / CONNECTED** | Bound to renderer canvas; independent pointer/orbit state from `pointerHandlers.js`, no shared mode (P0 #9). |
| Camera keyboard shortcuts | `src/ui/camera/createTorusCameraControls.ts` | **LEGACY / CONNECTED** | Only piece of the `.ts` camera-control family actually imported by `main.ts`. |
| Guide panel (notification + LLM bridge) | `src/ui/GuidePanel.js` | **LEGACY / CONNECTED** | Single `ev` var overwrite bug (P0 #5); unescaped `innerHTML` of LLM text (P0 #6, XSS-shaped); unconditional external API calls once a key is set (P0 #7). |
| Major state observer (HUD badge) | `src/ui/MajorStateObserver.js` | **LEGACY / CONNECTED** | Empty-candidate fallback gap (P0 #1); multiple `||` zero-value bugs (P0 #2). |
| Observation display (floating toast) | `src/ui/ObservationDisplay.js` | **LEGACY / CONNECTED** | Dedupe only while currently shown (P0 #4). |
| Metrics UI updater | `src/ui/updateMetricsUI.js` | **LEGACY / CONNECTED** | Central per-frame DOM writer for Field/World/Medium tabs, Now Summary, Event Timeline; also the only live importer of 5 `.tsx` files (see below) and of `deriveNowSummary`/`deriveAeternaEvents`. |
| Now-summary derivation | `src/ui/summary/deriveNowSummary.ts` | **CONNECTED** | Imported live by `updateMetricsUI.js`. Independent decision logic vs. GuidePanel/MajorStateObserver/ObservationDisplay (no shared event store, master-spec §9.1 violation). |
| Event timeline derivation | `src/ui/timeline/deriveAeternaEvents.ts` | **CONNECTED** | Same as above. |
| Runtime mode badge / value-kind badge / interpretation note / warning list / observation dashboard | `src/ui/natural/RuntimeModeBadge.tsx`, `ValueKindBadge.tsx`, `InterpretationNote.tsx`, `NaturalWarningList.tsx`, `ObservationDashboard.tsx` | **CONNECTED** | The only `.tsx`-suffixed files actually imported by the live app (via `updateMetricsUI.js`); plain string-returning TS functions, not React components (no React dependency exists in this repo). |
| Bridge pipeline | `src/bridge/bridge.ts` (`bridgeTorusToSignal`) | **LEGACY / CONNECTED** | Runs unconditionally every ~100ms from `runtimeLoop.ts`'s `maybeBridgeSignal`; no lifecycle model, no release gate (P0 #3, #8). |
| Accordion / slider / sparkline utilities | `src/ui/accordion.js`, `src/utils/slider.js`, `src/ui/trendSparkline.js` | **LEGACY / CONNECTED** | Small live DOM utilities, no known issues found. |
| Mobile bottom sheet | `layoutControls.js` (`openMobileSheet`/`closeMobileSheet`/`setMobileSheetFull`) | **LEGACY / BROKEN (effectively REMOVE-or-fix)** | Targets `#mobile-bottom-sheet`, which **does not exist** in `index.html`; every call no-ops. Real mobile panel is `#research-panel` + partially-wired `#sheet-drag-handle`. Contradicts `docs/manual-release-checklist.md`. Needs a decision in PR2: fix the id mismatch as a like-for-like legacy bug fix, or treat as superseded once the new Context Sheet (spec §5.2) ships. |
| API Key input (Raw tab) | `index.html:1479-1489`, consumed by `pointerHandlers.js` (`testAPIConnection`) and `GuidePanel.js` | **LEGACY / CONNECTED — Public-safety violation** | Live, reachable, unguarded by any release/public flag. Must be removed from any build the public-safety guardrails (`docs/public-research-mode.md` §8) claim to cover. See `docs/current-public-runtime-map.md`. |

## New / spec-aligned scaffolding (design-doc-aligned tree; not wired into the running app)

| Feature | File(s) | Status | Notes |
|---|---|---|---|
| Release safety validator | `src/release/validateReleaseSafety.ts` | **DEFINED / RENDERABLE (pure function, unit-tested)** — **NOT CONNECTED** | Zero callers outside `src/tests/release/**`. Never invoked from `main.ts` or any live path — the exact "config says false, but nothing loads/executes-nothing-checks" gap called out in the master spec §3.3. |
| Release environment config | `src/config/releaseEnvironmentConfig.ts` | **DEFINED — NOT CONNECTED** | Type + defaults only; no runtime resolver invoked anywhere in the live app. |
| Public research mode config | `src/config/publicResearchModeConfig.ts` | **DEFINED — NOT CONNECTED** | Same pattern. |
| Public research landing | `src/ui/public/PublicResearchLanding.tsx` | **RENDERABLE — NOT CONNECTED** | No importer outside tests. |
| Public build info / interpretation note | `src/ui/public/PublicBuildInfo.tsx`, `PublicInterpretationNote.tsx` | **RENDERABLE — NOT CONNECTED** | Same. |
| Recommended demo flow | `src/ui/public/RecommendedDemoFlow.tsx` | **RENDERABLE — NOT CONNECTED** | Same. |
| First-run guide (Welcome/Baseline/Touch/Insight flow) | `src/ui/onboarding/FirstRunGuide.tsx`, `FirstRunGuideStep.tsx` | **RENDERABLE — NOT CONNECTED** | No importer outside tests; this is the entire spec §6 first-experience state machine, currently unreachable. |
| Observation workspace shell | `src/ui/observation/ObservationWorkspace.tsx` | **RENDERABLE — NOT CONNECTED** | Root of an otherwise-dead subtree (see below); no importer outside tests. |
| Cell inspector panel | `src/ui/observation/CellInspectorPanel.tsx`, `useCellPicking.ts` | **RENDERABLE — NOT CONNECTED** | Reachable only via `ObservationWorkspace.tsx`, itself unreachable. |
| Time replay panel / replay slider / snapshot summary | `src/ui/replay/TimeReplayPanel.tsx`, `ReplaySlider.tsx`, `ReplaySnapshotSummary.tsx` | **RENDERABLE — NOT CONNECTED** | `TimeReplayPanel.tsx` imported only by `ObservationWorkspace.tsx`. |
| Causal trace panel / overlay | `src/ui/observation/CausalTracePanel.tsx`, `CausalTraceOverlay.tsx` | **RENDERABLE — NOT CONNECTED** | `CausalTraceOverlay.tsx` has **no importer at all**, not even from `ObservationWorkspace.tsx` — likely an orphaned duplicate of `CausalTracePanel.tsx`; candidate for REMOVE once confirmed truly superseded (do not remove in PR0-PR2, needs explicit confirmation). |
| Layer correlation panel | `src/ui/observation/LayerCorrelationPanel.tsx` | **RENDERABLE — NOT CONNECTED** | Imported only by `ObservationWorkspace.tsx`. |
| Observed ratio involvement panel | `src/ui/observation/ObservedRatioInvolvementPanel.tsx` | **RENDERABLE — NOT CONNECTED** | Same. |
| Difference view / metric spotlight / diagnostic strip / header / mobile tabs / now-summary (observation variant) | `src/ui/observation/DifferenceViewPanel.tsx`, `MetricSpotlightPanel.tsx`, `ObservationDiagnosticStrip.tsx`, `ObservationHeader.tsx`, `ObservationMobileTabs.tsx`, `NowSummaryPanel.tsx`, `NowSummarySectionCard.tsx` | **RENDERABLE — NOT CONNECTED** | All reachable only through `ObservationWorkspace.tsx`; note this file duplicates responsibility with the live, connected `src/ui/summary/deriveNowSummary.ts` — a future migration must retire one, not run both. |
| Consciousness-candidate-conditions panel | `src/ui/observation/ConsciousnessCandidateConditionsPanel.tsx` | **RENDERABLE — NOT CONNECTED** | Name warrants scrutiny against master-spec §2.3's ban on "consciousness/life/intelligence proof expressions" during PR8 migration — review copy carefully before connecting. |
| Error boundary / fallback screen / safe reset | `src/ui/system/AppErrorBoundary.tsx`, `FallbackScreen.tsx`, `SafeResetButton.tsx` | **RENDERABLE — NOT CONNECTED** | Exactly the components that would fix P0 #12 (silent boot failure) and P0 #10 (no accessible Safe Reset) if wired in — currently pure dead code, referenced only from `src/tests/release/*.test.ts`. High-priority PR6/PR2-adjacent migration target. |
| Lens-aware guide panel / mode tabs / question input / response view | `src/ui/guide/LensAwareGuidePanel.tsx`, `LensGuideModeTabs.tsx`, `LensGuideQuestionInput.tsx`, `LensGuideResponseView.tsx`, `deriveGuideExplanation.ts`, `guideClaimGuard.ts`, `guideCopy.ts`, `localGuideEngine.ts` | **RENDERABLE — NOT CONNECTED** | Rule-based/deterministic replacement candidate for the live `GuidePanel.js`'s unsafe LLM `innerHTML` path (P0 #6) — comments in `deriveGuideExplanation.ts`/`localGuideEngine.ts` explicitly claim "no LLM, no API key required." Good PR8 migration candidate given the current XSS-shaped bug it would replace. |
| Camera control hooks (React-hook-shaped) | `src/ui/camera/useTorusCameraControls.ts`, `useObservationCameraControls.ts` | **RENDERABLE — NOT CONNECTED** | Only importer is `src/ui/render/torusRenderModeManager.ts`, itself not imported by `main.ts`. Designed for `ObservationWorkspace.tsx`. |
| Research export / reproducibility / run-summary panels | `src/ui/research/ExportButton.tsx`, `ReproducibilityPanel.tsx`, `ResearchExportPanel.tsx`, `ResearchRunSummaryCard.tsx` | **RENDERABLE — NOT CONNECTED** | No importer outside tests. |
| Comparison panels (long-run comparison) | `src/ui/comparison/ComparisonHighlights.tsx`, `ComparisonMetricTable.tsx`, `LongRunComparisonPanel.tsx`, `VariantSummaryCard.tsx` | **RENDERABLE — NOT CONNECTED** | No importer outside tests and `src/comparison/runLongRunComparisonCli.ts` (a CLI script, not the browser app). |
| Terms / glossary panel | `src/ui/terms/ObservationGlossaryPanel.tsx`, `ObservationTermCard.tsx`, `TermTooltip.tsx`, `htmlEsc.ts` | **RENDERABLE — NOT CONNECTED** | No importer outside tests; note `htmlEsc.ts` is exactly the escaping utility the live `GuidePanel.js`/`layoutControls.js` innerHTML sites (P0 #6) are missing — reuse candidate. |
| Torus render layer registry / summaries / diagnostics / color maps | `src/ui/render/fieldLayerRegistry.ts`, `fieldLayerSummaries.ts`, `fieldLayerOverlayRules.ts`, `torusLayerRegistry.ts`, `torusColorMap.ts`, `phaseColorMap.ts`, `torusCoverageMetrics.ts`, `torusDiagnosticWarnings.ts`, `torusRenderModeManager.ts`, `cellPicking.ts`, `SelectedCellMarker.tsx` | **RENDERABLE — NOT CONNECTED** | Full "new" rendering-decision layer for the future Field Stage; no importer outside tests and each other. |
| Scenario run state / comparison / result summary | `src/ui/scenario/ScenarioRunState.ts`, `ScenarioComparison.ts`, `ScenarioResultSummary.ts` | **RENDERABLE — NOT CONNECTED** | No importer outside tests. |
| Overview state derivation / mini sparkline | `src/ui/overview/deriveOverviewState.ts`, `MiniMetricSparkline.ts` | **CONNECTED** | Imported live by `updateMetricsUI.js` (correction: these are live, unlike most of the `.tsx` tree — confirm per-file before assuming "new tree = dead"). |
| Lens context packet / metric lens registry | `src/ui/lens/lensContextPacket.ts`, `metricLensRegistry.ts` | **RENDERABLE — NOT CONNECTED** | No importer outside tests and the unreachable `.tsx` tree. |
| Inspector context interface | `src/ui/inspector/aiGuideContextInterface.ts`, `cellInspectorState.ts` | **DEFINED / RENDERABLE — NOT CONNECTED** | Type/state-shape only. |
| Explainable observation snapshot | `src/ui/explain/explainableObservationSnapshot.ts` | **CONNECTED** | Imported live by `updateMetricsUI.js` (drives the `#explain-panel` "explain" button). |

## Reset / state machinery

| Feature | File | Status | Notes |
|---|---|---|---|
| `resetTouchMemory()` | `src/perception/pointerHandlers.js:121-131` | **LEGACY / CONNECTED (partial)** | The only reset path wired to a real button (`index.html:1411`). Clears touch-memory trace only; does not clear GuidePanel/MajorStateObserver/ObservationDisplay history (P0 #10). |
| `resetObservationState()` | `src/state/selectedObservationState.ts:156-160` | **DEFINED / RENDERABLE — NOT CONNECTED** | Correctly implemented, never called from anywhere. Dead code today; candidate for PR5 (Reset design) wiring. |
| Safe Reset button ("Return to Safe Baseline") | `src/ui/system/SafeResetButton.tsx` | **RENDERABLE — NOT CONNECTED** | `docs/manual-release-checklist.md` currently claims this is "accessible" — it is not, in the shipped app. Doc needs correction or the button needs wiring before the checklist item can be truthfully checked. |

## Summary counts

- Live, CONNECTED (legacy or new-but-wired): ~20 files/areas.
- RENDERABLE/DEFINED but NOT CONNECTED (spec-aligned scaffolding awaiting migration): ~60 `.tsx`/`.ts` files.
- VERIFIED: **0** — no browser E2E exists in this repo (see `docs/ui-runtime-inventory.md` §14); nothing should be marked VERIFIED in any doc until Playwright coverage lands (PR1) and is actually run against a real browser.
- Confirmed dead/orphaned (REMOVE candidate, pending confirmation, not deleted in this PR): `src/ui/observation/CausalTraceOverlay.tsx` (no importer at all, likely superseded by `CausalTracePanel.tsx`).
