/**
 * deriveNaturalDiagnosticState.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Derives a NaturalDiagnosticState from available N-series observer outputs.
 * Aggregates NaN / Infinity / saturation / clamp warnings into one snapshot.
 *
 * Design principles:
 * - Pure function: no runtime feedback, no side effects.
 * - All inputs are optional so the function degrades gracefully when a
 *   subsystem is not active.
 * - NaN / Infinity / saturation thresholds are hard-coded constants,
 *   not runtime parameters, to avoid accidental leakage.
 * - validForLongRun is false when any serious guard fires.
 * - No semantic claims, no consciousness / life / intelligence labels.
 *
 * Reference: docs/aeterna-natural-v1-stabilization.md §8
 */

import type { NaturalDiagnosticState } from '../types/naturalDiagnosticState.ts';
import type { TorusCurvatureObservation } from '../types/torusCurvatureObservation.ts';
import type { VortexObservationState } from '../types/vortexCandidate.ts';
import type { MembraneObservationState } from '../types/membraneObservation.ts';
import type { WeakPlasticityObservationState } from '../types/weakPlasticityObservation.ts';
import type { ObservedRatiosState } from '../types/observedRatios.ts';
import type { LongRunVariantSummary } from '../types/longRunComparison.ts';

// ── Thresholds ─────────────────────────────────────────────────────────────────

/** Saturation risk level that triggers a safety warning. */
const SATURATION_WARNING_THRESHOLD = 0.8;

/** Extinction risk level that triggers a safety warning. */
const EXTINCTION_WARNING_THRESHOLD = 0.9;

/** Maximum nanOrInfinityCount in a subsystem before it propagates to total. */
// (all nonzero counts accumulate regardless)

// ── Inputs ─────────────────────────────────────────────────────────────────────

export interface DeriveNaturalDiagnosticStateInputs {
    timestamp?: number;
    curvatureObservation?: TorusCurvatureObservation | null;
    vortexObservation?: VortexObservationState | null;
    membraneObservation?: MembraneObservationState | null;
    plasticityObservation?: WeakPlasticityObservationState | null;
    observedRatiosState?: ObservedRatiosState | null;
    /** Per-variant summaries from long-run comparison, if any have run. */
    longRunSummaries?: LongRunVariantSummary[] | null;
    /**
     * Additional saturation risk values from other subsystems
     * (e.g. from the complex field amplitude monitor).
     */
    externalSaturationRisks?: number[];
    /**
     * Additional clamp event counts from subsystems that do not appear
     * in the named observation types above.
     */
    externalClampCounts?: number[];
}

// ── Main function ──────────────────────────────────────────────────────────────

/**
 * Derives a NaturalDiagnosticState from available N-series observer outputs.
 *
 * Each subsystem contributes:
 * - its nanOrInfinityCount to totalNanOrInfinityCount
 * - its warnings to the appropriate array
 * - its saturation / clamp metrics to the aggregate counts
 */
export function deriveNaturalDiagnosticState(
    inputs: DeriveNaturalDiagnosticStateInputs,
): NaturalDiagnosticState {
    const timestamp = inputs.timestamp ?? Date.now();

    const geometryWarnings: string[] = [];
    const complexFieldWarnings: string[] = [];
    const vortexWarnings: string[] = [];
    const membraneWarnings: string[] = [];
    const plasticityWarnings: string[] = [];
    const observedRatioWarnings: string[] = [];
    const comparisonWarnings: string[] = [];
    const safetyWarnings: string[] = [];

    let totalNanOrInfinityCount = 0;
    let clampEventCount = 0;
    let saturationRiskMax = 0;

    // ── N1: Torus geometry ─────────────────────────────────────────────────────

    const curv = inputs.curvatureObservation;
    if (curv) {
        if (!Number.isFinite(curv.minGaussianCurvature) || !Number.isFinite(curv.maxGaussianCurvature)) {
            totalNanOrInfinityCount += 1;
            geometryWarnings.push('Torus geometry: NaN or Infinity in Gaussian curvature values.');
        }
        if (!Number.isFinite(curv.curvatureAsymmetry)) {
            totalNanOrInfinityCount += 1;
            geometryWarnings.push('Torus geometry: NaN or Infinity in curvatureAsymmetry.');
        }
        if (curv.geometryConfidence < 0.5) {
            geometryWarnings.push(
                `Torus geometry: low geometryConfidence (${curv.geometryConfidence.toFixed(2)}).`,
            );
        }
    }

    // ── N2 / N3: Vortex / complex field ────────────────────────────────────────

    const vortex = inputs.vortexObservation;
    if (vortex) {
        if (vortex.phaseUnwrapWarningCount > 0) {
            complexFieldWarnings.push(
                `Complex field: ${vortex.phaseUnwrapWarningCount} phase-unwrap warnings.`,
            );
        }
        if (!Number.isFinite(vortex.averagePhaseGradient)) {
            totalNanOrInfinityCount += 1;
            complexFieldWarnings.push('Complex field: NaN or Infinity in averagePhaseGradient.');
        }
        if (!Number.isFinite(vortex.averageVorticity)) {
            totalNanOrInfinityCount += 1;
            vortexWarnings.push('Vortex: NaN or Infinity in averageVorticity.');
        }
        if (!Number.isFinite(vortex.totalTopologicalCharge)) {
            totalNanOrInfinityCount += 1;
            vortexWarnings.push('Vortex: NaN or Infinity in totalTopologicalCharge.');
        }
        // On a torus totalTopologicalCharge should be 0; deviation is informational.
        if (Number.isFinite(vortex.totalTopologicalCharge) && Math.abs(vortex.totalTopologicalCharge) > 2) {
            vortexWarnings.push(
                `Vortex: totalTopologicalCharge = ${vortex.totalTopologicalCharge} `
                + '(expected 0 on closed torus; deviation may indicate numerical error).',
            );
        }
    }

    // ── N4: Membrane ───────────────────────────────────────────────────────────

    const membrane = inputs.membraneObservation;
    if (membrane) {
        totalNanOrInfinityCount += membrane.nanOrInfinityCount;
        if (membrane.nanOrInfinityCount > 0) {
            membraneWarnings.push(
                `Membrane: ${membrane.nanOrInfinityCount} NaN or Infinity values detected.`,
            );
        }
        if (!Number.isFinite(membrane.membraneIntegrity) || membrane.membraneIntegrity < 0.5) {
            membraneWarnings.push(
                `Membrane: low membraneIntegrity (${
                    Number.isFinite(membrane.membraneIntegrity)
                        ? membrane.membraneIntegrity.toFixed(2)
                        : 'NaN/Inf'
                }).`,
            );
        }
    }

    // ── N5: Weak plasticity ────────────────────────────────────────────────────

    const plasticity = inputs.plasticityObservation;
    if (plasticity) {
        if ('nanOrInfinityCount' in plasticity && typeof plasticity.nanOrInfinityCount === 'number') {
            totalNanOrInfinityCount += plasticity.nanOrInfinityCount;
            if (plasticity.nanOrInfinityCount > 0) {
                plasticityWarnings.push(
                    `Plasticity: ${plasticity.nanOrInfinityCount} NaN or Infinity values detected.`,
                );
            }
        }
        if ('clampEventCount' in plasticity && typeof plasticity.clampEventCount === 'number') {
            clampEventCount += plasticity.clampEventCount;
            if (plasticity.clampEventCount > 0) {
                plasticityWarnings.push(
                    `Plasticity: ${plasticity.clampEventCount} clamp events fired.`,
                );
            }
        }
        if ('saturationRisk' in plasticity && typeof plasticity.saturationRisk === 'number') {
            const sr = plasticity.saturationRisk as number;
            if (sr > saturationRiskMax) saturationRiskMax = sr;
            if (sr > SATURATION_WARNING_THRESHOLD) {
                plasticityWarnings.push(
                    `Plasticity: saturation risk = ${sr.toFixed(2)} (threshold ${SATURATION_WARNING_THRESHOLD}).`,
                );
            }
        }
    }

    // ── N6: Observed ratios ────────────────────────────────────────────────────

    const ratios = inputs.observedRatiosState;
    if (ratios) {
        if ('nanOrInfinityCount' in ratios && typeof ratios.nanOrInfinityCount === 'number') {
            totalNanOrInfinityCount += ratios.nanOrInfinityCount;
            if (ratios.nanOrInfinityCount > 0) {
                observedRatioWarnings.push(
                    `Observed ratios: ${ratios.nanOrInfinityCount} NaN or Infinity values.`,
                );
            }
        }
    }

    // ── N7: Long-run comparison ────────────────────────────────────────────────

    const summaries = inputs.longRunSummaries;
    if (summaries && summaries.length > 0) {
        for (const s of summaries) {
            if (s.nanOrInfinityCount > 0) {
                totalNanOrInfinityCount += s.nanOrInfinityCount;
                comparisonWarnings.push(
                    `Long-run variant ${s.variantId}: ${s.nanOrInfinityCount} NaN/Infinity values.`,
                );
            }
            if (s.maxSaturationRisk > saturationRiskMax) saturationRiskMax = s.maxSaturationRisk;
            if (s.maxSaturationRisk > SATURATION_WARNING_THRESHOLD) {
                comparisonWarnings.push(
                    `Long-run variant ${s.variantId}: saturation risk = ${s.maxSaturationRisk.toFixed(2)}.`,
                );
            }
            if (s.maxExtinctionRisk > EXTINCTION_WARNING_THRESHOLD) {
                comparisonWarnings.push(
                    `Long-run variant ${s.variantId}: extinction risk = ${s.maxExtinctionRisk.toFixed(2)}.`,
                );
            }
            const skipped = s.notes.find(n => n.toLowerCase().startsWith('skipped'));
            if (skipped) {
                comparisonWarnings.push(`Long-run variant ${s.variantId}: skipped — ${skipped}`);
            }
        }
    }

    // ── External saturation risks / clamp counts ───────────────────────────────

    for (const risk of inputs.externalSaturationRisks ?? []) {
        if (Number.isFinite(risk) && risk > saturationRiskMax) saturationRiskMax = risk;
    }
    for (const count of inputs.externalClampCounts ?? []) {
        if (Number.isFinite(count)) clampEventCount += count;
    }

    // ── Cross-system safety summary ────────────────────────────────────────────

    if (saturationRiskMax > SATURATION_WARNING_THRESHOLD) {
        safetyWarnings.push(
            `⚠ saturationRiskMax = ${saturationRiskMax.toFixed(2)} exceeds threshold ${SATURATION_WARNING_THRESHOLD}.`,
        );
    }
    if (totalNanOrInfinityCount > 0) {
        safetyWarnings.push(
            `⚠ ${totalNanOrInfinityCount} NaN/Infinity values detected across N-series subsystems.`,
        );
    }

    // ── validForLongRun ────────────────────────────────────────────────────────

    const validForLongRun =
        totalNanOrInfinityCount === 0
        && saturationRiskMax <= SATURATION_WARNING_THRESHOLD
        && safetyWarnings.length === 0;

    return {
        timestamp,
        totalNanOrInfinityCount,
        geometryWarnings,
        complexFieldWarnings,
        vortexWarnings,
        membraneWarnings,
        plasticityWarnings,
        observedRatioWarnings,
        comparisonWarnings,
        saturationRiskMax,
        clampEventCount,
        safetyWarnings,
        validForLongRun,
    };
}
