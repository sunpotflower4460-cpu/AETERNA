/**
 * deriveGuideExplanation.ts
 * U6: Guide / Explanation System
 *
 * Derives a GuideExplanation from an ExplainableObservationSnapshot.
 * Rule-based / deterministic — no LLM, no API key required.
 *
 * Principles:
 * - Input: ExplainableObservationSnapshot (overview + nowSummary + recentEvents)
 * - Output: GuideExplanation (explanation lines + suggestions + glossary + integrity notes)
 * - No external API calls.
 * - No consciousness / emotion / intent claims.
 * - Graceful fallback when snapshot is null or incomplete.
 * - Does NOT modify any runtime state.
 * - Guide actions (openPanel / toggleLayer / resetView) affect UI only.
 *
 * Reference: docs/default-guide-principles.md
 * Reference: docs/scientific-ui-ux-principles.md
 */

import type { GuideExplanation, GuideSuggestion } from '../../types/guideExplanation.ts';
import type { ExplainableObservationSnapshot } from '../explain/explainableObservationSnapshot.ts';
import type { OverviewMetric } from '../../types/overviewState.ts';
import { sanitizeLines } from './guideClaimGuard.ts';
import { INTEGRITY_NOTES, selectGlossaryHints } from './guideCopy.ts';

// ── Parameters ─────────────────────────────────────────────────────────────────

export interface DeriveGuideExplanationParams {
    snapshot: ExplainableObservationSnapshot | null;
    selectedPanel?: string;
    visibleLayers?: string[];
    renderMode?: string;
    viewMode?: string;
    timestamp: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function metricValue(metrics: OverviewMetric[], id: string): number | string | null {
    const m = metrics.find(m => m.id === id);
    if (!m) return null;
    return m.value;
}

function metricStatus(metrics: OverviewMetric[], id: string): string | null {
    const m = metrics.find(m => m.id === id);
    if (!m) return null;
    return m.status;
}

function asNum(v: number | string | null): number | null {
    if (typeof v === 'number') return v;
    return null;
}

// ── Current Explanation ────────────────────────────────────────────────────────

function buildCurrentExplanation(snapshot: ExplainableObservationSnapshot): string[] {
    const lines: string[] = [];
    const overview = snapshot.overview;
    const nowSummary = snapshot.nowSummary;

    // Prefer Now Summary lines (they are already neutral observation text)
    if (nowSummary && nowSummary.lines && nowSummary.lines.length > 0) {
        for (const line of nowSummary.lines.slice(0, 4)) {
            lines.push(line.text);
        }
        return lines;
    }

    // Fallback: build from overview metrics
    if (overview && overview.metrics.length > 0) {
        const metrics = overview.metrics;
        const flow   = asNum(metricValue(metrics, 'flowContinuity'));
        const energy = asNum(metricValue(metrics, 'energyThroughput'));
        const ret    = asNum(metricValue(metrics, 'returnStrength'));
        const echo   = asNum(metricValue(metrics, 'echoPersistence'));
        const satRisk = asNum(metricValue(metrics, 'saturationRisk'));
        const extRisk = asNum(metricValue(metrics, 'extinctionRisk'));

        if (flow !== null) {
            const lvl = flow >= 0.7 ? 'high' : flow >= 0.3 ? 'moderate' : 'low';
            lines.push(`Torus field flow continuity is at ${lvl} level (${(flow * 100).toFixed(0)}%).`);
        }
        if (ret !== null) {
            if (ret < 0.2) {
                lines.push('Return signal from the world medium is weak or delayed.');
            } else if (ret >= 0.7) {
                lines.push('Return signal from the world medium is strong.');
            } else {
                lines.push(`Return signal from the world medium is present (${(ret * 100).toFixed(0)}%).`);
            }
        }
        if (echo !== null && echo > 0.5) {
            lines.push(`Echo persistence is elevated (${(echo * 100).toFixed(0)}%). Monitor for saturation.`);
        }
        if (energy !== null && energy < 0.1) {
            lines.push('Energy throughput is very low. Field activity may be near extinction threshold.');
        }
        if (satRisk !== null && satRisk > 0.6) {
            lines.push(`Saturation risk is high (${(satRisk * 100).toFixed(0)}%). Echo or activity may be at ceiling.`);
        }
        if (extRisk !== null && extRisk > 0.6) {
            lines.push(`Extinction risk is elevated (${(extRisk * 100).toFixed(0)}%). Field activity may be collapsing.`);
        }

        if (lines.length === 0) {
            lines.push(`Overall field status: ${overview.overallStatus}.`);
            lines.push('Observation data is present but no notable conditions detected.');
        }
        return lines;
    }

    // No data at all
    lines.push('Observation data is not yet available.');
    lines.push('Allow the simulation to run for a few seconds, then try again.');
    return lines;
}

// ── What to Look At ────────────────────────────────────────────────────────────

function buildWhatToLookAt(snapshot: ExplainableObservationSnapshot): GuideSuggestion[] {
    const suggestions: GuideSuggestion[] = [];
    const metrics = snapshot.overview?.metrics ?? [];

    const retStatus = metricStatus(metrics, 'returnStrength');
    const echoStatus = metricStatus(metrics, 'echoPersistence');
    const satRisk = asNum(metricValue(metrics, 'saturationRisk'));
    const extRisk = asNum(metricValue(metrics, 'extinctionRisk'));
    const leakVal = metricValue(metrics, 'semanticLeak');
    const nanVal  = metricValue(metrics, 'nanOrInfinity');
    const localExcitabilityStatus = metricStatus(metrics, 'localExcitability');

    // Return delayed → suggest Medium panel
    if (retStatus === 'low' || retStatus === 'warning') {
        suggestions.push({
            id: 'look-medium-delay',
            label: 'Medium → Delay / Return Profile',
            reason: 'Return signal is weak or delayed. The Medium panel shows delay and return profiles.',
            targetPanel: 'world',
            action: 'openPanel',
        });
    }

    // Echo high → suggest echo profile
    if (echoStatus === 'high' || echoStatus === 'warning') {
        suggestions.push({
            id: 'look-echo-profile',
            label: 'Medium → Echo Profile',
            reason: 'Echo persistence is elevated. Check the Echo Profile in the World panel.',
            targetPanel: 'world',
            action: 'openPanel',
        });
    }

    // Saturation risk → turn on risk overlay layer
    if (satRisk !== null && satRisk > 0.5) {
        suggestions.push({
            id: 'look-risk-overlay',
            label: 'Turn on Risk Overlay layer',
            reason: 'Saturation risk is elevated. The Risk Overlay layer highlights affected regions.',
            targetLayer: 'riskOverlay',
            action: 'toggleLayer',
        });
    }

    // Extinction risk → overview panel
    if (extRisk !== null && extRisk > 0.5) {
        suggestions.push({
            id: 'look-overview-extinction',
            label: 'Overview → Extinction Risk',
            reason: 'Extinction risk is elevated. Check the Overview panel for extinction risk metrics.',
            targetPanel: 'overview',
            action: 'openPanel',
        });
    }

    // Local excitability rising → turn on layer
    if (localExcitabilityStatus === 'high' || localExcitabilityStatus === 'warning') {
        suggestions.push({
            id: 'look-local-excitability',
            label: 'Turn on Local Excitability layer',
            reason: 'Local excitability is elevated. Enable the Local Excitability layer to see which regions are affected.',
            targetLayer: 'localExcitability',
            action: 'toggleLayer',
        });
    }

    // Proto-network events → Proto-Network panel
    const protoEvents = snapshot.recentEvents.filter(
        e => e.kind === 'protoNetworkCandidateObserved'
    );
    if (protoEvents.length > 0) {
        suggestions.push({
            id: 'look-proto-network',
            label: 'Paths → Proto-Network Candidate',
            reason: `${protoEvents.length} proto-network candidate event(s) observed recently. Open Paths panel to inspect.`,
            targetPanel: 'paths',
            action: 'openPanel',
        });
    }

    // Semantic leak → raw / diagnostics
    if (leakVal !== null && leakVal !== 0 && leakVal !== 'inactive' && leakVal !== 'clear') {
        suggestions.push({
            id: 'look-semantic-leak',
            label: 'Raw / Diagnostics — Semantic Leak',
            reason: 'Semantic leak count is non-zero. Open Raw tab to investigate.',
            targetPanel: 'raw',
            action: 'openPanel',
        });
    }

    // NaN / Infinity → diagnostics
    if (nanVal !== null && nanVal !== 0 && nanVal !== 'inactive' && nanVal !== 'clear') {
        suggestions.push({
            id: 'look-nan-infinity',
            label: 'Raw / Diagnostics — NaN / Infinity',
            reason: 'NaN or Infinity detected in metrics. Open Raw / Diagnostics tab.',
            targetPanel: 'raw',
            action: 'openPanel',
        });
    }

    // Always suggest overview as baseline
    if (suggestions.length === 0) {
        suggestions.push({
            id: 'look-overview-default',
            label: 'Overview panel',
            reason: 'The Overview panel shows a summary of all current field metrics.',
            targetPanel: 'overview',
            action: 'openPanel',
        });
    }

    return suggestions;
}

// ── Try Next ───────────────────────────────────────────────────────────────────

function buildTryNext(
    snapshot: ExplainableObservationSnapshot,
    renderMode?: string,
    viewMode?: string
): GuideSuggestion[] {
    const suggestions: GuideSuggestion[] = [];
    const metrics = snapshot.overview?.metrics ?? [];
    const flow = asNum(metricValue(metrics, 'flowContinuity'));
    const extRisk = asNum(metricValue(metrics, 'extinctionRisk'));
    const satRisk = asNum(metricValue(metrics, 'saturationRisk'));
    const echoStatus = metricStatus(metrics, 'echoPersistence');
    const localExcitabilityStatus = metricStatus(metrics, 'localExcitability');

    // Rotate torus (always a useful suggestion)
    suggestions.push({
        id: 'try-rotate-torus',
        label: 'Rotate the torus',
        reason: 'Drag-rotate to inspect the backside and less-visible field regions.',
        action: 'resetView',
    });

    // Diagnostic mode if there are warnings
    if ((satRisk !== null && satRisk > 0.5) || (extRisk !== null && extRisk > 0.5)) {
        if (renderMode !== 'diagnostic') {
            suggestions.push({
                id: 'try-diagnostic-view',
                label: 'Switch to Diagnostic View',
                reason: 'Risk thresholds are elevated. Diagnostic View shows coverage and health metrics.',
                action: 'switchViewMode',
            });
        }
    }

    // Trace / Residue layer (useful if flow is active)
    if (flow !== null && flow > 0.2) {
        suggestions.push({
            id: 'try-trace-layer',
            label: 'Turn on Trace / Residue layer',
            reason: 'Field flow is active. The Trace / Residue layer shows path history.',
            targetLayer: 'traceResidue',
            action: 'toggleLayer',
        });
    }

    // Single Touch scenario suggestion
    if (flow !== null && flow < 0.3) {
        suggestions.push({
            id: 'try-single-touch',
            label: 'Try Single Touch scenario',
            reason: 'Flow continuity is low. A Single Touch scenario allows observing how the field responds to a perturbation.',
            targetPanel: 'scenarios',
            action: 'openPanel',
        });
    }

    // Repeated Gentle Touch if flow is moderate
    if (flow !== null && flow >= 0.3 && flow < 0.7) {
        suggestions.push({
            id: 'try-repeated-touch',
            label: 'Try Repeated Gentle Touch scenario',
            reason: 'Flow is at moderate level. Repeated Gentle Touch allows observing repeated flow path formation.',
            targetPanel: 'scenarios',
            action: 'openPanel',
        });
    }

    // Slow Echo World if echo persistence is high
    if (echoStatus === 'high' || echoStatus === 'warning') {
        suggestions.push({
            id: 'try-slow-echo-world',
            label: 'Try Slow Echo World scenario',
            reason: 'Echo persistence is elevated. Slow Echo World allows observing trace residue buildup under long echo delay.',
            targetPanel: 'scenarios',
            action: 'openPanel',
        });
    }

    // Repeated Gentle Touch with Local Excitability layer if local excitability is high
    if (localExcitabilityStatus === 'high' || localExcitabilityStatus === 'warning') {
        suggestions.push({
            id: 'try-repeated-touch-excitability',
            label: 'Try Repeated Gentle Touch with Local Excitability layer',
            reason: 'Local excitability is elevated. Repeated Gentle Touch with the Local Excitability layer visible allows observing regional excitability changes.',
            targetPanel: 'scenarios',
            action: 'openPanel',
        });
    }

    // High Resistance World if extinction risk is high
    if (extRisk !== null && extRisk > 0.5) {
        suggestions.push({
            id: 'try-high-resistance-world',
            label: 'Try High Resistance World scenario',
            reason: 'Extinction risk is elevated. High Resistance World allows observing return attenuation and under-coupling risk.',
            targetPanel: 'scenarios',
            action: 'openPanel',
        });
    }

    // Compare raw vs smooth
    suggestions.push({
        id: 'try-compare-raw-smooth',
        label: 'Compare Raw and Smooth render modes',
        reason: 'Switch between Raw and Smooth modes to see how presentation smoothing affects the displayed field.',
        action: 'switchViewMode',
    });

    // Reset view
    if (viewMode && viewMode !== 'default') {
        suggestions.push({
            id: 'try-reset-view',
            label: 'Reset view',
            reason: 'Return camera to the default front view to see the full torus.',
            action: 'resetView',
        });
    }

    return suggestions.slice(0, 5);
}

// ── Glossary selection ─────────────────────────────────────────────────────────

function selectRelevantGlossary(snapshot: ExplainableObservationSnapshot): ReturnType<typeof selectGlossaryHints> {
    const terms: string[] = ['Raw', 'Derived', 'Proxy', 'Presentation-smoothed'];
    const metrics = snapshot.overview?.metrics ?? [];

    const retStatus = metricStatus(metrics, 'returnStrength');
    const echoStatus = metricStatus(metrics, 'echoPersistence');
    const satRisk = asNum(metricValue(metrics, 'saturationRisk'));
    const extRisk = asNum(metricValue(metrics, 'extinctionRisk'));

    if (retStatus === 'low' || retStatus === 'warning') {
        terms.push('Return Strength', 'Boundary Exchange');
    }
    if (echoStatus === 'high' || echoStatus === 'warning') {
        terms.push('Echo Persistence');
    }
    if (satRisk !== null && satRisk > 0.3) {
        terms.push('Trace / Residue', 'Local Excitability');
    }
    if (extRisk !== null && extRisk > 0.3) {
        terms.push('Flow Continuity', 'Energy Throughput', 'Closure Stability');
    }

    const protoEvents = snapshot.recentEvents.filter(
        e => e.kind === 'protoNetworkCandidateObserved' || e.kind === 'repeatedFlowPathObserved'
    );
    if (protoEvents.length > 0) {
        terms.push('Repeated Flow Path Candidate', 'Proto-Network Candidate');
    }

    const leakVal = metricValue(metrics, 'semanticLeak');
    if (leakVal !== null && leakVal !== 0 && leakVal !== 'inactive' && leakVal !== 'clear') {
        terms.push('Semantic Leak');
    }

    // Deduplicate
    return selectGlossaryHints([...new Set(terms)]);
}

// ── Confidence ─────────────────────────────────────────────────────────────────

function computeConfidence(snapshot: ExplainableObservationSnapshot): number {
    let score = 0;
    if (snapshot.overview !== null) score += 0.4;
    if (snapshot.nowSummary !== null) score += 0.4;
    if (snapshot.recentEvents.length > 0) score += 0.2;
    return Math.min(1, score);
}

// ── deriveGuideExplanation ─────────────────────────────────────────────────────

/**
 * Derive a GuideExplanation from an ExplainableObservationSnapshot.
 *
 * Rule-based / deterministic — no LLM, no API key required.
 * Does NOT modify any runtime state.
 * All output text is sanitized through guideClaimGuard before returning.
 *
 * @param params  DeriveGuideExplanationParams
 * @returns       GuideExplanation
 */
export function deriveGuideExplanation(params: DeriveGuideExplanationParams): GuideExplanation {
    const { snapshot, renderMode, viewMode, timestamp } = params;

    // Null snapshot → minimal "no data" explanation
    if (snapshot === null) {
        return {
            timestamp,
            currentExplanation: [
                'Observation data is not yet available.',
                'Allow the simulation to run for a few seconds, then try again.',
            ],
            whatToLookAt: [
                {
                    id: 'look-overview-nodata',
                    label: 'Overview panel',
                    reason: 'Check the Overview panel once the simulation has started.',
                    targetPanel: 'overview',
                    action: 'openPanel',
                },
            ],
            tryNext: [
                {
                    id: 'try-wait',
                    label: 'Wait for the simulation to initialise',
                    reason: 'The simulation may still be loading. Wait a moment before retrying.',
                },
            ],
            glossaryHints: selectGlossaryHints(['Raw', 'Derived', 'Proxy']),
            integrityNotes: [...INTEGRITY_NOTES],
            confidence: 0,
        };
    }

    // Check for NaN / Infinity
    const nanMetric = snapshot.overview?.metrics.find(m => m.id === 'nanOrInfinity');
    const hasNanInfinity = nanMetric && nanMetric.value !== 0 && nanMetric.status !== 'clear';

    const currentExplanation = sanitizeLines(buildCurrentExplanation(snapshot));
    const whatToLookAt = buildWhatToLookAt(snapshot);
    const tryNext = buildTryNext(snapshot, renderMode, viewMode);
    const glossaryHints = selectRelevantGlossary(snapshot);
    const integrityNotes = [...INTEGRITY_NOTES];

    if (hasNanInfinity) {
        integrityNotes.unshift(
            'Warning: NaN or Infinity values detected. Open Raw / Diagnostics tab to investigate.'
        );
    }

    const confidence = computeConfidence(snapshot);

    return {
        timestamp,
        currentExplanation,
        whatToLookAt,
        tryNext,
        glossaryHints,
        integrityNotes,
        confidence,
    };
}
