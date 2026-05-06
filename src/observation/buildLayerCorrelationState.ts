/**
 * buildLayerCorrelationState.ts
 * v1.8: Causal Trace / Layer Correlation
 *
 * Pure function that computes Pearson correlations between pairs of
 * globalSummary metrics over a sliding time window.
 *
 * Design principles:
 * - Correlation is NOT causal proof.
 * - NaN is never returned — null is used for unavailable values.
 * - Returns 'insufficient' confidence when sampleCount < 3.
 * - No consciousness / emotion / life / soul / mystical claims.
 * - No LLM or API calls.
 *
 * Reference: docs/causal-trace-layer-correlation.md §4
 */

import type { LayerCorrelationState, LayerCorrelationPair } from '../types/layerCorrelation.ts';
import type { TimeReplaySnapshot } from '../types/timeReplay.ts';
import type { CausalTraceConfidence } from '../types/causalTrace.ts';

// ── BuildLayerCorrelationStateParams ──────────────────────────────────────────

export interface BuildLayerCorrelationStateParams {
    snapshots: TimeReplaySnapshot[];
    timeWindowTicks: number;
    selectedPairs?: Array<{ metricKeyA: string; metricKeyB: string; id?: string; labelA?: string; labelB?: string }>;
}

// ── Default pairs ─────────────────────────────────────────────────────────────

const DEFAULT_PAIRS: Array<{ id: string; metricKeyA: string; labelA: string; metricKeyB: string; labelB: string }> = [
    {
        id: 'curvature×vortex',
        metricKeyA: 'phaseCoherence',
        labelA: 'Phase Coherence',
        metricKeyB: 'vortexCandidateCount',
        labelB: 'Vortex Candidate Count',
    },
    {
        id: 'vortexCount×plasticity',
        metricKeyA: 'vortexCandidateCount',
        labelA: 'Vortex Candidate Count',
        metricKeyB: 'plasticityAccumulation',
        labelB: 'Plasticity Accumulation',
    },
    {
        id: 'phaseCoherence×vortexCount',
        metricKeyA: 'phaseCoherence',
        labelA: 'Phase Coherence',
        metricKeyB: 'vortexCandidateCount',
        labelB: 'Vortex Candidate Count',
    },
    {
        id: 'plasticity×observedRatio',
        metricKeyA: 'plasticityAccumulation',
        labelA: 'Plasticity Accumulation',
        metricKeyB: 'observedRatioMatchStrength',
        labelB: 'Observed Ratio Match Strength',
    },
];

// ── Pearson correlation ───────────────────────────────────────────────────────

/**
 * Compute Pearson correlation coefficient for two equal-length arrays.
 * Returns null when computation is not possible (too few samples, zero variance).
 * Never returns NaN.
 */
function pearsonCorrelation(xs: number[], ys: number[]): number | null {
    const n = xs.length;
    if (n < 3) return null;

    let sumX = 0, sumY = 0;
    for (let i = 0; i < n; i++) {
        sumX += xs[i];
        sumY += ys[i];
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    let covXY = 0, varX = 0, varY = 0;
    for (let i = 0; i < n; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        covXY += dx * dy;
        varX += dx * dx;
        varY += dy * dy;
    }

    const denom = Math.sqrt(varX * varY);
    if (denom < 1e-12) return null;

    const r = covXY / denom;

    // Safety clamp — should not be needed with finite inputs, but guards NaN
    if (!Number.isFinite(r)) return null;
    return Math.max(-1, Math.min(1, r));
}

function confidenceFromSample(n: number): CausalTraceConfidence {
    if (n < 3) return 'insufficient';
    if (n >= 20) return 'medium';
    return 'low';
}

// ── buildLayerCorrelationState ────────────────────────────────────────────────

/**
 * Compute layer correlation state from a set of snapshots.
 *
 * @param params - BuildLayerCorrelationStateParams
 * @returns LayerCorrelationState
 */
export function buildLayerCorrelationState(
    params: BuildLayerCorrelationStateParams,
): LayerCorrelationState {
    const { snapshots, timeWindowTicks, selectedPairs } = params;
    const now = Date.now();

    // Filter snapshots to time window
    let filtered = snapshots;
    if (snapshots.length > 0) {
        const latestTick = Math.max(...snapshots.map((s) => s.tick));
        const earliestAllowed = latestTick - timeWindowTicks;
        filtered = snapshots.filter((s) => s.tick >= earliestAllowed);
    }

    const snapshotCount = filtered.length;
    const earliestTick = filtered.length > 0 ? Math.min(...filtered.map((s) => s.tick)) : null;
    const latestTick = filtered.length > 0 ? Math.max(...filtered.map((s) => s.tick)) : null;
    const sufficientData = snapshotCount >= 3;

    // Resolve pairs
    const pairDefs = selectedPairs
        ? selectedPairs.map((p) => ({
            id: p.id ?? `${p.metricKeyA}×${p.metricKeyB}`,
            metricKeyA: p.metricKeyA,
            labelA: p.labelA ?? p.metricKeyA,
            metricKeyB: p.metricKeyB,
            labelB: p.labelB ?? p.metricKeyB,
        }))
        : DEFAULT_PAIRS;

    const pairs: LayerCorrelationPair[] = pairDefs.map((def) => {
        if (!sufficientData) {
            return {
                id: def.id,
                labelA: def.labelA,
                metricKeyA: def.metricKeyA,
                labelB: def.labelB,
                metricKeyB: def.metricKeyB,
                correlation: null,
                sampleCount: snapshotCount,
                confidence: 'insufficient' as CausalTraceConfidence,
                caution: 'Correlation is not causal proof. Insufficient samples for meaningful correlation.',
            };
        }

        // Extract values
        const xs: number[] = [];
        const ys: number[] = [];

        for (const snap of filtered) {
            const a = (snap.globalSummary as Record<string, number | undefined>)[def.metricKeyA];
            const b = (snap.globalSummary as Record<string, number | undefined>)[def.metricKeyB];
            if (
                typeof a === 'number' && Number.isFinite(a) &&
                typeof b === 'number' && Number.isFinite(b)
            ) {
                xs.push(a);
                ys.push(b);
            }
        }

        const correlation = pearsonCorrelation(xs, ys);

        return {
            id: def.id,
            labelA: def.labelA,
            metricKeyA: def.metricKeyA,
            labelB: def.labelB,
            metricKeyB: def.metricKeyB,
            correlation,
            sampleCount: xs.length,
            confidence: confidenceFromSample(xs.length),
            caution: 'Correlation is not causal proof.',
        };
    });

    return {
        pairs,
        timeWindowTicks,
        snapshotCount,
        earliestTick,
        latestTick,
        sufficientData,
        caution: 'Layer correlation shows statistical patterns only. Correlation is not causal proof.',
        generatedAt: now,
    };
}
