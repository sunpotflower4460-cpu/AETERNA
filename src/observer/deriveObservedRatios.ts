/**
 * deriveObservedRatios.ts
 * N6: External Constants Removal / Observed Ratios
 *
 * Derives ObservedRatiosState from available field observation states.
 *
 * Design principles:
 * - Pure function: same inputs → same outputs.
 * - Observer-side only. Does NOT modify any runtime state.
 * - Does NOT feed observed ratios back into dynamics.
 * - Observed ratios are compared against REFERENCE_RATIOS for measurement only.
 * - A high matchStrength or high emergentResonanceProxy is an observational fact.
 *   It is NOT a proof of meaning, life, consciousness, or mystical resonance.
 * - A low matchStrength is NOT an error or failure.
 * - All values guarded against NaN / Infinity.
 * - Tolerance used for matchStrength is configurable via the matchTolerance param.
 *
 * Reference: docs/observed-ratios.md
 * Reference: docs/external-constants-removal.md
 */

import type { ComplexFieldState } from '../types/complexField.ts';
import type { CurvatureVortexCouplingState } from '../types/curvatureVortexCoupling.ts';
import type { RepeatedFlowPathObservationState } from '../types/repeatedFlowPath.ts';
import type { ProtoNetworkObservationState } from '../types/protoNetworkCandidate.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { ObservedRatio, ReferenceRatioMatch, ObservedRatiosState } from '../types/observedRatios.ts';
import type { ReferenceRatio } from './referenceRatios.ts';
import { REFERENCE_RATIOS } from './referenceRatios.ts';

// ── Helpers ────────────────────────────────────────────────────────────────────

function safe(v: number, fallback = 0): number {
    return isFinite(v) ? v : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

const EPSILON = 1e-10;

/**
 * Safely compute a ratio. Returns null if denominator is near zero or result
 * is non-finite.
 */
function safeRatio(numerator: number, denominator: number): number | null {
    if (!isFinite(numerator) || !isFinite(denominator)) return null;
    if (Math.abs(denominator) < EPSILON) return null;
    const r = numerator / denominator;
    if (!isFinite(r)) return null;
    return r;
}

/**
 * Compute cents distance between two frequency ratios.
 * Only valid when both values are finite and positive.
 */
function computeCentsDistance(observed: number, reference: number): number | null {
    if (!isFinite(observed) || !isFinite(reference)) return null;
    if (observed <= 0 || reference <= 0) return null;
    const c = 1200 * Math.log2(observed / reference);
    return isFinite(c) ? c : null;
}

// ── Confidence scale constants ─────────────────────────────────────────────────

/**
 * Scale factor applied to flow delay confidence.
 * Flow path confidence is observed indirectly (max/avg ratio), so we apply
 * a moderate discount to reflect lower certainty relative to direct measurements.
 */
const FLOW_DELAY_CONFIDENCE_SCALE = 0.6;

/**
 * Default confidence for closure timing ratios.
 * These are proxy metrics (returnStrength / closureStability), not direct measurements.
 */
const CLOSURE_TIMING_CONFIDENCE_DEFAULT = 0.5;

/**
 * Scale factor applied to phase coherence ratio confidence.
 * Phase coherence itself is used as both the data source and the confidence proxy,
 * so we discount it to avoid overconfidence when coherence happens to be high.
 */
const PHASE_COHERENCE_CONFIDENCE_FACTOR = 0.7;

// ── Observed ratio candidates ──────────────────────────────────────────────────

/**
 * Derive amplitude peak ratios from a ComplexFieldState.
 *
 * We use the ratio of maxAmplitude to averageAmplitude as a simple
 * amplitude-peak-based ratio. When the complex field has multiple
 * amplitude candidates, additional ratios could be added here.
 */
function deriveAmplitudeRatios(
    complexField: ComplexFieldState | null | undefined
): ObservedRatio[] {
    if (!complexField) return [];
    const max = safe(complexField.maxAmplitude);
    const avg = safe(complexField.averageAmplitude);
    const r = safeRatio(max, avg);
    if (r === null || r <= 0) return [];
    return [
        {
            id: 'amplitudePeakToAverage',
            label: 'Amplitude peak / average',
            numerator: max,
            denominator: avg,
            value: r,
            source: 'amplitudePeak',
            confidence: clamp(complexField.phaseCoherence ?? 0, 0, 1),
        },
    ];
}

/**
 * Derive vortex spacing ratios from a CurvatureVortexCouplingState.
 *
 * Uses the ratio of the highest-vortex-density band to the lowest-vortex-density
 * band (positive only) as a spacing ratio proxy.
 */
function deriveVortexSpacingRatios(
    curvatureVortexCoupling: CurvatureVortexCouplingState | null | undefined
): ObservedRatio[] {
    if (!curvatureVortexCoupling) return [];
    const bands = curvatureVortexCoupling.vortexDensityByCurvature;
    if (!bands || bands.length < 2) return [];

    const densities = bands
        .map(b => safe(b.vortexDensity))
        .filter(d => d > 0);
    if (densities.length < 2) return [];

    const maxDensity = Math.max(...densities);
    const minDensity = Math.min(...densities);
    const r = safeRatio(maxDensity, minDensity);
    if (r === null || r <= 0) return [];

    return [
        {
            id: 'vortexDensityMaxMin',
            label: 'Vortex density max / min (across curvature bands)',
            numerator: maxDensity,
            denominator: minDensity,
            value: r,
            source: 'vortexSpacing',
            confidence: clamp(curvatureVortexCoupling.observationConfidence ?? 0, 0, 1),
        },
    ];
}

/**
 * Derive repeated flow delay ratios from a RepeatedFlowPathObservationState.
 *
 * Uses the ratio of max confidence path's recurrenceStrength to the average.
 */
function deriveFlowDelayRatios(
    repeatedFlowPaths: RepeatedFlowPathObservationState | null | undefined
): ObservedRatio[] {
    if (!repeatedFlowPaths || !repeatedFlowPaths.candidates || repeatedFlowPaths.candidates.length < 2) return [];

    const maxConf = safe(repeatedFlowPaths.maxConfidence);
    const avgConf = safe(repeatedFlowPaths.averageConfidence);
    const r = safeRatio(maxConf, avgConf);
    if (r === null || r <= 0) return [];

    const confidence = clamp(repeatedFlowPaths.observationConfidence ?? 0, 0, 1) * FLOW_DELAY_CONFIDENCE_SCALE;

    return [
        {
            id: 'flowConfidenceMaxAvg',
            label: 'Flow path confidence max / average',
            numerator: maxConf,
            denominator: avgConf,
            value: r,
            source: 'flowDelay',
            confidence,
        },
    ];
}

/**
 * Derive closure timing ratios from a BodyWorldClosureState.
 *
 * Uses the ratio of returnStrength to closureStability as a timing proxy.
 */
function deriveClosureTimingRatios(
    closure: BodyWorldClosureState | null | undefined
): ObservedRatio[] {
    if (!closure) return [];

    const returnStrength = safe(closure.returnStrength);
    const closureStability = safe(closure.closureStability);
    const r = safeRatio(returnStrength, closureStability);
    if (r === null || r <= 0) return [];

    const confidence = CLOSURE_TIMING_CONFIDENCE_DEFAULT; // Moderate confidence; these are proxy metrics

    return [
        {
            id: 'closureReturnToStability',
            label: 'Closure return strength / stability',
            numerator: returnStrength,
            denominator: closureStability,
            value: r,
            source: 'closureTiming',
            confidence,
        },
    ];
}

/**
 * Derive phase coherence ratios from a ComplexFieldState.
 *
 * Uses the ratio of phaseCoherence to (1 − phaseCoherence) as a signal
 * of coherent vs incoherent phase regions.
 */
function derivePhaseCoherenceRatios(
    complexField: ComplexFieldState | null | undefined
): ObservedRatio[] {
    if (!complexField) return [];
    const pc = safe(complexField.phaseCoherence);
    if (pc <= 0 || pc >= 1) return [];

    const r = safeRatio(pc, 1 - pc);
    if (r === null || r <= 0) return [];

    return [
        {
            id: 'phaseCoherenceRatio',
            label: 'Phase coherence / (1 − coherence)',
            numerator: pc,
            denominator: 1 - pc,
            value: r,
            source: 'phaseCoherence',
            confidence: clamp(pc * PHASE_COHERENCE_CONFIDENCE_FACTOR, 0, 1),
        },
    ];
}

// ── Reference ratio matching ───────────────────────────────────────────────────

/**
 * Compute a ReferenceRatioMatch between one observed ratio and one reference.
 *
 * matchStrength = clamp(1 − relativeDistance / tolerance, 0, 1)
 *
 * The matchStrength is an observational measure only.
 * It does NOT prove meaning, life, or consciousness.
 */
function computeMatch(
    observed: ObservedRatio,
    reference: ReferenceRatio,
    matchTolerance: number
): ReferenceRatioMatch {
    const obs = observed.value;
    const ref = reference.value;
    const absDistance = safe(Math.abs(obs - ref));
    const relDistance = safe(absDistance / Math.max(Math.abs(ref), EPSILON));
    const centsDistance = computeCentsDistance(obs, ref);
    const rawMatchStrength = 1 - relDistance / Math.max(matchTolerance, EPSILON);
    const matchStrength = clamp(rawMatchStrength, 0, 1);

    return {
        observedRatioId: observed.id,
        referenceRatioId: reference.id,
        observedValue: obs,
        referenceValue: ref,
        absoluteDistance: absDistance,
        relativeDistance: relDistance,
        centsDistance,
        matchStrength,
    };
}

// ── emergentResonanceProxy ─────────────────────────────────────────────────────

/**
 * Derive emergentResonanceProxy.
 *
 * This is the average matchStrength of the top N matches, weighted by
 * the confidence of the observed ratio.
 *
 * Range: 0–1.
 *
 * CAUTION:
 * - This is a similarity proxy only.
 * - It is NOT a proof of resonance, life, or consciousness.
 * - It is NOT fed back into runtime dynamics.
 */
function deriveEmergentResonanceProxy(matches: ReferenceRatioMatch[], topN = 5): number {
    if (matches.length === 0) return 0;
    const sorted = [...matches].sort((a, b) => b.matchStrength - a.matchStrength);
    const top = sorted.slice(0, topN);
    const total = top.reduce((acc, m) => acc + m.matchStrength, 0);
    const proxy = total / Math.max(top.length, 1);
    return clamp(safe(proxy), 0, 1);
}

// ── NaN / Infinity guard ───────────────────────────────────────────────────────

function countNonFinite(ratios: ObservedRatio[], matches: ReferenceRatioMatch[]): number {
    let count = 0;
    for (const r of ratios) {
        if (!isFinite(r.value) || !isFinite(r.numerator) || !isFinite(r.denominator)) count++;
    }
    for (const m of matches) {
        if (!isFinite(m.absoluteDistance) || !isFinite(m.relativeDistance) || !isFinite(m.matchStrength)) count++;
    }
    return count;
}

// ── deriveObservedRatios ──────────────────────────────────────────────────────

export interface DeriveObservedRatiosParams {
    complexField?: ComplexFieldState | null;
    curvatureVortexCoupling?: CurvatureVortexCouplingState | null;
    repeatedFlowPaths?: RepeatedFlowPathObservationState | null;
    protoNetwork?: ProtoNetworkObservationState | null;
    closure?: BodyWorldClosureState | null;
    referenceRatios?: ReferenceRatio[];
    /** Tolerance for matchStrength: relativeDistance at which matchStrength = 0. Default: 0.3 */
    matchTolerance?: number;
    externalConstantsMode?: 'neutral' | 'legacy';
    timestamp: number;
}

/**
 * Derive an ObservedRatiosState from available field observation states.
 *
 * This is a pure observer-side function. It does NOT modify any runtime state.
 * Observed ratios are compared against reference ratios for measurement only.
 *
 * No observed ratio or match result is fed back into dynamics.
 * No reference ratio is used as a causal ingredient.
 * Reference matches are observational comparisons only.
 */
export function deriveObservedRatios(params: DeriveObservedRatiosParams): ObservedRatiosState {
    const {
        complexField,
        curvatureVortexCoupling,
        repeatedFlowPaths,
        closure,
        referenceRatios = REFERENCE_RATIOS,
        matchTolerance = 0.3,
        externalConstantsMode = 'neutral',
        timestamp,
    } = params;

    // Collect all observed ratios from available sources
    const observedRatios: ObservedRatio[] = [
        ...deriveAmplitudeRatios(complexField),
        ...deriveVortexSpacingRatios(curvatureVortexCoupling),
        ...deriveFlowDelayRatios(repeatedFlowPaths),
        ...deriveClosureTimingRatios(closure),
        ...derivePhaseCoherenceRatios(complexField),
    ];

    // Compute all reference ratio matches
    const referenceMatches: ReferenceRatioMatch[] = [];
    for (const observed of observedRatios) {
        for (const reference of referenceRatios) {
            referenceMatches.push(computeMatch(observed, reference, matchTolerance));
        }
    }

    // Find strongest match
    let strongestMatch: ReferenceRatioMatch | null = null;
    if (referenceMatches.length > 0) {
        strongestMatch = referenceMatches.reduce(
            (best, m) => (m.matchStrength > best.matchStrength ? m : best),
            referenceMatches[0]
        );
    }

    // Average match strength
    const avgMatchStrength = referenceMatches.length > 0
        ? clamp(
            safe(referenceMatches.reduce((acc, m) => acc + m.matchStrength, 0) / referenceMatches.length),
            0, 1
          )
        : 0;

    // emergentResonanceProxy — observer proxy only, not fed back to dynamics
    const emergentResonanceProxy = deriveEmergentResonanceProxy(referenceMatches);

    // Observation confidence
    const observationConfidence = observedRatios.length > 0
        ? clamp(
            safe(observedRatios.reduce((acc, r) => acc + r.confidence, 0) / observedRatios.length),
            0, 1
          )
        : 0;

    // NaN / Infinity count
    const nanOrInfinityCount = countNonFinite(observedRatios, referenceMatches);

    return {
        timestamp,
        observedRatios,
        referenceMatches,
        strongestMatch,
        averageMatchStrength: avgMatchStrength,
        emergentResonanceProxy,
        observationConfidence,
        nanOrInfinityCount,
        externalConstantsMode,
    };
}
