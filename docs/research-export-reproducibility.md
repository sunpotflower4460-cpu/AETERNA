# Research Export / Reproducibility

## 1. Purpose
AETERNA-NATURAL v1.2 adds a research export layer for reproducible observation runs.
The goal is to preserve seed, scenario, ticks, sampling interval, and runtime config without changing runtime dynamics.

## 2. Research run metadata
Research run metadata records run identity, seed, scenario, ticks, sampleEveryTicks, runtimeConfig, safety mode, external constants mode, and integrity counters.
This metadata is the minimum record needed to trace where an exported result came from.

## 3. Snapshot policy
Research snapshots are lightweight summaries only.
Raw field arrays, Float32Array buffers, and other large binary state are excluded from export.
Missing observer state stays missing; no fake values are added.

## 4. JSON export
JSON export serializes the research result with `JSON.stringify(result, null, 2)`.
The export remains machine-readable and avoids circular references or large binary payloads.

## 5. Markdown export
Markdown export presents metadata, runtime config summary, aggregate metrics, selected snapshots, interpretation notes, limitations, guardrails, and diagnostics.
The wording is observation-only and excludes consciousness, life, intelligence, mystical, or healing proof claims.

## 6. Long-run comparison export
Long-run comparison export keeps shared seed / scenario / ticks visible and presents variant summaries plus difference highlights.
Strongest and weakest labels remain metric-local comparisons, not winner labels.

## 7. Reproducibility policy
Every export must preserve the conditions needed for a same-seed rerun.
Seed, scenarioId, ticks, sampleEveryTicks, runtimeConfig, safety mode, and external constants mode are treated as mandatory reproducibility inputs.

## 8. Config hash
A lightweight stable config hash is generated from a sorted JSON representation of runtimeConfig.
The hash is comparison-oriented and is not intended as a cryptographic integrity proof.

## 9. Re-run policy
v1.2 prepares rerun configuration from metadata but does not automatically execute a rerun.
UI copy should stay at the level of “Re-run config prepared” until a future rerun flow is added.

## 10. Guardrails
Interpretation guardrails must be included in export-facing Markdown and UI copy.
These outputs are observation metrics only, not proof of consciousness, life, semantic memory, or mystical causality.
