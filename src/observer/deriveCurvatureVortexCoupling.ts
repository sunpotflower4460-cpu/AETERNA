/**
 * deriveCurvatureVortexCoupling.ts
 * N3: Curvature × Vortex Coupling
 *
 * Observer-side pure function that combines:
 *   - TorusGeometry   (N1: curved torus metric)
 *   - VortexObservationState (N2: complex scalar field vortex candidates)
 *
 * and produces a CurvatureVortexCouplingState describing how vortex
 * candidates relate to the curvature distribution of the torus.
 *
 * Key properties:
 * - Pure observer function: does NOT modify runtime state.
 * - Does NOT feed back into runtime dynamics.
 * - Does NOT connect to weak plasticity (that is N5).
 * - Does NOT connect vortices to semantic nodes, proto-networks, or memory.
 * - Robust to null / missing input; always returns a valid state.
 * - NaN / Infinity are guarded throughout; nanOrInfinityCount is reported.
 *
 * Curvature bands:
 *   negativeHigh — K < −threshold_hi
 *   negativeLow  — −threshold_hi ≤ K < 0
 *   nearZero     — |K| < near-zero tolerance
 *   positiveLow  —  0 < K ≤ threshold_hi
 *   positiveHigh —  K > threshold_hi
 *
 * Torus regions (by minor angle v = minorAngle = TWO_PI * j / segments):
 *   outerRim  — cos(v) > +REGION_THRESHOLD
 *   innerRim  — cos(v) < −REGION_THRESHOLD
 *   upperRim  — sin(v) > +REGION_THRESHOLD (and |cos(v)| ≤ REGION_THRESHOLD)
 *   lowerRim  — sin(v) < −REGION_THRESHOLD (and |cos(v)| ≤ REGION_THRESHOLD)
 *   neutral   — everything else
 *
 * Guardrails:
 * - Correlation does NOT imply causation.
 * - signedTotalCharge is a topological check, not a mystical indicator.
 * - innerRim is NOT a mystical center; outerRim is NOT superior.
 * - No consciousness / emotion / intention language.
 */

import type { TorusGeometry } from '../core/torusGeometry.ts';
import type { VortexObservationState } from '../types/vortexCandidate.ts';
import type { VortexCandidate } from '../types/vortexCandidate.ts';
import type {
  CurvatureVortexCouplingState,
  CurvatureBandVortexStats,
  CurvatureRegionVortexStats,
  TorusRegionId,
} from '../types/curvatureVortexCoupling.ts';
import { deriveVortexPairs } from './deriveVortexPairs.ts';

// ── Constants ──────────────────────────────────────────────────────────────────

/** cos(v) threshold for outerRim / innerRim classification. */
const REGION_THRESHOLD = 0.5;

// ── Helpers ────────────────────────────────────────────────────────────────────

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function safeNum(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + safeNum(v), 0);
  return sum / values.length;
}

/**
 * Pearson correlation between two equal-length numeric arrays.
 * Returns 0 when the arrays are empty, have length < 2, or have zero variance.
 */
function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2 || n !== ys.length) return 0;

  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let sx = 0;
  let sy = 0;

  for (let i = 0; i < n; i++) {
    const dx = safeNum(xs[i]) - mx;
    const dy = safeNum(ys[i]) - my;
    num += dx * dy;
    sx += dx * dx;
    sy += dy * dy;
  }

  const denom = Math.sqrt(sx * sy);
  if (!Number.isFinite(denom) || denom < Number.EPSILON) return 0;
  const r = num / denom;
  return Number.isFinite(r) ? Math.max(-1, Math.min(1, r)) : 0;
}

// ── Region classification ──────────────────────────────────────────────────────

function classifyRegion(minorAngle: number): TorusRegionId {
  const cosV = Math.cos(minorAngle);
  const sinV = Math.sin(minorAngle);
  if (cosV > REGION_THRESHOLD) return 'outerRim';
  if (cosV < -REGION_THRESHOLD) return 'innerRim';
  if (sinV > REGION_THRESHOLD) return 'upperRim';
  if (sinV < -REGION_THRESHOLD) return 'lowerRim';
  return 'neutral';
}

// ── Curvature band definition ──────────────────────────────────────────────────

interface CurvatureBandDef {
  bandId: string;
  label: string;
  test: (k: number) => boolean;
}

function buildBandDefs(minK: number, maxK: number): CurvatureBandDef[] {
  const range = maxK - minK;
  const hiThreshold = range > 0 ? minK + range * 0.75 : 0.1;
  const loThreshold = range > 0 ? minK + range * 0.25 : -0.1;
  const nearZeroHalf = range > 0 ? range * 0.05 : 0.01;

  return [
    {
      bandId: 'negativeHigh',
      label: 'Negative High Curvature',
      test: (k) => k < loThreshold,
    },
    {
      bandId: 'negativeLow',
      label: 'Negative Low Curvature',
      test: (k) => k >= loThreshold && k < -nearZeroHalf,
    },
    {
      bandId: 'nearZero',
      label: 'Near-Zero Curvature',
      test: (k) => Math.abs(k) <= nearZeroHalf,
    },
    {
      bandId: 'positiveLow',
      label: 'Positive Low Curvature',
      test: (k) => k > nearZeroHalf && k <= hiThreshold,
    },
    {
      bandId: 'positiveHigh',
      label: 'Positive High Curvature',
      test: (k) => k > hiThreshold,
    },
  ];
}

// ── Fallback state ─────────────────────────────────────────────────────────────

function fallbackBands(): CurvatureBandVortexStats[] {
  return [
    'negativeHigh',
    'negativeLow',
    'nearZero',
    'positiveLow',
    'positiveHigh',
  ].map((bandId, idx) => ({
    bandId,
    label: bandId,
    minGaussianCurvature: idx * 0.2 - 0.5,
    maxGaussianCurvature: idx * 0.2 - 0.3,
    regionCount: 0,
    vortexCount: 0,
    positiveChargeCount: 0,
    negativeChargeCount: 0,
    averageVortexConfidence: 0,
    averageAmplitudeMinimum: 0,
    averageVortexLifetime: 0,
    vortexDensity: 0,
  }));
}

function fallbackRegions(): CurvatureRegionVortexStats[] {
  const ids: TorusRegionId[] = [
    'outerRim',
    'innerRim',
    'upperRim',
    'lowerRim',
    'neutral',
  ];
  return ids.map((regionId) => ({
    regionId,
    vortexCount: 0,
    positiveChargeCount: 0,
    negativeChargeCount: 0,
    averageConfidence: 0,
    averageLifetime: 0,
    density: 0,
  }));
}

// ── Main derivation ────────────────────────────────────────────────────────────

export interface DeriveCurvatureVortexCouplingParams {
  geometry: TorusGeometry | null;
  vortexObservation: VortexObservationState | null;
  previousCoupling?: CurvatureVortexCouplingState | null;
  metricMode?: 'flat' | 'curved';
  timestamp: number;
}

/**
 * Derive a CurvatureVortexCouplingState from torus geometry and vortex
 * observation data.
 *
 * This is the primary entry point for the N3 observation.  It is a pure
 * observer function — read-only with respect to runtime state.
 */
export function deriveCurvatureVortexCoupling(
  params: DeriveCurvatureVortexCouplingParams,
): CurvatureVortexCouplingState {
  const { geometry, vortexObservation, timestamp } = params;

  const fallback: CurvatureVortexCouplingState = {
    timestamp,
    totalVortexCount: 0,
    positiveChargeCount: 0,
    negativeChargeCount: 0,
    signedTotalCharge: 0,
    expectedSignedCharge: 0,
    chargeDeviation: 0,
    vortexDensityByCurvature: fallbackBands(),
    vortexStatsByRegion: fallbackRegions(),
    curvatureVortexCorrelation: 0,
    curvatureBiasStrength: 0,
    averageVortexLifetime: 0,
    vortexPairCount: 0,
    averageVortexPairLifetime: 0,
    flatVsCurvedComparisonAvailable: false,
    observationConfidence: 0,
    nanOrInfinityCount: 0,
  };

  // Graceful fallback when either input is missing
  if (!geometry || geometry.cells.length === 0 || !vortexObservation) {
    return fallback;
  }

  const cells = geometry.cells;
  const candidates: VortexCandidate[] = vortexObservation.candidates ?? [];
  const segments = geometry.config.segments;

  let nanOrInfinityCount = 0;

  // ── Build a fast index from cell index → cell ────────────────────────────
  // Cells are stored i*segments+j, so direct array indexing is sufficient.

  // ── Topological charge totals ────────────────────────────────────────────
  let signedTotalCharge = 0;
  let positiveChargeCount = 0;
  let negativeChargeCount = 0;

  for (const c of candidates) {
    const charge = c.topologicalCharge ?? 0;
    if (!Number.isFinite(charge)) { nanOrInfinityCount++; continue; }
    signedTotalCharge += charge;
    if (charge > 0) positiveChargeCount += charge;
    if (charge < 0) negativeChargeCount += Math.abs(charge);
  }

  if (!Number.isFinite(signedTotalCharge)) {
    nanOrInfinityCount++;
    signedTotalCharge = 0;
  }

  const expectedSignedCharge = 0 as const;
  const chargeDeviation = Math.abs(signedTotalCharge - expectedSignedCharge);

  // ── Curvature bands ──────────────────────────────────────────────────────
  const minK = geometry.minGaussianCurvature;
  const maxK = geometry.maxGaussianCurvature;
  const bandDefs = buildBandDefs(minK, maxK);

  interface BandAccum {
    bandId: string;
    label: string;
    minK: number;
    maxK: number;
    regionCount: number;
    vortexCount: number;
    positiveChargeCount: number;
    negativeChargeCount: number;
    confidenceSum: number;
    amplitudeSum: number;
    lifetimeSum: number;
  }

  const bandMap = new Map<string, BandAccum>();
  for (const def of bandDefs) {
    bandMap.set(def.bandId, {
      bandId: def.bandId,
      label: def.label,
      minK: Number.POSITIVE_INFINITY,
      maxK: Number.NEGATIVE_INFINITY,
      regionCount: 0,
      vortexCount: 0,
      positiveChargeCount: 0,
      negativeChargeCount: 0,
      confidenceSum: 0,
      amplitudeSum: 0,
      lifetimeSum: 0,
    });
  }

  for (const cell of cells) {
    const k = cell.gaussianCurvature;
    if (!Number.isFinite(k)) { nanOrInfinityCount++; continue; }

    for (const def of bandDefs) {
      if (def.test(k)) {
        const accum = bandMap.get(def.bandId)!;
        accum.regionCount++;
        if (k < accum.minK) accum.minK = k;
        if (k > accum.maxK) accum.maxK = k;
        break;
      }
    }
  }

  // Assign each vortex candidate to a curvature band by looking up its cell
  for (const candidate of candidates) {
    const cellIndex = candidate.i * segments + candidate.j;
    const cell = cells[cellIndex];
    if (!cell) continue;
    const k = cell.gaussianCurvature;
    if (!Number.isFinite(k)) { nanOrInfinityCount++; continue; }

    for (const def of bandDefs) {
      if (def.test(k)) {
        const accum = bandMap.get(def.bandId)!;
        accum.vortexCount++;
        if (candidate.topologicalCharge > 0) accum.positiveChargeCount++;
        if (candidate.topologicalCharge < 0) accum.negativeChargeCount++;
        accum.confidenceSum += safeNum(candidate.confidence);
        accum.amplitudeSum += safeNum(candidate.amplitudeMinimum);
        accum.lifetimeSum += safeNum(candidate.lifetimeTicks ?? 1);
        break;
      }
    }
  }

  const vortexDensityByCurvature: CurvatureBandVortexStats[] = bandDefs.map(
    (def) => {
      const accum = bandMap.get(def.bandId)!;
      const n = accum.vortexCount;
      return {
        bandId: accum.bandId,
        label: accum.label,
        minGaussianCurvature:
          Number.isFinite(accum.minK) ? accum.minK : 0,
        maxGaussianCurvature:
          Number.isFinite(accum.maxK) ? accum.maxK : 0,
        regionCount: accum.regionCount,
        vortexCount: n,
        positiveChargeCount: accum.positiveChargeCount,
        negativeChargeCount: accum.negativeChargeCount,
        averageVortexConfidence:
          n > 0 ? clamp01(accum.confidenceSum / n) : 0,
        averageAmplitudeMinimum:
          n > 0 ? safeNum(accum.amplitudeSum / n) : 0,
        averageVortexLifetime:
          n > 0 ? safeNum(accum.lifetimeSum / n) : 0,
        vortexDensity: accum.vortexCount / Math.max(1, accum.regionCount),
      };
    },
  );

  // ── Region statistics ────────────────────────────────────────────────────
  const regionIds: TorusRegionId[] = [
    'outerRim',
    'innerRim',
    'upperRim',
    'lowerRim',
    'neutral',
  ];

  interface RegionAccum {
    vortexCount: number;
    positiveChargeCount: number;
    negativeChargeCount: number;
    confidenceSum: number;
    lifetimeSum: number;
    cellCount: number;
  }

  const regionMap = new Map<TorusRegionId, RegionAccum>();
  for (const id of regionIds) {
    regionMap.set(id, {
      vortexCount: 0,
      positiveChargeCount: 0,
      negativeChargeCount: 0,
      confidenceSum: 0,
      lifetimeSum: 0,
      cellCount: 0,
    });
  }

  // Count cells per region
  for (const cell of cells) {
    const regionId = classifyRegion(cell.minorAngle);
    regionMap.get(regionId)!.cellCount++;
  }

  // Count vortex candidates per region
  for (const candidate of candidates) {
    const cellIndex = candidate.i * segments + candidate.j;
    const cell = cells[cellIndex];
    if (!cell) continue;
    const regionId = classifyRegion(cell.minorAngle);
    const accum = regionMap.get(regionId)!;
    accum.vortexCount++;
    if (candidate.topologicalCharge > 0) accum.positiveChargeCount++;
    if (candidate.topologicalCharge < 0) accum.negativeChargeCount++;
    accum.confidenceSum += safeNum(candidate.confidence);
    accum.lifetimeSum += safeNum(candidate.lifetimeTicks ?? 1);
  }

  const vortexStatsByRegion: CurvatureRegionVortexStats[] = regionIds.map(
    (regionId) => {
      const accum = regionMap.get(regionId)!;
      const n = accum.vortexCount;
      return {
        regionId,
        vortexCount: n,
        positiveChargeCount: accum.positiveChargeCount,
        negativeChargeCount: accum.negativeChargeCount,
        averageConfidence: n > 0 ? clamp01(accum.confidenceSum / n) : 0,
        averageLifetime: n > 0 ? safeNum(accum.lifetimeSum / n) : 0,
        density: n / Math.max(1, accum.cellCount),
      };
    },
  );

  // ── Curvature–vortex correlation ─────────────────────────────────────────
  const curvatureAtVortex: number[] = [];
  const confidenceAtVortex: number[] = [];

  for (const candidate of candidates) {
    const cellIndex = candidate.i * segments + candidate.j;
    const cell = cells[cellIndex];
    if (!cell) continue;
    const k = cell.gaussianCurvature;
    if (!Number.isFinite(k) || !Number.isFinite(candidate.confidence)) {
      nanOrInfinityCount++;
      continue;
    }
    curvatureAtVortex.push(k);
    confidenceAtVortex.push(candidate.confidence);
  }

  const curvatureVortexCorrelation = pearsonCorrelation(
    curvatureAtVortex,
    confidenceAtVortex,
  );

  // ── Curvature bias strength ──────────────────────────────────────────────
  // Ratio of max band density to mean band density (normalised to [0,1]).
  const bandDensities = vortexDensityByCurvature.map((b) => b.vortexDensity);
  const meanBandDensity = mean(bandDensities);
  const maxBandDensity = Math.max(0, ...bandDensities.filter(Number.isFinite));
  const curvatureBiasStrength =
    meanBandDensity > 0
      ? clamp01((maxBandDensity - meanBandDensity) / Math.max(meanBandDensity, 1e-9))
      : 0;

  // ── Average vortex lifetime ──────────────────────────────────────────────
  const lifetimes = candidates.map((c) => safeNum(c.lifetimeTicks ?? 1));
  const averageVortexLifetime = mean(lifetimes);

  // ── Vortex pairs ─────────────────────────────────────────────────────────
  const pairsResult = deriveVortexPairs({ candidates, segments, timestamp });

  // ── Observation confidence ────────────────────────────────────────────────
  const hasGeometry = cells.length > 0;
  const hasCandidates = candidates.length > 0;
  const geometryConf = hasGeometry ? 1 : 0;
  const candidateConf = hasCandidates
    ? Math.min(1, candidates.length / 8) * 0.6
      + (vortexObservation.observationConfidence ?? 0) * 0.4
    : 0;
  const nanPenalty = clamp01(nanOrInfinityCount / Math.max(1, cells.length));
  const observationConfidence = clamp01(
    (geometryConf * 0.3 + candidateConf * 0.7) * (1 - nanPenalty * 0.5),
  );

  return {
    timestamp,
    totalVortexCount: candidates.length,
    positiveChargeCount,
    negativeChargeCount,
    signedTotalCharge,
    expectedSignedCharge,
    chargeDeviation,
    vortexDensityByCurvature,
    vortexStatsByRegion,
    curvatureVortexCorrelation,
    curvatureBiasStrength,
    averageVortexLifetime,
    vortexPairCount: pairsResult.pairCount,
    averageVortexPairLifetime: pairsResult.averagePairLifetime,
    flatVsCurvedComparisonAvailable: false,
    observationConfidence,
    nanOrInfinityCount,
  };
}
