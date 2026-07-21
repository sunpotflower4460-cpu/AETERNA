/**
 * computeLayerCorrelation.ts
 *
 * Context Panel Migration item 7/9 (Layer Correlation). Deliberately NOT
 * built on the existing src/ui/observation/LayerCorrelationPanel.tsx
 * scaffolding, which assumes rich per-layer observation data (geometry/
 * vortex/membrane/etc., same unavailable-data gap noted in PR8b-f).
 *
 * Instead: a real Pearson correlation coefficient computed across the
 * captured RuntimeSnapshotHistory (PR8d) between each pair of the 4
 * metrics RuntimeSnapshot actually has (sigma/phi/energy/arousal). This
 * is genuine statistical correlation over real recorded data, not a
 * fabricated cross-layer relationship.
 */

import type { RuntimeSnapshotHistory } from './RuntimeSnapshotHistory.js';
import type { RuntimeSnapshot } from '../runtime/RuntimeSnapshot.js';

type MetricId = 'sigma' | 'phi' | 'energy' | 'arousal';

const METRICS: MetricId[] = ['sigma', 'phi', 'energy', 'arousal'];

export interface LayerCorrelationPair {
  metricA: MetricId;
  metricB: MetricId;
  /** Pearson correlation coefficient, -1..1. Null if fewer than 2 paired samples or zero variance in either metric. */
  correlation: number | null;
  sampleSize: number;
}

export interface LayerCorrelationResult {
  pairs: LayerCorrelationPair[];
}

function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}

function pairedSamples(
  snapshots: RuntimeSnapshot[],
  metricA: MetricId,
  metricB: MetricId
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const snap of snapshots) {
    const a = snap[metricA];
    const b = snap[metricB];
    if (a !== null && b !== null && Number.isFinite(a) && Number.isFinite(b)) {
      xs.push(a);
      ys.push(b);
    }
  }
  return { xs, ys };
}

export function computeLayerCorrelation(history: RuntimeSnapshotHistory): LayerCorrelationResult {
  const pairs: LayerCorrelationPair[] = [];
  for (let i = 0; i < METRICS.length; i++) {
    for (let j = i + 1; j < METRICS.length; j++) {
      const metricA = METRICS[i];
      const metricB = METRICS[j];
      const { xs, ys } = pairedSamples(history.snapshots, metricA, metricB);
      pairs.push({
        metricA,
        metricB,
        correlation: pearsonCorrelation(xs, ys),
        sampleSize: xs.length,
      });
    }
  }
  return { pairs };
}
