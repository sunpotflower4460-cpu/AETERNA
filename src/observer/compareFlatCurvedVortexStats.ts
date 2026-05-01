/**
 * compareFlatCurvedVortexStats.ts
 * N3: Curvature × Vortex Coupling
 *
 * Observer-side helper that creates a snapshot comparison between a flat-metric
 * and a curved-metric vortex coupling observation.
 *
 * Guardrails:
 * - Pure observer function — does NOT modify runtime state.
 * - NOT connected to runtime feedback or weak plasticity.
 * - No consciousness / emotion / intention claims.
 * - Full long-run comparison is deferred to N7.
 * - Robust to null input; returns a valid structure with placeholders.
 */

import type { CurvatureVortexCouplingState } from '../types/curvatureVortexCoupling.ts';

// ── Flat vs curved comparison snapshot ────────────────────────────────────────

/**
 * Snapshot comparison between a flat-metric and a curved-metric vortex
 * coupling observation.
 *
 * In N3 this is a simple paired snapshot.  Long-run statistical comparison
 * is planned for N7.
 */
export interface FlatCurvedVortexComparison {
  timestamp: number;
  flatVortexCount: number;
  curvedVortexCount: number;
  flatSignedTotalCharge: number;
  curvedSignedTotalCharge: number;
  flatAverageVortexLifetime: number;
  curvedAverageVortexLifetime: number;
  flatCurvatureBiasStrength: number;
  curvedCurvatureBiasStrength: number;
  /** Human-readable notes about the snapshot differences. */
  differenceSummary: string[];
  /**
   * Confidence that the comparison is meaningful [0, 1].
   * Low when either side has no vortex candidates or is unavailable.
   */
  comparisonConfidence: number;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function diffNote(label: string, flat: number, curved: number): string {
  if (!Number.isFinite(flat) || !Number.isFinite(curved)) return '';
  const delta = curved - flat;
  if (Math.abs(delta) < 0.01) return `${label}: no notable difference`;
  const dir = delta > 0 ? 'higher in curved' : 'lower in curved';
  return `${label}: ${dir} (Δ ${delta.toFixed(3)})`;
}

// ── derivation ─────────────────────────────────────────────────────────────────

/**
 * Create a FlatCurvedVortexComparison from two coupling observations.
 *
 * Either input may be null (e.g. when only one metric mode has been run).
 * In that case the comparison is returned with zero/default values and low
 * comparisonConfidence.
 */
export function compareFlatCurvedVortexStats(params: {
  flat: CurvatureVortexCouplingState | null;
  curved: CurvatureVortexCouplingState | null;
  timestamp: number;
}): FlatCurvedVortexComparison {
  const { flat, curved, timestamp } = params;

  if (!flat && !curved) {
    return {
      timestamp,
      flatVortexCount: 0,
      curvedVortexCount: 0,
      flatSignedTotalCharge: 0,
      curvedSignedTotalCharge: 0,
      flatAverageVortexLifetime: 0,
      curvedAverageVortexLifetime: 0,
      flatCurvatureBiasStrength: 0,
      curvedCurvatureBiasStrength: 0,
      differenceSummary: ['No flat or curved coupling data available.'],
      comparisonConfidence: 0,
    };
  }

  const flatCount = flat?.totalVortexCount ?? 0;
  const curvedCount = curved?.totalVortexCount ?? 0;
  const flatCharge = flat?.signedTotalCharge ?? 0;
  const curvedCharge = curved?.signedTotalCharge ?? 0;
  const flatLifetime = flat?.averageVortexLifetime ?? 0;
  const curvedLifetime = curved?.averageVortexLifetime ?? 0;
  const flatBias = flat?.curvatureBiasStrength ?? 0;
  const curvedBias = curved?.curvatureBiasStrength ?? 0;

  const summary: string[] = [];

  const vortexNote = diffNote('vortexCount', flatCount, curvedCount);
  if (vortexNote) summary.push(vortexNote);

  const chargeNote = diffNote('signedTotalCharge', flatCharge, curvedCharge);
  if (chargeNote) summary.push(chargeNote);

  const lifetimeNote = diffNote(
    'averageVortexLifetime',
    flatLifetime,
    curvedLifetime,
  );
  if (lifetimeNote) summary.push(lifetimeNote);

  const biasNote = diffNote(
    'curvatureBiasStrength',
    flatBias,
    curvedBias,
  );
  if (biasNote) summary.push(biasNote);

  if (!flat) {
    summary.push(
      'Flat coupling not available — only curved observation present.',
    );
  }
  if (!curved) {
    summary.push(
      'Curved coupling not available — only flat observation present.',
    );
  }

  if (summary.length === 0) {
    summary.push('Flat and curved observations appear similar at this snapshot.');
  }

  const flatConf = flat?.observationConfidence ?? 0;
  const curvedConf = curved?.observationConfidence ?? 0;
  const comparisonConfidence =
    flat && curved
      ? Math.min(flatConf, curvedConf)
      : 0;

  return {
    timestamp,
    flatVortexCount: flatCount,
    curvedVortexCount: curvedCount,
    flatSignedTotalCharge: flatCharge,
    curvedSignedTotalCharge: curvedCharge,
    flatAverageVortexLifetime: flatLifetime,
    curvedAverageVortexLifetime: curvedLifetime,
    flatCurvatureBiasStrength: flatBias,
    curvedCurvatureBiasStrength: curvedBias,
    differenceSummary: summary,
    comparisonConfidence: Number.isFinite(comparisonConfidence)
      ? Math.max(0, Math.min(1, comparisonConfidence))
      : 0,
  };
}
