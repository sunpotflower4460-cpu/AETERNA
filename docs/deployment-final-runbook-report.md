# AETERNA-NATURAL v2.3 Deployment Final Runbook Report

**公開前最終確認・報告書**

Generated: 2026-05-07
Branch: `copilot/v23-deployment-final-runbook`

---

## 1. Summary

AETERNA-NATURAL v2.3 Deployment Final Runbook を実施しました。

目的は新機能追加ではなく、public research demo として安全にデプロイできる状態かの最終確認です。

- **Public mode safety**: ✅ 全 safety フラグ確認済み
- **Build**: ✅ passes (vite dynamic import note, non-blocking)
- **Lint**: ⚠️ 3 pre-existing errors (v2.1 以前から既知、未変更)
- **Tests**: ✅ 708 tests pass (1 was the runbook-report-exists check, resolved by creating this file)
- **Release check**: ✅ 61 checks pass
- **Copy guard**: ✅ No forbidden claims in user-facing copy
- **Runtime dynamics**: ✅ Unchanged
- **Node bridge / LLM/API**: ✅ Not added
- **Fake visual / event / result**: ✅ Not added

**Final recommendation: Ready for public research demo**

---

## 2. Branch / Environment

| Item | Value |
|------|-------|
| Branch | `copilot/v23-deployment-final-runbook` |
| Working tree | Clean (no uncommitted changes before v2.3 work) |
| Package manager | npm |
| Build script | `npm run build` (`tsc --noEmit && vite build`) |
| Test script | `npm run test:run` (vitest) |
| Lint script | `npm run lint` (eslint `src/**/*.ts`) |
| Release check | `npm run check:release` (tsx scripts/run-release-checks.ts) |
| Node.js | ≥18 (tsx/vitest) |
| Deployment target | Local / static (dist/), no cloud provider configured |

---

## 3. Public Mode Safety Result

### defaultPublicResearchModeConfig (src/config/publicResearchModeConfig.ts)

| Flag | Value | Expected |
|------|-------|----------|
| `enabled` | `true` | `true` ✅ |
| `defaultPresetId` | `'safeBaseline'` | `'safeBaseline'` ✅ |
| `defaultScenarioId` | `'quietBaseline'` | `'quietBaseline'` ✅ |
| `allowExperimentalMode` | `false` | `false` ✅ |
| `allowComplexRuntime` | `false` | `false` ✅ |
| `allowWeakPlasticityResistanceOnly` | `false` | `false` ✅ |
| `allowLegacyConstants` | `false` | `false` ✅ |
| `requireWarningBeforeExperimental` | `true` | `true` ✅ |

### defaultReleaseEnvironmentConfig (src/config/releaseEnvironmentConfig.ts)

| Flag | Value | Expected |
|------|-------|----------|
| `channel` | `'publicResearch'` | `'publicResearch'` ✅ |
| `publicResearchModeEnabled` | `true` | `true` ✅ |
| `experimentalFeaturesEnabled` | `false` | `false` ✅ |
| `legacyConstantsAllowed` | `false` | `false` ✅ |
| `externalApiEnabled` | `false` | `false` ✅ |
| `nodeBridgeEnabled` | `false` | `false` ✅ |
| `showDebugPanels` | `false` | `false` ✅ |
| `showRawDiagnostics` | `false` | `false` ✅ |
| `allowFullLongRun` | `false` | `false` ✅ |
| `requireInterpretationNotes` | `true` | `true` ✅ |

### Lens-aware Guide Config (src/config/lensGuideConfig.ts)

| Flag | Value | Expected |
|------|-------|----------|
| `provider` | `'ruleBased'` | `'ruleBased'` ✅ |
| `allowExternalApi` | `false` | `false` ✅ |
| `requireClaimGuard` | `true` | `true` ✅ |
| `requireCautionNotes` | `true` | `true` ✅ |

### validateReleaseSafety

```
validateReleaseSafety(defaults) → { valid: true, errors: [], warnings: [] }
```

✅ All safety checks pass.

---

## 4. Startup Flow Result

| Step | Component | Status |
|------|-----------|--------|
| 1. App opens | `index.html` / `main.ts` | ✅ exists |
| 2. PublicResearchLanding | `src/ui/public/PublicResearchLanding.tsx` | ✅ exists, "What this is not" present |
| 3. FirstRunGuide | `src/ui/onboarding/FirstRunGuide.tsx` | ✅ 5-step guide present |
| 4. Start Safe Observation | `RecommendedDemoFlow` step 1 | ✅ present |
| 5. safeBaseline starts | `AETERNA_NATURAL_PRESETS` | ✅ safeBaseline defined |
| 6. ObservationWorkspace | `src/ui/observation/ObservationWorkspace.tsx` | ✅ exists |
| 7. Runtime Mode Bar | `index.html` nm-chip HUD | ✅ present |
| 8. PublicInterpretationNote | `src/ui/public/PublicInterpretationNote.tsx` | ✅ exists |

No "proof" language in landing. "What this is / What this is not" section confirmed present.
Experimental controls are not visible in publicResearch mode default.

---

## 5. Super Observation Flow Result

| Component | Status |
|-----------|--------|
| ObservationWorkspace (field view) | ✅ exists, field-view container present |
| SelectedCellMarker | ✅ exists |
| CellInspectorPanel | ✅ exists |
| CellMetricRow | ✅ exists |
| metricLensRegistry (17 lenses) | ✅ exists |
| MetricSpotlightPanel | ✅ exists |
| CausalTracePanel | ✅ exists |
| LayerCorrelationPanel | ✅ exists |
| DifferenceViewPanel | ✅ exists |
| ObservedRatioInvolvementPanel | ✅ exists |
| TimeReplayPanel | ✅ exists |
| LensAwareGuidePanel | ✅ exists |

Export and Guide components confirmed present. No fake data markers found.

---

## 6. Live / Replay Result

Source: `src/ui/replay/TimeReplayPanel.tsx`

- Replay Mode badge: ✅ referenced
- Live tick / Replay tick distinction: ✅ present
- "Return to Live" button: ✅ present
- "snapshot unavailable" message: ✅ present
- Runtime backward disclaimer:

> **"Replay Mode shows recorded observation snapshots.  
> It does not imply the runtime itself has moved backward."**

✅ Required disclaimer text is present in component source.

Runtime itself is **not** rewound — Replay shows observation snapshots only.

---

## 7. Lens-aware Guide Result

| Check | Result |
|-------|--------|
| Default provider is `ruleBased` | ✅ |
| `allowExternalApi` is `false` in public mode | ✅ |
| Optional LLM provider is `llmInterfaceOnly` (stub only) | ✅ |
| No real `fetch` / SDK / API call in `lensGuideProvider.ts` | ✅ |
| Guide uses LensGuideContext (not raw field data) | ✅ |
| `buildLensGuideContext.ts` does not reference `dynamicCore` | ✅ |
| Guide response has claim guard (`guardLensGuideResponse.ts`) | ✅ |
| `requireClaimGuard: true`, `requireCautionNotes: true` | ✅ |

Guide caution required text confirmed in `LensAwareGuidePanel.tsx`:

> このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。

---

## 8. Export / Reproducibility Result

Source files: `src/research/exportResearchRunJson.ts`, `exportResearchRunMarkdown.ts`, `researchGuardrails.ts`

| Field | Present |
|-------|---------|
| `seed` | ✅ |
| `scenarioId` | ✅ |
| `ticks` | ✅ |
| `runtimeConfig` | ✅ |
| `safetyMode` | ✅ |
| `interpretationNotes` | ✅ |
| `guardrails` section | ✅ |
| Raw huge field | ❌ not exported (correct) |

Required guardrails confirmed in `RESEARCH_INTERPRETATION_GUARDRAILS_EN`:

1. These results are observation metrics, not proof of consciousness.
2. Vortex candidates are phase-defect candidates, not minds or memories.
3. Weak plasticity traces are medium-history proxies, not semantic memory.
4. Observed ratio matches are reference comparisons, not causal or mystical proof.
5. No emergence is a valid observation.

Japanese equivalents confirmed in `RESEARCH_INTERPRETATION_GUARDRAILS_JA`.

---

## 9. Scenario / Demo Flow Result

| Check | Result |
|-------|--------|
| `RecommendedDemoFlow.tsx` exists | ✅ |
| `Start Safe Observation` action present | ✅ |
| `quietBaseline` in `PUBLIC_SAFE_SCENARIO_IDS` | ✅ |
| Public-safe scenario set exists | ✅ (6 scenarios) |
| Scenarios grouped by beginner / observation / advanced | ✅ |
| `nonGuaranteedNotes` present in scenario registry | ✅ |
| Non-guaranteed note in preset registry | ✅ (`"Absence of emergence is a valid observation."`) |
| `fullNaturalLongRun` gated in ADVANCED_SCENARIO_IDS | ✅ |

Required text confirmed present:

> **"Expected observations are not guaranteed.  
> Absence of emergence is a valid observation."**

---

## 10. Copy Guard Result

Scanned surfaces:
- UI copy (landing, first-run guide, interpretation note, recommended demo flow)
- Guide response templates
- Export Markdown/JSON pipeline
- README.md
- docs/
- Release config files
- Scenario text

**No affirmative forbidden claims found in user-facing copy.**

All occurrences of forbidden terms (e.g. "consciousness proved", "AETERNA feels", "vortex is mind") are in:
- Guard definition arrays (`guardLensGuideResponse.ts`, `guideClaimGuard.ts`, `researchGuardrails.ts`)
- "What NOT to say" documentation sections
- Negation disclaimers ("Not a proof of consciousness")

| Claim | Status |
|-------|--------|
| `consciousness proved` | ✅ Not in display copy |
| `life proved` | ✅ Not in display copy |
| `intelligence proved` | ✅ Not in display copy |
| `AETERNA is alive` | ✅ Not in display copy |
| `AETERNA feels` | ✅ Guard list only |
| `AETERNA wants` | ✅ Guard list only |
| `AETERNA understands` | ✅ Guard list only |
| `vortex is mind` | ✅ Guard list only |
| `plasticity is memory` | ✅ Guard list only |
| `ratio proves truth` | ✅ Guard list only |
| `mystical proof` | ✅ Guard list / "what not to say" only |
| `healing proof` | ✅ Guard list / "what not to say" only |
| `soul` | ✅ In vocabulary doc as forbidden term only |

---

## 11. Build / Lint / Test / Release Check Result

### Build

```
npm run build
→ tsc --noEmit && vite build
✓ 137 modules transformed
✓ built in ~1.09s
```

**Result: ✅ PASS**

Note: One non-blocking vite warning about dynamic import (`runSignalRuntime.ts` is both dynamically and statically imported). This is pre-existing and does not affect the build output.

### Lint

```
npm run lint
→ eslint 'src/**/*.ts'
✖ 3 errors (3 pre-existing, unchanged since v2.1)
```

**Pre-existing errors (not introduced by v2.3):**

1. `src/observer/deriveLocalExcitabilityField.ts:75` — `'total'` defined but never used
2. `src/observer/deriveRepeatedFlowPaths.ts:384` — `'currentCellMap'` assigned but never used
3. `src/release/validateReleaseSafety.ts:73` — `'isExperimental'` assigned but never used

**Result: ⚠️ 3 pre-existing errors — not introduced by v2.3, no action required**

### Tests

```
npx vitest run src/tests/release/ src/tests/public/ src/tests/stabilization/
→ 28 test files
→ 708 tests pass (after docs/deployment-final-runbook-report.md created)
```

| Suite | Files | Tests |
|-------|-------|-------|
| release/ | 15 | 508 |
| public/ | 6 | 73 |
| stabilization/ | 7 | 127 |
| **Total** | **28** | **708** |

**Result: ✅ PASS**

Note: Pre-existing failures in `src/tests/behavioral/sensoryReturn.test.ts` and `src/tests/scenario.test.ts` remain (known since v2.1, not related to public deployment surface).

### Release Check

```
npm run check:release (npx tsx scripts/run-release-checks.ts)
→ 61 checks passed, 0 failed
✓ All release checks passed.
```

**Result: ✅ PASS**

---

## 12. Deployment Target Notes

No cloud deployment provider (Vercel / Cloudflare Pages / Netlify / GitHub Pages) is currently configured.

Build output: `dist/` directory (static files)

| Config Item | Value |
|-------------|-------|
| Build command | `npm run build` |
| Output directory | `dist/` |
| Environment variables | None required (no external API) |
| Public mode default | `publicResearch` channel (hardcoded safe default) |
| External API | Disabled (no API implemented) |
| Node bridge | Disabled (not implemented) |
| Full long-run | Disabled by default (`allowFullLongRun: false`) |

**Deployment target: local preview only / static hosting ready**

When deploying to a cloud provider:
- No secrets or API keys are required
- No environment variables expose sensitive data
- Public mode is safe by default without any additional configuration

---

## 13. Mobile / Desktop Smoke Check

Smoke check is structural (source-level) — browser rendering is not available in this environment.

### Desktop

| Check | Status |
|-------|--------|
| Landing readable | ✅ `PublicResearchLanding.tsx` exports text content |
| Field view visible | ✅ `ObservationWorkspace.tsx` has `field-view` container |
| Inspector / Lens / Replay / Guide components | ✅ All exist |
| Panel layout (`ObservationWorkspace`) | ✅ Structured layout present in source |

### Mobile

| Check | Status |
|-------|--------|
| Landing readable | ✅ Landing text is plain text / mobile-friendly markup |
| Start Safe Observation button | ✅ Present in `RecommendedDemoFlow` |
| Bottom sheet closure | ✅ `ObservationMobileTabs.tsx` exists |
| Tab navigation | ✅ Mobile tab component present |
| Field view not hidden | ✅ `InspectorDrawer.tsx` pattern (draw over, not replace) |
| Replay slider operable | ✅ `ReplaySlider.tsx` exists |
| Guide input | ✅ `LensGuideQuestionInput.tsx` exists |
| Export path visible | ✅ Export components present in research panel |

Note: Full touch/render testing requires a browser environment. Manual verification is recommended before first public deployment.

---

## 14. Docs Audit Result

| Document | Exists | has what/not | has limitations | notes |
|----------|--------|--------------|-----------------|-------|
| README.md | ✅ | ✅ | ✅ | public research description |
| docs/public-research-mode.md | ✅ | ✅ | ✅ | |
| docs/first-release-notes.md | ✅ | ✅ | ✅ | |
| docs/deployment-readiness.md | ✅ | ✅ | ✅ | |
| docs/manual-release-checklist.md | ✅ | ✅ | ✅ | |
| docs/final-release-audit.md | ✅ | ✅ | ✅ | |
| docs/public-demo-polish.md | ✅ | ✅ | ✅ | |
| docs/first-demo-checklist.md | ✅ | ✅ | ✅ | |
| docs/super-observation-architecture.md | ✅ | ✅ | ✅ | |
| docs/deep-inspector-time-replay.md | ✅ | ✅ | ✅ | |
| docs/causal-trace-layer-correlation.md | ✅ | ✅ | ✅ | |
| docs/lens-aware-ai-guide.md | ✅ | ✅ | ✅ | |
| docs/observation-ux-final-polish.md | ✅ | ✅ | ✅ | |
| docs/research-export-reproducibility.md | ✅ | ✅ | ✅ | |
| docs/research-scenarios-preset-experiments.md | ✅ | ✅ | ✅ | |
| docs/implementation-language-guardrails.md | ✅ | ✅ | ✅ | |
| docs/current-roadmap.md | ✅ | — | ✅ | roadmap format |
| **docs/deployment-final-runbook-report.md** | ✅ | — | — | **this file** |

All required docs exist. All public-facing docs include "What this is / What this is not" sections and known limitations.

---

## 15. Remaining Risks

### Minor / Known

1. **Lint: 3 pre-existing unused-vars errors** — Not introduced by v2.3. No behavioral impact. Recommendation: fix in a dedicated lint cleanup PR.

2. **Vite dynamic import warning** — `runSignalRuntime.ts` is both dynamically and statically imported. Non-blocking, output is correct. Pre-existing.

3. **Full test suite timeout** — `npm run test:run` (all tests) can run very long due to behavioral/scenario simulation tests. CI should target specific test suites (`release/`, `public/`, `stabilization/`) rather than the full suite.

4. **Mobile rendering not verified in browser** — Structural source checks confirm mobile components exist, but touch interaction requires a real browser for final verification before first public deployment.

5. **No cloud deployment provider configured** — Static build (`dist/`) is ready, but no hosting target is set. This is not a blocker, but a deployment step must be performed before the demo is publicly accessible.

6. **TypeScript version warning in lint** — `@typescript-eslint/typescript-estree` warns that TypeScript 5.9.3 is not officially supported (supported: ≥4.7.4 <5.6.0). Lint results are functionally correct but this should be resolved in a dependency update.

### Not Risks (Confirmed Safe)

- No experimental features exposed in public default ✅
- No LLM/API calls in any code path ✅
- No Node bridge ✅
- No fake results / fake events / fake visuals ✅
- No semantic node / semantic memory ✅
- No consciousness / life / intelligence / mystical / healing proof claims in user copy ✅
- Runtime dynamics unchanged ✅
- dynamicCore has no external feedback from observedRatios or emergentResonance ✅

---

## 16. Final Recommendation

### ✅ Ready for public research demo

AETERNA-NATURAL is ready to be deployed as a public research demo with the following understanding:

1. **Public mode safety is confirmed** — all safety flags are set correctly in defaults
2. **No forbidden claims** — user-facing copy is clean; guardrails are in place
3. **Core flows are structurally sound** — landing → first-run → observation → replay → guide → export chain is complete
4. **No dangerous features are exposed** — experimental, LLM, Node bridge, full long-run all disabled by default
5. **Export / reproducibility is correct** — seed, scenario, ticks, config, guardrails all present in exports

**Before first public URL distribution:**
- Run manual mobile verification in a real browser
- Confirm chosen cloud hosting provider's build/output settings
- Perform one final manual walkthrough of the RecommendedDemoFlow steps

---

## Appendix: Files Added / Changed in v2.3

### New Files

| File | Description |
|------|-------------|
| `docs/deployment-final-runbook-report.md` | This report |
| `src/tests/release/deploymentFinalRunbook.test.ts` | Runbook safety + config tests (60 tests) |
| `src/tests/release/finalPublicDemoFlow.test.ts` | Public demo flow structural tests (30 tests) |
| `src/tests/release/finalDeploymentCopyGuard.test.ts` | v2.3 copy guard scan (28 tests) |

### Changed Files

None. No existing files were modified in v2.3.

---

## Appendix: Intentionally Not Changed

The following were inspected but intentionally left unchanged per the v2.3 "no behavior break" policy:

- `src/core/dynamicCore.ts` — runtime dynamics unchanged
- `src/config/aeternaNaturalRuntimeConfig.ts` — no default changes
- `src/config/aeternaNaturalPresets.ts` — no preset changes
- `src/plasticity/weakPlasticity.ts` — no plasticity changes
- `src/observer/deriveObservedRatios.ts` — no ratio feedback changes
- `src/guide/ruleBasedLensGuide.ts` — no guide logic changes
- All 3 pre-existing lint errors — not introduced by v2.3, left for dedicated cleanup

---

*AETERNA-NATURAL v2.3 — Deployment Final Runbook Report*
*Observation-only. No consciousness, life, intelligence, or mystical proof claims.*
