/**
 * ruleBasedLensGuide.ts
 * v1.8: Causal Trace / Layer Correlation (updated from v1.7)
 *
 * Provides simple rule-based guide text for the active Metric Visual Lens,
 * with replay context awareness.
 *
 * Design principles:
 * - No LLM / external API calls.
 * - All text is observation-based and epistemically accurate.
 * - Replay context is surfaced neutrally — no mystical claims.
 * - No consciousness / emotion / life-proof claims.
 * - Guide text is advisory only; it does NOT modify runtime state.
 *
 * Guardrails:
 * - "Replay Mode shows recorded observation snapshots."
 *   "It does not imply the runtime itself has moved backward."
 * - Guide text MUST NOT claim AETERNA is remembering, thinking, or feeling.
 *
 * Reference: docs/deep-inspector-time-replay.md §11, §16
 */

import type { MetricLensId } from '../ui/lens/metricLensRegistry.ts';
import type { ReplayModeState } from '../types/timeReplay.ts';

// ── LensGuideContext ──────────────────────────────────────────────────────────

/**
 * Context provided to the rule-based lens guide.
 */
export interface LensGuideContext {
    /** Currently active lens ID, or null */
    activeLensId: MetricLensId | null;
    /** Currently selected metric ID path, or null */
    selectedMetricId: string | null;
    /** Whether the UI is in replay mode */
    replayMode: ReplayModeState;
    /** The tick being replayed (null if live) */
    replayTick: number | null;
    /** Current live tick */
    liveTick: number;
    /** Whether a snapshot is available for replayTick */
    snapshotAvailable: boolean;
    /** Whether causal trace result is available */
    causalTraceAvailable?: boolean;
    /** CausalTraceResult summary lines (if available) */
    causalTraceSummary?: string[];
    /** CausalTraceResult cautions (if available) */
    causalTraceCautions?: string[];
}

// ── LensGuideResult ───────────────────────────────────────────────────────────

/**
 * Output from the rule-based guide.
 */
export interface LensGuideResult {
    /** Primary guide lines (1-3 sentences) */
    lines: string[];
    /**
     * Replay-mode notice (shown when replayMode === 'replay').
     * null when in live mode.
     */
    replayNotice: string | null;
    /**
     * Epistemic note for the active lens.
     */
    epistemicNote: string;
    /**
     * Causal trace guidance lines (null when no trace available).
     * When present, always includes "not causal proof" language.
     */
    causalTraceLines: string[] | null;
}

// ── Rule maps ─────────────────────────────────────────────────────────────────

const LENS_GUIDE_LINES: Record<MetricLensId, string[]> = {
    gaussianCurvature: [
        'Gaussian Curvature shows cos(v)/(r·(R+r·cos(v))). Positive on the outer rim, negative on the inner rim.',
        'This is a purely geometric quantity. It does not reflect activity or dynamics.',
    ],
    areaElement: [
        'Area Element shows the local surface area per grid cell: r·(R+r·cos(v)).',
        'Larger on the outer rim, smaller on the inner rim. Geometric only.',
    ],
    innerOuterBias: [
        'Inner–Outer Bias shows cos(v). +1 = outer rim, −1 = inner rim.',
        'Useful for identifying which torus region this cell occupies.',
    ],
    fieldAmplitude: [
        'Field Amplitude shows the magnitude of the complex scalar field at this cell.',
        'Higher amplitude = stronger local field oscillation. Not a measure of "activity level" in a biological sense.',
    ],
    fieldPhase: [
        'Field Phase shows the angular argument of the complex field [−π, π].',
        'Phase variation across cells reveals spatial wave structure.',
    ],
    phaseCoherence: [
        'Local Phase Coherence measures mean cosine similarity to the 4 periodic neighbours.',
        'Higher values indicate a locally coherent phase neighbourhood (0–1).',
    ],
    flowContinuity: [
        'Local Flow Continuity is a proxy for local amplitude gradient smoothness.',
        'High = gradual amplitude change. Derived from amplitude neighbourhood differences.',
    ],
    energyThroughput: [
        'Local Energy Throughput = amplitude × flow continuity proxy.',
        'Higher where amplitude is large and flow is smooth. Derived proxy, not biological energy.',
    ],
    vortexConfidence: [
        'Vortex Candidate Confidence shows the observer-side estimate that a phase-defect candidate is located near this cell.',
        '0 = no candidate; 1 = high-confidence candidate. This is a proxy, not a guaranteed vortex.',
    ],
    topologicalCharge: [
        'Topological Charge shows the phase-winding index at this cell: +1, 0, or −1.',
        'Derived from discrete phase winding over the cell neighbourhood.',
    ],
    membraneDeformation: [
        'Membrane Deformation shows local membrane deformation state (0–1).',
        'Source: MembraneState observer. Not biological membrane deformation.',
    ],
    membraneTension: [
        'Membrane Tension shows local tension state (0–1).',
        'Observer-side value. Not physical tension.',
    ],
    membranePermeability: [
        'Membrane Permeability shows local permeability state (0–1).',
        'Observer-side value. Not biological permeability.',
    ],
    twoSidedness: [
        'Two-Sidedness shows the overlap between actuation and return imprints (0–1).',
        'Higher = more symmetric actuation/return pattern. Derived metric.',
    ],
    plasticityTrace: [
        'Plasticity Trace shows total accumulated weak plasticity trace at this cell.',
        'Derived from vortex, repeated-flow, excitability, and membrane trace channels. Not synaptic weight.',
    ],
    resistanceScale: [
        'Resistance Scale shows the multiplicative resistance factor at this cell.',
        '1.0 = neutral. Values above 1 = increased resistance; below 1 = reduced. Derived scale factor.',
    ],
    observedRatioMatch: [
        'Observed Ratio Match shows the strongest reference ratio match strength (0–1).',
        'This is a similarity proxy only. High matchStrength is NOT proof of resonance, life, or consciousness.',
    ],
};

// ── deriveReplayNotice ────────────────────────────────────────────────────────

function deriveReplayNotice(ctx: LensGuideContext): string | null {
    if (ctx.replayMode !== 'replay') return null;

    if (ctx.snapshotAvailable && ctx.replayTick !== null) {
        return (
            `Currently in Replay Mode. ` +
            `This display is based on the recorded observation snapshot at tick ${ctx.replayTick}. ` +
            `The live runtime is at tick ${ctx.liveTick}. ` +
            `Replay Mode shows recorded observation snapshots. ` +
            `It does not imply the runtime itself has moved backward.`
        );
    }

    if (ctx.replayTick !== null) {
        return (
            `Currently in Replay Mode (tick ${ctx.replayTick}), ` +
            `but no snapshot is available for this tick. ` +
            `Replay Mode shows recorded observation snapshots. ` +
            `It does not imply the runtime itself has moved backward.`
        );
    }

    return (
        `Currently in Replay Mode. ` +
        `Replay Mode shows recorded observation snapshots. ` +
        `It does not imply the runtime itself has moved backward.`
    );
}

// ── deriveRuleBasedLensGuide ──────────────────────────────────────────────────

/**
 * Derive rule-based guide text for the active lens with replay context.
 *
 * No LLM is called. No runtime state is modified.
 *
 * @param ctx - LensGuideContext
 * @returns   - LensGuideResult with guide lines, replay notice, epistemic note, and causal trace lines
 */
export function deriveRuleBasedLensGuide(ctx: LensGuideContext): LensGuideResult {
    const lines: string[] = ctx.activeLensId
        ? (LENS_GUIDE_LINES[ctx.activeLensId] ?? [
              `Observing metric: ${ctx.activeLensId}. No specific guide available for this lens.`,
          ])
        : [
              'Select a metric from the Cell Inspector to see lens-specific guidance.',
          ];

    const replayNotice = deriveReplayNotice(ctx);

    const epistemicNote =
        'All values are observer-side measurements or proxies. ' +
        'High or low values are not evidence for consciousness, emotion, or intelligence in living systems.';

    // Causal trace lines
    let causalTraceLines: string[] | null = null;
    if (ctx.causalTraceAvailable && ctx.causalTraceSummary && ctx.causalTraceSummary.length > 0) {
        causalTraceLines = [
            'Possible contributing signals have been identified for this cell and tick.',
            ...ctx.causalTraceSummary,
            'This is a possible contributing signal, not causal proof.',
            'Correlation between metrics is not evidence of causation.',
        ];
        if (ctx.causalTraceCautions && ctx.causalTraceCautions.length > 0) {
            causalTraceLines.push(...ctx.causalTraceCautions);
        }
    } else if (ctx.causalTraceAvailable) {
        causalTraceLines = [
            'Causal trace is available for this context, but no signals were found.',
            'This is a possible contributing signal, not causal proof.',
        ];
    }

    return { lines, replayNotice, epistemicNote, causalTraceLines };
}
