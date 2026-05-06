# First Release Notes

AETERNA-NATURAL v1.4 — First Release Polish

---

## 1. Current status

AETERNA-NATURAL v1.4 is a research prototype. It is the first public release of the torus field observation lab.

Status: **Research prototype — not production software.**

This release is suitable for:
- Field dynamics observation
- Reproducible scenario runs
- Preset comparison experiments
- Export for research documentation

It is NOT suitable for:
- Production deployment
- Clinical or therapeutic use
- Claims about consciousness, life, or intelligence

---

## 2. What is stable

The following components are stable in v1.4:

- **Core dynamics** (`dynamicCore.ts`) — torus field, dissipation, trace, extinction risk
- **Geometry layer** — torus metric, curvature, curvature-vortex correlation
- **Complex field layer** — phase coherence, vortex candidate detection
- **Membrane layer** — two-sidedness, integrity
- **Weak plasticity trace** — accumulation, saturation risk (observation only)
- **Observed ratios** — ratio match strength, resonance proxy (observer-side only)
- **Long-run comparison suite** — reproducible preset variant comparison
- **7 runtime presets** — safeBaseline through fullNaturalExperimental
- **10 research scenarios** — quietBaseline through longRunNaturalComparison
- **14 preset experiments** — E01 through E14
- **Export** — JSON and Markdown with full reproducibility metadata
- **Public Research Mode config** — conservative defaults

---

## 3. What is experimental

The following are experimental and gated in public mode:

- `fieldRuntimeMode=complexRuntime` — full complex-field runtime feedback
- `weakPlasticityMode=resistanceOnly` — resistance-only plasticity (requires clamp)
- `externalConstantsMode=legacy` — legacy external constants (comparison only)
- `safetyMode=experimental` — experimental preset mode
- Advanced panels and raw diagnostics

These require explicit researcher confirmation before use.

---

## 4. Known limitations

- The torus simulation is a mathematical field model, not a biological simulation
- Vortex candidates are geometric phase defects, not biological neurons
- Weak plasticity traces do not encode meaning or memory
- Observed ratios are observational — they are not fed back into dynamics
- Long-run runs may show saturation risk — this is a known dynamics property, not a bug
- NaN / Infinity counts must be monitored; non-zero counts require investigation

---

## 5. What not to claim

**Do NOT claim any of the following based on this system:**

- That AETERNA has consciousness or awareness
- That the field has feelings, desires, or intentions
- That vortex candidates are neurons, minds, or proto-minds
- That plasticity traces are memory or learning
- That ratio matches are proof of resonance or communication
- That the system proves or disproves consciousness, life, or intelligence
- That AETERNA is healing, therapeutic, or mystically significant

These claims are not supported by the observations and violate the research integrity principles of this project.

---

## 6. Recommended first observations

1. Open AETERNA-NATURAL
2. Read the First Run Guide (5 steps)
3. Select **safeBaseline** preset
4. Run **Quiet Baseline** scenario (seed=1000, ticks=2000)
5. Open **Overview** panel — read flow continuity, energy throughput, extinction risk
6. Confirm `semanticLeakCount = 0` and `nanOrInfinityCount = 0`
7. Export as Markdown with seed / config / scenario / ticks
8. (Optional) Run **Single Pulse Return** and compare to baseline

---

## 7. Next development phases

Planned for future versions (not yet implemented):

- **v1.5**: App Packaging / Deployment Readiness ✅ 完了 (2026-05-06)
  - ReleaseEnvironmentConfig, validateReleaseSafety, release check script
  - AppErrorBoundary, FallbackScreen, SafeResetButton
  - PublicBuildInfo, deployment docs, manual release checklist
- **v1.6–v2.0**: Super Observation Architecture → Observation UX Final Polish ✅ 完了 (2026-05-06)
  - Super Observation Architecture (v1.6): CellObservation, MetricLensRegistry (17 lenses)
  - Deep Inspector / Time Replay (v1.7): TimeReplayBuffer, CellInspectorPanel, ReplaySlider
  - Causal Trace / Layer Correlation (v1.8): CausalTracePanel, LayerCorrelationPanel, DifferenceViewPanel
  - Lens-aware AI Guide (v1.9): LensAwareGuidePanel, ruleBasedLensGuide, guardLensGuideResponse
  - Observation UX Final Polish (v2.0): ObservationWorkspace, ObservationHeader, ObservationMobileTabs
- **v2.1**: Final QA / Release Audit ✅ 完了 (2026-05-06)
  - Public mode safety audit (all dangerous flags confirmed off)
  - Runtime dynamics non-change confirmed
  - Super Observation flow confirmed end-to-end
  - Forbidden claim audit across all UI / guide / export / docs
  - final-release-audit.md created
  - finalCopyGuard / finalPublicModeSafety / finalSuperObservationFlow / finalReleaseAudit tests added
- **v2.2**: Public Demo Polish / Landing Copy (next)
- **v3.x**: Reafference comparison and actuation pulse observation

All future phases will maintain the core principles:
- No consciousness / life / intelligence / mystical claims
- No Node bridge, LLM, or API integration
- No fake results, fake events, or fake visuals
- Observation only — not proof
