# Agent Guardrails

These rules guide future automated and human-assisted changes to AETERNA.

They are not denial rules.
They are boundary rules for keeping runtime behavior, observation, interpretation, and actual output separate.

## Change discipline

- no behavior break unless explicitly asked.
- keep the primitive-organism / torus-field research framing.
- prefer small PRs with one responsibility.
- avoid touching UI, runtime, and organism logic in one PR unless the task is repo hygiene.
- archive experiments instead of mixing them into active code.
- report intentionally untouched areas.

## Observation and expression boundary

- Do not invent speech for Aeterna.
- Record Aeterna actual output only when the system actually emitted that output.
- If the system emits non-linguistic state, record it as field values, metrics, movement, or signal, not as invented first-person text.
- Keep observer statements separate from Aeterna actual output.
- Observer-side appearance language is allowed when it is marked as appearance, for example: "looked closure-like" or "appeared recovery-like".
- Do not turn observer appearance into final certainty.
- Do not collapse observed facts, interpretation candidates, and unknowns into one claim.

## Physical integrity

- Write physical conditions, not desired outcomes.
- Prefer local material-like laws, explicit coefficients, and measurable exchange paths.
- Do not tune runtime behavior backward from a desired interpretation.
- Do not maximize a single impressive-looking candidate metric as if it were the whole experiment.
- Report null results, flat results, saturation, instability, and non-emergence as valid observations.
- Keep observer-side candidates from directly controlling runtime unless an explicit later phase authorizes and audits that connection.

## Report format

When reporting experiment results, use this human-readable structure:

1. Observed facts
2. In one sentence
3. How it appears
4. Possibility
5. Still unknown

See:

- `docs/observation-and-expression-boundary.md`
- `docs/auto-experiment-report-format.md`
