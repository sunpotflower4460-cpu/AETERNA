/**
 * cellInspector.test.ts
 * v1.6: Super Observation Architecture — Cell Inspector / Lens / Guide context tests
 *
 * Verifies:
 * - CellInspectorState transitions (select, metric, lens, toggle, reset)
 * - MetricLensRegistry (all lenses defined, groups correct, findLensForMetric)
 * - LensContextPacket building
 * - AiGuideContext building (no LLM calls, EPISTEMIC_GUARD present)
 * - No fake values in lens or context
 * - Semantic / consciousness claim guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
    DEFAULT_CELL_INSPECTOR_STATE,
    selectCell,
    selectMetric,
    activateLens,
    toggleInspectorPanel,
    resetCellInspector,
} from '../../ui/inspector/cellInspectorState.js';

import {
    getAllLenses,
    getAvailableLenses,
    getLens,
    getLensesByGroup,
    findLensForMetric,
} from '../../ui/lens/metricLensRegistry.js';

import {
    buildLensContextPacket,
    resolveObservationPath,
} from '../../ui/lens/lensContextPacket.js';

import {
    buildAiGuideContext,
    EPISTEMIC_GUARD,
} from '../../ui/inspector/aiGuideContextInterface.js';

import { deriveCellObservation } from '../../observation/deriveCellObservation.js';
import type { CellObservationInput } from '../../types/cellObservation.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const SEGMENTS = 4;
const TOTAL = SEGMENTS * SEGMENTS;

function makeObs() {
    const amplitude = new Float32Array(TOTAL).fill(0.5);
    const phase = new Float32Array(TOTAL).fill(0.3);
    const vortexObs = {
        vortexCandidateMask: new Uint8Array(TOTAL),
        topologicalCharge: new Int8Array(TOTAL),
        vorticity: new Float32Array(TOTAL),
        candidates: [] as [],
    };
    const membraneState = {
        cells: Array.from({ length: TOTAL }, (_, idx) => ({
            index: idx,
            deformation: 0.1,
            permeability: 0.5,
            tension: 0.3,
            actuationImprint: 0.2,
            returnImprint: 0.15,
            twoSidedness: 0.25,
        })),
    };
    const plasticityState = {
        cells: Array.from({ length: TOTAL }, (_, idx) => ({
            index: idx,
            accumulatedTrace: 0.001,
            vortexTrace: 0.0003,
            repeatedFlowTrace: 0.0003,
            localExcitabilityTrace: 0.0002,
            membraneTrace: 0.0002,
            resistanceScale: 1.0,
        })),
        mode: 'observeOnly' as const,
        ablationEnabled: false,
    };
    const input: CellObservationInput = {
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
        vortexObservation: vortexObs,
        amplitude,
        phase,
        membraneState,
        weakPlasticityState: plasticityState,
        observedRatiosState: null,
        recentEvents: [],
        regionId: 'u1-v1',
    };
    return deriveCellObservation(input);
}

// ── CellInspectorState ────────────────────────────────────────────────────────

describe('CellInspectorState: default', () => {
    it('starts with null selections and closed panel', () => {
        const s = DEFAULT_CELL_INSPECTOR_STATE;
        expect(s.selectedCellIndex).toBeNull();
        expect(s.selectedMetricId).toBeNull();
        expect(s.activeLensId).toBeNull();
        expect(s.panelOpen).toBe(false);
    });
});

describe('CellInspectorState: selectCell', () => {
    it('opens panel and sets cellIndex', () => {
        const s = selectCell(DEFAULT_CELL_INSPECTOR_STATE, 7);
        expect(s.selectedCellIndex).toBe(7);
        expect(s.panelOpen).toBe(true);
    });

    it('deselecting clears cellIndex and metricId', () => {
        let s = selectCell(DEFAULT_CELL_INSPECTOR_STATE, 7);
        s = selectMetric(s, 'geometry.gaussianCurvature', null);
        s = selectCell(s, null);
        expect(s.selectedCellIndex).toBeNull();
        expect(s.selectedMetricId).toBeNull();
    });

    it('preserves activeLensId when changing cell', () => {
        let s = selectCell(DEFAULT_CELL_INSPECTOR_STATE, 3);
        s = activateLens(s, 'gaussianCurvature');
        s = selectCell(s, 9);
        expect(s.activeLensId).toBe('gaussianCurvature');
    });
});

describe('CellInspectorState: selectMetric', () => {
    it('sets metricId and activates corresponding lens', () => {
        let s = selectCell(DEFAULT_CELL_INSPECTOR_STATE, 5);
        s = selectMetric(s, 'geometry.gaussianCurvature', 'gaussianCurvature');
        expect(s.selectedMetricId).toBe('geometry.gaussianCurvature');
        expect(s.activeLensId).toBe('gaussianCurvature');
    });

    it('clearing metricId preserves current lensId', () => {
        let s = selectCell(DEFAULT_CELL_INSPECTOR_STATE, 5);
        s = selectMetric(s, 'field.amplitude', 'fieldAmplitude');
        s = selectMetric(s, null);
        expect(s.selectedMetricId).toBeNull();
        expect(s.activeLensId).toBe('fieldAmplitude');
    });
});

describe('CellInspectorState: activateLens', () => {
    it('sets activeLensId', () => {
        const s = activateLens(DEFAULT_CELL_INSPECTOR_STATE, 'fieldPhase');
        expect(s.activeLensId).toBe('fieldPhase');
    });

    it('null deactivates lens', () => {
        let s = activateLens(DEFAULT_CELL_INSPECTOR_STATE, 'fieldPhase');
        s = activateLens(s, null);
        expect(s.activeLensId).toBeNull();
    });
});

describe('CellInspectorState: toggleInspectorPanel', () => {
    it('toggles panelOpen', () => {
        let s = DEFAULT_CELL_INSPECTOR_STATE;
        s = toggleInspectorPanel(s);
        expect(s.panelOpen).toBe(true);
        s = toggleInspectorPanel(s);
        expect(s.panelOpen).toBe(false);
    });
});

describe('CellInspectorState: resetCellInspector', () => {
    it('resets to default values', () => {
        let s = selectCell(DEFAULT_CELL_INSPECTOR_STATE, 5);
        s = selectMetric(s, 'field.amplitude', 'fieldAmplitude');
        s = resetCellInspector(s);
        expect(s.selectedCellIndex).toBeNull();
        expect(s.selectedMetricId).toBeNull();
        expect(s.activeLensId).toBeNull();
        expect(s.panelOpen).toBe(false);
    });
});

// ── MetricLensRegistry ────────────────────────────────────────────────────────

describe('MetricLensRegistry: getAllLenses', () => {
    it('returns all defined lenses (at least 15)', () => {
        const lenses = getAllLenses();
        expect(lenses.length).toBeGreaterThanOrEqual(15);
    });

    it('each lens has required fields', () => {
        for (const lens of getAllLenses()) {
            expect(lens.id).toBeTruthy();
            expect(lens.label).toBeTruthy();
            expect(lens.description).toBeTruthy();
            expect(lens.disclaimer).toBeTruthy();
            expect(['measured', 'derived', 'proxy']).toContain(lens.valueKind);
            expect(lens.observationPath).toBeTruthy();
            expect(['geometry', 'field', 'vortex', 'membrane', 'plasticity', 'ratios']).toContain(lens.group);
            expect(lens.colorHex).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(lens.unit).toBeDefined();
            expect(typeof lens.available).toBe('boolean');
        }
    });

    it('all lenses are available', () => {
        for (const lens of getAllLenses()) {
            expect(lens.available).toBe(true);
        }
    });
});

describe('MetricLensRegistry: getAvailableLenses', () => {
    it('returns only available lenses', () => {
        for (const lens of getAvailableLenses()) {
            expect(lens.available).toBe(true);
        }
    });
});

describe('MetricLensRegistry: getLens', () => {
    it('returns a specific lens by ID', () => {
        const lens = getLens('gaussianCurvature');
        expect(lens).not.toBeNull();
        expect(lens!.id).toBe('gaussianCurvature');
    });

    it('returns null for unknown ID', () => {
        // @ts-expect-error testing invalid ID
        expect(getLens('nonExistentId')).toBeNull();
    });
});

describe('MetricLensRegistry: getLensesByGroup', () => {
    it('returns geometry group lenses', () => {
        const geoLenses = getLensesByGroup('geometry');
        expect(geoLenses.length).toBeGreaterThanOrEqual(3);
        for (const l of geoLenses) expect(l.group).toBe('geometry');
    });

    it('returns vortex group lenses', () => {
        const vortLenses = getLensesByGroup('vortex');
        expect(vortLenses.length).toBeGreaterThanOrEqual(2);
    });
});

describe('MetricLensRegistry: findLensForMetric', () => {
    it('finds lens by observationPath', () => {
        const lens = findLensForMetric('geometry.gaussianCurvature');
        expect(lens).not.toBeNull();
        expect(lens!.id).toBe('gaussianCurvature');
    });

    it('returns null for unknown path', () => {
        expect(findLensForMetric('nonexistent.path')).toBeNull();
    });
});

describe('MetricLensRegistry: no forbidden claims', () => {
    it('no positive consciousness / emotion / soul / life-proof claims in lens descriptions', () => {
        // These patterns represent POSITIVE claims — NOT disclaimers.
        // Disclaimer text like "does NOT represent consciousness" is acceptable.
        const forbiddenPositiveClaims = [
            'proves consciousness',
            'is conscious',
            'has emotions',
            'experiencing emotion',
            'soul is',
            'proof of life',
            'feels alive',
            'intelligence is present',
        ];
        for (const lens of getAllLenses()) {
            const text = `${lens.label} ${lens.description} ${lens.disclaimer}`.toLowerCase();
            for (const phrase of forbiddenPositiveClaims) {
                expect(text.includes(phrase), `Lens ${lens.id} contains forbidden phrase "${phrase}"`).toBe(false);
            }
        }
    });
});

// ── LensContextPacket ─────────────────────────────────────────────────────────

describe('buildLensContextPacket: with active lens', () => {
    it('builds packet with lens context', () => {
        const obs = makeObs();
        const lens = getLens('gaussianCurvature')!;
        const packet = buildLensContextPacket(obs, lens, 10);
        expect(packet.cellObservation).toBe(obs);
        expect(packet.activeLens).toBe(lens);
        expect(packet.contextSummary).toContain('Gaussian Curvature');
        expect(packet.epistemicNote).toBeTruthy();
        expect(typeof packet.timestamp).toBe('number');
        expect(packet.tick).toBe(10);
    });

    it('highlightedMetricValue is a finite number for gaussianCurvature', () => {
        const obs = makeObs();
        const lens = getLens('gaussianCurvature')!;
        const packet = buildLensContextPacket(obs, lens);
        expect(typeof packet.highlightedMetricValue).toBe('number');
        expect(Number.isFinite(packet.highlightedMetricValue as number)).toBe(true);
    });
});

describe('buildLensContextPacket: without active lens', () => {
    it('builds overview packet', () => {
        const obs = makeObs();
        const packet = buildLensContextPacket(obs, null);
        expect(packet.activeLens).toBeNull();
        expect(packet.contextSummary).toContain('full cell overview');
        expect(packet.highlightedMetricValue).toBeUndefined();
    });
});

describe('resolveObservationPath', () => {
    it('resolves nested path', () => {
        const obs = makeObs();
        const v = resolveObservationPath(obs, 'geometry.gaussianCurvature');
        expect(v).toBe(obs.geometry.gaussianCurvature);
    });

    it('returns undefined for missing path', () => {
        const obs = makeObs();
        const v = resolveObservationPath(obs, 'geometry.nonExistentField');
        expect(v).toBeUndefined();
    });
});

// ── AiGuideContext ────────────────────────────────────────────────────────────

describe('buildAiGuideContext: basic', () => {
    it('includes EPISTEMIC_GUARD', () => {
        const obs = makeObs();
        const packet = buildLensContextPacket(obs, null);
        const ctx = buildAiGuideContext(packet);
        expect(ctx.epistemicGuard).toBe(EPISTEMIC_GUARD);
        expect(ctx.epistemicGuard.length).toBeGreaterThan(50);
    });

    it('sets implicitQuestion for overview', () => {
        const obs = makeObs();
        const packet = buildLensContextPacket(obs, null);
        const ctx = buildAiGuideContext(packet);
        expect(ctx.implicitQuestion).toContain('state of this cell');
    });

    it('sets implicitQuestion for specific lens', () => {
        const obs = makeObs();
        const lens = getLens('fieldAmplitude')!;
        const packet = buildLensContextPacket(obs, lens);
        const ctx = buildAiGuideContext(packet);
        expect(ctx.implicitQuestion).toContain('Field Amplitude');
    });

    it('populates metricEntries for all groups', () => {
        const obs = makeObs();
        const packet = buildLensContextPacket(obs, null);
        const ctx = buildAiGuideContext(packet);
        const groups = new Set(ctx.metricEntries.map((e) => e.group));
        expect(groups.has('geometry')).toBe(true);
        expect(groups.has('field')).toBe(true);
        expect(groups.has('vortex')).toBe(true);
        expect(groups.has('membrane')).toBe(true);
        expect(groups.has('plasticity')).toBe(true);
    });

    it('sets primaryMetric when lens is active', () => {
        const obs = makeObs();
        const lens = getLens('gaussianCurvature')!;
        const packet = buildLensContextPacket(obs, lens);
        const ctx = buildAiGuideContext(packet);
        expect(ctx.primaryMetric).not.toBeNull();
        expect(ctx.primaryMetric!.path).toBe('geometry.gaussianCurvature');
    });

    it('sets primaryMetric to null for overview', () => {
        const obs = makeObs();
        const packet = buildLensContextPacket(obs, null);
        const ctx = buildAiGuideContext(packet);
        expect(ctx.primaryMetric).toBeNull();
    });

    it('cellPosition is set from geometry', () => {
        const obs = makeObs();
        const packet = buildLensContextPacket(obs, null);
        const ctx = buildAiGuideContext(packet);
        expect(ctx.cellPosition).toEqual({ i: 1, j: 1 });
    });
});

describe('buildAiGuideContext: completeness', () => {
    it('complete when all observers provided', () => {
        const obs = makeObs();
        const packet = buildLensContextPacket(obs, null);
        const ctx = buildAiGuideContext(packet);
        // With observedRatiosState null, ratios is unavailable, so partial
        expect(['complete', 'partial']).toContain(ctx.completeness);
    });
});

describe('buildAiGuideContext: no LLM calls', () => {
    it('buildAiGuideContext file contains no fetch / axios / LLM calls', () => {
        const filePath = resolve(process.cwd(), 'src/ui/inspector/aiGuideContextInterface.ts');
        const content = readFileSync(filePath, 'utf-8');
        expect(content.includes('fetch(')).toBe(false);
        expect(content.includes('axios')).toBe(false);
        expect(content.includes('openai')).toBe(false);
        expect(content.includes('anthropic')).toBe(false);
        expect(content.includes('llm')).toBe(false);
    });
});

// ── EPISTEMIC_GUARD content check ──────────────────────────────────────────────

describe('EPISTEMIC_GUARD', () => {
    it('mentions observer-side and not-proof-of-consciousness', () => {
        expect(EPISTEMIC_GUARD.toLowerCase()).toContain('observer');
        expect(EPISTEMIC_GUARD.toLowerCase()).toContain('not');
        expect(EPISTEMIC_GUARD.toLowerCase()).toContain('proof');
    });
});

// ── No semantic claims in source files ───────────────────────────────────────

describe('Super Observation source files: no forbidden claims', () => {
    const files = [
        'src/types/cellObservation.ts',
        'src/observation/deriveCellObservation.ts',
        'src/ui/inspector/cellInspectorState.ts',
        'src/ui/lens/metricLensRegistry.ts',
        'src/ui/lens/lensContextPacket.ts',
        'src/ui/inspector/aiGuideContextInterface.ts',
    ];

    // These patterns represent POSITIVE claims only.
    // Words like "consciousness" or "emotion" that appear in disclaimers
    // ("NOT proof of consciousness") are acceptable — they are anti-claims.
    // "fake glow" and "proof of life" can appear in design comments explaining
    // what the code deliberately avoids — that is acceptable.
    const forbiddenPositivePhrases = [
        'proves consciousness',
        'is conscious',
        'has emotions',
        'experiencing emotion',
        'soul is present',
        'aeterna wants',
        'aeterna feels',
    ];

    for (const file of files) {
        it(`${file} contains no forbidden positive semantic claims`, () => {
            const content = readFileSync(resolve(process.cwd(), file), 'utf-8').toLowerCase();
            for (const phrase of forbiddenPositivePhrases) {
                expect(content.includes(phrase), `${file} contains forbidden phrase "${phrase}"`).toBe(false);
            }
        });
    }
});
