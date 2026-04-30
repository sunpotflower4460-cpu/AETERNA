/**
 * scenarioUx.test.ts
 * U7: Scenario UX — static smoke tests
 *
 * Verifies that:
 * - ScenarioPreset type exists in src/types/scenarioPreset.ts
 * - scenarioPresetRegistry has all 10 presets
 * - All presets have no forbidden terms
 * - getScenarioPreset works correctly
 * - ScenarioRunState transitions work correctly
 * - makeEmptyResultSummary returns hasResult=false
 * - makeResultSummary sets hasResult=true with params-derived values
 * - compareScenarios works correctly
 * - recordScenarioControlEvent adds to event history
 * - AeternaEventKind includes 'scenarioControl' and 'scenarioSummary'
 * - No fake hardcoded results in ScenarioResultSummary
 * - Recommended layers are non-empty in all presets
 * - No runtime dynamics files are imported in scenario UI files
 *
 * These are static / unit tests — no browser or DOM required.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Modules under test ────────────────────────────────────────────────────────

import {
    SCENARIO_PRESET_REGISTRY,
    getScenarioPreset,
} from '../../scenario/scenarioPresetRegistry.js';

import {
    getScenarioRunState,
    runScenario,
    pauseScenario,
    resumeScenario,
    stopScenario,
    resetScenarioRun,
    tickScenario,
} from '../../ui/scenario/ScenarioRunState.js';

import {
    makeEmptyResultSummary,
    makeResultSummary,
} from '../../ui/scenario/ScenarioResultSummary.js';

import {
    compareScenarios,
} from '../../ui/scenario/ScenarioComparison.js';

import {
    recordScenarioControlEvent,
    getRecentEvents,
    resetEventHistory,
} from '../../ui/timeline/deriveAeternaEvents.js';

// ── Source files for static analysis ─────────────────────────────────────────

const ROOT = resolve(__dirname, '../..');

function readSrc(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const srcScenarioPresetType    = readSrc('types/scenarioPreset.ts');
const srcRegistry              = readSrc('scenario/scenarioPresetRegistry.ts');
const srcRunState              = readSrc('ui/scenario/ScenarioRunState.ts');
const srcResultSummary         = readSrc('ui/scenario/ScenarioResultSummary.ts');
const srcComparison            = readSrc('ui/scenario/ScenarioComparison.ts');
const srcAeternaEventType      = readSrc('types/aeternaEvent.ts');
const srcDeriveAeternaEvents   = readSrc('ui/timeline/deriveAeternaEvents.ts');

// ── Forbidden terms ───────────────────────────────────────────────────────────

const FORBIDDEN_TERMS = [
    'conscious', 'feels', 'wants', 'learned meaning', 'understands',
    'memory formed', '意識', '感じています', '欲しがっています',
    '意味を学習', '理解しました', '記憶しました',
];

// ── Runtime dynamics files (must NOT be imported in scenario UI files) ────────

const RUNTIME_DYNAMICS_PATTERNS = [
    'updateWorldMedium',
    'applyWorldMediumFeedback',
    'deriveActuationPulse',
    'applyActuationFeedback',
    'initializeWorldMediumState',
];

// ─────────────────────────────────────────────────────────────────────────────

describe('U7 ScenarioPreset type', () => {
    it('ScenarioPreset type is defined in types/scenarioPreset.ts', () => {
        expect(srcScenarioPresetType).toContain('ScenarioPreset');
        expect(srcScenarioPresetType).toContain('ScenarioPresetId');
        expect(srcScenarioPresetType).toContain('id:');
        expect(srcScenarioPresetType).toContain('title:');
        expect(srcScenarioPresetType).toContain('shortDescription:');
        expect(srcScenarioPresetType).toContain('observationGoal:');
        expect(srcScenarioPresetType).toContain('expectedSignals:');
        expect(srcScenarioPresetType).toContain('recommendedLayers:');
        expect(srcScenarioPresetType).toContain('recommendedPanel:');
        expect(srcScenarioPresetType).toContain('durationHint:');
    });

    it('ScenarioPresetId includes all 10 preset IDs', () => {
        expect(srcScenarioPresetType).toContain('quietObservation');
        expect(srcScenarioPresetType).toContain('singleTouch');
        expect(srcScenarioPresetType).toContain('repeatedGentleTouch');
        expect(srcScenarioPresetType).toContain('holdAndRelease');
        expect(srcScenarioPresetType).toContain('delayedReturn');
        expect(srcScenarioPresetType).toContain('highResistanceWorld');
        expect(srcScenarioPresetType).toContain('lowResistanceWorld');
        expect(srcScenarioPresetType).toContain('slowEchoWorld');
        expect(srcScenarioPresetType).toContain('fastEchoWorld');
        expect(srcScenarioPresetType).toContain('longRunNaturalEmergence');
    });
});

describe('U7 ScenarioPreset registry', () => {
    it('SCENARIO_PRESET_REGISTRY has exactly 10 presets', () => {
        expect(SCENARIO_PRESET_REGISTRY).toHaveLength(10);
    });

    it('all preset IDs are unique', () => {
        const ids = SCENARIO_PRESET_REGISTRY.map(p => p.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(10);
    });

    it('all 10 expected IDs are present in the registry', () => {
        const ids = SCENARIO_PRESET_REGISTRY.map(p => p.id);
        expect(ids).toContain('quietObservation');
        expect(ids).toContain('singleTouch');
        expect(ids).toContain('repeatedGentleTouch');
        expect(ids).toContain('holdAndRelease');
        expect(ids).toContain('delayedReturn');
        expect(ids).toContain('highResistanceWorld');
        expect(ids).toContain('lowResistanceWorld');
        expect(ids).toContain('slowEchoWorld');
        expect(ids).toContain('fastEchoWorld');
        expect(ids).toContain('longRunNaturalEmergence');
    });

    it('all presets have non-empty recommendedLayers', () => {
        for (const preset of SCENARIO_PRESET_REGISTRY) {
            expect(preset.recommendedLayers.length).toBeGreaterThan(0);
        }
    });

    it('all presets have non-empty title, shortDescription, observationGoal, recommendedPanel', () => {
        for (const preset of SCENARIO_PRESET_REGISTRY) {
            expect(preset.title.length).toBeGreaterThan(0);
            expect(preset.shortDescription.length).toBeGreaterThan(0);
            expect(preset.observationGoal.length).toBeGreaterThan(0);
            expect(preset.recommendedPanel.length).toBeGreaterThan(0);
        }
    });

    it('all presets have a valid durationHint', () => {
        for (const preset of SCENARIO_PRESET_REGISTRY) {
            expect(['short', 'medium', 'long']).toContain(preset.durationHint);
        }
    });

    it('all preset texts contain no forbidden terms', () => {
        for (const preset of SCENARIO_PRESET_REGISTRY) {
            const allText = [
                preset.title,
                preset.shortDescription,
                preset.observationGoal,
                preset.safetyNote ?? '',
                ...preset.expectedSignals,
            ].join(' ').toLowerCase();

            for (const term of FORBIDDEN_TERMS) {
                expect(allText).not.toContain(term.toLowerCase());
            }
        }
    });

    it('registry source file contains no forbidden terms', () => {
        const src = srcRegistry.toLowerCase();
        for (const term of FORBIDDEN_TERMS) {
            expect(src).not.toContain(term.toLowerCase());
        }
    });
});

describe('U7 getScenarioPreset', () => {
    it('returns the correct preset for a known ID', () => {
        const preset = getScenarioPreset('quietObservation');
        expect(preset).toBeDefined();
        expect(preset?.id).toBe('quietObservation');
        expect(preset?.title).toBe('Quiet Observation');
    });

    it('returns undefined for an unknown ID', () => {
        // @ts-expect-error - testing unknown ID
        const preset = getScenarioPreset('nonExistentId');
        expect(preset).toBeUndefined();
    });

    it('all 10 preset IDs resolve via getScenarioPreset', () => {
        const ids = [
            'quietObservation', 'singleTouch', 'repeatedGentleTouch',
            'holdAndRelease', 'delayedReturn', 'highResistanceWorld',
            'lowResistanceWorld', 'slowEchoWorld', 'fastEchoWorld',
            'longRunNaturalEmergence',
        ] as const;
        for (const id of ids) {
            const preset = getScenarioPreset(id);
            expect(preset).toBeDefined();
            expect(preset?.id).toBe(id);
        }
    });
});

describe('U7 ScenarioRunState', () => {
    beforeEach(() => {
        resetScenarioRun();
    });

    it('initial state is idle', () => {
        const state = getScenarioRunState();
        expect(state.status).toBe('idle');
        expect(state.activeScenarioId).toBeNull();
        expect(state.startTick).toBeNull();
        expect(state.currentTick).toBeNull();
        expect(state.elapsedMs).toBeNull();
    });

    it('runScenario sets status to running', () => {
        runScenario('singleTouch', 100);
        const state = getScenarioRunState();
        expect(state.status).toBe('running');
        expect(state.activeScenarioId).toBe('singleTouch');
        expect(state.startTick).toBe(100);
        expect(state.currentTick).toBe(100);
        expect(state.elapsedMs).toBe(0);
    });

    it('pauseScenario sets status to paused', () => {
        runScenario('singleTouch', 100);
        pauseScenario();
        expect(getScenarioRunState().status).toBe('paused');
    });

    it('pauseScenario does nothing when not running', () => {
        pauseScenario();
        expect(getScenarioRunState().status).toBe('idle');
    });

    it('resumeScenario sets status to running from paused', () => {
        runScenario('singleTouch', 100);
        pauseScenario();
        resumeScenario();
        expect(getScenarioRunState().status).toBe('running');
    });

    it('resumeScenario does nothing when not paused', () => {
        runScenario('singleTouch', 100);
        resumeScenario();
        expect(getScenarioRunState().status).toBe('running');
    });

    it('stopScenario sets status to stopped', () => {
        runScenario('singleTouch', 100);
        stopScenario(200);
        const state = getScenarioRunState();
        expect(state.status).toBe('stopped');
        expect(state.currentTick).toBe(200);
    });

    it('resetScenarioRun resets to idle', () => {
        runScenario('singleTouch', 100);
        stopScenario(200);
        resetScenarioRun();
        const state = getScenarioRunState();
        expect(state.status).toBe('idle');
        expect(state.activeScenarioId).toBeNull();
        expect(state.startTick).toBeNull();
        expect(state.currentTick).toBeNull();
        expect(state.elapsedMs).toBeNull();
    });

    it('tickScenario updates currentTick and elapsedMs when running', () => {
        runScenario('singleTouch', 100);
        tickScenario(150, 5000);
        const state = getScenarioRunState();
        expect(state.currentTick).toBe(150);
        expect(state.elapsedMs).toBe(5000);
    });

    it('tickScenario does nothing when paused', () => {
        runScenario('singleTouch', 100);
        pauseScenario();
        tickScenario(200, 9000);
        const state = getScenarioRunState();
        expect(state.currentTick).toBe(100);
    });

    it('getScenarioRunState returns a copy, not the internal reference', () => {
        runScenario('singleTouch', 100);
        const state1 = getScenarioRunState();
        runScenario('quietObservation', 200);
        expect(state1.activeScenarioId).toBe('singleTouch');
    });
});

describe('U7 ScenarioResultSummary', () => {
    it('makeEmptyResultSummary returns hasResult=false', () => {
        const summary = makeEmptyResultSummary();
        expect(summary.hasResult).toBe(false);
        expect(summary.scenarioId).toBeNull();
        expect(summary.durationMs).toBeNull();
        expect(summary.ticks).toBeNull();
        expect(summary.semanticLeakCount).toBe(0);
        expect(summary.nanOrInfinityCount).toBe(0);
    });

    it('makeResultSummary sets hasResult=true', () => {
        const summary = makeResultSummary({
            scenarioId: 'quietObservation',
            scenarioTitle: 'Quiet Observation',
            durationMs: 10000,
            ticks: 500,
            averageFlowContinuity: 0.6,
            averageReturnStrength: 0.4,
            averageEchoStrength: 0.3,
            averageClosureStability: 0.5,
            highExcitabilityRegionCount: 2,
            repeatedFlowPathCandidateCount: 1,
            protoNetworkCandidateCount: 0,
            semanticLeakCount: 0,
            nanOrInfinityCount: 0,
        });
        expect(summary.hasResult).toBe(true);
    });

    it('makeResultSummary values come from params, not hardcoded', () => {
        const summary = makeResultSummary({
            scenarioId: 'singleTouch',
            scenarioTitle: 'Single Touch',
            durationMs: 3000,
            ticks: 100,
            averageFlowContinuity: 0.42,
            averageReturnStrength: 0.77,
            averageEchoStrength: 0.19,
            averageClosureStability: 0.63,
            highExcitabilityRegionCount: 3,
            repeatedFlowPathCandidateCount: 0,
            protoNetworkCandidateCount: 0,
            semanticLeakCount: 0,
            nanOrInfinityCount: 0,
        });
        expect(summary.scenarioId).toBe('singleTouch');
        expect(summary.scenarioTitle).toBe('Single Touch');
        expect(summary.durationMs).toBe(3000);
        expect(summary.ticks).toBe(100);
        expect(summary.averageFlowContinuity).toBe(0.42);
        expect(summary.averageReturnStrength).toBe(0.77);
        expect(summary.averageEchoStrength).toBe(0.19);
        expect(summary.averageClosureStability).toBe(0.63);
        expect(summary.highExcitabilityRegionCount).toBe(3);
    });

    it('ScenarioResultSummary source does not hardcode numeric result values', () => {
        // The makeResultSummary function must assign from params, not literals
        expect(srcResultSummary).toContain('params.averageFlowContinuity');
        expect(srcResultSummary).toContain('params.averageReturnStrength');
        expect(srcResultSummary).toContain('params.ticks');
        expect(srcResultSummary).toContain('params.durationMs');
    });
});

describe('U7 ScenarioComparison', () => {
    it('compareScenarios returns hasComparison=false when both null', () => {
        const result = compareScenarios(null, null);
        expect(result.hasComparison).toBe(false);
        expect(result.scenarioA).toBeNull();
        expect(result.scenarioB).toBeNull();
    });

    it('compareScenarios returns hasComparison=false when only one has result', () => {
        const summary = makeResultSummary({
            scenarioId: 'quietObservation',
            scenarioTitle: 'Quiet Observation',
            durationMs: 5000,
            ticks: 200,
            averageFlowContinuity: 0.5,
            averageReturnStrength: 0.4,
            averageEchoStrength: 0.3,
            averageClosureStability: 0.4,
            highExcitabilityRegionCount: 1,
            repeatedFlowPathCandidateCount: 0,
            protoNetworkCandidateCount: 0,
            semanticLeakCount: 0,
            nanOrInfinityCount: 0,
        });
        const result = compareScenarios(summary, null);
        expect(result.hasComparison).toBe(false);
    });

    it('compareScenarios returns hasComparison=true when both have result', () => {
        const summaryA = makeResultSummary({
            scenarioId: 'quietObservation',
            scenarioTitle: 'Quiet Observation',
            durationMs: 5000,
            ticks: 200,
            averageFlowContinuity: 0.5,
            averageReturnStrength: 0.4,
            averageEchoStrength: 0.3,
            averageClosureStability: 0.4,
            highExcitabilityRegionCount: 1,
            repeatedFlowPathCandidateCount: 0,
            protoNetworkCandidateCount: 0,
            semanticLeakCount: 0,
            nanOrInfinityCount: 0,
        });
        const summaryB = makeResultSummary({
            scenarioId: 'singleTouch',
            scenarioTitle: 'Single Touch',
            durationMs: 3000,
            ticks: 100,
            averageFlowContinuity: 0.3,
            averageReturnStrength: 0.6,
            averageEchoStrength: 0.2,
            averageClosureStability: 0.5,
            highExcitabilityRegionCount: 0,
            repeatedFlowPathCandidateCount: 0,
            protoNetworkCandidateCount: 0,
            semanticLeakCount: 0,
            nanOrInfinityCount: 0,
        });
        const result = compareScenarios(summaryA, summaryB);
        expect(result.hasComparison).toBe(true);
        expect(result.scenarioA?.scenarioId).toBe('quietObservation');
        expect(result.scenarioB?.scenarioId).toBe('singleTouch');
    });

    it('compareScenarios returns hasComparison=false for two empty summaries', () => {
        const empty = makeEmptyResultSummary();
        const result = compareScenarios(empty, empty);
        expect(result.hasComparison).toBe(false);
    });
});

describe('U7 recordScenarioControlEvent', () => {
    beforeEach(() => {
        resetEventHistory();
    });

    it('recordScenarioControlEvent adds an event to the history', () => {
        recordScenarioControlEvent('start', 'Quiet Observation', 10);
        const events = getRecentEvents(10);
        expect(events.length).toBeGreaterThan(0);
    });

    it('recordScenarioControlEvent with kind=start produces a scenarioControl event', () => {
        recordScenarioControlEvent('start', 'Single Touch', 50);
        const events = getRecentEvents(5);
        const ev = events.find(e => e.kind === 'scenarioControl');
        expect(ev).toBeDefined();
        expect(ev?.text).toContain('Single Touch');
        expect(ev?.text).toContain('started');
    });

    it('recordScenarioControlEvent with kind=summary produces a scenarioSummary event', () => {
        recordScenarioControlEvent('summary', 'Hold and Release', 200);
        const events = getRecentEvents(5);
        const ev = events.find(e => e.kind === 'scenarioSummary');
        expect(ev).toBeDefined();
        expect(ev?.text).toContain('Hold and Release');
    });

    it('recordScenarioControlEvent with kind=stop produces a scenarioControl event with stopped text', () => {
        recordScenarioControlEvent('stop', 'Delayed Return', 300);
        const events = getRecentEvents(5);
        const ev = events.find(e => e.kind === 'scenarioControl');
        expect(ev).toBeDefined();
        expect(ev?.text).toContain('stopped');
    });

    it('recordScenarioControlEvent with kind=reset produces a scenarioControl event with reset text', () => {
        recordScenarioControlEvent('reset', 'Fast Echo World', 0);
        const events = getRecentEvents(5);
        const ev = events.find(e => e.kind === 'scenarioControl');
        expect(ev?.text).toContain('reset');
    });
});

describe('U7 AeternaEventKind includes scenario kinds', () => {
    it('AeternaEventKind includes scenarioControl', () => {
        expect(srcAeternaEventType).toContain('scenarioControl');
    });

    it('AeternaEventKind includes scenarioSummary', () => {
        expect(srcAeternaEventType).toContain('scenarioSummary');
    });
});

describe('U7 deriveAeternaEvents includes recordScenarioControlEvent', () => {
    it('deriveAeternaEvents.ts exports recordScenarioControlEvent', () => {
        expect(srcDeriveAeternaEvents).toContain('recordScenarioControlEvent');
        expect(srcDeriveAeternaEvents).toContain('export function recordScenarioControlEvent');
    });
});

describe('U7 no runtime dynamics imported in scenario UI files', () => {
    it('ScenarioRunState.ts does not import runtime dynamics', () => {
        for (const pattern of RUNTIME_DYNAMICS_PATTERNS) {
            expect(srcRunState).not.toContain(pattern);
        }
    });

    it('ScenarioResultSummary.ts does not import runtime dynamics', () => {
        for (const pattern of RUNTIME_DYNAMICS_PATTERNS) {
            expect(srcResultSummary).not.toContain(pattern);
        }
    });

    it('ScenarioComparison.ts does not import runtime dynamics', () => {
        for (const pattern of RUNTIME_DYNAMICS_PATTERNS) {
            expect(srcComparison).not.toContain(pattern);
        }
    });

    it('scenarioPresetRegistry.ts does not import runtime dynamics', () => {
        for (const pattern of RUNTIME_DYNAMICS_PATTERNS) {
            expect(srcRegistry).not.toContain(pattern);
        }
    });
});
