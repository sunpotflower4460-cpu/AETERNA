/**
 * ruleBasedLensGuide.ts
 * v1.9: Lens-aware AI Guide (updated from v1.8)
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
 * Reference: docs/lens-aware-ai-guide.md
 */

import type { MetricLensId } from '../ui/lens/metricLensRegistry.ts';
import type { ReplayModeState } from '../types/timeReplay.ts';
import type { LensGuideRequest, LensGuideResponse } from './lensGuideTypes.ts';

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

// ── answerLensGuideRequest ────────────────────────────────────────────────────

// Lens suggestions keyed by activeLensId
const LENS_NEXT_SUGGESTIONS: Partial<Record<MetricLensId, MetricLensId[]>> = {
    vortexConfidence:     ['phaseCoherence', 'fieldPhase', 'topologicalCharge'],
    phaseCoherence:       ['fieldPhase', 'vortexConfidence', 'fieldAmplitude'],
    fieldPhase:           ['phaseCoherence', 'vortexConfidence', 'fieldAmplitude'],
    fieldAmplitude:       ['flowContinuity', 'energyThroughput', 'phaseCoherence'],
    topologicalCharge:    ['vortexConfidence', 'fieldPhase', 'phaseCoherence'],
    plasticityTrace:      ['resistanceScale', 'vortexConfidence', 'fieldAmplitude'],
    resistanceScale:      ['plasticityTrace', 'fieldAmplitude', 'membraneDeformation'],
    membraneDeformation:  ['membraneTension', 'membranePermeability', 'twoSidedness'],
    membraneTension:      ['membraneDeformation', 'membranePermeability', 'twoSidedness'],
    membranePermeability: ['membraneDeformation', 'membraneTension', 'twoSidedness'],
    observedRatioMatch:   ['vortexConfidence', 'phaseCoherence', 'plasticityTrace'],
    gaussianCurvature:    ['areaElement', 'innerOuterBias', 'fieldAmplitude'],
    flowContinuity:       ['energyThroughput', 'fieldAmplitude', 'phaseCoherence'],
    energyThroughput:     ['flowContinuity', 'fieldAmplitude', 'vortexConfidence'],
};

const DEFAULT_NEXT_LENSES: MetricLensId[] = [
    'vortexConfidence', 'phaseCoherence', 'fieldPhase', 'plasticityTrace', 'observedRatioMatch',
];

function _getNextLenses(activeLensId: string | null | undefined): string[] {
    if (activeLensId) {
        const suggestions = LENS_NEXT_SUGGESTIONS[activeLensId as MetricLensId];
        if (suggestions && suggestions.length > 0) return suggestions;
    }
    return DEFAULT_NEXT_LENSES;
}

/**
 * Answer a LensGuideRequest using rule-based logic.
 *
 * Handles 5 modes: explain, hypothesis, compare, caution, nextObservation.
 * No LLM is called. No runtime state is modified.
 *
 * @param request - LensGuideRequest
 * @returns LensGuideResponse
 */
export function answerLensGuideRequest(request: LensGuideRequest): LensGuideResponse {
    const { mode, lensContext, guideContext } = request;
    const activeLensId = lensContext.activeLens?.id ?? null;
    const lensLabel = lensContext.activeLens?.label ?? 'full cell overview';
    const lensDisclaimer = lensContext.activeLens?.disclaimer ?? 'Multiple observer-side metrics shown.';
    const usedContextKinds: string[] = ['lensContext'];
    if (guideContext) usedContextKinds.push('guideContext');

    const observationFacts: string[] = guideContext?.observationFacts?.length
        ? guideContext.observationFacts
        : [lensContext.contextSummary];

    const base = {
        confidence: 0.7,
        usedContextKinds,
        claimGuardPassed: true as const,
        blockedClaims: [] as string[],
    };

    switch (mode) {
        case 'explain': {
            const lensDesc = LENS_GUIDE_LINES[activeLensId as MetricLensId]?.[0] ?? 'Observer-side metric.';
            return {
                ...base,
                mode,
                answer: `現在見ているもの: ${lensLabel}. ${lensDesc}`,
                observationFacts,
                hypothesisCandidates: [],
                comparisonNotes: [],
                cautionNotes: [
                    'All values are observer-side measurements. High or low values are not evidence for consciousness or intelligence.',
                    lensDisclaimer,
                ],
                suggestedNextLenses: _getNextLenses(activeLensId),
                suggestedNextPanels: ['Cell Inspector', 'Metric Spotlight'],
            };
        }

        case 'hypothesis': {
            const facts = guideContext?.observationFacts ?? observationFacts;
            const hypothesisCandidates: string[] = [];
            if (facts.length > 0) {
                const f0 = facts[0];
                hypothesisCandidates.push(
                    `${f0} — if elevated, phase structure may be temporarily organized in this region. This is a hypothesis candidate, not a conclusion.`,
                );
            }
            if (facts.length > 1) {
                hypothesisCandidates.push(
                    `${facts[1]} — co-variation with neighboring metrics may indicate transient local coupling. This is a hypothesis candidate, not a conclusion.`,
                );
            }
            hypothesisCandidates.push(
                'These are hypothesis candidates only, not conclusions.',
            );
            return {
                ...base,
                mode,
                answer: '観測事実から弱い仮説候補を提示します。These are hypothesis candidates only, not conclusions.',
                observationFacts,
                hypothesisCandidates,
                comparisonNotes: [],
                cautionNotes: [
                    'Hypotheses are not proof.',
                    'Causal Trace is not causal proof.',
                    'Proxy metrics are not direct measurements.',
                ],
                suggestedNextLenses: ['vortexConfidence', 'phaseCoherence', 'fieldPhase'],
                suggestedNextPanels: ['Causal Trace', 'Difference View'],
            };
        }

        case 'compare': {
            const diffSummary = guideContext?.differenceSummary ?? [];
            const corrSummary = guideContext?.layerCorrelationSummary ?? [];
            const replaySummary = guideContext?.replaySummary;
            const comparisonNotes: string[] = [
                ...diffSummary,
                ...corrSummary,
            ];
            if (replaySummary?.isReplayMode) {
                comparisonNotes.push(
                    `Replay mode: tick ${replaySummary.replayTick ?? '?'} vs live tick ${replaySummary.liveTick ?? '?'}.`,
                );
            }
            return {
                ...base,
                mode,
                answer: 'Comparing replay / difference / layer correlation data.',
                observationFacts,
                hypothesisCandidates: [],
                comparisonNotes,
                cautionNotes: [
                    'Comparison shows before/after snapshots.',
                    'Correlation is not causation.',
                    'Sample size may be small.',
                ],
                suggestedNextLenses: [],
                suggestedNextPanels: ['Difference View', 'Layer Correlation', 'Time Replay'],
            };
        }

        case 'caution': {
            return {
                ...base,
                mode,
                answer: 'このメトリクスについての注意点を示します。',
                observationFacts,
                hypothesisCandidates: [],
                comparisonNotes: [],
                cautionNotes: [
                    'This value is an observer-side measurement or proxy.',
                    'Proxy metrics are NOT direct proof of any phenomenon.',
                    'Causal Trace shows possible contributing signals, not causal proof.',
                    'Correlation between metrics is not evidence of causation.',
                    'No claims about consciousness, life, or intelligence can be made from these observations.',
                ],
                suggestedNextLenses: [],
                suggestedNextPanels: ['Causal Trace', 'Metric Spotlight'],
            };
        }

        case 'nextObservation': {
            const nextLenses = _getNextLenses(activeLensId);
            const nextPanels: string[] = [];
            if (guideContext?.causalTraceSummary?.length) nextPanels.push('Causal Trace');
            if (guideContext?.layerCorrelationSummary?.length) nextPanels.push('Layer Correlation');
            if (guideContext?.differenceSummary?.length) nextPanels.push('Difference View');
            if (guideContext?.replaySummary?.isReplayMode) nextPanels.push('Time Replay');
            if (nextPanels.length === 0) nextPanels.push('Cell Inspector', 'Metric Spotlight', 'Causal Trace');
            return {
                ...base,
                mode,
                answer: '次に見るとよいもの:',
                observationFacts,
                hypothesisCandidates: [],
                comparisonNotes: [],
                cautionNotes: [
                    'These are suggestions only. Observation order does not affect runtime.',
                ],
                suggestedNextLenses: nextLenses,
                suggestedNextPanels: nextPanels,
            };
        }

        default: {
            return {
                ...base,
                mode: 'explain' as const,
                answer: `現在見ているもの: ${lensLabel}.`,
                observationFacts,
                hypothesisCandidates: [],
                comparisonNotes: [],
                cautionNotes: [
                    'All values are observer-side measurements.',
                    lensDisclaimer,
                ],
                suggestedNextLenses: _getNextLenses(activeLensId),
                suggestedNextPanels: ['Cell Inspector', 'Metric Spotlight'],
            };
        }
    }
}
