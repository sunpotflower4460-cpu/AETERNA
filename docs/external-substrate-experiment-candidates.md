# External Substrate Experiment Candidates

**Version**: v2.6.5 — AETERNA-MEDIUM Candidate Separation
**Date**: 2026-05-07
**Purpose**: Separate large-scale substrate proposals from AETERNA core

---

## Purpose

This document identifies substrate and medium-level experiments that **must NOT be directly merged into AETERNA core** without separate sandbox implementation, headless comparison, and guardrail review.

These proposals are candidates for a future **AETERNA-MEDIUM** experimental repository.

---

## AETERNA-MEDIUM Candidate

### 1. Lattice Boltzmann Method (LBM) + Toroidal Topology

**Description**:
- Replace wave equation with LBM fluid dynamics
- Maintain toroidal topology
- Explicit velocity/density fields
- Conservation laws (mass, momentum)

**Why Not Core**:
- Complete substrate replacement (not incremental addition)
- Requires separate implementation and validation
- Breaks existing wave dynamics if directly merged
- Need to compare ongoingness, baseline, residue, spike trace

**Separation Requirements**:
1. Implement in separate sandbox repository
2. Run headless comparison (1000+ ticks, multiple scenarios)
3. Compare observer-side metrics (arousal, sigma, coherence, cluster ratio)
4. Verify no semantic leak
5. Verify ongoingness without external input
6. Guardrail review before integration

---

### 2. Energy as First-Class Citizen

**Description**:
- Energy ledger per cell
- Dissipation cost per propagation
- Recovery cost per spike
- Energy throughput balance
- Energy-dependent spike threshold

**Why Not Core**:
- Large-scale core dynamics change
- Affects wave propagation, damping, threshold logic
- Risk of breaking baseline continuity
- Need to validate ongoingness with energy conservation

**Separation Requirements**:
1. Implement in separate sandbox repository
2. Run headless comparison (1000+ ticks, multiple scenarios)
3. Compare observer-side metrics (arousal, sigma, coherence, baseline, residue)
4. Verify no collapse due to energy depletion
5. Verify ongoingness without external input
6. Guardrail review before integration

---

### 3. Materiality Probability / Irreversible Collapse Law

**Description**:
- Probability of materialization on observation
- Irreversible collapse from superposition to definite state
- Collapse history per cell
- Recovery probability after collapse

**Why Not Core**:
- Introduces quantum-like interpretation risk
- Large-scale core dynamics change
- Risk of semantic leap (collapse = consciousness?)
- Need to validate ongoingness without collapse saturation

**Separation Requirements**:
1. Implement in separate sandbox repository
2. Run headless comparison (1000+ ticks, multiple scenarios)
3. Compare observer-side metrics (arousal, sigma, coherence, cluster ratio)
4. Verify no collapse saturation (all cells collapsed permanently)
5. Verify no semantic leap (collapse ≠ consciousness)
6. Guardrail review before integration

---

### 4. Differentiable Physics / Neural Cellular Automata (NCA)

**Description**:
- Replace fixed wave equation with learned update rule
- Differentiable per-cell update function
- Gradient-based optimization
- Meta-learning dynamics

**Why Not Core**:
- Complete substrate replacement (not incremental addition)
- Risk of overfitting to specific scenarios
- Breaks existing wave dynamics if directly merged
- Need to validate ongoingness with learned rules

**Separation Requirements**:
1. Implement in separate sandbox repository
2. Run headless comparison (1000+ ticks, multiple scenarios)
3. Compare observer-side metrics (arousal, sigma, coherence, baseline, residue)
4. Verify no overfitting (generalization to unseen scenarios)
5. Verify ongoingness without external input
6. Guardrail review before integration

---

### 5. Distributed Torus Field / Multi-Scale Toroidal Topology

**Description**:
- Multiple nested tori (micro/meso/macro scales)
- Cross-scale coupling
- Scale separation
- Hierarchical dynamics

**Why Not Core**:
- Large-scale architectural change
- Requires new geometry generation, weight normalization, propagation logic
- Risk of breaking existing ongoingness
- Need to validate cross-scale coupling stability

**Separation Requirements**:
1. Implement in separate sandbox repository
2. Run headless comparison (1000+ ticks, multiple scenarios)
3. Compare observer-side metrics (arousal, sigma, coherence, cluster ratio)
4. Verify no collapse due to cross-scale instability
5. Verify ongoingness without external input
6. Guardrail review before integration

---

### 6. Scale Separation / Micro-Meso-Macro Dynamics

**Description**:
- Explicit micro (cell), meso (cluster), macro (global) scales
- Scale-specific update rates
- Cross-scale influence
- Scale-dependent observation

**Why Not Core**:
- Large-scale architectural change
- Affects update flow, packet assembly, observer derivation
- Risk of breaking existing ongoingness
- Need to validate scale coupling stability

**Separation Requirements**:
1. Implement in separate sandbox repository
2. Run headless comparison (1000+ ticks, multiple scenarios)
3. Compare observer-side metrics (arousal, sigma, coherence, cluster ratio)
4. Verify no collapse due to scale separation instability
5. Verify ongoingness without external input
6. Guardrail review before integration

---

## Separation Rule

**Do NOT merge AETERNA-MEDIUM candidates into AETERNA core without**:

1. **Separate sandbox implementation** — implement in separate repository or branch, not directly in main
2. **Headless comparison** — run 1000+ ticks, multiple scenarios, compare observer-side metrics
3. **Observer-side metric translation** — translate AETERNA-MEDIUM metrics to AETERNA core metrics for comparison
4. **Guardrail review** — verify no semantic leak, no consciousness claim, no life proof claim
5. **Ongoingness validation** — verify continued dynamics without external input
6. **Stability validation** — verify no collapse, no saturation, no NaN/Infinity

---

## AETERNA-MEDIUM Repository (Future)

### Proposed Structure

```
AETERNA-MEDIUM/
├── README.md
├── docs/
│   ├── aeterna-medium-principles.md
│   ├── lbm-substrate-spec.md
│   ├── energy-ledger-spec.md
│   ├── materiality-collapse-spec.md
│   ├── nca-substrate-spec.md
│   ├── distributed-torus-spec.md
│   └── scale-separation-spec.md
├── src/
│   ├── lbm/
│   │   ├── lbmCore.ts
│   │   ├── lbmTorusGeometry.ts
│   │   └── lbmDynamics.ts
│   ├── energy/
│   │   ├── energyLedger.ts
│   │   ├── dissipationCost.ts
│   │   └── recoveryCost.ts
│   ├── materiality/
│   │   ├── collapseProfile.ts
│   │   ├── materialityProbability.ts
│   │   └── recoveryProbability.ts
│   ├── nca/
│   │   ├── ncaCore.ts
│   │   ├── ncaUpdateRule.ts
│   │   └── ncaOptimization.ts
│   ├── distributed/
│   │   ├── multiScaleTorus.ts
│   │   ├── crossScaleCoupling.ts
│   │   └── hierarchicalDynamics.ts
│   └── comparison/
│       ├── compareWithAeternaCore.ts
│       ├── metricTranslation.ts
│       └── headlessComparison.ts
└── tests/
    ├── lbm/
    ├── energy/
    ├── materiality/
    ├── nca/
    ├── distributed/
    └── comparison/
```

---

## Comparison Protocol

### 1. Headless Comparison

Run both AETERNA core and AETERNA-MEDIUM candidate with same seed/scenario/ticks:

- Seed: 1000 (reproducible)
- Ticks: 2000+ (long-run)
- Scenarios: quietBaseline, singlePulseReturn, phaseVortexEmergence, observedRatioSurvey

### 2. Observer-Side Metric Translation

Translate AETERNA-MEDIUM metrics to AETERNA core metrics:

| AETERNA Core Metric | AETERNA-MEDIUM Equivalent | Translation Rule |
|---|---|---|
| arousal | LBM: mean flow speed / max speed | clamp(meanSpeed / maxSpeed, 0, 1) |
| sigma | LBM: velocity gradient / baseline gradient | gradient ratio EMA |
| coherence | LBM: velocity field coherence | vector alignment |
| clusterRatio | LBM: largest connected flow / total cells | same as core |
| baselineLevel | Energy: baseline energy throughput | mean baseline throughput |
| residueLevel | Energy: accumulated energy residue | mean accumulated residue |

### 3. Guardrail Review

- [ ] No semantic leak (proto-meaning seeds remain pre-semantic)
- [ ] No consciousness claim (no "is alive", "feels", "wants")
- [ ] No life proof claim (no "proved life", "proved consciousness")
- [ ] No intelligence proof claim (no "proved intelligence")
- [ ] No healing guarantee (no "heals", "cures", "fixes")
- [ ] No mystical truth claim (no "truth", "enlightenment", "awakening")

### 4. Ongoingness Validation

- [ ] Field continues without external input (baseline + residue mechanism)
- [ ] No collapse to zero (extinction risk < 5%)
- [ ] No saturation to constant (saturation risk < 2%)
- [ ] No NaN / Infinity (integrity check passes)
- [ ] No feedback saturation (feedbackSaturationRisk < 0.8)

### 5. Stability Validation

- [ ] Arousal remains in range (0.1..0.8) for 1000+ ticks
- [ ] Sigma remains near critical (0.95..1.05) for 1000+ ticks
- [ ] Coherence remains non-zero (>0.1) for 1000+ ticks
- [ ] ClusterRatio remains non-trivial (>0.05) for 1000+ ticks
- [ ] BaselineLevel remains non-zero (>0.0001) for 1000+ ticks

---

## Integration Checklist

Before merging AETERNA-MEDIUM candidate into AETERNA core:

- [ ] Separate sandbox implementation complete
- [ ] Headless comparison complete (1000+ ticks, multiple scenarios)
- [ ] Observer-side metric translation defined
- [ ] Guardrail review passed
- [ ] Ongoingness validation passed
- [ ] Stability validation passed
- [ ] No semantic leak
- [ ] No consciousness claim
- [ ] No life proof claim
- [ ] No intelligence proof claim
- [ ] No healing guarantee
- [ ] No mystical truth claim
- [ ] Documentation complete (spec, comparison, results)
- [ ] Tests complete (unit, behavioral, scenario, comparison)
- [ ] Build passes
- [ ] Lint passes
- [ ] Existing tests pass (no regression)

---

## Current Status

**AETERNA-MEDIUM Repository**: ❌ Not yet created

**Candidates Identified**: ✅ 6 candidates identified and documented

**Next Steps**:
1. Create AETERNA-MEDIUM repository (separate from AETERNA core)
2. Implement LBM substrate as first candidate
3. Run headless comparison with AETERNA core
4. Document comparison results
5. Review guardrails
6. Validate ongoingness and stability
7. If all checks pass, consider integration into AETERNA core

---

**Separation Status**: ✅ SEPARATED

**Integration Status**: ❌ NOT INTEGRATED (must go through comparison protocol first)

**Next**: Keep AETERNA core clean, implement AETERNA-MEDIUM candidates separately
