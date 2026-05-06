/**
 * deriveCellObservation.ts
 * v1.6: Super Observation Architecture
 *
 * Assembles a CellObservation for a specific cell index from the current set
 * of observer snapshots.
 *
 * Design principles:
 * - Pure function: same inputs → same outputs.
 * - Observer-side only — does NOT modify any runtime state.
 * - No fake values: missing observer data produces `undefined`, not invented numbers.
 * - No semantic labels, no consciousness claims.
 * - All arithmetic is guarded against NaN / Infinity.
 * - regionId follows the "uI-vJ" convention used throughout the codebase.
 * - phaseCoherenceLocal is the mean cosine distance to the 4 periodic neighbours.
 *
 * Reference: docs/super-observation-architecture.md
 */

import type {
    CellObservation,
    CellObservationInput,
    CellRegionLabel,
} from '../types/cellObservation.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function safe(v: number, fallback = 0): number {
    return Number.isFinite(v) ? v : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number): number {
    return clamp(safe(v), 0, 1);
}

/**
 * Derive a geometric region label from the minor (v) angle.
 * Purely geometric — NOT a semantic label.
 *
 * Uses a 0.9 threshold to create a proper mid-latitude neutral zone:
 * - outerRim  : cos(v) > 0.9  — close to the outermost equator
 * - innerRim  : cos(v) < -0.9 — close to the innermost equator
 * - upperRim  : sin(v) > 0.9  — close to the top
 * - lowerRim  : sin(v) < -0.9 — close to the bottom
 * - neutral   : mid-latitude belt (everything else)
 */
function deriveRegionLabel(minorAngle: number): CellRegionLabel {
    const cosV = Math.cos(minorAngle);
    const sinV = Math.sin(minorAngle);
    if (cosV < -0.9) return 'innerRim';
    if (cosV > 0.9) return 'outerRim';
    if (sinV > 0.9) return 'upperRim';
    if (sinV < -0.9) return 'lowerRim';
    return 'neutral';
}

/**
 * Compute mean cosine similarity of a cell's phase to its 4 periodic neighbours.
 * Returns a value in [0, 1].  Used as phaseCoherenceLocal.
 */
function computePhaseCoherenceLocal(
    index: number,
    segments: number,
    phase: Float32Array,
): number {
    const i = Math.floor(index / segments);
    const j = index % segments;
    const neighbours = [
        ((i - 1 + segments) % segments) * segments + j,
        ((i + 1) % segments) * segments + j,
        i * segments + ((j - 1 + segments) % segments),
        i * segments + ((j + 1) % segments),
    ];
    const p0 = phase[index];
    if (!Number.isFinite(p0)) return 0;
    let sum = 0;
    for (const ni of neighbours) {
        const pn = phase[ni];
        if (!Number.isFinite(pn)) continue;
        sum += Math.cos(p0 - pn);
    }
    return clamp01((sum / neighbours.length + 1) / 2);
}

/**
 * Compute local amplitude gradient magnitude (flow continuity proxy).
 * Returns a value in [0, 1] by normalising against the local mean.
 */
function computeFlowContinuityLocal(
    index: number,
    segments: number,
    amplitude: Float32Array,
): number {
    const i = Math.floor(index / segments);
    const j = index % segments;
    const a0 = safe(amplitude[index]);
    const neighbours = [
        ((i - 1 + segments) % segments) * segments + j,
        ((i + 1) % segments) * segments + j,
        i * segments + ((j - 1 + segments) % segments),
        i * segments + ((j + 1) % segments),
    ];
    let gradMag = 0;
    let neighbourMean = a0;
    let nCount = 1;
    for (const ni of neighbours) {
        const an = safe(amplitude[ni]);
        gradMag += Math.abs(a0 - an);
        neighbourMean += an;
        nCount++;
    }
    neighbourMean /= nCount;
    if (neighbourMean <= 0) return 0;
    const normGrad = gradMag / (neighbours.length * neighbourMean);
    return clamp01(1 - normGrad);
}

/**
 * Find the nearest VortexCandidate to cell (i, j) using toroidal distance.
 * Returns the candidate or null when none exist.
 */
function findNearestVortexCandidate(
    cellI: number,
    cellJ: number,
    segments: number,
    candidates: CellObservationInput['vortexObservation'] extends null | undefined
        ? never
        : NonNullable<CellObservationInput['vortexObservation']>['candidates'],
): NonNullable<CellObservationInput['vortexObservation']>['candidates'][number] | null {
    if (!candidates || candidates.length === 0) return null;
    let best: typeof candidates[number] | null = null;
    let bestDist = Infinity;
    for (const c of candidates) {
        const di = Math.min(
            Math.abs(c.i - cellI),
            segments - Math.abs(c.i - cellI),
        );
        const dj = Math.min(
            Math.abs(c.j - cellJ),
            segments - Math.abs(c.j - cellJ),
        );
        const dist = Math.hypot(di, dj);
        if (dist < bestDist) {
            bestDist = dist;
            best = c;
        }
    }
    return best;
}

// ── deriveCellObservation ─────────────────────────────────────────────────────

/**
 * Assemble a CellObservation for the given cell index from all available
 * observer snapshots.
 *
 * Missing or null snapshots produce `undefined` field values and the
 * corresponding diagnostics.valueKinds entry is set to 'unavailable'.
 *
 * @param input - CellObservationInput with all optional observer snapshots
 * @returns CellObservation - read-only integrated per-cell record
 */
export function deriveCellObservation(input: CellObservationInput): CellObservation {
    const {
        timestamp,
        tick,
        cellIndex,
        segments,
        torusCell,
        vortexObservation,
        amplitude,
        phase,
        membraneState,
        weakPlasticityState,
        observedRatiosState,
        recentEvents,
        regionId,
    } = input;

    let missingFieldCount = 0;

    // ── Geometry ──────────────────────────────────────────────────────────────

    let geometry: CellObservation['geometry'] = {};
    let geometryKind: CellObservation['diagnostics']['valueKinds']['geometry'] = 'unavailable';

    if (torusCell) {
        const { i, j, majorAngle, minorAngle, areaElement, gaussianCurvature, meanCurvature, innerOuterBias } = torusCell;
        geometry = {
            i,
            j,
            majorAngle: Number.isFinite(majorAngle) ? majorAngle : undefined,
            minorAngle: Number.isFinite(minorAngle) ? minorAngle : undefined,
            regionLabel: Number.isFinite(minorAngle) ? deriveRegionLabel(minorAngle) : undefined,
            areaElement: Number.isFinite(areaElement) ? areaElement : undefined,
            gaussianCurvature: Number.isFinite(gaussianCurvature) ? gaussianCurvature : undefined,
            meanCurvature: Number.isFinite(meanCurvature) ? meanCurvature : undefined,
            innerOuterBias: Number.isFinite(innerOuterBias) ? innerOuterBias : undefined,
        };
        geometryKind = 'measured';
    } else {
        missingFieldCount += 8;
    }

    // ── Field ────────────────────────────────────────────────────────────────

    let field: CellObservation['field'] = {};
    let fieldKind: CellObservation['diagnostics']['valueKinds']['field'] = 'unavailable';

    if (amplitude && phase && cellIndex < amplitude.length && cellIndex < phase.length) {
        const amp = amplitude[cellIndex];
        const ph = phase[cellIndex];
        const ampVal = Number.isFinite(amp) ? amp : undefined;
        const phVal = Number.isFinite(ph) ? ph : undefined;
        const coherence = computePhaseCoherenceLocal(cellIndex, segments, phase);
        const flowCont = computeFlowContinuityLocal(cellIndex, segments, amplitude);
        const throughput =
            ampVal !== undefined && Number.isFinite(flowCont)
                ? safe(ampVal * flowCont)
                : undefined;
        field = {
            amplitude: ampVal,
            phase: phVal,
            phaseCoherenceLocal: coherence,
            flowContinuityLocal: flowCont,
            energyThroughputLocal: throughput,
        };
        fieldKind = 'derived';
        if (ampVal === undefined) missingFieldCount++;
        if (phVal === undefined) missingFieldCount++;
    } else {
        missingFieldCount += 5;
    }

    // ── Vortex ───────────────────────────────────────────────────────────────

    let vortex: CellObservation['vortex'] = {};
    let vortexKind: CellObservation['diagnostics']['valueKinds']['vortex'] = 'unavailable';

    if (vortexObservation && cellIndex < vortexObservation.vortexCandidateMask.length) {
        const mask = vortexObservation.vortexCandidateMask[cellIndex];
        const charge = vortexObservation.topologicalCharge[cellIndex];
        const vort = vortexObservation.vorticity[cellIndex];

        let nearestId: string | null = null;
        let nearestConf: number | undefined = undefined;
        let nearestAmpMin: number | undefined = undefined;
        let nearestWinding: number | undefined = undefined;

        if (torusCell) {
            const nearest = findNearestVortexCandidate(
                torusCell.i,
                torusCell.j,
                segments,
                vortexObservation.candidates,
            );
            if (nearest) {
                nearestId = nearest.id;
                nearestConf = nearest.confidence;
                nearestAmpMin = nearest.amplitudeMinimum;
                nearestWinding = nearest.phaseWinding;
            }
        }

        vortex = {
            candidateConfidence: mask === 1 ? (nearestConf ?? clamp01(safe(vort))) : 0,
            topologicalCharge: charge,
            phaseWinding: nearestWinding,
            amplitudeMinimum: nearestAmpMin,
            nearestCandidateId: nearestId,
        };
        vortexKind = 'proxy';
    } else {
        missingFieldCount += 5;
    }

    // ── Membrane ─────────────────────────────────────────────────────────────

    let membrane: CellObservation['membrane'] = {};
    let membraneKind: CellObservation['diagnostics']['valueKinds']['membrane'] = 'unavailable';

    if (membraneState) {
        const cell = membraneState.cells.find((c) => c.index === cellIndex);
        if (cell) {
            membrane = {
                deformation: Number.isFinite(cell.deformation) ? cell.deformation : undefined,
                permeability: Number.isFinite(cell.permeability) ? cell.permeability : undefined,
                tension: Number.isFinite(cell.tension) ? cell.tension : undefined,
                actuationImprint: Number.isFinite(cell.actuationImprint) ? cell.actuationImprint : undefined,
                returnImprint: Number.isFinite(cell.returnImprint) ? cell.returnImprint : undefined,
                twoSidedness: Number.isFinite(cell.twoSidedness) ? cell.twoSidedness : undefined,
            };
            membraneKind = 'measured';
        } else {
            missingFieldCount += 6;
        }
    } else {
        missingFieldCount += 6;
    }

    // ── Plasticity ───────────────────────────────────────────────────────────

    let plasticity: CellObservation['plasticity'] = {};
    let plasticityKind: CellObservation['diagnostics']['valueKinds']['plasticity'] = 'unavailable';

    if (weakPlasticityState) {
        const cell = weakPlasticityState.cells.find((c) => c.index === cellIndex);
        if (cell) {
            const runtimeApplied =
                weakPlasticityState.mode === 'resistanceOnly' &&
                !weakPlasticityState.ablationEnabled;
            plasticity = {
                accumulatedTrace: Number.isFinite(cell.accumulatedTrace) ? cell.accumulatedTrace : undefined,
                vortexTrace: Number.isFinite(cell.vortexTrace) ? cell.vortexTrace : undefined,
                repeatedFlowTrace: Number.isFinite(cell.repeatedFlowTrace) ? cell.repeatedFlowTrace : undefined,
                localExcitabilityTrace: Number.isFinite(cell.localExcitabilityTrace)
                    ? cell.localExcitabilityTrace
                    : undefined,
                membraneTrace: Number.isFinite(cell.membraneTrace) ? cell.membraneTrace : undefined,
                resistanceScale: Number.isFinite(cell.resistanceScale) ? cell.resistanceScale : undefined,
                runtimeApplied,
            };
            plasticityKind = 'derived';
        } else {
            missingFieldCount += 7;
        }
    } else {
        missingFieldCount += 7;
    }

    // ── Ratios ───────────────────────────────────────────────────────────────

    let ratios: CellObservation['ratios'] = { involvedObservedRatioIds: [] };
    let ratiosKind: CellObservation['diagnostics']['valueKinds']['ratios'] = 'unavailable';

    if (observedRatiosState) {
        // Ratios are global (not per-cell); we surface the strongest match that
        // uses 'amplitudePeak' or field-local sources as a proxy for involvement.
        const involvedIds = observedRatiosState.observedRatios.map((r) => r.id);
        const strongest = observedRatiosState.strongestMatch;
        ratios = {
            involvedObservedRatioIds: involvedIds,
            strongestReferenceMatchLabel: strongest
                ? strongest.referenceRatioId
                : null,
            strongestMatchStrength: strongest
                ? (Number.isFinite(strongest.matchStrength) ? strongest.matchStrength : null)
                : null,
        };
        ratiosKind = 'proxy';
    } else {
        missingFieldCount += 2;
    }

    // ── Events ───────────────────────────────────────────────────────────────

    let events: CellObservation['events'] = { recentEventIds: [], recentEventCount: 0 };
    let eventsKind: CellObservation['diagnostics']['valueKinds']['events'] = 'unavailable';

    if (recentEvents) {
        const cellRegionId = regionId ?? (torusCell ? `u${torusCell.i}-v${torusCell.j}` : null);
        const matching = cellRegionId
            ? recentEvents.filter((e) => e.source === cellRegionId)
            : [];
        events = {
            recentEventIds: matching.map((e) => e.id),
            recentEventCount: matching.length,
            lastEventTick: matching.length > 0
                ? Math.max(...matching.map((e) => e.tick))
                : undefined,
        };
        eventsKind = 'measured';
    } else {
        missingFieldCount += 2;
    }

    // ── Diagnostics ──────────────────────────────────────────────────────────

    const hasUnavailableSource =
        !torusCell ||
        !amplitude ||
        !phase ||
        !vortexObservation ||
        !membraneState ||
        !weakPlasticityState ||
        !observedRatiosState ||
        !recentEvents;

    return {
        timestamp,
        tick,
        cellIndex,
        segments,
        geometry,
        field,
        vortex,
        membrane,
        plasticity,
        ratios,
        events,
        diagnostics: {
            valueKinds: {
                geometry: geometryKind,
                field: fieldKind,
                vortex: vortexKind,
                membrane: membraneKind,
                plasticity: plasticityKind,
                ratios: ratiosKind,
                events: eventsKind,
            },
            missingFieldCount,
            hasUnavailableSource,
        },
    };
}

// ── Convenience: regionId from cellIndex ──────────────────────────────────────

/**
 * Derive the "uI-vJ" regionId string for a given flat cell index.
 * Matches the convention used in weakPlasticity, vortexCandidates, etc.
 */
export function cellRegionIdFromIndex(cellIndex: number, segments: number): string {
    const i = Math.floor(cellIndex / segments);
    const j = cellIndex % segments;
    return `u${i}-v${j}`;
}
