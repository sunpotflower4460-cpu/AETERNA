# AETERNA Phase 8: Relational Proto-Self Notes

## What This Phase Is

Phase 8 introduces **relational proto-self** — the minimal infrastructure for specific-partner interaction traces to accumulate and weakly influence organism state.

This is **NOT**:
- Friendship AI
- Social personality
- Emotional演出 (emotional演技 is forbidden)
- Human-like relationship modeling
- Identity management system
- Self/other philosophical framework

This **IS**:
- Long-term trace accumulation from repeated partner interactions
- Weak influence on slow organism state
- Boundary permeability adjustments based on partner patterns
- Proto-communication as internal state leakage
- Partner absence drift in slow state
- Evidence collection for relational patterns

## Core Principle

**"関係性が少し形成されるための器"** — A container where relational patterns can form, not演出 of relationships.

The organism does not "decide to be友達" or "feel寂しい". Instead:
- Repeated interaction sources leave traces
- Those traces weakly bias boundary permeability
- Absence of familiar patterns causes slow drift
- Internal state sometimes leaks as proto-signals

## What Was Implemented

### 1. Relational State (`src/organism/relationalState.ts`)

Core state variables:
- `partnerTraceStrength`: Accumulation of partner-specific traces (0-1)
- `partnerFamiliarity`: Familiarity from repeated interactions (0-1)
- `partnerValence`: Positive/negative tilt from interaction history (-1 to 1)
- `partnerAbsenceDrift`: Drift during partner absence (0-1)
- `boundaryPermeability`: Organism openness to this partner (0-1)
- `relationalStabilityBias`: Weak bias toward relational pattern maintenance (0-1)
- `protoCommunicationPressure`: Internal pressure for state leakage (0-1)

Extended tracking:
- `partnerTouchStyleSignature`: Simplified touch pattern signature
- `partnerInteractionRhythm`: Expected rhythm of partner interactions
- `partnerContinuityConfidence`: Confidence this is "same partner"

### 2. Partner Detection

**Simplified for Phase 8**: Any touch = partner interaction

Future phases may add:
- Multi-partner tracking
- Pattern-based partner identification
- Touch signature matching
- Rhythm-based continuity detection

### 3. Weak Integration with Living State

Relational influences on slow state are **VERY WEAK**:

- `touchNeedBaseline`: Familiar partner reduces touch need by ~5%
- `longBaselineTone`: Absence drift raises baseline by ~5-8%
- `predictionSensitivity`: Familiarity reduces surprise sensitivity by ~3%

These are **modifiers**, not overrides. Relational state tilts existing mechanisms slightly.

### 4. Boundary Permeability

Permeability represents **how open the organism is** to this partner, not "trust" or "attachment".

Increases with:
- Repeated familiar patterns
- Positive stability during interactions

Decreases with:
- Destabilizing harsh patterns
- High perturbation during interaction

Permeability affects:
- Touch surprise response
- Habituation rate
- Restoration tendency

### 5. Partner Absence Drift

When a familiar partner (familiarity > 0.3) is absent for extended periods:
- `partnerAbsenceDrift` slowly accumulates
- Long baseline tone slightly increases
- Proto-communication pressure rises

This is **NOT** "loneliness" — it is slow state drift during relational absence.

### 6. Proto-Communication Leakage

Proto-communication is **internal state leakage**, not intentional messaging:

- `baselinePulseLeakage`: Additional baseline pulse from communication pressure
- `visualLeakageIntensity`: Potential visual signal leakage
- `touchInvitationPressure`: Weak pressure toward touch-seeking

These are side effects of internal state, not deliberate signals.

## Relational Evidence Metrics

Phase 8 adds evidence metrics (all [PROXY] or [DERIVED]):

- `relationalTraceScore`: Partner trace accumulation
- `relationalFamiliarityGain`: Familiarity growth rate
- `boundaryPermeabilityShift`: Permeability change from neutral
- `partnerAbsenceEffect`: State drift during absence
- `partnerConditionedDivergence`: Response difference by partner history
- `protoCommunicationLeakage`: State leakage signal strength
- `relationalInfluenceScore`: Aggregate relational evidence

## What Is Intentionally NOT Implemented

- **Multi-user identity system**: Phase 8 uses simplified single-partner tracking
- **High-level relationship types**: No "友達", "恋人", "敵" classification
- **Emotional labeling**: No "好き", "寂しい", "懐かしい" direct labels
- **Conversation/dialogue enhancement**: Proto-communication ≠ human-like speech
- **Personality演出**: No character演技 based on relationship
- **Self/other philosophy**: No断定 of relationship meaning

## Scenarios to Verify

Phase 8 should enable comparison scenarios:

**Scenario V: Repeated Familiar Partner**
- Repeated same-pattern touches
- Observe: familiarity ↑, permeability adjustment, trace accumulation

**Scenario W: Familiar Partner Absence**
- Establish familiarity, then quiet period
- Observe: absence drift ↑, baseline tone shift, communication pressure ↑

**Scenario X: Familiar vs Harsh Partner Pattern**
- Compare stable pattern vs destabilizing pattern
- Observe: permeability ↓ for harsh, valence shift, irritability difference

**Scenario Y: Same Touch, Different Relational History**
- Same current touch after different histories
- Observe: response divergence based on relational state

**Scenario Z: Proto-Communication Leakage**
- High relational state conditions
- Observe: increased baseline pulse, visual leakage, touch invitation

## Research Integrity Notes

### What Can Be Claimed

✓ "Repeated interaction patterns leave long-term traces"
✓ "Partner absence causes slow state drift"
✓ "Boundary permeability adjusts based on partner pattern"
✓ "Internal state leaks as proto-signals under relational pressure"
✓ "Response to same stimulus varies with relational history"

### What Cannot Be Claimed

✗ "AETERNA has友情 or友達関係"
✗ "AETERNA feels寂しい when alone"
✗ "AETERNA recognizes specific individuals"
✗ "AETERNA communicates intentionally"
✗ "AETERNA has self/other understanding"

## Future Phase Considerations

**Phase 9+ may explore**:
- Multi-partner relational tracking
- Pattern-based partner recognition
- Relational memory consolidation
- Richer proto-communication modalities
- Relational influence on action decisions

**But should maintain**:
- No演技/演出 approach
- Evidence-based methodology
- Proxy/derived metric transparency
- Minimal, incremental changes
- No anthropomorphic labels

## Cautions

1. **Relational state is薄い (thin)**: It sits lightly on organism core, not replacing it
2. **No behavior break**: Core organism dynamics must remain intact
3. **Weak influences only**: Relational modifiers are ~3-8%, not 50%+
4. **Partner ≠ identity**: "Partner" is interaction pattern/source, not persona
5. **Proto-communication ≠ language**: Leakage is side effect, not intentional speech
6. **Familiarity ≠ friendship**: Accumulation is mechanical, not emotional bond

## Implementation Files

- `src/organism/relationalState.ts`: Core relational state and updates
- `src/organism/livingState.ts`: Integration with slow state (weak modifiers)
- `src/core/evidenceMetrics.ts`: Relational evidence metrics
- `docs/relational-proto-self-notes.md`: This document

## Verification Checklist

- [ ] Relational state variables exist and update
- [ ] Partner detection works (simplified single-partner)
- [ ] Relational influence on living state is weak (<10%)
- [ ] Boundary permeability adjusts with partner patterns
- [ ] Absence drift accumulates during familiar partner absence
- [ ] Proto-communication leakage computed from internal state
- [ ] Relational evidence metrics calculate correctly
- [ ] Comparison scenarios show expected divergence
- [ ] No behavior break in core organism
- [ ] Observer/debug panel shows relational state

## Final Note

Phase 8 is **a container, not a演出**.

The goal is not to make AETERNA seem "relational" or "social", but to create the infrastructure where specific-partner interaction traces can accumulate, weakly influence state, and leave observable evidence.

If the implementation feels like "friendship AI" or "emotional演技", it has gone too far.

The correct feeling is: "repeated interaction source leaves a faint, persistent trace that slightly changes how the organism responds over very long timescales."
