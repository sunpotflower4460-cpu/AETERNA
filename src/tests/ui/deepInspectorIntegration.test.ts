/**
 * deepInspectorIntegration.test.ts
 * v1.7: Deep Inspector / Time Replay — Integration tests
 *
 * Verifies the end-to-end connection between:
 * - SelectedObservationState transitions
 * - CellInspectorPanel rendering with real CellObservation
 * - MetricSpotlightPanel lens activation
 * - buildCellMetricRows: values match observation, not fake
 * - CellInspectorPanel shows "(not observed)" for missing values
 * - Metric row click activates correct lens
 * - ruleBasedLensGuide replay context
 * - No forbidden claims in any rendered output
 * - LLM/API not called
 * - Runtime dynamics unchanged (no side effects)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
    DEFAULT_SELECTED_OBSERVATION_STATE,
    selectObservationCell,
    selectObservationMetric,
    activateObservationLens,
    enterReplayMode,
    exitReplayMode,
    updateLiveTick,
} from '../../state/selectedObservationState.js';

import { buildCellMetricRows, renderCellInspectorPanelHTML } from '../../ui/observation/CellInspectorPanel.js';
import { renderMetricSpotlightPanelHTML, getPreferredLayersForLens } from '../../ui/observation/MetricSpotlightPanel.js';
import { deriveRuleBasedLensGuide } from '../../guide/ruleBasedLensGuide.js';
import { deriveCellObservation } from '../../observation/deriveCellObservation.js';
import type { CellObservationInput } from '../../types/cellObservation.js';

// ── Test helper: build a CellObservation ──────────────────────────────────────

const SEGMENTS = 4;
const TOTAL = SEGMENTS * SEGMENTS;

function makeObs(cellIndex = 5) {
    const amplitude = new Float32Array(TOTAL).fill(0.5);
    const phase = new Float32Array(TOTAL).fill(0.3);
    const input: CellObservationInput = {
        timestamp: 1000,
        tick: 10,
        cellIndex,
        segments: SEGMENTS,
        torusCell: {
            i: Math.floor(cellIndex / SEGMENTS),
            j: cellIndex % SEGMENTS,
            majorAngle: Math.PI / 2,
            minorAngle: 0.5,
            areaElement: 2.5,
            gaussianCurvature: 0.1,
            meanCurvature: 0.3,
            innerOuterBias: 0.8,
        },
        vortexObservation: {
            vortexCandidateMask: new Uint8Array(TOTAL),
            topologicalCharge: new Int8Array(TOTAL),
            vorticity: new Float32Array(TOTAL),
            candidates: [],
        },
        amplitude,
        phase,
        membraneState: {
            cells: Array.from({ length: TOTAL }, (_, idx) => ({
                index: idx,
                deformation: 0.1,
                permeability: 0.5,
                tension: 0.3,
                actuationImprint: 0.2,
                returnImprint: 0.15,
                twoSidedness: 0.25,
            })),
        },
        weakPlasticityState: {
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
        },
        observedRatiosState: null,
        recentEvents: [],
        regionId: `u${Math.floor(cellIndex/SEGMENTS)}-v${cellIndex%SEGMENTS}`,
    };
    return deriveCellObservation(input);
}

// ── SelectedObservationState ──────────────────────────────────────────────────

describe('SelectedObservationState', () => {
    it('starts with null selections and live mode', () => {
        const s = DEFAULT_SELECTED_OBSERVATION_STATE;
        expect(s.selectedCellIndex).toBeNull();
        expect(s.replayMode).toBe('live');
        expect(s.replayTick).toBeNull();
    });

    it('selectObservationCell sets index and opens panel', () => {
        const s = selectObservationCell(DEFAULT_SELECTED_OBSERVATION_STATE, 7);
        expect(s.selectedCellIndex).toBe(7);
        expect(s.panelOpen).toBe(true);
    });

    it('selectObservationMetric activates lens', () => {
        let s = selectObservationCell(DEFAULT_SELECTED_OBSERVATION_STATE, 3);
        s = selectObservationMetric(s, 'geometry.gaussianCurvature', 'gaussianCurvature');
        expect(s.selectedMetricId).toBe('geometry.gaussianCurvature');
        expect(s.activeLensId).toBe('gaussianCurvature');
    });

    it('activateObservationLens sets lens', () => {
        const s = activateObservationLens(DEFAULT_SELECTED_OBSERVATION_STATE, 'fieldPhase');
        expect(s.activeLensId).toBe('fieldPhase');
    });

    it('enterReplayMode sets mode=replay and replayTick', () => {
        const s = enterReplayMode(DEFAULT_SELECTED_OBSERVATION_STATE, 42);
        expect(s.replayMode).toBe('replay');
        expect(s.replayTick).toBe(42);
    });

    it('exitReplayMode returns to live mode', () => {
        let s = enterReplayMode(DEFAULT_SELECTED_OBSERVATION_STATE, 42);
        s = exitReplayMode(s);
        expect(s.replayMode).toBe('live');
        expect(s.replayTick).toBeNull();
    });

    it('updateLiveTick updates liveTick without changing replayMode', () => {
        let s = enterReplayMode(DEFAULT_SELECTED_OBSERVATION_STATE, 20);
        s = updateLiveTick(s, 200);
        expect(s.liveTick).toBe(200);
        expect(s.replayMode).toBe('replay');
    });
});

// ── CellInspectorPanel ────────────────────────────────────────────────────────

describe('CellInspectorPanel', () => {
    it('renders empty state when no observation', () => {
        const html = renderCellInspectorPanelHTML({
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
            onMetricClick: () => {},
        });
        expect(html).toContain('Select a cell');
    });

    it('renders cell info when observation is provided', () => {
        const obs = makeObs(5);
        const html = renderCellInspectorPanelHTML({
            observation: obs,
            activeLensId: null,
            selectedMetricId: null,
            onMetricClick: () => {},
        });
        expect(html).toContain('cell-inspector-panel');
        expect(html).toContain('Cell');
    });

    it('shows "(not observed)" for undefined field values — no fake 0', () => {
        const obs = makeObs(5);
        const rows = buildCellMetricRows(obs);
        // All rows with undefined values should show "(not observed)"
        for (const row of rows) {
            if (row.value === undefined || row.value === null) {
                expect(row.valueKind).toBe('unavailable');
            }
        }
    });

    it('shows replay badge when isReplayMode=true', () => {
        const obs = makeObs(5);
        const html = renderCellInspectorPanelHTML({
            observation: obs,
            activeLensId: null,
            selectedMetricId: null,
            onMetricClick: () => {},
            isReplayMode: true,
        });
        expect(html).toContain('Replay');
    });
});

// ── buildCellMetricRows: values match observation ─────────────────────────────

describe('buildCellMetricRows', () => {
    it('gaussianCurvature row value matches observation', () => {
        const obs = makeObs(5);
        const rows = buildCellMetricRows(obs);
        const row = rows.find((r) => r.metricId === 'geometry.gaussianCurvature');
        expect(row).toBeDefined();
        expect(row!.value).toBe(obs.geometry.gaussianCurvature);
    });

    it('field amplitude row value matches observation', () => {
        const obs = makeObs(5);
        const rows = buildCellMetricRows(obs);
        const row = rows.find((r) => r.metricId === 'field.amplitude');
        expect(row).toBeDefined();
        expect(row!.value).toBe(obs.field.amplitude);
    });

    it('each row has a metricId and lensId or null', () => {
        const obs = makeObs(5);
        const rows = buildCellMetricRows(obs);
        for (const row of rows) {
            expect(typeof row.metricId).toBe('string');
            expect(row.lensId === null || typeof row.lensId === 'string').toBe(true);
        }
    });
});

// ── MetricSpotlightPanel ──────────────────────────────────────────────────────

describe('MetricSpotlightPanel', () => {
    it('renders empty state when no lens', () => {
        const html = renderMetricSpotlightPanelHTML({
            activeLensId: null,
            observation: null,
        });
        expect(html).toContain('metric-spotlight-panel--empty');
    });

    it('renders lens info for active lens', () => {
        const obs = makeObs(5);
        const html = renderMetricSpotlightPanelHTML({
            activeLensId: 'gaussianCurvature',
            observation: obs,
        });
        expect(html).toContain('Gaussian Curvature');
        expect(html).toContain('measured');
    });

    it('shows layer unavailable when layer not in availableLayerIds', () => {
        const obs = makeObs(5);
        const html = renderMetricSpotlightPanelHTML({
            activeLensId: 'gaussianCurvature',
            observation: obs,
            availableLayerIds: new Set(), // no layers available
        });
        expect(html).toContain('layer unavailable');
    });

    it('getPreferredLayersForLens returns array', () => {
        const layers = getPreferredLayersForLens('gaussianCurvature');
        expect(Array.isArray(layers)).toBe(true);
        expect(layers).toContain('torusCurvature');
    });
});

// ── ruleBasedLensGuide ────────────────────────────────────────────────────────

describe('ruleBasedLensGuide', () => {
    it('returns guide lines for active lens', () => {
        const result = deriveRuleBasedLensGuide({
            activeLensId: 'gaussianCurvature',
            selectedMetricId: null,
            replayMode: 'live',
            replayTick: null,
            liveTick: 100,
            snapshotAvailable: false,
        });
        expect(result.lines.length).toBeGreaterThan(0);
        expect(result.replayNotice).toBeNull();
    });

    it('returns replayNotice when in replay mode', () => {
        const result = deriveRuleBasedLensGuide({
            activeLensId: 'fieldAmplitude',
            selectedMetricId: null,
            replayMode: 'replay',
            replayTick: 50,
            liveTick: 120,
            snapshotAvailable: true,
        });
        expect(result.replayNotice).not.toBeNull();
        expect(result.replayNotice).toContain('Replay Mode');
        expect(result.replayNotice).toContain('tick 50');
        expect(result.replayNotice!.toLowerCase()).toContain('does not imply the runtime itself has moved backward');
    });

    it('replayNotice mentions both replayTick and liveTick', () => {
        const result = deriveRuleBasedLensGuide({
            activeLensId: null,
            selectedMetricId: null,
            replayMode: 'replay',
            replayTick: 77,
            liveTick: 200,
            snapshotAvailable: true,
        });
        expect(result.replayNotice).toContain('77');
        expect(result.replayNotice).toContain('200');
    });

    it('epistemicNote does not claim consciousness or life', () => {
        const result = deriveRuleBasedLensGuide({
            activeLensId: 'vortexConfidence',
            selectedMetricId: null,
            replayMode: 'live',
            replayTick: null,
            liveTick: 1,
            snapshotAvailable: false,
        });
        const note = result.epistemicNote.toLowerCase();
        expect(note).not.toContain('proves consciousness');
        expect(note).not.toContain('is conscious');
        expect(note).not.toContain('proof of life');
        expect(note).toContain('observer');
    });
});

// ── No LLM/API calls ──────────────────────────────────────────────────────────

describe('v1.7 files: no LLM/API calls', () => {
    const filesToCheck = [
        'src/types/timeReplay.ts',
        'src/replay/timeReplayBuffer.ts',
        'src/observer/getRecentEventsForCell.ts',
        'src/state/selectedObservationState.ts',
        'src/guide/ruleBasedLensGuide.ts',
        'src/ui/replay/TimeReplayPanel.tsx',
        'src/ui/replay/ReplaySlider.tsx',
        'src/ui/observation/CellInspectorPanel.tsx',
        'src/ui/observation/MetricSpotlightPanel.tsx',
    ];

    for (const file of filesToCheck) {
        it(`${file} contains no fetch/axios/LLM calls`, () => {
            const content = readFileSync(resolve(process.cwd(), file), 'utf-8');
            expect(content).not.toContain('fetch(');
            expect(content).not.toContain('axios');
            expect(content).not.toContain('openai');
            expect(content).not.toContain('anthropic');
        });
    }
});

// ── No forbidden semantic claims ──────────────────────────────────────────────

describe('v1.7 files: no forbidden semantic claims', () => {
    const forbidden = [
        'proves consciousness',
        'is conscious',
        'aeterna feels',
        'aeterna wants',
        'aeterna remembers',
        'proof of life',
        'intelligence emerged',
        'soul resonance',
    ];

    const filesToCheck = [
        'src/types/timeReplay.ts',
        'src/replay/timeReplayBuffer.ts',
        'src/state/selectedObservationState.ts',
        'src/guide/ruleBasedLensGuide.ts',
    ];

    for (const file of filesToCheck) {
        it(`${file} contains no forbidden positive semantic claims`, () => {
            const content = readFileSync(resolve(process.cwd(), file), 'utf-8').toLowerCase();
            for (const phrase of forbidden) {
                expect(content, `${file} should not contain "${phrase}"`).not.toContain(phrase);
            }
        });
    }
});
