/**
 * buildObservationDifference.ts
 * v1.8: Causal Trace / Layer Correlation — Difference View
 *
 * Pure function that computes before/after/delta for observation metrics
 * between two replay snapshots.
 *
 * Design principles:
 * - Handles null/undefined values gracefully — never substitutes with 0.
 * - relativeDelta is null when beforeValue is 0 or unavailable.
 * - largestChanges contains top 5 items by |delta|.
 * - No consciousness / emotion / life / soul / mystical claims.
 * - No LLM or API calls.
 *
 * Reference: docs/causal-trace-layer-correlation.md §5
 */

import type {
    ObservationDifferenceItem,
    ObservationDifferenceState,
} from '../types/observationDifference.ts';
import type { TimeReplaySnapshot } from '../types/timeReplay.ts';
import type { CellObservation } from '../types/cellObservation.ts';

// ── BuildObservationDifferenceParams ──────────────────────────────────────────

export interface BuildObservationDifferenceParams {
    beforeSnapshot: TimeReplaySnapshot | null;
    afterSnapshot: TimeReplaySnapshot | null;
    beforeCell: CellObservation | null;
    afterCell: CellObservation | null;
    activeLensId: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeNum(v: number | undefined | null): number | null {
    if (v === undefined || v === null) return null;
    if (!Number.isFinite(v)) return null;
    return v;
}

function makeDiffItem(
    metricId: string,
    label: string,
    sourceLayer: string,
    valueKind: ObservationDifferenceItem['valueKind'],
    before: number | null,
    after: number | null,
): ObservationDifferenceItem {
    const delta = before !== null && after !== null ? after - before : null;
    let relativeDelta: number | null = null;
    if (delta !== null && before !== null && Math.abs(before) > 1e-12) {
        relativeDelta = delta / Math.abs(before);
        if (!Number.isFinite(relativeDelta)) relativeDelta = null;
    }
    return { metricId, label, valueKind, valueBefore: before, valueAfter: after, delta, relativeDelta, sourceLayer };
}

// ── buildObservationDifference ────────────────────────────────────────────────

/**
 * Compute observation difference between two snapshots.
 *
 * @param params - BuildObservationDifferenceParams
 * @returns ObservationDifferenceState
 */
export function buildObservationDifference(
    params: BuildObservationDifferenceParams,
): ObservationDifferenceState {
    const { beforeSnapshot, afterSnapshot, beforeCell, afterCell, activeLensId } = params;
    const now = Date.now();

    const beforeTick = beforeSnapshot?.tick ?? 0;
    const afterTick = afterSnapshot?.tick ?? 0;

    const items: ObservationDifferenceItem[] = [];

    // Global summary items
    const globalSummaryAvailable = !!(beforeSnapshot || afterSnapshot);
    if (globalSummaryAvailable) {
        const bg = beforeSnapshot?.globalSummary ?? {};
        const ag = afterSnapshot?.globalSummary ?? {};

        items.push(makeDiffItem(
            'globalSummary.phaseCoherence',
            'Phase Coherence',
            'field',
            'Derived',
            safeNum(bg.phaseCoherence),
            safeNum(ag.phaseCoherence),
        ));
        items.push(makeDiffItem(
            'globalSummary.vortexCandidateCount',
            'Vortex Candidate Count',
            'vortex',
            'Measured',
            safeNum(bg.vortexCandidateCount),
            safeNum(ag.vortexCandidateCount),
        ));
        items.push(makeDiffItem(
            'globalSummary.membraneOverlap',
            'Membrane Overlap',
            'membrane',
            'Derived',
            safeNum(bg.membraneOverlap),
            safeNum(ag.membraneOverlap),
        ));
        items.push(makeDiffItem(
            'globalSummary.plasticityAccumulation',
            'Plasticity Accumulation',
            'plasticity',
            'Derived',
            safeNum(bg.plasticityAccumulation),
            safeNum(ag.plasticityAccumulation),
        ));
        items.push(makeDiffItem(
            'globalSummary.observedRatioMatchStrength',
            'Observed Ratio Match Strength',
            'ratios',
            'Proxy',
            safeNum(bg.observedRatioMatchStrength),
            safeNum(ag.observedRatioMatchStrength),
        ));
        items.push(makeDiffItem(
            'globalSummary.nanOrInfinityCount',
            'NaN/Infinity Count',
            'diagnostics',
            'Check',
            safeNum(bg.nanOrInfinityCount),
            safeNum(ag.nanOrInfinityCount),
        ));
    }

    // Cell observation items
    const cellObservationAvailable = !!(beforeCell || afterCell);
    if (cellObservationAvailable) {
        const bc = beforeCell;
        const ac = afterCell;

        // Geometry
        items.push(makeDiffItem('geometry.gaussianCurvature', 'Gaussian Curvature', 'geometry', 'Measured',
            safeNum(bc?.geometry.gaussianCurvature), safeNum(ac?.geometry.gaussianCurvature)));
        items.push(makeDiffItem('geometry.areaElement', 'Area Element', 'geometry', 'Measured',
            safeNum(bc?.geometry.areaElement), safeNum(ac?.geometry.areaElement)));
        items.push(makeDiffItem('geometry.innerOuterBias', 'Inner–Outer Bias', 'geometry', 'Derived',
            safeNum(bc?.geometry.innerOuterBias), safeNum(ac?.geometry.innerOuterBias)));

        // Field
        items.push(makeDiffItem('field.amplitude', 'Field Amplitude', 'field', 'Raw',
            safeNum(bc?.field.amplitude), safeNum(ac?.field.amplitude)));
        items.push(makeDiffItem('field.phase', 'Field Phase', 'field', 'Raw',
            safeNum(bc?.field.phase), safeNum(ac?.field.phase)));
        items.push(makeDiffItem('field.phaseCoherenceLocal', 'Local Phase Coherence', 'field', 'Derived',
            safeNum(bc?.field.phaseCoherenceLocal), safeNum(ac?.field.phaseCoherenceLocal)));
        items.push(makeDiffItem('field.flowContinuityLocal', 'Local Flow Continuity', 'field', 'Proxy',
            safeNum(bc?.field.flowContinuityLocal), safeNum(ac?.field.flowContinuityLocal)));

        // Vortex
        items.push(makeDiffItem('vortex.candidateConfidence', 'Vortex Candidate Confidence', 'vortex', 'Derived',
            safeNum(bc?.vortex.candidateConfidence), safeNum(ac?.vortex.candidateConfidence)));
        items.push(makeDiffItem('vortex.topologicalCharge', 'Topological Charge', 'vortex', 'Derived',
            safeNum(bc?.vortex.topologicalCharge), safeNum(ac?.vortex.topologicalCharge)));

        // Membrane
        items.push(makeDiffItem('membrane.deformation', 'Membrane Deformation', 'membrane', 'Measured',
            safeNum(bc?.membrane.deformation), safeNum(ac?.membrane.deformation)));
        items.push(makeDiffItem('membrane.tension', 'Membrane Tension', 'membrane', 'Measured',
            safeNum(bc?.membrane.tension), safeNum(ac?.membrane.tension)));
        items.push(makeDiffItem('membrane.permeability', 'Membrane Permeability', 'membrane', 'Measured',
            safeNum(bc?.membrane.permeability), safeNum(ac?.membrane.permeability)));

        // Plasticity
        items.push(makeDiffItem('plasticity.accumulatedTrace', 'Plasticity Trace', 'plasticity', 'Derived',
            safeNum(bc?.plasticity.accumulatedTrace), safeNum(ac?.plasticity.accumulatedTrace)));
        items.push(makeDiffItem('plasticity.resistanceScale', 'Resistance Scale', 'plasticity', 'Derived',
            safeNum(bc?.plasticity.resistanceScale), safeNum(ac?.plasticity.resistanceScale)));

        // Ratios
        items.push(makeDiffItem('ratios.strongestMatchStrength', 'Strongest Ratio Match', 'ratios', 'Proxy',
            safeNum(bc?.ratios.strongestMatchStrength), safeNum(ac?.ratios.strongestMatchStrength)));
    }

    // Compute largest changes
    const withDelta = items.filter((it) => it.delta !== null);
    const largestChanges = [...withDelta]
        .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
        .slice(0, 5);

    return {
        beforeTick,
        afterTick,
        activeLensId,
        items,
        largestChanges,
        cellObservationAvailable,
        globalSummaryAvailable,
        caution: 'Differences shown are observational deltas only. They do not imply causal relationships.',
        generatedAt: now,
    };
}
