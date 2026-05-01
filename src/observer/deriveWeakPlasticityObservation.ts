/**
 * deriveWeakPlasticityObservation.ts
 * N5: Weak Plasticity Channel — observer summary derivation
 *
 * Derives WeakPlasticityObservationState from a WeakPlasticityState snapshot.
 * This is an observer-side read-only operation. It does NOT modify the
 * WeakPlasticityState or any runtime simulation state.
 *
 * Design principles:
 * - Pure function: same inputs → same outputs.
 * - No semantic labels, no learning claims, no runtime graph.
 * - All values guarded against NaN / Infinity.
 * - plasticitySaturationRisk and plasticityDormancyRisk are proxies only.
 *
 * Reference: docs/weak-plasticity-channel.md
 */

import type { WeakPlasticityState } from '../types/weakPlasticity.ts';
import type { WeakPlasticityObservationState } from '../types/weakPlasticityObservation.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function safe(v: number, fallback = 0): number {
    return isFinite(v) ? v : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

// ── deriveWeakPlasticityObservation ──────────────────────────────────────────

/**
 * Derive a WeakPlasticityObservationState from a WeakPlasticityState snapshot.
 *
 * vortexContribution / repeatedFlowContribution / localExcitabilityContribution
 * / membraneContribution are expressed as fractions of totalAccumulation.
 * When totalAccumulation is 0, all contribution fractions are 0.
 *
 * plasticitySaturationRisk: ratio of maxAccumulation to the saturation ceiling
 *   (heuristic: acc ≥ 4 means all four channels near maximum).
 *
 * plasticityDormancyRisk: inverse proxy — high when totalAccumulation is very small
 *   relative to the number of cells.
 *
 * observationConfidence: reflects whether cells array is non-empty and the
 *   WeakPlasticityState is in a valid (non-off) mode.
 */
export function deriveWeakPlasticityObservation(
    state: WeakPlasticityState
): WeakPlasticityObservationState {
    const { cells, timestamp, tick, mode, ablationEnabled, nanOrInfinityCount } = state;
    const n = cells.length;

    if (n === 0 || mode === 'off') {
        return {
            timestamp,
            tick,
            totalAccumulation: 0,
            averageAccumulation: 0,
            maxAccumulation: 0,
            affectedRegionCount: 0,
            averageResistanceScale: 1.0,
            minResistanceScale: 1.0,
            maxResistanceScale: 1.0,
            vortexContribution: 0,
            repeatedFlowContribution: 0,
            localExcitabilityContribution: 0,
            membraneContribution: 0,
            plasticitySaturationRisk: 0,
            plasticityDormancyRisk: 1,
            ablationEnabled,
            mode,
            observationConfidence: 0,
            nanOrInfinityCount: safe(nanOrInfinityCount),
        };
    }

    let totalVortex    = 0;
    let totalRfp       = 0;
    let totalLex       = 0;
    let totalMem       = 0;
    let totalAcc       = 0;
    let maxAcc         = 0;
    let totalResScale  = 0;
    let minResScale    = 2.0;
    let maxResScale    = 0.0;
    let affectedCount  = 0;

    for (const cell of cells) {
        const vt  = safe(cell.vortexTrace);
        const rft = safe(cell.repeatedFlowTrace);
        const lex = safe(cell.localExcitabilityTrace);
        const mem = safe(cell.membraneTrace);
        const acc = safe(cell.accumulatedTrace);
        const rs  = safe(cell.resistanceScale, 1.0);

        totalVortex   += vt;
        totalRfp      += rft;
        totalLex      += lex;
        totalMem      += mem;
        totalAcc      += acc;
        totalResScale += rs;

        if (acc > maxAcc) maxAcc = acc;
        if (rs < minResScale) minResScale = rs;
        if (rs > maxResScale) maxResScale = rs;
        if (acc > 0) affectedCount++;
    }

    // If no cells had non-zero rs, reset min/max to 1.0
    // Sentinels: min init was 2.0 (above any valid value), max init was 0.0 (below any valid value)
    const UNINITIALIZED_MIN_SENTINEL = 1.5; // if min stayed above this, no real cell updated it
    const UNINITIALIZED_MAX_SENTINEL = 0.5; // if max stayed below this, no real cell updated it
    if (minResScale > UNINITIALIZED_MIN_SENTINEL) minResScale = 1.0;
    if (maxResScale < UNINITIALIZED_MAX_SENTINEL) maxResScale = 1.0;

    const avgAcc      = totalAcc / n;
    const avgResScale = totalResScale / n;

    // Contribution fractions
    const totalChannels = totalVortex + totalRfp + totalLex + totalMem;
    const vortexFrac  = totalChannels > 0 ? clamp(totalVortex / totalChannels, 0, 1) : 0;
    const rfpFrac     = totalChannels > 0 ? clamp(totalRfp    / totalChannels, 0, 1) : 0;
    const lexFrac     = totalChannels > 0 ? clamp(totalLex    / totalChannels, 0, 1) : 0;
    const memFrac     = totalChannels > 0 ? clamp(totalMem    / totalChannels, 0, 1) : 0;

    // plasticitySaturationRisk: 0 when maxAcc < 0.1, 1 when maxAcc ≥ 4 (all channels near 1)
    const SATURATION_CEILING = 4.0;
    const satRisk = clamp(maxAcc / SATURATION_CEILING, 0, 1);

    // plasticityDormancyRisk: high when avgAcc is very small
    // Full dormancy risk at avgAcc=0; near-zero at avgAcc ≥ DORMANCY_THRESHOLD.
    // DORMANCY_THRESHOLD is set to 10× the default accumulationDecayRate (1e-5),
    // representing one decay cycle worth of minimum meaningful accumulation.
    const DORMANCY_THRESHOLD = 0.001;
    const dormancyRisk = clamp(1 - Math.min(avgAcc / DORMANCY_THRESHOLD, 1), 0, 1);

    // observationConfidence: non-zero only when state is in a live mode
    const isLiveMode = mode !== 'off';
    const observationConfidence = isLiveMode ? clamp(1 - (safe(nanOrInfinityCount) / Math.max(n, 1)), 0, 1) : 0;

    return {
        timestamp,
        tick,
        totalAccumulation:              totalAcc,
        averageAccumulation:            avgAcc,
        maxAccumulation:                maxAcc,
        affectedRegionCount:            affectedCount,
        averageResistanceScale:         avgResScale,
        minResistanceScale:             minResScale,
        maxResistanceScale:             maxResScale,
        vortexContribution:             vortexFrac,
        repeatedFlowContribution:       rfpFrac,
        localExcitabilityContribution:  lexFrac,
        membraneContribution:           memFrac,
        plasticitySaturationRisk:       satRisk,
        plasticityDormancyRisk:         dormancyRisk,
        ablationEnabled,
        mode,
        observationConfidence,
        nanOrInfinityCount:             safe(nanOrInfinityCount),
    };
}
