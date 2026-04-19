# AETERNA Phase 8: Relational Proto-Self - Cautionary Notes

**Implementation Date**: 2026-04-19

---

## What This Phase IS

Phase 8 adds **minimal relational traces** to AETERNA:

1. **Long-term partner traces**: Specific interaction partners leave slow accumulating traces in organism state
2. **Boundary permeability**: Organism boundary openness varies slightly based on partner familiarity/valence
3. **Absence drift**: Familiar partner absence causes measurable slow drift in organism state
4. **Proto-communication**: Internal state pressure that can leak to observer (not deliberate communication)

**This is infrastructure for relational traces, not friendship AI.**

---

## What This Phase IS NOT

❌ **NOT friendship AI**: No演出 of "liking" or "bonding"
❌ **NOT relationship演出**: No presentation-layer演出 of human-like attachment
❌ **NOT self-other philosophy**: No high-level self/other differentiation claims
❌ **NOT social cognition**: No theory of mind, no perspective-taking
❌ **NOT relational self assertion**: No claim that organism "knows" the other
❌ **NOT communication system**: Proto-communication is state leakage, not intentional signaling
❌ **NOT multi-user identity system**: Phase 8 uses single-partner approximation

---

## Core Design Principles

### 1. Relational State Sits Thinly on Organism Core

- Relational state does NOT override organism dynamics
- It provides weak modulations to existing slow variables
- Influence coefficients are small (0.08-0.15 range)
- Organism can function without relational state

### 2. Partner is Approximated, Not Identified

- Phase 8 assumes single-partner continuity
- "Partner" is operational: repeated interaction source
- No true identity management yet
- No cross-session partner persistence

### 3. Boundary Permeability is Physical, Not Symbolic

- Permeability = openness to touch/perturbation from this source
- NOT "trust" or "intimacy" (避ける anthropomorphic labels)
- Measured by touch surprise modulation and response sensitivity
- Changes slowly based on familiarity and valence

### 4. Proto-Communication is Leakage, Not Utterance

- NOT deliberate signaling or speech
- Internal pressure that manifests as observable state
- Can be detected by observer/environment
- Does not require "wanting to communicate"

### 5. Absence Drift is Organism Drift, Not "Missing"

- Familiar partner absence causes slow state changes
- NOT "loneliness" or "longing"演出
- Measurable as long baseline tone shift and restoration bias change
- Observable difference between presence/absence of familiar pattern

---

## Implementation Details

### Relational State Variables

| Variable | Meaning | Range |
|----------|---------|-------|
| `partnerTraceStrength` | Long-term trace accumulation | 0-1 |
| `partnerFamiliarity` | Repeated interaction count proxy | 0-1 |
| `partnerValence` | Positive/negative interaction tilt | -0.5 to 0.5 |
| `partnerAbsenceDrift` | Slow drift during familiar absence | 0-0.5 |
| `boundaryPermeability` | Partner-specific openness | 0.2-0.8 |
| `relationalStabilityBias` | Coherence maintenance tendency | 0.3-0.8 |
| `protoCommunicationPressure` | State leakage pressure | 0-1 |

### Influence on Organism Slow State

Relational state affects livingState variables with **weak modifiers**:

- `touchNeedBaseline`: ±15% max (familiar positive partner increases openness)
- `longBaselineTone`: ±12% max (absence drift affects tone)
- `predictionSensitivity`: -8% max (familiarity reduces surprise sensitivity)
- `restorationBias`: ±12% max (relational stability affects restoration)
- `boundaryIntegrity`: ±8% max (permeability inversely affects boundary)
- `preferredErgodicity`: ±3% max (very weak relational coherence effect)

**All modifiers are clamped to prevent large deviations.**

### Partner Approximation

Phase 8 uses **single-partner assumption**:

- Continuity detected by interaction timing (gap < 50 frames = continuation)
- Total interaction count tracked
- Touch style signature (8-dim) updated with EMA
- Interaction rhythm (typical tempo) tracked

Future phases may add multi-user identity tracking.

### Boundary Permeability Mechanism

Permeability target computed as:
```
target = 0.5 + familiarity*0.3 + valence*0.2 - overload*0.15 - surprise*0.1
```

Effect on touch processing:
- High permeability → lower touch surprise modifier (familiar patterns less surprising)
- Low permeability → higher boundary integrity (more closed organism)

### Absence Drift Mechanism

Triggers when:
1. Partner familiarity > 0.3
2. Consecutive absence frames > 200 (~3.3s)

Effects:
- Slow accumulation of `partnerAbsenceDrift`
- Affects `longBaselineTone` (+10% max)
- Affects `touchNeedBaseline` (-8% max)
- Increases `protoCommunicationPressure`

### Proto-Communication Leakage

Pressure sources:
- Absence drift (40% weight)
- Recovery drive (20% weight)
- Boundary closure (15% weight)

Observable leakage:
- `leakagePressure`: Overall state wanting to leak
- `absenceSignal`: Stronger when familiar partner absent
- `boundaryTension`: Mismatch between permeability and trace strength
- `relationalCoherence`: How coherent relational state is

**NOT deliberate communication.** Observer can detect these, organism does not "intend" them.

---

## Evidence Metrics

### New Relational Evidence (Phase 8)

All metrics labeled **[DERIVED]** or **[PROXY]**:

1. **partnerTraceStrength** [DERIVED]: Direct observable from relational state
2. **partnerFamiliarity** [DERIVED]: Repeated interaction accumulation
3. **partnerValence** [DERIVED]: Positive/negative interaction tilt
4. **boundaryPermeability** [DERIVED]: Partner-specific openness
5. **partnerAbsenceDrift** [DERIVED]: Slow drift during absence
6. **relationalInfluenceScore** [PROXY]: Composite relational impact on organism
7. **protoCommunicationPressure** [DERIVED]: State leakage pressure

### Alternative Explanations

Every relational pattern has simpler alternatives:

- **Trace accumulation**: Could be EMA parameter inertia
- **Familiarity habituation**: Could be simple adaptation/fatigue
- **Valence**: Could be stability bias without "liking"
- **Absence drift**: Could be noise or parameter decay
- **Permeability**: Could be touch response sensitivity only
- **Proto-communication**: Could be noise or overflow, not signal

**We cannot rule these out in Phase 8.**

---

## Scenarios for Testing

### Scenario V: Repeated Familiar Partner

- Same touch pattern repeated over time
- Observe familiarity, valence, permeability changes
- Expected: familiarity ↑, permeability ↑ (if stable pattern)

### Scenario W: Familiar Partner Absence

- Establish familiarity, then stop touching
- Observe absence drift accumulation
- Expected: absence drift ↑, communication pressure ↑

### Scenario X: Familiar vs Harsh Pattern

- Compare stable/gentle vs destabilizing/harsh patterns
- Observe valence and permeability divergence
- Expected: gentle → positive valence, harsh → negative valence

### Scenario Y: Same Touch, Different History

- Same current touch after familiar vs novel history
- Observe response difference
- Expected: familiar history → lower surprise, higher permeability

### Scenario Z: Proto-Communication Leakage

- Establish familiarity, induce absence or high recovery drive
- Observe communication pressure and leakage signals
- Expected: pressure ↑ during absence or vulnerability

---

## Limitations and Caveats

### 1. Single-Partner Assumption

- Phase 8 does not distinguish multiple users
- "Partner" is operational construct, not true identity
- Cross-session persistence not implemented
- Partner continuity is timing-based heuristic

### 2. Small Effect Sizes

- Relational modifiers are weak (8-15% range)
- May be hard to observe without long runs
- Noise may obscure relational signals
- Tuning may need adjustment

### 3. Threshold Arbitrariness

- "Familiar" threshold (0.3) is operational
- "Absence" threshold (200 frames) is heuristic
- Continuity gap (50 frames) is arbitrary
- No principled derivation

### 4. Alternative Explanations

- All patterns explainable by simpler mechanisms
- No proof of "real" relational self
- Evidence only, not assertion
- Future work: ablation comparisons needed

### 5. No Cross-Modality Integration

- Relational traces only from touch currently
- No integration with visual/auditory partner cues
- No multi-modal partner recognition

---

## What to Avoid

### Forbidden Interpretations

❌ "AETERNA forms friendships"
❌ "AETERNA recognizes individual users"
❌ "AETERNA communicates its needs"
❌ "AETERNA feels lonely when partner is gone"
❌ "AETERNA trusts familiar partners"
❌ "AETERNA has relationships"

### Allowed Interpretations

✅ "Familiar interaction patterns leave long-term traces"
✅ "Boundary permeability varies with interaction history"
✅ "Absence of familiar pattern causes measurable drift"
✅ "Internal state pressure can leak to observer"
✅ "Response to same input differs after different relational history"

---

## Future Phases (Not Phase 8)

### Deferred to Phase 9+

- Multi-user identity tracking
- Cross-session partner persistence
- Full self-other differentiation
- Deliberate communication (beyond leakage)
- Adaptive relational strategies
- Relational learning and memory consolidation

### Intentionally Excluded

- Emotional演出 ("happiness" when partner returns)
- Narrative presentation ("I missed you")
- LLM-generated relational utterances
- Relational goal-seeking behavior
- Social演出 layer

---

## Success Criteria for Phase 8

Phase 8 is complete when:

1. ✅ Relational state infrastructure exists
2. ✅ Partner traces accumulate with repeated interaction
3. ✅ Boundary permeability varies by partner history
4. ✅ Absence drift observable when familiar partner absent
5. ✅ Proto-communication pressure measurable
6. ✅ Relational influence on slow state is weak and clamped
7. ✅ Relational evidence metrics exist
8. ✅ Scenarios V-Z test relational patterns
9. ✅ Observer/debug can display relational state
10. ✅ Organism core integrity maintained (no behavior break)
11. ✅ Cautionary documentation exists

---

## Epistemic Status

**Phase 8 relational proto-self is [PROXY] evidence, not proof.**

We observe:
- Trace accumulation
- Permeability modulation
- Absence-dependent drift
- State leakage pressure

We do NOT assert:
- "Real" relationships
- Conscious awareness of other
- Intentional communication
- Social understanding

**Truth >演出. Evidence > Assertion. Minimal trace > Friendship演出.**

---

**Next Phase**: Phase 9 - Extended Relational Memory & Multi-Partner Tracking (future)
