/**
 * weakPlasticity.ts
 * N5: Weak Plasticity Channel — create / update functions
 *
 * Introduces a very weak, config-gated observer-to-medium feedback path.
 * The ONLY runtime effect permitted is a fractional resistanceScale that
 * modulates localResistance — and only when all three gates are open:
 *   - config.enabled === true
 *   - config.ablationEnabled === false
 *   - config.mode === 'resistanceOnly'
 *
 * What this is NOT:
 * - Not semantic memory.        Not learning.         Not a runtime graph.
 * - Not network edges.          Not Node bridge.      Not emotion / consciousness.
 * - Not proto-network runtime.  Not fake learning.    Not LLM / API calls.
 *
 * Design:
 * - Trace accumulation is 10^-4 order or below.
 * - Decay prevents unlimited accumulation.
 * - All arithmetic is guarded against NaN / Infinity.
 * - Clamps enforce resistanceScale ∈ [minResistanceScale, maxResistanceScale].
 *
 * Reference: docs/weak-plasticity-channel.md
 */

import type { WeakPlasticityState, WeakPlasticityCellTrace } from '../types/weakPlasticity.ts';
import type { WeakPlasticityConfig } from '../config/weakPlasticityConfig.ts';
import type { VortexObservationState } from '../types/vortexCandidate.ts';
import type { RepeatedFlowPathObservationState } from '../types/repeatedFlowPath.ts';
import type { LocalExcitabilityFieldState } from '../types/localExcitabilityField.ts';
import type { MembraneObservationState } from '../types/membraneObservation.ts';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Return v if finite, else fallback. */
function safe(v: number, fallback = 0): number {
    return isFinite(v) ? v : fallback;
}

/** Clamp a value to [lo, hi]. */
function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

/**
 * Parse a regionId of the form "uI-vJ" and return [i, j].
 * Returns null if the format does not match.
 */
function parseRegionId(regionId: string): [number, number] | null {
    const m = /^u(\d+)-v(\d+)$/.exec(regionId);
    if (!m) return null;
    return [parseInt(m[1], 10), parseInt(m[2], 10)];
}

// ── createWeakPlasticityState ─────────────────────────────────────────────────

export interface CreateWeakPlasticityStateParams {
    segments: number;
    timestamp: number;
    tick: number;
}

/**
 * Create a zero-initialised WeakPlasticityState.
 *
 * - cells.length === segments * segments
 * - All trace values are 0; resistanceScale is 1.0 (neutral)
 * - regionId follows the "uI-vJ" coordinate convention
 */
export function createWeakPlasticityState(
    params: CreateWeakPlasticityStateParams
): WeakPlasticityState {
    const { segments, timestamp, tick } = params;
    const cells: WeakPlasticityCellTrace[] = [];

    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            cells.push({
                regionId: `u${i}-v${j}`,
                index: i * segments + j,
                vortexTrace: 0,
                repeatedFlowTrace: 0,
                localExcitabilityTrace: 0,
                membraneTrace: 0,
                accumulatedTrace: 0,
                resistanceDelta: 0,
                resistanceScale: 1.0,
                lastUpdatedTick: tick,
                confidence: 0,
            });
        }
    }

    return {
        timestamp,
        tick,
        segments,
        cells,
        totalAccumulation: 0,
        averageAccumulation: 0,
        maxAccumulation: 0,
        averageResistanceDelta: 0,
        maxResistanceDelta: 0,
        affectedRegionCount: 0,
        mode: 'off',
        ablationEnabled: true,
        nanOrInfinityCount: 0,
    };
}

// ── updateWeakPlasticityState ─────────────────────────────────────────────────

export interface UpdateWeakPlasticityStateParams {
    previous: WeakPlasticityState;
    vortexObservation?: VortexObservationState | null;
    repeatedFlowPaths?: RepeatedFlowPathObservationState | null;
    localExcitability?: LocalExcitabilityFieldState | null;
    membraneObservation?: MembraneObservationState | null;
    config: WeakPlasticityConfig;
    timestamp: number;
    tick: number;
    dt: number;
}

/**
 * Update WeakPlasticityState for one simulation tick.
 *
 * When config.enabled === false or config.mode === 'off', returns the previous
 * state unchanged (no-op path for zero behaviour change).
 *
 * Update order per cell:
 * 1. Decay all four trace channels.
 * 2. Add vortex-candidate contribution.
 * 3. Add repeated-flow-path contribution.
 * 4. Add local-excitability contribution.
 * 5. Add membrane contribution.
 * 6. Clamp each channel to [0, 1].
 * 7. Compute accumulatedTrace.
 * 8. Derive resistanceDelta and resistanceScale.
 *
 * Runtime feedback rule:
 * - resistanceScale is always computed (for diagnostic observation).
 * - It is only AVAILABLE to runtime code when:
 *     config.enabled && !config.ablationEnabled && config.mode === 'resistanceOnly'
 */
export function updateWeakPlasticityState(
    params: UpdateWeakPlasticityStateParams
): WeakPlasticityState {
    const {
        previous,
        vortexObservation,
        repeatedFlowPaths,
        localExcitability,
        membraneObservation,
        config,
        timestamp,
        tick,
        dt,
    } = params;

    // ── Gate 1: master switch ─────────────────────────────────────────────────
    if (!config.enabled || config.mode === 'off') {
        return {
            ...previous,
            timestamp,
            tick,
            mode: config.mode,
            ablationEnabled: config.ablationEnabled,
        };
    }

    const { segments } = previous;
    const maxDt = clamp(safe(dt, 1), 0.001, 10);
    const decayFactor = 1 - clamp(safe(config.accumulationDecayRate), 0, 1) * maxDt;
    const lr = clamp(safe(config.learningRate), 0, 0.01);
    const maxDelta = clamp(safe(config.maxDeltaPerTick), 0, 0.01);
    const confThreshold = clamp(safe(config.requireConfidenceAbove), 0, 1);
    const maxResMax = clamp(safe(config.maxResistanceScale, 1.05), 1.0, 2.0);
    const minResMin = clamp(safe(config.minResistanceScale, 0.95), 0.0, 1.0);

    // ── Build influence maps ───────────────────────────────────────────────────

    const vortexDeltaByIndex = new Float32Array(segments * segments);
    const vortexConfByIndex  = new Float32Array(segments * segments);

    if (vortexObservation?.candidates) {
        const wi = clamp(safe(config.vortexInfluence), 0, 10);
        for (const cand of vortexObservation.candidates) {
            const conf = safe(cand.confidence);
            if (conf < confThreshold) continue;
            const parsed = parseRegionId(cand.regionId);
            if (!parsed) continue;
            const [ci, cj] = parsed;
            if (ci < 0 || ci >= segments || cj < 0 || cj >= segments) continue;
            const idx = ci * segments + cj;
            const delta = clamp(lr * wi * conf, 0, maxDelta);
            vortexDeltaByIndex[idx] += delta;
            if (conf > vortexConfByIndex[idx]) {
                vortexConfByIndex[idx] = conf;
            }
        }
    }

    const rfpDeltaByIndex = new Float32Array(segments * segments);
    const rfpConfByIndex  = new Float32Array(segments * segments);

    if (repeatedFlowPaths?.candidates) {
        const wi = clamp(safe(config.repeatedFlowInfluence), 0, 10);
        for (const path of repeatedFlowPaths.candidates) {
            const conf = safe(path.confidence);
            if (conf < confThreshold) continue;

            const recurrence   = safe(path.recurrenceStrength, 0);
            const traceSupport = safe(path.traceSupport, 0);
            const replayAffin  = safe(path.replayAffinity, 0);
            const strength = (recurrence + traceSupport + replayAffin) / 3;
            const delta = clamp(lr * wi * conf * strength, 0, maxDelta);

            for (const rId of [path.fromRegionId, path.toRegionId]) {
                const parsed = parseRegionId(rId);
                if (!parsed) continue;
                const [ri, rj] = parsed;
                if (ri < 0 || ri >= segments || rj < 0 || rj >= segments) continue;
                const idx = ri * segments + rj;
                rfpDeltaByIndex[idx] += delta;
                if (conf > rfpConfByIndex[idx]) {
                    rfpConfByIndex[idx] = conf;
                }
            }
        }
    }

    const lexDeltaByIndex = new Float32Array(segments * segments);
    const lexConfByIndex  = new Float32Array(segments * segments);

    if (localExcitability?.cells) {
        const wi = clamp(safe(config.localExcitabilityInfluence), 0, 10);
        for (const cell of localExcitability.cells) {
            const conf          = safe(cell.confidence);
            const excit         = safe(cell.excitability);
            const threshProx    = safe(cell.thresholdProximity);
            const refractDepth  = safe(cell.refractoryDepth);

            if (excit < 0.5 || threshProx < 0.4 || refractDepth > 0.7) continue;
            if (conf < confThreshold) continue;

            const parsed = parseRegionId(cell.regionId);
            if (!parsed) continue;
            const [ri, rj] = parsed;
            if (ri < 0 || ri >= segments || rj < 0 || rj >= segments) continue;
            const idx = ri * segments + rj;

            const strength = excit * threshProx * (1 - refractDepth);
            const delta = clamp(lr * wi * conf * strength, 0, maxDelta);
            lexDeltaByIndex[idx] += delta;
            if (conf > lexConfByIndex[idx]) {
                lexConfByIndex[idx] = conf;
            }
        }
    }

    // membrane — global (N4 MembraneObservationState is not region-level)
    let membraneDeltaGlobal = 0;
    let membraneConfGlobal  = 0;

    if (membraneObservation) {
        const wi       = clamp(safe(config.membraneInfluence), 0, 10);
        const overlap  = safe(membraneObservation.actuationReturnOverlap);
        const twoSided = safe(membraneObservation.averageTwoSidedness);
        const obsConf  = safe(membraneObservation.observationConfidence);

        if (obsConf >= confThreshold) {
            const strength = (overlap + twoSided) / 2;
            membraneDeltaGlobal = clamp(lr * wi * obsConf * strength, 0, maxDelta);
            membraneConfGlobal  = obsConf;
        }
    }

    // ── Per-cell update ────────────────────────────────────────────────────────

    let nanCount = 0;
    let totalAccumulation    = 0;
    let maxAccumulation      = 0;
    let totalResistanceDelta = 0;
    let maxResistanceDelta   = 0;
    let affectedCount        = 0;

    const newCells: WeakPlasticityCellTrace[] = new Array(segments * segments);

    for (let idx = 0; idx < segments * segments; idx++) {
        const prev = previous.cells[idx];

        // 1. Decay
        let vt  = safe(prev.vortexTrace)            * decayFactor;
        let rft = safe(prev.repeatedFlowTrace)      * decayFactor;
        let lex = safe(prev.localExcitabilityTrace) * decayFactor;
        let mem = safe(prev.membraneTrace)          * decayFactor;

        // 2-5. Add contributions
        vt  += safe(vortexDeltaByIndex[idx]);
        rft += safe(rfpDeltaByIndex[idx]);
        lex += safe(lexDeltaByIndex[idx]);
        mem += membraneDeltaGlobal;

        // 6. Clamp each channel to [0, 1]
        vt  = clamp(vt,  0, 1);
        rft = clamp(rft, 0, 1);
        lex = clamp(lex, 0, 1);
        mem = clamp(mem, 0, 1);

        // 7. Accumulated trace
        const acc = vt + rft + lex + mem;

        // 8. Resistance delta: concentrated flow → slightly more permeable
        const maxDeltaRange = 4 * maxDelta * 100;
        const resistanceDelta = -clamp(acc, 0, maxDeltaRange);
        const resistanceScale  = clamp(1 + resistanceDelta, minResMin, maxResMax);

        // 9. NaN guard
        const cellHasNaN = !isFinite(vt) || !isFinite(rft) || !isFinite(lex)
            || !isFinite(mem) || !isFinite(acc) || !isFinite(resistanceDelta)
            || !isFinite(resistanceScale);
        if (cellHasNaN) nanCount++;

        // 10. Cell confidence
        const cellConf = Math.max(
            safe(vortexConfByIndex[idx]),
            safe(rfpConfByIndex[idx]),
            safe(lexConfByIndex[idx]),
            membraneConfGlobal,
        );

        newCells[idx] = {
            regionId:                prev.regionId,
            index:                   idx,
            vortexTrace:             cellHasNaN ? 0 : vt,
            repeatedFlowTrace:       cellHasNaN ? 0 : rft,
            localExcitabilityTrace:  cellHasNaN ? 0 : lex,
            membraneTrace:           cellHasNaN ? 0 : mem,
            accumulatedTrace:        cellHasNaN ? 0 : acc,
            resistanceDelta:         cellHasNaN ? 0 : resistanceDelta,
            resistanceScale:         cellHasNaN ? 1 : resistanceScale,
            lastUpdatedTick:         tick,
            confidence:              clamp(cellConf, 0, 1),
        };

        const safeAcc = cellHasNaN ? 0 : acc;
        totalAccumulation += safeAcc;
        if (safeAcc > maxAccumulation) maxAccumulation = safeAcc;
        if (safeAcc > 0) affectedCount++;

        const safeRd = cellHasNaN ? 0 : Math.abs(resistanceDelta);
        totalResistanceDelta += cellHasNaN ? 0 : resistanceDelta;
        if (safeRd > maxResistanceDelta) maxResistanceDelta = safeRd;
    }

    const n = segments * segments;

    return {
        timestamp,
        tick,
        segments,
        cells:                newCells,
        totalAccumulation,
        averageAccumulation:  n > 0 ? totalAccumulation / n : 0,
        maxAccumulation,
        averageResistanceDelta: n > 0 ? totalResistanceDelta / n : 0,
        maxResistanceDelta,
        affectedRegionCount:  affectedCount,
        mode:                 config.mode,
        ablationEnabled:      config.ablationEnabled,
        nanOrInfinityCount:   nanCount,
    };
}

// ── Runtime access helper ─────────────────────────────────────────────────────

/**
 * Return the resistanceScale for a cell if runtime feedback is permitted,
 * otherwise return 1.0 (neutral — no effect on base resistance).
 *
 * Runtime feedback is only permitted when:
 *   - config.enabled === true
 *   - config.ablationEnabled === false
 *   - config.mode === 'resistanceOnly'
 *
 * Usage in dynamicCore (minimal):
 *   const scale = getResistanceScale(plasticityState, config, cellIndex);
 *   effectiveResistance = baseResistance * scale;
 */
export function getResistanceScale(
    state: WeakPlasticityState,
    config: WeakPlasticityConfig,
    cellIndex: number
): number {
    if (!config.enabled) return 1.0;
    if (config.ablationEnabled) return 1.0;
    if (config.mode !== 'resistanceOnly') return 1.0;
    const cell = state.cells[cellIndex];
    if (!cell) return 1.0;
    return clamp(safe(cell.resistanceScale, 1.0), 0.5, 2.0);
}
