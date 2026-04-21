# Need / Motivation Principles

AETERNA v0.5 / A4: Need / Motivation Split

## Purpose

This document explains the separation of **need** and **motivation** in AETERNA's organism state.

## Core Distinction

### Need

**Definition**: Deficiency / maintenance / recovery pressure

**Sources**:
- Energy depletion
- Boundary integrity loss
- Overload damage
- Safety threats
- Unmet homeostatic requirements

**Characteristics**:
- Arises from *lack* or *damage*
- Reflects organism vulnerability
- Is reactive to deficiency states
- Does NOT directly produce behavior
- Can be high while organism is quiescent

**Examples**:
- `energyNeed`: high when energyReserve is low, fatigue is high
- `safetyNeed`: high when overload threatens boundary integrity
- `restorationNeed`: high when recovery conditions are present but not yet achieved
- `contactNeed`: high when touch absence is prolonged (optional)

### Motivation

**Definition**: Directional tendency toward action or foreground formation

**Sources**:
- Arousal / awareness state
- Replay traces and consolidation
- History-dependent biases
- Openness and salience
- Recent dynamics

**Characteristics**:
- Arises from *readiness* and *conditions*
- Reflects directional pull
- Is NOT a simple transformation of need
- Does NOT guarantee action
- Can be high with low need

**Examples**:
- `noveltyMotivation`: tendency toward new/unfamiliar (moderate arousal + awareness + salience)
- `repetitionMotivation`: tendency toward familiar patterns (replay activity + coherence)
- `explorationMotivation`: tendency to probe/engage (openness + moderate novelty + not-too-high safetyNeed)
- `settlingMotivation`: tendency toward rest/consolidation (restoration readiness + coherence)
- `withdrawMotivation`: tendency to pull back/protect (safety need + overload + boundary threat)

## Independence

**Critical principle**: Need and motivation are INDEPENDENT.

### High Need ≠ High Motivation

Example: High `energyNeed` with low `explorationMotivation`

- Organism is depleted (high energyNeed)
- But arousal and awareness are low
- No exploration tendency despite need

This is **valid** and **expected**.

### High Motivation ≠ High Need

Example: Moderate `noveltyMotivation` with low `energyNeed`

- Organism is well-rested (low energyNeed)
- But arousal, awareness, and salience are favorable
- Exploration tendency without need pressure

This is **valid** and **expected**.

### Competing Motivations

Multiple motivations can be present simultaneously:

- High `noveltyMotivation` + high `repetitionMotivation`: organism in mixed state
- High `explorationMotivation` + high `settlingMotivation`: organism between states

This is **valid** and reflects the complexity of internal state.

## What This Is NOT

### Not Human Desire

This is NOT a model of human wants, wishes, goals, or intentions.

- No "I want X"
- No goal planning
- No conscious decision-making
- No narrative self-explanation

### Not Action Determination

Need and motivation do NOT directly decide actions.

- They influence **bias** in organism core
- They modulate **candidate weights** weakly
- They do NOT override dynamics
- They do NOT create mode switches

### Not Anthropomorphic States

Labels like "novelty" and "safety" are descriptive, not psychological.

- `noveltyMotivation` is NOT curiosity
- `safetyNeed` is NOT fear
- `explorationMotivation` is NOT intention
- These are primitive-organism-level directional tendencies

## Derivation

### Need Derivation

Needs are derived primarily from **felt-state** and **homeostatic state**:

- `energyNeed` ← `depletion` + `energyReserve` + `fatigue`
- `safetyNeed` ← `overload` + `boundaryIntegrity` + `perturbationLoad` + `instability`
- `restorationNeed` ← `restorationReadiness` × (unrecovered state indicators)
- `contactNeed` ← `touchNeedBaseline` + absence drift + low engagement (optional)

### Motivation Derivation

Motivations are derived from **arousal/awareness**, **replay state**, **history**, and **openness**:

- `noveltyMotivation` ← moderate `arousalLevel` + `awarenessWindow` + `salienceOpenness` + unresolved perturbation - high overload penalty
- `repetitionMotivation` ← `recentReplaySalience` + `restConsolidationDepth` + `coherence` + `settlingWindow`
- `explorationMotivation` ← `openness` + `noveltyMotivation` + moderate arousal - `safetyNeed` penalty
- `settlingMotivation` ← `restorationReadiness` + `coherence` + `settlingWindow` + `restDepth`
- `withdrawMotivation` ← `safetyNeed` + `overload` + boundary threat + harsh interaction

**Key**: Motivation derivation includes need inputs but is NOT a simple mapping.

## Integration Points

### Weak Modulation to Organism Core

Need/motivation can weakly influence organism bias:

- High `safetyNeed` → slight withdraw bias
- High `restorationNeed` → slight restoration bias increase
- High `noveltyMotivation` → slight novelty sensitivity increase
- High `repetitionMotivation` → slight familiar pattern openness increase

**Important**:
- Bias changes are SMALL
- No mode switches
- No strong action forcing
- Just gentle directional nudges

### Connection to Self-Origin Candidates

If Phase 7 self-origin evidence system is present:

- `explorationMotivation` → slight increase in spontaneous orient pulse probability
- `settlingMotivation` → slight increase in spontaneous settling bias
- `withdrawMotivation` → slight increase in protective dampening candidates

**Important**:
- Does NOT演出 "wanting to do something"
- Only adjusts candidate weights
- Remains subtle

## Observable Differences

### In Scenarios

Need/motivation separation should be visible across scenarios:

- **Scenario AT**: High `energyNeed`, low `explorationMotivation` (depleted quiet)
- **Scenario AU**: High `safetyNeed`, high `withdrawMotivation` (overload withdrawal)
- **Scenario AV**: Elevated `repetitionMotivation` (repeated pattern)
- **Scenario AW**: Moderate `explorationMotivation` (moderate arousal + openness)
- **Scenario AX**: `restorationNeed` and `settlingMotivation` relationship (recovery)

### In Metrics

Observer should show need and motivation as separate columns:

```
energyNeed:          0.45
safetyNeed:          0.20
noveltyMotivation:   0.35
explorationMotivation: 0.28
```

This demonstrates independence.

## What Was NOT Changed

### Organism Core

- No mode system redesign
- No action planner added
- No full agency system
- Existing dynamics remain

### Intentional Systems

- No goal system
- No planning system
- No minimal self deepening (that's B群)
- No relational self expansion

### UI / Presentation

- No narrative generation
- No anthropomorphic labels in runtime
- No演出 of "wanting"

## Future Extensions (Not This Phase)

Potential future work (B群 or later):

- Predictive self deepening
- Explicit goal candidates
- Minimal self integration
- Relational dynamics expansion
- Agency full implementation

But for A4, we only split need and motivation as independent continuous quantities.

## Testing Need/Motivation Separation

Key test criteria:

1. Both need and motivation produce finite values (no NaN)
2. Need responds to deficiency (high depletion → high energyNeed)
3. Motivation responds to conditions (moderate arousal + awareness → moderate noveltyMotivation)
4. Need and motivation can vary independently (high need + low motivation, or vice versa)
5. Multiple motivations can compete (novelty + repetition both present)
6. No behavior break (existing scenarios still pass)

## Summary

**Need**: Deficiency / damage pressure
**Motivation**: Directional behavioral tendency
**Independence**: They are NOT coupled
**Purpose**: Enable more nuanced internal state without adding intentional goal system yet

This is a foundation for future agency development, not agency itself.
