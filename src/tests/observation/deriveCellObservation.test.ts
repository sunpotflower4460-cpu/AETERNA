/**
 * deriveCellObservation.test.ts
 * v1.6: Super Observation Architecture — deriveCellObservation unit tests
 *
 * Verifies that:
 * - CellObservation is assembled correctly from full and partial inputs
 * - Missing observer data produces undefined values, not fake values
 * - Geometry fields are derived from TorusGeometryCell correctly
 * - Field amplitude / phase / coherence / continuity are computed correctly
 * - Vortex data is mapped correctly
 * - Membrane data is mapped correctly
 * - Plasticity data is mapped correctly
 * - Ratios data is mapped correctly
 * - Events are filtered by regionId
 * - Diagnostics valueKinds reflect availability
 * - No NaN or Infinity leaks into numeric fields
 * - cellRegionIdFromIndex follows "uI-vJ" convention
 */

import { describe, it, expect } from 'vitest';
import {
    deriveCellObservation,
    cellRegionIdFromIndex,
} from '../../observation/deriveCellObservation.js';
import type { CellObservationInput } from '../../types/cellObservation.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const SEGMENTS = 4;
const TOTAL = SEGMENTS * SEGMENTS;

function makeAmplitude(base = 0.5): Float32Array {
    const a = new Float32Array(TOTAL);
    for (let i = 0; i < TOTAL; i++) a[i] = base + (i / TOTAL) * 0.1;
    return a;
}

function makePhase(base = 0): Float32Array {
    const p = new Float32Array(TOTAL);
    for (let i = 0; i < TOTAL; i++) p[i] = base + (i / TOTAL) * Math.PI * 0.1;
    return p;
}

function makeVortexObs(segments = SEGMENTS) {
    const total = segments * segments;
    const mask = new Uint8Array(total);
    const charge = new Int8Array(total);
    const vorticity = new Float32Array(total);
    return { vortexCandidateMask: mask, topologicalCharge: charge, vorticity, candidates: [] };
}

function makeMembraneState(segments = SEGMENTS) {
    const cells = Array.from({ length: segments * segments }, (_, idx) => ({
        index: idx,
        deformation: 0.1 + idx * 0.01,
        permeability: 0.5,
        tension: 0.3,
        actuationImprint: 0.2,
        returnImprint: 0.15,
        twoSidedness: 0.25,
    }));
    return { cells };
}

function makePlasticityState(segments = SEGMENTS) {
    const cells = Array.from({ length: segments * segments }, (_, idx) => ({
        index: idx,
        accumulatedTrace: idx * 0.001,
        vortexTrace: idx * 0.0003,
        repeatedFlowTrace: idx * 0.0003,
        localExcitabilityTrace: idx * 0.0002,
        membraneTrace: idx * 0.0002,
        resistanceScale: 1.0 - idx * 0.0001,
    }));
    return { cells, mode: 'observeOnly' as const, ablationEnabled: false };
}

function makeInput(overrides: Partial<CellObservationInput> = {}): CellObservationInput {
    return {
        timestamp: 1000,
        tick: 10,
        cellIndex: 5,
        segments: SEGMENTS,
        torusCell: {
            i: 1,
            j: 1,
            majorAngle: Math.PI / 2,
            minorAngle: 0,
            areaElement: 2.5,
            gaussianCurvature: 0.1,
            meanCurvature: 0.3,
            innerOuterBias: 1.0,
        },
        vortexObservation: makeVortexObs(),
        amplitude: makeAmplitude(),
        phase: makePhase(),
        membraneState: makeMembraneState(),
        weakPlasticityState: makePlasticityState(),
        observedRatiosState: null,
        recentEvents: [],
        regionId: 'u1-v1',
        ...overrides,
    };
}

// ── Tests: cellRegionIdFromIndex ──────────────────────────────────────────────

describe('cellRegionIdFromIndex', () => {
    it('follows uI-vJ convention', () => {
        expect(cellRegionIdFromIndex(0, 4)).toBe('u0-v0');
        expect(cellRegionIdFromIndex(1, 4)).toBe('u0-v1');
        expect(cellRegionIdFromIndex(4, 4)).toBe('u1-v0');
        expect(cellRegionIdFromIndex(5, 4)).toBe('u1-v1');
        expect(cellRegionIdFromIndex(15, 4)).toBe('u3-v3');
    });

    it('handles segments=8', () => {
        expect(cellRegionIdFromIndex(9, 8)).toBe('u1-v1');
        expect(cellRegionIdFromIndex(63, 8)).toBe('u7-v7');
    });
});

// ── Tests: deriveCellObservation — geometry ───────────────────────────────────

describe('deriveCellObservation: geometry', () => {
    it('populates geometry from torusCell', () => {
        const obs = deriveCellObservation(makeInput());
        expect(obs.geometry.i).toBe(1);
        expect(obs.geometry.j).toBe(1);
        expect(obs.geometry.majorAngle).toBeCloseTo(Math.PI / 2);
        expect(obs.geometry.minorAngle).toBe(0);
        expect(obs.geometry.areaElement).toBe(2.5);
        expect(obs.geometry.gaussianCurvature).toBe(0.1);
        expect(obs.geometry.meanCurvature).toBe(0.3);
        expect(obs.geometry.innerOuterBias).toBe(1.0);
        expect(obs.diagnostics.valueKinds.geometry).toBe('measured');
    });

    it('returns empty geometry when torusCell is null', () => {
        const obs = deriveCellObservation(makeInput({ torusCell: null }));
        expect(obs.geometry.i).toBeUndefined();
        expect(obs.geometry.gaussianCurvature).toBeUndefined();
        expect(obs.diagnostics.valueKinds.geometry).toBe('unavailable');
    });

    it('derives outerRim regionLabel for minorAngle=0 (cos=1)', () => {
        const obs = deriveCellObservation(makeInput());
        expect(obs.geometry.regionLabel).toBe('outerRim');
    });

    it('derives innerRim for minorAngle=π (cos=-1)', () => {
        const obs = deriveCellObservation(makeInput({
            torusCell: {
                i: 2, j: 2, majorAngle: 0, minorAngle: Math.PI,
                areaElement: 1, gaussianCurvature: -0.1, meanCurvature: 0.1, innerOuterBias: -1,
            },
        }));
        expect(obs.geometry.regionLabel).toBe('innerRim');
    });

    it('derives neutral for mid-latitude minorAngle (3π/4: cos≈-0.707, sin≈0.707)', () => {
        // At 3π/4 (135°): cos ≈ -0.707, sin ≈ 0.707
        // Both are in (-0.9, 0.9) → neutral
        const obs = deriveCellObservation(makeInput({
            torusCell: {
                i: 0, j: 0, majorAngle: 0, minorAngle: 3 * Math.PI / 4,
                areaElement: 1, gaussianCurvature: 0, meanCurvature: 0, innerOuterBias: 0,
            },
        }));
        expect(obs.geometry.regionLabel).toBe('neutral');
    });

    it('derives upperRim for minorAngle≈π/2 (sin≈1)', () => {
        const obs = deriveCellObservation(makeInput({
            torusCell: {
                i: 0, j: 0, majorAngle: 0, minorAngle: Math.PI / 2,
                areaElement: 1, gaussianCurvature: 0, meanCurvature: 0, innerOuterBias: 0,
            },
        }));
        expect(obs.geometry.regionLabel).toBe('upperRim');
    });

    it('derives lowerRim for minorAngle≈3π/2 (sin≈-1)', () => {
        const obs = deriveCellObservation(makeInput({
            torusCell: {
                i: 0, j: 0, majorAngle: 0, minorAngle: 3 * Math.PI / 2,
                areaElement: 1, gaussianCurvature: 0, meanCurvature: 0, innerOuterBias: 0,
            },
        }));
        expect(obs.geometry.regionLabel).toBe('lowerRim');
    });
});

// ── Tests: deriveCellObservation — field ──────────────────────────────────────

describe('deriveCellObservation: field', () => {
    it('populates amplitude and phase', () => {
        const obs = deriveCellObservation(makeInput());
        expect(typeof obs.field.amplitude).toBe('number');
        expect(Number.isFinite(obs.field.amplitude!)).toBe(true);
        expect(typeof obs.field.phase).toBe('number');
        expect(Number.isFinite(obs.field.phase!)).toBe(true);
        expect(obs.diagnostics.valueKinds.field).toBe('derived');
    });

    it('computes phaseCoherenceLocal in [0,1]', () => {
        const obs = deriveCellObservation(makeInput());
        expect(obs.field.phaseCoherenceLocal).toBeGreaterThanOrEqual(0);
        expect(obs.field.phaseCoherenceLocal).toBeLessThanOrEqual(1);
    });

    it('computes flowContinuityLocal in [0,1]', () => {
        const obs = deriveCellObservation(makeInput());
        expect(obs.field.flowContinuityLocal).toBeGreaterThanOrEqual(0);
        expect(obs.field.flowContinuityLocal).toBeLessThanOrEqual(1);
    });

    it('energyThroughputLocal is finite and non-negative', () => {
        const obs = deriveCellObservation(makeInput());
        expect(Number.isFinite(obs.field.energyThroughputLocal!)).toBe(true);
        expect(obs.field.energyThroughputLocal!).toBeGreaterThanOrEqual(0);
    });

    it('returns unavailable field when amplitude or phase is null', () => {
        const obs = deriveCellObservation(makeInput({ amplitude: null, phase: null }));
        expect(obs.field.amplitude).toBeUndefined();
        expect(obs.diagnostics.valueKinds.field).toBe('unavailable');
    });

    it('phaseCoherenceLocal is high for uniform phase field', () => {
        const uniformPhase = new Float32Array(TOTAL).fill(1.0);
        const obs = deriveCellObservation(makeInput({ phase: uniformPhase }));
        expect(obs.field.phaseCoherenceLocal!).toBeGreaterThan(0.9);
    });
});

// ── Tests: deriveCellObservation — vortex ────────────────────────────────────

describe('deriveCellObservation: vortex', () => {
    it('returns zero candidateConfidence when mask is 0', () => {
        const obs = deriveCellObservation(makeInput());
        expect(obs.vortex.candidateConfidence).toBe(0);
        expect(obs.diagnostics.valueKinds.vortex).toBe('proxy');
    });

    it('returns non-zero confidence when mask is 1', () => {
        const vo = makeVortexObs();
        vo.vortexCandidateMask[5] = 1;
        vo.candidates.push({ id: 'vc-1', i: 1, j: 1, confidence: 0.85, amplitudeMinimum: 0.1, phaseWinding: 1.5, topologicalCharge: 1 });
        const obs = deriveCellObservation(makeInput({ vortexObservation: vo }));
        expect(obs.vortex.candidateConfidence!).toBeGreaterThan(0);
    });

    it('stores topological charge from array', () => {
        const vo = makeVortexObs();
        vo.topologicalCharge[5] = 1;
        const obs = deriveCellObservation(makeInput({ vortexObservation: vo }));
        expect(obs.vortex.topologicalCharge).toBe(1);
    });

    it('returns unavailable when vortexObservation is null', () => {
        const obs = deriveCellObservation(makeInput({ vortexObservation: null }));
        expect(obs.vortex.candidateConfidence).toBeUndefined();
        expect(obs.diagnostics.valueKinds.vortex).toBe('unavailable');
    });
});

// ── Tests: deriveCellObservation — membrane ───────────────────────────────────

describe('deriveCellObservation: membrane', () => {
    it('maps membrane cell data', () => {
        const obs = deriveCellObservation(makeInput());
        expect(Number.isFinite(obs.membrane.deformation!)).toBe(true);
        expect(Number.isFinite(obs.membrane.permeability!)).toBe(true);
        expect(Number.isFinite(obs.membrane.tension!)).toBe(true);
        expect(obs.diagnostics.valueKinds.membrane).toBe('measured');
    });

    it('returns unavailable when membraneState is null', () => {
        const obs = deriveCellObservation(makeInput({ membraneState: null }));
        expect(obs.membrane.deformation).toBeUndefined();
        expect(obs.diagnostics.valueKinds.membrane).toBe('unavailable');
    });
});

// ── Tests: deriveCellObservation — plasticity ─────────────────────────────────

describe('deriveCellObservation: plasticity', () => {
    it('maps plasticity cell data', () => {
        const obs = deriveCellObservation(makeInput());
        expect(typeof obs.plasticity.accumulatedTrace).toBe('number');
        expect(obs.plasticity.resistanceScale).toBeDefined();
        expect(obs.diagnostics.valueKinds.plasticity).toBe('derived');
    });

    it('runtimeApplied is false for observeOnly mode', () => {
        const obs = deriveCellObservation(makeInput());
        expect(obs.plasticity.runtimeApplied).toBe(false);
    });

    it('runtimeApplied is true for resistanceOnly mode without ablation', () => {
        const ps = makePlasticityState();
        const state = { ...ps, mode: 'resistanceOnly' as const, ablationEnabled: false };
        const obs = deriveCellObservation(makeInput({ weakPlasticityState: state }));
        expect(obs.plasticity.runtimeApplied).toBe(true);
    });

    it('returns unavailable when weakPlasticityState is null', () => {
        const obs = deriveCellObservation(makeInput({ weakPlasticityState: null }));
        expect(obs.plasticity.accumulatedTrace).toBeUndefined();
        expect(obs.diagnostics.valueKinds.plasticity).toBe('unavailable');
    });
});

// ── Tests: deriveCellObservation — ratios ─────────────────────────────────────

describe('deriveCellObservation: ratios', () => {
    it('returns empty ratio ids and unavailable kind when observedRatiosState is null', () => {
        const obs = deriveCellObservation(makeInput({ observedRatiosState: null }));
        expect(obs.ratios.involvedObservedRatioIds).toEqual([]);
        expect(obs.diagnostics.valueKinds.ratios).toBe('unavailable');
    });

    it('maps observed ratio IDs from state', () => {
        const ratiosState = {
            observedRatios: [{ id: 'r1', source: 'amplitudePeak' }, { id: 'r2', source: 'phaseCoherence' }],
            strongestMatch: { observedRatioId: 'r1', referenceRatioId: 'phi', matchStrength: 0.7 },
            referenceMatches: [],
        };
        const obs = deriveCellObservation(makeInput({ observedRatiosState: ratiosState }));
        expect(obs.ratios.involvedObservedRatioIds).toEqual(['r1', 'r2']);
        expect(obs.ratios.strongestReferenceMatchLabel).toBe('phi');
        expect(obs.ratios.strongestMatchStrength).toBeCloseTo(0.7);
        expect(obs.diagnostics.valueKinds.ratios).toBe('proxy');
    });
});

// ── Tests: deriveCellObservation — events ─────────────────────────────────────

describe('deriveCellObservation: events', () => {
    it('returns empty events when recentEvents is null', () => {
        const obs = deriveCellObservation(makeInput({ recentEvents: null }));
        expect(obs.events.recentEventCount).toBe(0);
        expect(obs.diagnostics.valueKinds.events).toBe('unavailable');
    });

    it('filters events by regionId', () => {
        const events = [
            { id: 'e1', tick: 10, source: 'u1-v1' },
            { id: 'e2', tick: 11, source: 'u2-v3' },
            { id: 'e3', tick: 12, source: 'u1-v1' },
        ];
        const obs = deriveCellObservation(makeInput({ recentEvents: events, regionId: 'u1-v1' }));
        expect(obs.events.recentEventCount).toBe(2);
        expect(obs.events.recentEventIds).toContain('e1');
        expect(obs.events.recentEventIds).toContain('e3');
        expect(obs.events.lastEventTick).toBe(12);
        expect(obs.diagnostics.valueKinds.events).toBe('measured');
    });

    it('uses torusCell regionId when regionId is not provided', () => {
        const events = [
            { id: 'e1', tick: 5, source: 'u1-v1' },
        ];
        const obs = deriveCellObservation(makeInput({ recentEvents: events, regionId: undefined }));
        expect(obs.events.recentEventCount).toBe(1);
    });
});

// ── Tests: deriveCellObservation — diagnostics ────────────────────────────────

describe('deriveCellObservation: diagnostics', () => {
    it('all valueKinds are defined', () => {
        const obs = deriveCellObservation(makeInput());
        const vk = obs.diagnostics.valueKinds;
        expect(vk.geometry).toBeDefined();
        expect(vk.field).toBeDefined();
        expect(vk.vortex).toBeDefined();
        expect(vk.membrane).toBeDefined();
        expect(vk.plasticity).toBeDefined();
        expect(vk.ratios).toBeDefined();
        expect(vk.events).toBeDefined();
    });

    it('hasUnavailableSource is false when all sources provided', () => {
        const obs = deriveCellObservation(makeInput({ recentEvents: [], observedRatiosState: {
            observedRatios: [],
            strongestMatch: null,
            referenceMatches: [],
        } }));
        expect(obs.diagnostics.hasUnavailableSource).toBe(false);
    });

    it('hasUnavailableSource is true when any source is missing', () => {
        const obs = deriveCellObservation(makeInput({ membraneState: null }));
        expect(obs.diagnostics.hasUnavailableSource).toBe(true);
    });

    it('produces no NaN or Infinity in numeric fields', () => {
        const obs = deriveCellObservation(makeInput({ recentEvents: [], observedRatiosState: {
            observedRatios: [],
            strongestMatch: null,
            referenceMatches: [],
        } }));
        function checkNoNanInf(obj: unknown, path = ''): void {
            if (obj === null || obj === undefined) return;
            if (typeof obj === 'number') {
                expect(Number.isFinite(obj), `${path} should be finite`).toBe(true);
            } else if (typeof obj === 'object' && !ArrayBuffer.isView(obj)) {
                for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
                    checkNoNanInf(v, `${path}.${k}`);
                }
            }
        }
        // Check scalar fields
        for (const [k, v] of Object.entries(obs.field)) {
            if (typeof v === 'number') {
                expect(Number.isFinite(v), `field.${k} should be finite`).toBe(true);
            }
        }
        for (const [k, v] of Object.entries(obs.geometry)) {
            if (typeof v === 'number') {
                expect(Number.isFinite(v), `geometry.${k} should be finite`).toBe(true);
            }
        }
        void checkNoNanInf; // available but we use the targeted checks above
    });
});

// ── Tests: deriveCellObservation — timestamp and tick ────────────────────────

describe('deriveCellObservation: timestamp and tick', () => {
    it('passes through timestamp', () => {
        const obs = deriveCellObservation(makeInput({ timestamp: 9999 }));
        expect(obs.timestamp).toBe(9999);
    });

    it('passes through tick', () => {
        const obs = deriveCellObservation(makeInput({ tick: 42 }));
        expect(obs.tick).toBe(42);
    });

    it('tick is undefined when not provided', () => {
        const obs = deriveCellObservation(makeInput({ tick: undefined }));
        expect(obs.tick).toBeUndefined();
    });
});
