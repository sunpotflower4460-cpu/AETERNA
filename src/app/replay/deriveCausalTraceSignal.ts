/**
 * deriveCausalTraceSignal.ts
 *
 * Context Panel Migration item 6/9 (Causal Trace). Deliberately NOT
 * built on the existing src/types/causalTrace.ts CausalTraceResult /
 * CausalTraceSignal — that type models a rich multi-signal graph
 * (geometry/vortex/membrane/plasticity/ratios/events/comparison source
 * layers, related cells, related events) that would require data this
 * app doesn't have (same gap as PR8b-e). Faking 6+ "possible
 * contributing signals" from 4 scalar fields would misrepresent what
 * was actually observed.
 *
 * Instead: given the RuntimeSnapshotDifference already computed for the
 * Difference panel (PR8e), identify which single metric changed the
 * most and report it as the one temporal correlation the data actually
 * supports — with the same confidence/caution vocabulary as the real
 * CausalTraceResult (low/medium/high/insufficient, and a mandatory
 * "not causal proof" caution), so this is honestly a strict subset of
 * that model's semantics, not an incompatible one.
 */

import type { RuntimeSnapshotDifference } from './RuntimeSnapshotDifference.js';

export type CausalTraceConfidence = 'low' | 'medium' | 'high' | 'insufficient';

export interface CausalTraceSignalSummary {
  metricId: 'sigma' | 'phi' | 'energy' | 'arousal' | null;
  label: string | null;
  delta: number | null;
  confidence: CausalTraceConfidence;
  caution: string;
}

const CAUTION =
  'これは時間的な相関の観測であり、因果関係の証明ではありません。' +
  ' This is a temporal correlation, not proof of causation.';

const HIGH_THRESHOLD = 0.1;
const MEDIUM_THRESHOLD = 0.01;

export function deriveCausalTraceSignal(diff: RuntimeSnapshotDifference): CausalTraceSignalSummary {
  const withDelta = diff.items.filter((item) => item.delta !== null) as Array<
    RuntimeSnapshotDifference['items'][number] & { delta: number }
  >;

  if (withDelta.length === 0) {
    return { metricId: null, label: null, delta: null, confidence: 'insufficient', caution: CAUTION };
  }

  const strongest = withDelta.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a));
  const magnitude = Math.abs(strongest.delta);
  const confidence: CausalTraceConfidence =
    magnitude >= HIGH_THRESHOLD ? 'high' : magnitude >= MEDIUM_THRESHOLD ? 'medium' : 'low';

  return {
    metricId: strongest.metricId,
    label: strongest.label,
    delta: strongest.delta,
    confidence,
    caution: CAUTION,
  };
}
