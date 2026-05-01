/**
 * overviewNowSummaryTimeline.test.ts
 * U5: Overview / Now Summary / Event Timeline — static smoke tests
 *
 * Verifies that:
 * - OverviewState type is defined correctly
 * - NowSummaryState type is defined correctly
 * - AeternaEvent type is defined correctly
 * - deriveOverviewState produces valid output (no LLM / API)
 * - deriveNowSummary produces 3–5 lines (no LLM / API)
 * - deriveNowSummary does NOT contain forbidden expressions
 * - deriveAeternaEvents does NOT create fake events
 * - Semantic Leak status is expressible
 * - Explain Button snapshot interface is defined
 * - Runtime dynamics are not modified by any of these modules
 *
 * These are static / unit tests — no browser or DOM required.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Modules under test ────────────────────────────────────────────────────────

import {
    deriveOverviewState,
} from '../../ui/overview/deriveOverviewState.js';

import {
    deriveNowSummary,
} from '../../ui/summary/deriveNowSummary.js';

import {
    deriveAeternaEvents,
    getRecentEvents,
    resetEventHistory,
} from '../../ui/timeline/deriveAeternaEvents.js';

import {
    buildExplainableSnapshot,
} from '../../ui/explain/explainableObservationSnapshot.js';

// ── Source files for static analysis ─────────────────────────────────────────

const ROOT = resolve(__dirname, '../..');

function readSrc(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const srcDeriveOverview   = readSrc('ui/overview/deriveOverviewState.ts');
const srcDeriveNowSummary = readSrc('ui/summary/deriveNowSummary.ts');
const srcDeriveEvents     = readSrc('ui/timeline/deriveAeternaEvents.ts');
const srcExplain          = readSrc('ui/explain/explainableObservationSnapshot.ts');
const srcOverviewType     = readSrc('types/overviewState.ts');
const srcNowSummaryType   = readSrc('types/nowSummary.ts');
const srcAeternaEventType = readSrc('types/aeternaEvent.ts');

// ── Test data helpers ─────────────────────────────────────────────────────────

function makeViability(overrides: Record<string, number> = {}) {
    return {
        timestamp: 1000,
        flowContinuity:      0.5,
        energyThroughput:    0.4,
        dissipationBalance:  0.3,
        resistanceBalance:   0.4,
        delayCoherence:      0.5,
        boundaryExchange:    0.4,
        underCouplingRisk:   0.1,
        overCouplingRisk:    0.1,
        saturationRisk:      0.1,
        extinctionRisk:      0.1,
        viabilityConfidence: 0.8,
        ...overrides,
    };
}

function makeClosure(overrides: Record<string, number> = {}) {
    return {
        timestamp:             1000,
        loopGain:              0.4,
        roundTripDelay:        0.3,
        returnStrength:        0.5,
        selfCausedMatch:       0.4,
        worldMismatch:         0.2,
        closureStability:      0.4,
        closureDrift:          0.1,
        unresolvedReturn:      0.1,
        feedbackSaturationRisk: 0.1,
        returnMismatch:        0.2,
        ...overrides,
    };
}

function makeMembraneObservation(overrides: Record<string, number> = {}) {
    return {
        timestamp: 1000,
        averagePermeability: 0.5,
        averageTension: 0.45,
        averageDeformation: 0.2,
        averageTwoSidedness: 0.15,
        highDeformationRegionCount: 1,
        highTwoSidednessRegionCount: 0,
        actuationReturnOverlap: 0.12,
        membraneRecoveryBalance: 0.8,
        membraneAsymmetry: 0.1,
        membraneIntegrity: 0.85,
        observationConfidence: 0.9,
        nanOrInfinityCount: 0,
        ...overrides,
    };
}

// ── Type definition tests ─────────────────────────────────────────────────────

describe('U5 type definitions', () => {
    it('OverviewState type is defined', () => {
        expect(srcOverviewType).toContain('OverviewState');
        expect(srcOverviewType).toContain('OverviewMetric');
        expect(srcOverviewType).toContain('overallStatus');
        expect(srcOverviewType).toContain('confidence');
    });

    it('OverviewMetric has valueKind field', () => {
        expect(srcOverviewType).toContain('valueKind');
        expect(srcOverviewType).toContain('measured');
        expect(srcOverviewType).toContain('derived');
        expect(srcOverviewType).toContain('proxy');
        expect(srcOverviewType).toContain('check');
    });

    it('NowSummaryState type is defined', () => {
        expect(srcNowSummaryType).toContain('NowSummaryState');
        expect(srcNowSummaryType).toContain('NowSummaryLine');
        expect(srcNowSummaryType).toContain('priority');
        expect(srcNowSummaryType).toContain('text');
        expect(srcNowSummaryType).toContain('confidence');
    });

    it('NowSummaryLine has valueKind field', () => {
        expect(srcNowSummaryType).toContain('valueKind');
    });

    it('AeternaEvent type is defined', () => {
        expect(srcAeternaEventType).toContain('AeternaEvent');
        expect(srcAeternaEventType).toContain('AeternaEventKind');
        expect(srcAeternaEventType).toContain('tick');
        expect(srcAeternaEventType).toContain('severity');
        expect(srcAeternaEventType).toContain('text');
        expect(srcAeternaEventType).toContain('valueKind');
    });

    it('AeternaEventKind covers all required kinds', () => {
        const src = srcAeternaEventType;
        expect(src).toContain('actuationPulse');
        expect(src).toContain('sensoryReturn');
        expect(src).toContain('closureMetricChange');
        expect(src).toContain('localExcitabilityShift');
        expect(src).toContain('repeatedFlowPathObserved');
        expect(src).toContain('protoNetworkCandidateObserved');
        expect(src).toContain('riskChange');
        expect(src).toContain('semanticLeakCheck');
        expect(src).toContain('diagnosticWarning');
    });
});

// ── deriveOverviewState tests ─────────────────────────────────────────────────

describe('deriveOverviewState', () => {
    it('returns a valid OverviewState with no input', () => {
        const state = deriveOverviewState({ timestamp: 0 });
        expect(state).toBeDefined();
        expect(Array.isArray(state.metrics)).toBe(true);
        expect(typeof state.overallStatus).toBe('string');
        expect(typeof state.confidence).toBe('number');
        expect(state.confidence).toBeGreaterThanOrEqual(0);
        expect(state.confidence).toBeLessThanOrEqual(1);
    });

    it('always includes semanticLeak metric', () => {
        const state = deriveOverviewState({ timestamp: 0 });
        const leak = state.metrics.find(m => m.id === 'semanticLeak');
        expect(leak).toBeDefined();
        expect(leak?.value).toBe(0);
        expect(leak?.status).toBe('clear');
        expect(leak?.valueKind).toBe('check');
    });

    it('includes LLM Teacher and Node Bridge as inactive checks', () => {
        const state = deriveOverviewState({ timestamp: 0 });
        const llm = state.metrics.find(m => m.id === 'llmTeacher');
        const bridge = state.metrics.find(m => m.id === 'nodeBridge');
        expect(llm?.value).toBe('inactive');
        expect(llm?.status).toBe('clear');
        expect(bridge?.value).toBe('inactive');
        expect(bridge?.status).toBe('clear');
    });

    it('returns all core metrics when viability is provided', () => {
        const state = deriveOverviewState({ viability: makeViability(), timestamp: 0 });
        const ids = state.metrics.map(m => m.id);
        expect(ids).toContain('flowContinuity');
        expect(ids).toContain('energyThroughput');
        expect(ids).toContain('boundaryExchange');
        expect(ids).toContain('saturationRisk');
        expect(ids).toContain('extinctionRisk');
    });

    it('classifies high saturation risk correctly', () => {
        const state = deriveOverviewState({
            viability: makeViability({ saturationRisk: 0.8 }),
            timestamp: 0,
        });
        const sat = state.metrics.find(m => m.id === 'saturationRisk');
        expect(sat?.status).toBe('warning');
        expect(state.overallStatus).toBe('saturated-risk');
    });

    it('classifies high extinction risk correctly', () => {
        const state = deriveOverviewState({
            viability: makeViability({ extinctionRisk: 0.75, saturationRisk: 0 }),
            timestamp: 0,
        });
        expect(state.overallStatus).toBe('extinction-risk');
    });

    it('clamps all numeric metric values to [0, 1]', () => {
        const state = deriveOverviewState({
            viability: makeViability({ flowContinuity: 2.0, saturationRisk: -0.5 }),
            timestamp: 0,
        });
        state.metrics.forEach(m => {
            if (typeof m.value === 'number') {
                expect(m.value).toBeGreaterThanOrEqual(0);
                expect(m.value).toBeLessThanOrEqual(1);
            }
        });
    });

    it('includes membrane metrics when membrane observation is provided', () => {
        const state = deriveOverviewState({
            viability: makeViability(),
            closure: makeClosure(),
            membraneObservation: makeMembraneObservation({ averageDeformation: 0.42, actuationReturnOverlap: 0.28 }),
            timestamp: 0,
        });
        const ids = state.metrics.map(m => m.id);
        expect(ids).toContain('membraneDeformation');
        expect(ids).toContain('membraneOverlap');
        expect(ids).toContain('membraneIntegrity');
    });

    it('does not contain consciousness / emotion claim strings in output logic', () => {
        // Check that actual consciousness / emotion claim strings are not in text output
        // (Comments that document forbidden terms are acceptable; actual claim strings are not.)
        const claimPhrases = [
            'AETERNA is thinking',
            'AETERNA wants',
            'AETERNA feels',
            'AETERNA became conscious',
            'AETERNA remembered you',
            'is sentient',
        ];
        claimPhrases.forEach(phrase => {
            expect(srcDeriveOverview).not.toContain(phrase);
        });
    });
});

// ── deriveNowSummary tests ────────────────────────────────────────────────────

describe('deriveNowSummary', () => {
    it('returns a valid NowSummaryState with no input', () => {
        const summary = deriveNowSummary({ timestamp: 0 });
        expect(summary).toBeDefined();
        expect(Array.isArray(summary.lines)).toBe(true);
        expect(summary.lines.length).toBeGreaterThanOrEqual(1);
        expect(summary.lines.length).toBeLessThanOrEqual(5);
        expect(typeof summary.confidence).toBe('number');
    });

    it('returns 3–5 lines when viability and closure are provided', () => {
        const summary = deriveNowSummary({
            viability: makeViability(),
            closure: makeClosure(),
            timestamp: 0,
        });
        expect(summary.lines.length).toBeGreaterThanOrEqual(3);
        expect(summary.lines.length).toBeLessThanOrEqual(5);
    });

    it('lines are sorted by priority ascending', () => {
        const summary = deriveNowSummary({
            viability: makeViability({ saturationRisk: 0.8 }),
            closure: makeClosure(),
            timestamp: 0,
        });
        for (let i = 1; i < summary.lines.length; i++) {
            expect(summary.lines[i].priority).toBeGreaterThanOrEqual(summary.lines[i - 1].priority);
        }
    });

    it('each line has required fields', () => {
        const summary = deriveNowSummary({ viability: makeViability(), timestamp: 0 });
        summary.lines.forEach(line => {
            expect(typeof line.id).toBe('string');
            expect(typeof line.priority).toBe('number');
            expect(typeof line.text).toBe('string');
            expect(line.text.length).toBeGreaterThan(0);
            expect(typeof line.source).toBe('string');
            expect(['measured', 'derived', 'proxy', 'presentation-smoothed', 'check'])
                .toContain(line.valueKind);
        });
    });

    it('high saturation risk generates a priority-2 line', () => {
        const summary = deriveNowSummary({
            viability: makeViability({ saturationRisk: 0.8 }),
            timestamp: 0,
        });
        const riskLine = summary.lines.find(l => l.priority <= 2 && l.id.includes('sat'));
        expect(riskLine).toBeDefined();
    });

    it('includes semantic leak check line', () => {
        const summary = deriveNowSummary({ timestamp: 0, semanticLeakCount: 0 });
        const checkLine = summary.lines.find(l => l.id === 'semanticLeakClear' || l.id === 'semanticLeakFound');
        expect(checkLine).toBeDefined();
    });

    it('adds membrane observation text when membrane data is present', () => {
        const summary = deriveNowSummary({
            viability: makeViability(),
            closure: makeClosure(),
            membraneObservation: makeMembraneObservation({
                averageDeformation: 0.48,
                actuationReturnOverlap: 0.26,
                membraneIntegrity: 0.8,
            }),
            timestamp: 0,
        });
        expect(summary.lines.some(l => l.text.includes('Membrane deformation'))).toBe(true);
    });

    it('does NOT use LLM, API, or fetch', () => {
        expect(srcDeriveNowSummary).not.toContain('fetch(');
        expect(srcDeriveNowSummary).not.toContain('openai');
        expect(srcDeriveNowSummary).not.toContain('gemini');
        expect(srcDeriveNowSummary).not.toContain('axios');
        expect(srcDeriveNowSummary).not.toContain('llm');
        expect(srcDeriveNowSummary).not.toContain('apiKey');
        expect(srcDeriveNowSummary).not.toContain('API_KEY');
    });

    it('does NOT contain forbidden emotion / consciousness claim strings in source', () => {
        // Check for actual claim strings, not documentation of forbidden terms
        const claimPhrases = [
            'AETERNA is thinking',
            'AETERNA wants',
            'AETERNA feels',
            'AETERNA became conscious',
            'AETERNA remembered you',
            'is sentient',
            '考えています',
            '寂しがっています',
            '意識が生まれました',
            '覚えました',
        ];
        claimPhrases.forEach(phrase => {
            expect(srcDeriveNowSummary).not.toContain(phrase);
        });
    });

    it('does NOT contain forbidden emotion / consciousness expressions in any generated text', () => {
        const summary = deriveNowSummary({
            viability: makeViability(),
            closure: makeClosure(),
            timestamp: 0,
        });
        const allText = summary.lines.map(l => l.text).join(' ').toLowerCase();
        const forbidden = [
            'thinking', 'wants', 'feels', 'lonely', 'conscious',
            'understands', 'remembered', 'emotion', 'sentient',
        ];
        forbidden.forEach(word => {
            expect(allText).not.toContain(word);
        });
    });
});

// ── deriveAeternaEvents tests ─────────────────────────────────────────────────

describe('deriveAeternaEvents', () => {
    beforeEach(() => {
        resetEventHistory();
    });

    it('returns an array of events on first call', () => {
        const events = deriveAeternaEvents({
            viability: makeViability(),
            closure: makeClosure(),
            tick: 100,
            timestamp: Date.now(),
        });
        expect(Array.isArray(events)).toBe(true);
    });

    it('includes a semantic leak check on first call', () => {
        const events = deriveAeternaEvents({
            tick: 1,
            timestamp: Date.now(),
        });
        const check = events.find(e => e.kind === 'semanticLeakCheck');
        expect(check).toBeDefined();
        expect(check?.severity).toBe('info');
    });

    it('each event has required fields', () => {
        const events = deriveAeternaEvents({
            viability: makeViability(),
            tick: 100,
            timestamp: Date.now(),
        });
        events.forEach(ev => {
            expect(typeof ev.id).toBe('string');
            expect(typeof ev.tick).toBe('number');
            expect(typeof ev.timestamp).toBe('number');
            expect(typeof ev.kind).toBe('string');
            expect(['info', 'notice', 'warning']).toContain(ev.severity);
            expect(typeof ev.text).toBe('string');
            expect(ev.text.length).toBeGreaterThan(0);
            expect(['measured', 'derived', 'proxy', 'check']).toContain(ev.valueKind);
        });
    });

    it('does NOT contain forbidden event text', () => {
        const events = deriveAeternaEvents({
            viability: makeViability(),
            closure: makeClosure(),
            tick: 100,
            timestamp: Date.now(),
        });
        const allText = events.map(e => e.text).join(' ').toLowerCase();
        const forbidden = ['wanted to respond', 'remembered a path', 'understood', 'felt unstable'];
        forbidden.forEach(phrase => {
            expect(allText).not.toContain(phrase);
        });
    });

    it('detects saturation risk increase and emits a riskChange event', () => {
        deriveAeternaEvents({ viability: makeViability({ saturationRisk: 0.1 }), tick: 1, timestamp: Date.now() });
        const events = deriveAeternaEvents({ viability: makeViability({ saturationRisk: 0.7 }), tick: 2, timestamp: Date.now() });
        const riskEv = events.find(e => e.kind === 'riskChange' && e.text.includes('Saturation'));
        expect(riskEv).toBeDefined();
        expect(riskEv?.severity).toBe('warning');
    });

    it('detects membrane deformation increase and emits a membraneObservation event', () => {
        deriveAeternaEvents({
            viability: makeViability(),
            closure: makeClosure(),
            membraneObservation: makeMembraneObservation({ averageDeformation: 0.05, actuationReturnOverlap: 0.02 }),
            tick: 1,
            timestamp: Date.now(),
        });
        const events = deriveAeternaEvents({
            viability: makeViability(),
            closure: makeClosure(),
            membraneObservation: makeMembraneObservation({ averageDeformation: 0.42, actuationReturnOverlap: 0.28 }),
            tick: 2,
            timestamp: Date.now(),
        });
        const membraneEv = events.find(e => e.kind === 'membraneObservation');
        expect(membraneEv).toBeDefined();
    });

    it('does NOT emit events when values do not change significantly', () => {
        deriveAeternaEvents({ viability: makeViability({ saturationRisk: 0.5 }), tick: 1, timestamp: Date.now() });
        resetEventHistory();

        // Very small change — should not trigger an event
        deriveAeternaEvents({ viability: makeViability({ saturationRisk: 0.5 }), tick: 2, timestamp: Date.now() });
        const events = deriveAeternaEvents({ viability: makeViability({ saturationRisk: 0.52 }), tick: 3, timestamp: Date.now() });
        const riskEv = events.filter(e => e.kind === 'riskChange');
        expect(riskEv.length).toBe(0);
    });

    it('does NOT modify any source with runtime dynamics changes', () => {
        // Check that deriveAeternaEvents source does not call simulation update functions
        expect(srcDeriveEvents).not.toContain('organism.update');
        expect(srcDeriveEvents).not.toContain('network.step');
        expect(srcDeriveEvents).not.toContain('dynamicCore');
    });

    it('getRecentEvents returns most recent events', () => {
        deriveAeternaEvents({ tick: 1, timestamp: Date.now() });
        const recent = getRecentEvents(5);
        expect(Array.isArray(recent)).toBe(true);
        expect(recent.length).toBeLessThanOrEqual(5);
    });
});

// ── ExplainableObservationSnapshot tests ─────────────────────────────────────

describe('ExplainableObservationSnapshot', () => {
    it('buildExplainableSnapshot returns a valid snapshot', () => {
        const overview = deriveOverviewState({ timestamp: 0 });
        const summary  = deriveNowSummary({ timestamp: 0 });
        const events   = getRecentEvents();
        const snapshot = buildExplainableSnapshot(overview, summary, events);

        expect(snapshot.overview).toBeDefined();
        expect(snapshot.nowSummary).toBeDefined();
        expect(Array.isArray(snapshot.recentEvents)).toBe(true);
        expect(typeof snapshot.timestamp).toBe('number');
    });

    it('snapshot works with null overview and summary', () => {
        const snapshot = buildExplainableSnapshot(null, null, []);
        expect(snapshot.overview).toBeNull();
        expect(snapshot.nowSummary).toBeNull();
        expect(snapshot.recentEvents).toHaveLength(0);
    });

    it('snapshot interface is defined in source', () => {
        expect(srcExplain).toContain('ExplainableObservationSnapshot');
        expect(srcExplain).toContain('overview');
        expect(srcExplain).toContain('nowSummary');
        expect(srcExplain).toContain('recentEvents');
    });

    it('does NOT contain LLM calls', () => {
        expect(srcExplain).not.toContain('fetch(');
        expect(srcExplain).not.toContain('openai');
        expect(srcExplain).not.toContain('llm');
    });
});

// ── Runtime safety tests ──────────────────────────────────────────────────────

describe('Runtime safety: no dynamics modification', () => {
    const allSources = [
        srcDeriveOverview,
        srcDeriveNowSummary,
        srcDeriveEvents,
        srcExplain,
    ];

    it('no source calls organism.update or network.step', () => {
        allSources.forEach(src => {
            expect(src).not.toContain('organism.update');
            expect(src).not.toContain('network.step');
            expect(src).not.toContain('dynamicCore');
        });
    });

    it('no source adds fake energy or fake events', () => {
        allSources.forEach(src => {
            expect(src).not.toContain('fakeEnergy');
            expect(src).not.toContain('fakeEvent');
            expect(src).not.toContain('fakeTrace');
            expect(src).not.toContain('fakeReturn');
        });
    });

    it('no source adds semantic node or LLM teacher runtime additions', () => {
        allSources.forEach(src => {
            // Check that these are not being added as runtime features
            expect(src).not.toContain('addSemanticNode');
            expect(src).not.toContain('createSemanticNode');
            expect(src).not.toContain('teacherBinding');
            expect(src).not.toContain('llmTeacherCall');
            expect(src).not.toContain('nodeBridgeConnect');
        });
    });
});

// ── Semantic Leak display test ────────────────────────────────────────────────

describe('Semantic Leak status visibility', () => {
    it('deriveOverviewState produces a semanticLeak metric', () => {
        const state = deriveOverviewState({ semanticLeakCount: 0, timestamp: 0 });
        const leak = state.metrics.find(m => m.id === 'semanticLeak');
        expect(leak).toBeDefined();
        expect(leak?.valueKind).toBe('check');
        expect(leak?.status).toBe('clear');
    });

    it('semanticLeak metric shows warning when count > 0', () => {
        const state = deriveOverviewState({ semanticLeakCount: 2, timestamp: 0 });
        const leak = state.metrics.find(m => m.id === 'semanticLeak');
        expect(leak?.status).toBe('warning');
    });

    it('deriveNowSummary includes semantic leak check line', () => {
        const summary = deriveNowSummary({ semanticLeakCount: 0, timestamp: 0 });
        const leakLine = summary.lines.find(l =>
            l.id === 'semanticLeakClear' || l.id === 'semanticLeakFound'
        );
        expect(leakLine).toBeDefined();
    });
});
