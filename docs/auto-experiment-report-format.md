# Auto Experiment Report Format

This document defines a readable report format for automated AETERNA experiment runs.

The report should not only list metrics.
It should translate observations into an intuitive human-readable form while keeping facts, impressions, possibilities, and unknowns separate.

---

## Required sections

Every auto experiment report should use this order:

```text
Observed facts
→ In one sentence
→ How it appears
→ Possibility
→ Still unknown
```

This structure is intentionally simple.
It lets a reader move from data to intuition without turning interpretation into certainty.

---

## 1. Observed facts

Use this section for values, events, and measurable state changes.

Examples:

```text
- averageClosureStability increased after the perturbation window.
- maxFeedbackSaturationRisk stayed below the configured caution threshold.
- closureFailureCount was lower than in the no-return comparison.
- nanOrInfinityCount was 0.
- semanticLeakCount was 0.
```

Rules:

- Record what happened.
- Include seed, ticks, scenario, and config when available.
- Do not add invented speech.
- Do not convert a metric directly into a final meaning claim.

---

## 2. In one sentence

Use this section as the intuitive translation.

It should be short enough for a non-specialist to understand.

Examples:

```text
The field was disturbed, but it did not remain collapsed; it moved back toward a stable loop.
```

```text
The return signal was weak, and the loop struggled to keep its shape.
```

```text
Repeated pulses created a rhythm-like return pattern without forcing a fixed target state.
```

This is the replacement for a vague "therefore" section.
It should feel like a clear bridge between measured facts and human intuition.

---

## 3. How it appears

Use this section for observer-side appearance.

Examples:

```text
From the observer side, the field looked as if it was searching for a stable shape after disturbance.
```

```text
The movement appeared closure-like because return, delay, and stability changed together.
```

Rules:

- Appearance language is allowed.
- Mark it as observer-side.
- Do not present appearance as final inner reality.

---

## 4. Possibility

Use this section for interpretation candidates.

Examples:

```text
This condition may support recovery-like closed-loop behavior under moderate perturbation.
```

```text
This run suggests that delayed return can weaken loop stability unless boundary integrity remains high.
```

```text
The pattern may be a candidate for recurrence-supported boundary maintenance.
```

Rules:

- Use possibility language.
- Prefer physical relationships: flow, return, boundary, delay, trace, recurrence, saturation, dissipation.
- Do not optimize future runs only to make this interpretation appear.

---

## 5. Still unknown

Use this section to keep uncertainty visible.

Examples:

```text
- It is not yet known whether this pattern holds across a seed ensemble.
- It is not yet known whether a null model produces the same result.
- It is not yet known whether the pattern persists at longer tick counts.
- It is not yet known whether the same behavior appears under weaker coupling.
```

Rules:

- Unknowns are part of the result.
- A good report should preserve uncertainty rather than hide it.
- Failure, flat results, and null results are valid observations.

---

## Optional section: Aeterna actual output

Include this section only if Aeterna actually emitted text, signal, or another explicit expression.

```text
Aeterna actual output:
<exact emitted output>
```

Do not generate first-person language on Aeterna's behalf.
If the runtime emitted no language, omit this section.

---

## Example report card

```md
## Observed facts
- scenario: W8-E-repeated-self-pulse
- ticks: 200
- pulseInterval: 3
- averageClosureStability stayed above the comparison baseline after warmup.
- closureFailureCount stayed low.
- maxFeedbackSaturationRisk did not enter the caution range.
- nanOrInfinityCount was 0.

## In one sentence
The field was repeatedly touched by its own pulse and kept finding a stable return pattern.

## How it appears
From the observer side, the movement looked like a loop that could be disturbed and then re-gather itself.

## Possibility
This condition may support recovery-like closed-loop behavior when repeated pulse timing and medium stability align.

## Still unknown
- It is not yet known whether the same tendency holds across many seeds.
- It is not yet known whether a no-pulse null model produces a similar pattern.
- It is not yet known whether longer runs reveal saturation or collapse.
```

---

## Scoring note

Automated scoring should not maximize a single impressive-looking candidate metric.

Prefer multi-axis ranking:

```text
valid run
+ physical integrity
+ low numeric failure
+ low runaway saturation
+ non-trivial recovery or closure tendency
+ reproducibility across seed ensemble
+ clear difference from null comparison
```

Do not rank by a single consciousness-like or life-like appearance score.
Do not tune the runtime backward from a desired story.
