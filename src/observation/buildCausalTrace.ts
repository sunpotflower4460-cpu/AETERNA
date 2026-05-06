/**
 * buildCausalTrace.ts
 * v1.8: Causal Trace / Layer Correlation
 *
 * Pure function that extracts possible contributing signals from observation
 * data using rule-based logic. No LLM or API calls.
 *
 * Design principles:
 * - Signals are only built when real data supports them — no fabrication.
 * - All signals carry caution text: "possible contributing signal, not causal proof."
 * - Returns 'insufficient' confidence when snapshots are missing.
 * - No consciousness / emotion / life / soul / mystical claims.
 *
 * Reference: docs/causal-trace-layer-correlation.md §3
 */

import type { CausalTraceResult, CausalTraceSignal, CausalTraceConfidence } from '../types/causalTrace.ts';
import type { TimeReplaySnapshot } from '../types/timeReplay.ts';
import type { CellObservation } from '../types/cellObservation.ts';
import type { LensContextPacket } from '../ui/lens/lensContextPacket.ts';

// ── BuildCausalTraceParams ────────────────────────────────────────────────────

export interface BuildCausalTraceParams {
    lensContext: LensContextPacket;
    currentSnapshot: TimeReplaySnapshot | null;
    previousSnapshot: TimeReplaySnapshot | null;
    nextSnapshot?: TimeReplaySnapshot | null;
    recentEvents: Array<{ id: string; tick: number; source?: string }>;
    cellObservation: CellObservation | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CAUTION_TEXT =
    'This is a possible contributing signal, not causal proof.';

const TEMPORAL_WINDOW_TICKS = 10;
const THRESHOLD_RATIO = 0.8;

// ── Helpers ───────────────────────────────────────────────────────────────────

let _signalCounter = 0;

function nextSignalId(prefix: string): string {
    _signalCounter = (_signalCounter + 1) % 1_000_000;
    return `${prefix}-${_signalCounter}`;
}

function safeNum(v: number | undefined | null): number | null {
    if (v === undefined || v === null) return null;
    if (!Number.isFinite(v)) return null;
    return v;
}

function pickConfidence(delta: number | null): CausalTraceConfidence {
    if (delta === null) return 'low';
    const abs = Math.abs(delta);
    if (abs > 0.3) return 'high';
    if (abs > 0.05) return 'medium';
    return 'low';
}

// ── Signal extractors ─────────────────────────────────────────────────────────

/**
 * Extract same_cell delta signals: metrics that changed between previousSnapshot
 * and currentSnapshot for the selected cell.
 */
function extractSameCellDeltaSignals(
    currentSnapshot: TimeReplaySnapshot,
    previousSnapshot: TimeReplaySnapshot,
    cellObservation: CellObservation,
): CausalTraceSignal[] {
    const signals: CausalTraceSignal[] = [];
    const cellIndex = cellObservation.cellIndex;

    // Compare globalSummary fields
    const fields: Array<{
        key: keyof TimeReplaySnapshot['globalSummary'];
        label: string;
        layer: CausalTraceSignal['sourceLayer'];
        metricId: string;
    }> = [
        { key: 'phaseCoherence', label: 'Phase Coherence', layer: 'field', metricId: 'globalSummary.phaseCoherence' },
        { key: 'vortexCandidateCount', label: 'Vortex Candidate Count', layer: 'vortex', metricId: 'globalSummary.vortexCandidateCount' },
        { key: 'membraneOverlap', label: 'Membrane Overlap', layer: 'membrane', metricId: 'globalSummary.membraneOverlap' },
        { key: 'plasticityAccumulation', label: 'Plasticity Accumulation', layer: 'plasticity', metricId: 'globalSummary.plasticityAccumulation' },
        { key: 'observedRatioMatchStrength', label: 'Observed Ratio Match Strength', layer: 'ratios', metricId: 'globalSummary.observedRatioMatchStrength' },
    ];

    for (const { key, label, layer, metricId } of fields) {
        const before = safeNum(previousSnapshot.globalSummary[key]);
        const after = safeNum(currentSnapshot.globalSummary[key]);
        if (before === null || after === null) continue;

        const delta = after - before;
        if (Math.abs(delta) < 1e-9) continue;

        signals.push({
            id: nextSignalId('sc'),
            sourceLayer: layer,
            metricId,
            label,
            valueBefore: before,
            valueAfter: after,
            delta,
            tickBefore: previousSnapshot.tick,
            tickAfter: currentSnapshot.tick,
            relatedCellIndices: [cellIndex],
            relatedEventIds: [],
            relationKind: 'same_cell',
            confidence: pickConfidence(delta),
            caution: CAUTION_TEXT,
        });
    }

    return signals;
}

/**
 * Extract temporal_nearby signals: events within TEMPORAL_WINDOW_TICKS of currentTick.
 */
function extractTemporalNearbySignals(
    currentTick: number,
    recentEvents: Array<{ id: string; tick: number; source?: string }>,
    cellIndex: number,
): CausalTraceSignal[] {
    const signals: CausalTraceSignal[] = [];

    const nearby = recentEvents.filter(
        (ev) => Math.abs(ev.tick - currentTick) <= TEMPORAL_WINDOW_TICKS,
    );

    if (nearby.length === 0) return signals;

    signals.push({
        id: nextSignalId('tn'),
        sourceLayer: 'events',
        metricId: 'events.temporal_nearby',
        label: `${nearby.length} event(s) within ${TEMPORAL_WINDOW_TICKS} ticks`,
        valueBefore: null,
        valueAfter: null,
        delta: null,
        tickBefore: undefined,
        tickAfter: currentTick,
        relatedCellIndices: [cellIndex],
        relatedEventIds: nearby.map((ev) => ev.id),
        relationKind: 'temporal_nearby',
        confidence: 'low',
        caution: CAUTION_TEXT,
    });

    return signals;
}

/**
 * Extract threshold_near signals: metrics close to their operational threshold.
 */
function extractThresholdNearSignals(
    currentSnapshot: TimeReplaySnapshot,
    cellObservation: CellObservation,
): CausalTraceSignal[] {
    const signals: CausalTraceSignal[] = [];
    const cellIndex = cellObservation.cellIndex;

    // vortexCandidateConfidence threshold: > 0.8
    const vcc = safeNum(cellObservation.vortex.candidateConfidence);
    if (vcc !== null && vcc > THRESHOLD_RATIO) {
        signals.push({
            id: nextSignalId('th'),
            sourceLayer: 'vortex',
            metricId: 'vortex.candidateConfidence',
            label: 'Vortex Candidate Confidence near threshold',
            valueBefore: null,
            valueAfter: vcc,
            delta: null,
            tickAfter: currentSnapshot.tick,
            relatedCellIndices: [cellIndex],
            relatedEventIds: [],
            relationKind: 'threshold_near',
            confidence: 'medium',
            caution: CAUTION_TEXT,
        });
    }

    // plasticityAccumulation threshold: > 0.8 of globalSummary max (proxy: > 0.8)
    const pa = safeNum(currentSnapshot.globalSummary.plasticityAccumulation);
    if (pa !== null && pa > THRESHOLD_RATIO) {
        signals.push({
            id: nextSignalId('th'),
            sourceLayer: 'plasticity',
            metricId: 'globalSummary.plasticityAccumulation',
            label: 'Plasticity Accumulation near threshold',
            valueBefore: null,
            valueAfter: pa,
            delta: null,
            tickAfter: currentSnapshot.tick,
            relatedCellIndices: [cellIndex],
            relatedEventIds: [],
            relationKind: 'threshold_near',
            confidence: 'medium',
            caution: CAUTION_TEXT,
        });
    }

    // observedRatioMatchStrength threshold: > 0.8
    const rms = safeNum(currentSnapshot.globalSummary.observedRatioMatchStrength);
    if (rms !== null && rms > THRESHOLD_RATIO) {
        signals.push({
            id: nextSignalId('th'),
            sourceLayer: 'ratios',
            metricId: 'globalSummary.observedRatioMatchStrength',
            label: 'Observed Ratio Match Strength near threshold',
            valueBefore: null,
            valueAfter: rms,
            delta: null,
            tickAfter: currentSnapshot.tick,
            relatedCellIndices: [cellIndex],
            relatedEventIds: [],
            relationKind: 'threshold_near',
            confidence: 'low',
            caution: CAUTION_TEXT,
        });
    }

    return signals;
}

/**
 * Extract ratio_component signals: cell is in involvedObservedRatioIds.
 */
function extractRatioComponentSignals(
    cellObservation: CellObservation,
): CausalTraceSignal[] {
    const signals: CausalTraceSignal[] = [];
    const { involvedObservedRatioIds } = cellObservation.ratios;

    if (involvedObservedRatioIds.length === 0) return signals;

    signals.push({
        id: nextSignalId('rc'),
        sourceLayer: 'ratios',
        metricId: 'ratios.involvedObservedRatioIds',
        label: `Cell is component of ${involvedObservedRatioIds.length} observed ratio(s)`,
        valueBefore: null,
        valueAfter: involvedObservedRatioIds.length,
        delta: null,
        relatedCellIndices: [cellObservation.cellIndex],
        relatedEventIds: [],
        relationKind: 'ratio_component',
        confidence: 'low',
        caution: CAUTION_TEXT,
    });

    return signals;
}

// ── buildCausalTrace ──────────────────────────────────────────────────────────

/**
 * Build a CausalTraceResult from observation data using rule-based logic.
 *
 * No LLM or API calls. No runtime state modification.
 * All signals are possible contributing signals only — not causal proof.
 *
 * @param params - BuildCausalTraceParams
 * @returns CausalTraceResult
 */
export function buildCausalTrace(params: BuildCausalTraceParams): CausalTraceResult {
    const { lensContext, currentSnapshot, previousSnapshot, recentEvents, cellObservation } = params;

    const now = Date.now();
    const cellIndex = cellObservation?.cellIndex ?? null;
    const activeLensId = lensContext.activeLens?.id ?? null;
    const currentTick = currentSnapshot?.tick ?? lensContext.tick ?? 0;

    // Insufficient: no snapshots
    if (!currentSnapshot || !cellObservation) {
        return {
            id: `ct-${now}`,
            targetCellIndex: cellIndex,
            targetMetricId: null,
            activeLensId,
            currentTick,
            comparedTick: null,
            possibleContributingSignals: [],
            relatedObservations: [],
            strongestSignals: [],
            summary: ['Insufficient data: no snapshot or cell observation available.'],
            cautions: [
                CAUTION_TEXT,
                'No signals could be extracted — data was unavailable.',
            ],
            confidence: 'insufficient',
            generatedAt: now,
        };
    }

    const signals: CausalTraceSignal[] = [];

    // a. same_cell delta signals
    if (previousSnapshot) {
        signals.push(
            ...extractSameCellDeltaSignals(currentSnapshot, previousSnapshot, cellObservation),
        );
    }

    // b. temporal_nearby signals
    signals.push(
        ...extractTemporalNearbySignals(currentTick, recentEvents, cellObservation.cellIndex),
    );

    // c. threshold_near signals
    signals.push(...extractThresholdNearSignals(currentSnapshot, cellObservation));

    // d. ratio_component signals
    signals.push(...extractRatioComponentSignals(cellObservation));

    // Derive confidence
    let confidence: CausalTraceConfidence = 'insufficient';
    if (signals.length > 0) {
        const hasHigh = signals.some((s) => s.confidence === 'high');
        const hasMed = signals.some((s) => s.confidence === 'medium');
        confidence = hasHigh ? 'high' : hasMed ? 'medium' : 'low';
    }

    // Strongest signals: sort by confidence, take top 3
    const confidenceRank: Record<CausalTraceConfidence, number> = {
        high: 3, medium: 2, low: 1, insufficient: 0,
    };
    const strongestSignals = [...signals]
        .sort((a, b) => confidenceRank[b.confidence] - confidenceRank[a.confidence])
        .slice(0, 3);

    const summary: string[] = signals.length > 0
        ? [
            `${signals.length} possible contributing signal(s) found at tick ${currentTick}.`,
            'All signals are possible contributing signals only — not causal proof.',
          ]
        : ['No possible contributing signals found for this tick and cell.'];

    return {
        id: `ct-${now}`,
        targetCellIndex: cellIndex,
        targetMetricId: activeLensId,
        activeLensId,
        currentTick,
        comparedTick: previousSnapshot?.tick ?? null,
        possibleContributingSignals: signals,
        relatedObservations: signals,
        strongestSignals,
        summary,
        cautions: [
            CAUTION_TEXT,
            'Correlation between metrics is not evidence of causation.',
            'No consciousness, life, or intelligence claims are made.',
        ],
        confidence,
        generatedAt: now,
    };
}
