/**
 * RuntimeSnapshotDifference.ts
 *
 * Context Panel Migration item 5/9 (Difference). Deliberately NOT built
 * on the existing src/observation/buildObservationDifference.ts — that
 * function requires TimeReplaySnapshot/CellObservation (the same
 * unavailable rich-data types noted in PR8b-d). This computes a before/
 * after/delta comparison using only real RuntimeSnapshot (PR3) fields.
 *
 * Reuses the general shape of ObservationDifferenceItem
 * (src/types/observationDifference.ts) in spirit — metricId/label/
 * before/after/delta — but defines its own minimal types rather than
 * force-fitting into that interface's cellObservationAvailable/
 * globalSummaryAvailable fields, which describe a different data source
 * than RuntimeSnapshot.
 */

import type { RuntimeSnapshot } from '../runtime/RuntimeSnapshot.js';

export interface RuntimeSnapshotDifferenceItem {
  metricId: 'sigma' | 'phi' | 'energy' | 'arousal';
  label: string;
  before: number | null;
  after: number | null;
  /** after - before. Null if either value is unavailable — never fabricated. */
  delta: number | null;
}

export interface RuntimeSnapshotDifference {
  beforeTick: number | null;
  afterTick: number | null;
  items: RuntimeSnapshotDifferenceItem[];
}

const METRICS: Array<{ metricId: RuntimeSnapshotDifferenceItem['metricId']; label: string }> = [
  { metricId: 'sigma', label: 'σ' },
  { metricId: 'phi', label: 'φ' },
  { metricId: 'energy', label: 'energy' },
  { metricId: 'arousal', label: 'arousal' },
];

function computeDelta(before: number | null, after: number | null): number | null {
  if (before === null || after === null) return null;
  return after - before;
}

export function buildRuntimeSnapshotDifference(
  before: RuntimeSnapshot | null,
  after: RuntimeSnapshot | null
): RuntimeSnapshotDifference {
  const items = METRICS.map(({ metricId, label }) => {
    const beforeValue = before?.[metricId] ?? null;
    const afterValue = after?.[metricId] ?? null;
    return {
      metricId,
      label,
      before: beforeValue,
      after: afterValue,
      delta: computeDelta(beforeValue, afterValue),
    };
  });
  return {
    beforeTick: before?.tick ?? null,
    afterTick: after?.tick ?? null,
    items,
  };
}
