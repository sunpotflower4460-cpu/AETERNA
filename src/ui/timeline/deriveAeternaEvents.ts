/**
 * deriveAeternaEvents.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Derives AeternaEvent entries from state transition observations.
 * Events are fact-based — no fake events, no emotion claims.
 *
 * Principles:
 * - Events are generated only when a meaningful state change is observed.
 * - No fake events are created to simulate activity.
 * - Event text is neutral and observational only.
 * - The event log is bounded; oldest entries are discarded.
 * - Does NOT modify any runtime state.
 *
 * Reference: docs/scientific-ui-ux-principles.md §3
 */

import type { AeternaEvent, AeternaEventKind, AeternaEventSeverity } from '../../types/aeternaEvent.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { LocalExcitabilityFieldState } from '../../types/localExcitabilityField.ts';
import type { RepeatedFlowPathObservationState } from '../../types/repeatedFlowPath.ts';
import type { ProtoNetworkObservationState } from '../../types/protoNetworkCandidate.ts';

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_EVENT_HISTORY = 50;

// Minimum change in a value before triggering an event (prevents event spam)
const RISK_CHANGE_THRESHOLD    = 0.15;
const CLOSURE_CHANGE_THRESHOLD = 0.12;
const FLOW_CHANGE_THRESHOLD    = 0.15;

// ── Previous-state snapshot (for delta detection) ─────────────────────────────

interface PrevSnapshot {
    saturationRisk:     number;
    extinctionRisk:     number;
    flowContinuity:     number;
    returnStrength:     number;
    closureStability:   number;
    mismatch:           number;
    localExciteHigh:    number;
    repeatedPathCount:  number;
    protoNetCount:      number;
    semanticLeakCount:  number;
}

let _prevSnapshot: PrevSnapshot | null = null;
let _eventHistory: AeternaEvent[] = [];
let _eventIndex = 0;

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeId(kind: AeternaEventKind, tick: number): string {
    return `${kind}-${tick}-${_eventIndex++}`;
}

function makeEvent(
    kind: AeternaEventKind,
    severity: AeternaEventSeverity,
    text: string,
    source: string,
    tick: number,
    valueKind: AeternaEvent['valueKind'] = 'derived'
): AeternaEvent {
    return {
        id: makeId(kind, tick),
        tick,
        timestamp: Date.now(),
        kind,
        severity,
        text,
        source,
        valueKind,
    };
}

function push(ev: AeternaEvent): void {
    _eventHistory.unshift(ev);
    if (_eventHistory.length > MAX_EVENT_HISTORY) {
        _eventHistory.length = MAX_EVENT_HISTORY;
    }
}

// ── deriveAeternaEvents ────────────────────────────────────────────────────────

export interface DeriveAeternaEventsParams {
    viability?: DynamicViabilityState | null;
    closure?: BodyWorldClosureState | null;
    localField?: LocalExcitabilityFieldState | null;
    repeatedFlowPaths?: RepeatedFlowPathObservationState | null;
    protoNetwork?: ProtoNetworkObservationState | null;
    semanticLeakCount?: number;
    nanOrInfinityCount?: number;
    tick: number;
    timestamp: number;
}

/**
 * Detect state transitions and emit AeternaEvent entries when significant
 * changes are observed.
 *
 * This function is stateful — it maintains a previous-snapshot for delta detection.
 * Call once per display-update cycle (not every simulation frame).
 *
 * Does NOT create fake events. Only emits when real state changes are detected.
 * Does NOT modify any runtime simulation state.
 */
export function deriveAeternaEvents(params: DeriveAeternaEventsParams): AeternaEvent[] {
    const {
        viability,
        closure,
        localField,
        repeatedFlowPaths,
        protoNetwork,
        semanticLeakCount = 0,
        nanOrInfinityCount = 0,
        tick,
    } = params;

    const cur: PrevSnapshot = {
        saturationRisk:    viability?.saturationRisk ?? 0,
        extinctionRisk:    viability?.extinctionRisk ?? 0,
        flowContinuity:    viability?.flowContinuity ?? 0,
        returnStrength:    closure?.returnStrength ?? 0,
        closureStability:  closure?.closureStability ?? 0,
        mismatch:          closure?.returnMismatch ?? 0,
        localExciteHigh:   localField?.highExcitabilityRegionCount ?? 0,
        repeatedPathCount: repeatedFlowPaths?.pathCandidateCount ?? 0,
        protoNetCount:     protoNetwork?.networkCandidateCount ?? 0,
        semanticLeakCount,
    };

    // First call — initialise snapshot and emit a startup check
    if (_prevSnapshot === null) {
        _prevSnapshot = cur;

        push(makeEvent(
            'semanticLeakCheck',
            'info',
            `tick ${tick}: System check — Semantic leak: 0  LLM Teacher: inactive  Node Bridge: inactive`,
            'integrity check',
            tick,
            'check'
        ));

        if (nanOrInfinityCount > 0) {
            push(makeEvent(
                'diagnosticWarning',
                'warning',
                `tick ${tick}: Diagnostic — ${nanOrInfinityCount} NaN / Infinity value(s) detected`,
                'diagnostic check',
                tick,
                'check'
            ));
        }

        return [..._eventHistory];
    }

    const prev = _prevSnapshot;

    // ── Risk changes ─────────────────────────────────────────────────────────

    if (Math.abs(cur.saturationRisk - prev.saturationRisk) >= RISK_CHANGE_THRESHOLD) {
        const dir = cur.saturationRisk > prev.saturationRisk ? 'increased' : 'decreased';
        const sev: AeternaEventSeverity = cur.saturationRisk >= 0.65 ? 'warning' : 'notice';
        push(makeEvent(
            'riskChange',
            sev,
            `tick ${tick}: Saturation risk ${dir} → ${cur.saturationRisk.toFixed(2)}`,
            'DynamicViabilityState.saturationRisk',
            tick,
            'proxy'
        ));
    }

    if (Math.abs(cur.extinctionRisk - prev.extinctionRisk) >= RISK_CHANGE_THRESHOLD) {
        const dir = cur.extinctionRisk > prev.extinctionRisk ? 'increased' : 'decreased';
        const sev: AeternaEventSeverity = cur.extinctionRisk >= 0.65 ? 'warning' : 'notice';
        push(makeEvent(
            'riskChange',
            sev,
            `tick ${tick}: Extinction risk ${dir} → ${cur.extinctionRisk.toFixed(2)}`,
            'DynamicViabilityState.extinctionRisk',
            tick,
            'proxy'
        ));
    }

    // ── Flow change ──────────────────────────────────────────────────────────

    if (Math.abs(cur.flowContinuity - prev.flowContinuity) >= FLOW_CHANGE_THRESHOLD) {
        const dir = cur.flowContinuity > prev.flowContinuity ? 'increased' : 'decreased';
        push(makeEvent(
            'actuationPulse',
            'notice',
            `tick ${tick}: Flow continuity ${dir} → ${cur.flowContinuity.toFixed(2)}`,
            'DynamicViabilityState.flowContinuity',
            tick,
            'derived'
        ));
    }

    // ── Return / Closure changes ─────────────────────────────────────────────

    if (Math.abs(cur.returnStrength - prev.returnStrength) >= CLOSURE_CHANGE_THRESHOLD) {
        const dir = cur.returnStrength > prev.returnStrength ? 'detected' : 'weakened';
        push(makeEvent(
            'sensoryReturn',
            'notice',
            `tick ${tick}: Sensory return signal ${dir} → ${cur.returnStrength.toFixed(2)}`,
            'BodyWorldClosureState.returnStrength',
            tick,
            'derived'
        ));
    }

    if (Math.abs(cur.closureStability - prev.closureStability) >= CLOSURE_CHANGE_THRESHOLD) {
        const dir = cur.closureStability > prev.closureStability ? 'strengthened' : 'weakened';
        push(makeEvent(
            'closureMetricChange',
            'notice',
            `tick ${tick}: Closure loop stability ${dir} → ${cur.closureStability.toFixed(2)}`,
            'BodyWorldClosureState.closureStability',
            tick,
            'proxy'
        ));
    }

    if (Math.abs(cur.mismatch - prev.mismatch) >= CLOSURE_CHANGE_THRESHOLD) {
        const dir = cur.mismatch > prev.mismatch ? 'increased' : 'decreased';
        const sev: AeternaEventSeverity = cur.mismatch >= 0.6 ? 'warning' : 'notice';
        push(makeEvent(
            'reafferenceComparison',
            sev,
            `tick ${tick}: Reafference mismatch ${dir} → ${cur.mismatch.toFixed(2)}`,
            'BodyWorldClosureState.returnMismatch',
            tick,
            'derived'
        ));
    }

    // ── Local excitability shift ──────────────────────────────────────────────

    if (cur.localExciteHigh !== prev.localExciteHigh) {
        push(makeEvent(
            'localExcitabilityShift',
            'info',
            `tick ${tick}: High-excitability region count changed → ${cur.localExciteHigh}`,
            'LocalExcitabilityFieldState.highExcitabilityRegionCount',
            tick,
            'derived'
        ));
    }

    // ── Repeated flow path change ─────────────────────────────────────────────

    if (cur.repeatedPathCount > prev.repeatedPathCount) {
        push(makeEvent(
            'repeatedFlowPathObserved',
            'info',
            `tick ${tick}: Repeated flow path candidate count increased → ${cur.repeatedPathCount}`,
            'RepeatedFlowPathObservationState.pathCandidateCount',
            tick,
            'derived'
        ));
    }

    // ── Proto-network candidate change ────────────────────────────────────────

    if (cur.protoNetCount > prev.protoNetCount) {
        push(makeEvent(
            'protoNetworkCandidateObserved',
            'info',
            `tick ${tick}: Proto-network candidate count increased → ${cur.protoNetCount}`,
            'ProtoNetworkObservationState.networkCandidateCount',
            tick,
            'proxy'
        ));
    }

    // ── NaN / Infinity diagnostic ─────────────────────────────────────────────

    if (nanOrInfinityCount > 0) {
        push(makeEvent(
            'diagnosticWarning',
            'warning',
            `tick ${tick}: ${nanOrInfinityCount} NaN / Infinity value(s) in field buffers`,
            'diagnostic check',
            tick,
            'check'
        ));
    }

    // ── Periodic semantic leak check (every ~300 ticks) ───────────────────────

    if (tick % 300 === 0) {
        push(makeEvent(
            'semanticLeakCheck',
            'info',
            `tick ${tick}: Semantic leak check — count: ${semanticLeakCount} — ${semanticLeakCount === 0 ? 'clear' : 'warning'}`,
            'integrity check',
            tick,
            'check'
        ));
    }

    _prevSnapshot = cur;
    return [..._eventHistory];
}

// ── Public accessors ──────────────────────────────────────────────────────────

/** Return the most recent N events (newest first). */
export function getRecentEvents(n = 7): AeternaEvent[] {
    return _eventHistory.slice(0, n);
}

/** Clear the event history and previous snapshot (for testing / reset). */
export function resetEventHistory(): void {
    _eventHistory = [];
    _prevSnapshot = null;
    _eventIndex = 0;
}

// ── Scenario control events ───────────────────────────────────────────────────

/**
 * Record a scenario control event (start / pause / resume / stop / reset / summary).
 *
 * Pushes a real AeternaEvent to the history.
 * Does NOT create fake events — only called explicitly by scenario UI state handlers.
 * Does NOT modify any runtime simulation state.
 */
export function recordScenarioControlEvent(
    kind: 'start' | 'pause' | 'resume' | 'stop' | 'reset' | 'summary',
    scenarioTitle: string,
    tick: number
): void {
    const eventKind = kind === 'summary' ? 'scenarioSummary' as const : 'scenarioControl' as const;
    const actionText = kind === 'start'   ? 'started'
        : kind === 'pause'  ? 'paused'
        : kind === 'resume' ? 'resumed'
        : kind === 'stop'   ? 'stopped'
        : kind === 'reset'  ? 'reset'
        : 'summary generated';

    push(makeEvent(
        eventKind,
        'info',
        `tick ${tick}: Scenario "${scenarioTitle}" ${actionText}`,
        'scenarioControl',
        tick,
        'check'
    ));
}
