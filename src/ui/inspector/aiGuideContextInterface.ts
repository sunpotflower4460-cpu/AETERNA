/**
 * aiGuideContextInterface.ts
 * v1.6: Super Observation Architecture — AI Guide Context Interface
 *
 * Defines the AiGuideContext type and the buildAiGuideContext() function.
 *
 * AiGuideContext is the structured context that would be provided to an
 * AI Guide (e.g. a future LLM-backed guide).  In v1.6, NO LLM or external
 * API call is made.  This file establishes the interface only.
 *
 * Design principles:
 * - No LLM / external API calls in this file.
 * - No fake context, fake metrics, fake explanations.
 * - Context is derived entirely from LensContextPacket / CellObservation.
 * - No semantic labels, consciousness claims, or mystical proof claims.
 * - All metric summaries are observation-based and epistemic-status-labeled.
 * - The interface is designed to be extended in v1.9 Lens-aware AI Guide
 *   when LLM integration is introduced, without changing this file.
 *
 * Reference: docs/super-observation-architecture.md
 */

import type { LensContextPacket } from '../lens/lensContextPacket.ts';
import type { CellObservation } from '../../types/cellObservation.ts';

// ── AiGuideMetricEntry ────────────────────────────────────────────────────────

/**
 * A single metric entry in the AI Guide context.
 * Each entry has an observation path, a formatted value, and an
 * epistemic-status label so the guide can contextualise the value.
 */
export interface AiGuideMetricEntry {
    /** CellObservation field path (e.g. 'geometry.gaussianCurvature') */
    path: string;
    /** Human-readable metric label */
    label: string;
    /** Formatted value string (or '(unavailable)') */
    valueFormatted: string;
    /** Raw numeric value (if available and finite) */
    valueRaw: number | null;
    /** Epistemic status of this value */
    valueKind: 'measured' | 'derived' | 'proxy' | 'unavailable';
    /** Group within CellObservation */
    group: 'geometry' | 'field' | 'vortex' | 'membrane' | 'plasticity' | 'ratios' | 'events';
}

// ── AiGuideContext ────────────────────────────────────────────────────────────

/**
 * Structured context bundle for the AI Guide.
 *
 * v1.6: This is the interface only.  In v1.6, no LLM is called.
 * Future v1.9 will use this context as the input to a guide query.
 *
 * The context contains:
 * - A plain-language question the user can ask ("What is this?")
 * - The selected cell's observation data as structured metric entries
 * - The active lens description (if any)
 * - An epistemic guard note
 */
export interface AiGuideContext {
    /** Wall-clock timestamp when this context was built */
    timestamp: number;

    /** Simulation tick at time of context capture */
    tick?: number;

    /**
     * The question the user has implicitly asked by selecting this cell/metric.
     * Derived from the active lens label or a default question.
     * No consciousness / emotion / intent phrasing.
     *
     * Examples:
     * - "What is the Gaussian Curvature at this cell?"
     * - "What does this Vortex Candidate Confidence value mean?"
     * - "What is the current state of this cell?"
     */
    implicitQuestion: string;

    /** Flat cell index */
    cellIndex: number;

    /** Cell grid position (if available) */
    cellPosition: { i: number; j: number } | null;

    /** All metric entries for this cell, grouped by observation category */
    metricEntries: AiGuideMetricEntry[];

    /**
     * Description of the active Metric Visual Lens (if any).
     * null when no specific lens is active.
     */
    activeLensDescription: string | null;

    /**
     * The primary highlighted metric entry (from the active lens).
     * null when showing full overview.
     */
    primaryMetric: AiGuideMetricEntry | null;

    /**
     * Epistemic guard note to be prepended to any AI guide response.
     * Prevents consciousness / mystical proof claims.
     *
     * FIXED TEXT — must not be weakened.
     */
    epistemicGuard: string;

    /**
     * Diagnostic status of this context.
     * 'complete': all observer groups available.
     * 'partial': some observer groups unavailable.
     * 'minimal': only geometry available.
     */
    completeness: 'complete' | 'partial' | 'minimal';
}

// ── EPISTEMIC_GUARD ───────────────────────────────────────────────────────────

/**
 * Fixed epistemic guard note included in every AiGuideContext.
 * Must NOT be weakened or removed.
 */
export const EPISTEMIC_GUARD =
    'All values are observer-side measurements, derived proxies, or observer estimates from the ' +
    'AETERNA torus field simulation. High values are NOT proof of life, consciousness, emotion, ' +
    'intelligence, meaning, or self-awareness. Low values are NOT failures. ' +
    'Interpret all metrics as field physics / geometry observations only.';

// ── buildAiGuideContext ───────────────────────────────────────────────────────

/**
 * Build an AiGuideContext from a LensContextPacket.
 *
 * In v1.6, this context is assembled but NOT sent to any LLM or API.
 * Future v1.9 will use this as the input to a guide query.
 *
 * @param packet - LensContextPacket from the Cell Inspector
 * @returns AiGuideContext - ready for guide display or future LLM input
 */
export function buildAiGuideContext(packet: LensContextPacket): AiGuideContext {
    const { cellObservation, activeLens, tick } = packet;
    const { cellIndex, geometry, diagnostics } = cellObservation;

    const cellPosition =
        geometry.i !== undefined && geometry.j !== undefined
            ? { i: geometry.i, j: geometry.j }
            : null;

    const metricEntries = buildAllMetricEntries(cellObservation, diagnostics.valueKinds);

    const primaryMetric = activeLens
        ? (metricEntries.find((e) => e.path === activeLens.observationPath) ?? null)
        : null;

    const implicitQuestion = activeLens
        ? `What is the ${activeLens.label} at this cell?`
        : 'What is the current state of this cell?';

    const activeLensDescription = activeLens
        ? `${activeLens.label}: ${activeLens.description} (${activeLens.valueKind})`
        : null;

    const unavailableCount = Object.values(diagnostics.valueKinds).filter(
        (k) => k === 'unavailable',
    ).length;
    const completeness: AiGuideContext['completeness'] =
        unavailableCount === 0 ? 'complete' : unavailableCount <= 3 ? 'partial' : 'minimal';

    return {
        timestamp: Date.now(),
        tick,
        implicitQuestion,
        cellIndex,
        cellPosition,
        metricEntries,
        activeLensDescription,
        primaryMetric,
        epistemicGuard: EPISTEMIC_GUARD,
        completeness,
    };
}

// ── buildAllMetricEntries ─────────────────────────────────────────────────────

type ValueKinds = CellObservation['diagnostics']['valueKinds'];

function buildAllMetricEntries(obs: CellObservation, valueKinds: ValueKinds): AiGuideMetricEntry[] {
    const entries: AiGuideMetricEntry[] = [];

    // Geometry
    const gKind = valueKinds.geometry;
    entries.push(
        makeEntry('geometry.i', 'Grid Row (i)', obs.geometry.i, gKind, 'geometry'),
        makeEntry('geometry.j', 'Grid Column (j)', obs.geometry.j, gKind, 'geometry'),
        makeEntry('geometry.majorAngle', 'Major Angle (u)', obs.geometry.majorAngle, gKind, 'geometry', 'rad'),
        makeEntry('geometry.minorAngle', 'Minor Angle (v)', obs.geometry.minorAngle, gKind, 'geometry', 'rad'),
        makeEntry('geometry.areaElement', 'Area Element', obs.geometry.areaElement, gKind, 'geometry'),
        makeEntry('geometry.gaussianCurvature', 'Gaussian Curvature', obs.geometry.gaussianCurvature, gKind, 'geometry', 'm⁻²'),
        makeEntry('geometry.meanCurvature', 'Mean Curvature', obs.geometry.meanCurvature, gKind, 'geometry', 'm⁻¹'),
        makeEntry('geometry.innerOuterBias', 'Inner–Outer Bias', obs.geometry.innerOuterBias, gKind, 'geometry'),
    );

    // Field
    const fKind = valueKinds.field;
    entries.push(
        makeEntry('field.amplitude', 'Field Amplitude', obs.field.amplitude, fKind, 'field'),
        makeEntry('field.phase', 'Field Phase', obs.field.phase, fKind, 'field', 'rad'),
        makeEntry('field.phaseCoherenceLocal', 'Local Phase Coherence', obs.field.phaseCoherenceLocal, fKind, 'field'),
        makeEntry('field.flowContinuityLocal', 'Local Flow Continuity', obs.field.flowContinuityLocal, fKind, 'field'),
        makeEntry('field.energyThroughputLocal', 'Local Energy Throughput', obs.field.energyThroughputLocal, fKind, 'field'),
    );

    // Vortex
    const vKind = valueKinds.vortex;
    entries.push(
        makeEntry('vortex.candidateConfidence', 'Vortex Candidate Confidence', obs.vortex.candidateConfidence, vKind, 'vortex'),
        makeEntry('vortex.topologicalCharge', 'Topological Charge', obs.vortex.topologicalCharge, vKind, 'vortex'),
        makeEntry('vortex.phaseWinding', 'Phase Winding', obs.vortex.phaseWinding, vKind, 'vortex', 'rad'),
        makeEntry('vortex.amplitudeMinimum', 'Amplitude Minimum (near)', obs.vortex.amplitudeMinimum, vKind, 'vortex'),
    );

    // Membrane
    const mKind = valueKinds.membrane;
    entries.push(
        makeEntry('membrane.deformation', 'Membrane Deformation', obs.membrane.deformation, mKind, 'membrane'),
        makeEntry('membrane.permeability', 'Membrane Permeability', obs.membrane.permeability, mKind, 'membrane'),
        makeEntry('membrane.tension', 'Membrane Tension', obs.membrane.tension, mKind, 'membrane'),
        makeEntry('membrane.actuationImprint', 'Actuation Imprint', obs.membrane.actuationImprint, mKind, 'membrane'),
        makeEntry('membrane.returnImprint', 'Return Imprint', obs.membrane.returnImprint, mKind, 'membrane'),
        makeEntry('membrane.twoSidedness', 'Two-Sidedness', obs.membrane.twoSidedness, mKind, 'membrane'),
    );

    // Plasticity
    const pKind = valueKinds.plasticity;
    entries.push(
        makeEntry('plasticity.accumulatedTrace', 'Accumulated Trace', obs.plasticity.accumulatedTrace, pKind, 'plasticity'),
        makeEntry('plasticity.vortexTrace', 'Vortex Trace', obs.plasticity.vortexTrace, pKind, 'plasticity'),
        makeEntry('plasticity.repeatedFlowTrace', 'Repeated Flow Trace', obs.plasticity.repeatedFlowTrace, pKind, 'plasticity'),
        makeEntry('plasticity.localExcitabilityTrace', 'Local Excitability Trace', obs.plasticity.localExcitabilityTrace, pKind, 'plasticity'),
        makeEntry('plasticity.membraneTrace', 'Membrane Trace', obs.plasticity.membraneTrace, pKind, 'plasticity'),
        makeEntry('plasticity.resistanceScale', 'Resistance Scale', obs.plasticity.resistanceScale, pKind, 'plasticity'),
    );

    // Ratios
    const rKind = valueKinds.ratios;
    entries.push(
        makeEntry(
            'ratios.strongestMatchStrength',
            'Strongest Ratio Match Strength',
            obs.ratios.strongestMatchStrength ?? undefined,
            rKind,
            'ratios',
        ),
    );

    // Events
    entries.push(
        makeEntry('events.recentEventCount', 'Recent Event Count', obs.events.recentEventCount, valueKinds.events, 'events'),
        makeEntry('events.lastEventTick', 'Last Event Tick', obs.events.lastEventTick, valueKinds.events, 'events'),
    );

    return entries;
}

function makeEntry(
    path: string,
    label: string,
    value: number | undefined | null,
    valueKind: 'measured' | 'derived' | 'proxy' | 'unavailable',
    group: AiGuideMetricEntry['group'],
    unit = '',
): AiGuideMetricEntry {
    const rawValue = typeof value === 'number' && Number.isFinite(value) ? value : null;
    const valueFormatted =
        rawValue !== null
            ? `${rawValue.toFixed(6)}${unit ? ' ' + unit : ''}`
            : '(unavailable)';
    return {
        path,
        label,
        valueFormatted,
        valueRaw: rawValue,
        valueKind: rawValue === null && valueKind !== 'unavailable' ? 'unavailable' : valueKind,
        group,
    };
}
