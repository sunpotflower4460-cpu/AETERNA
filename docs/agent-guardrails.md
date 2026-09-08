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

## AETERNA PURE PHYSICS work

For PURE PHYSICS work, follow:

- `docs/pure-physics-core-design.md`
- `docs/pure-physics-implementation-plan.md`

Do not rewrite, summarize, or sanitize those source documents when adding them.
Treat them as the approved implementation constitution for future `src/pure/` work.

## AETERNA Vessel work (K-Series)

For work under the K-Series roadmap (completing AETERNA as a vessel that could
host intelligence, without claiming it does), follow:

- `AGENTS.md` (repo root) — operating contract: one phase per session, no
  self-grading, ask before inventing a spec decision
- `docs/vessel/VESSEL_CHARTER.md` — what a vessel is, and the claim ceiling
- `docs/vessel/vessel-roadmap.md` — K0-K8 completion conditions and decisive
  falsifiers; do not start a phase without a stated falsifier
- `docs/vessel/anti-delusion-apparatus.md` — the four rings; do not weaken a
  ring to make an observation look stronger

A K-Series PR that reports a phase complete without the corresponding actual
command output, or that reports a falsifier as satisfied without recording it
in `docs/vessel/white-ceilings.md`, is incomplete regardless of code state.

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
