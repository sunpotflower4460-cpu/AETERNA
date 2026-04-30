/**
 * deriveNowSummary.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Derives a NowSummaryState from existing observation snapshots.
 * Rule-based / local — no LLM, no API key required.
 *
 * Principles:
 * - Returns 3–5 priority-ranked observation lines.
 * - Lines describe field conditions in neutral terms.
 * - Forbidden: "thinking", "wants", "feels", "lonely", "conscious", "understands",
 *   "remembered you", "became aware", or any emotion / intent claim.
 * - Graceful fallback when upstream states are missing.
 * - Does NOT modify any runtime state.
 *
 * Reference: docs/scientific-ui-ux-principles.md §3
 * Reference: docs/default-guide-principles.md
 */

import type { NowSummaryState, NowSummaryLine } from '../../types/nowSummary.ts';
import type { OverviewState } from '../../types/overviewState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { MediumProfileState } from '../../types/mediumProfileState.ts';
import type { LocalExcitabilityFieldState } from '../../types/localExcitabilityField.ts';
import type { RepeatedFlowPathObservationState } from '../../types/repeatedFlowPath.ts';
import type { ProtoNetworkObservationState } from '../../types/protoNetworkCandidate.ts';

// ── Parameters ─────────────────────────────────────────────────────────────────

export interface DeriveNowSummaryParams {
    overview?: OverviewState | null;
    viability?: DynamicViabilityState | null;
    closure?: BodyWorldClosureState | null;
    mediumProfile?: MediumProfileState | null;
    localField?: LocalExcitabilityFieldState | null;
    repeatedFlowPaths?: RepeatedFlowPathObservationState | null;
    protoNetwork?: ProtoNetworkObservationState | null;
    semanticLeakCount?: number;
    nanOrInfinityCount?: number;
    timestamp: number;
}

// ── Max displayed lines ────────────────────────────────────────────────────────

const MAX_LINES = 5;

// ── deriveNowSummary ──────────────────────────────────────────────────────────

/**
 * Derive a NowSummaryState from available observation snapshots.
 *
 * Returns a valid NowSummaryState even when all upstream states are null.
 * In that case the summary describes the absence of data.
 *
 * Does NOT call any LLM, API, or external service.
 * Does NOT modify any runtime state.
 */
export function deriveNowSummary(params: DeriveNowSummaryParams): NowSummaryState {
    const {
        viability,
        closure,
        mediumProfile,
        localField,
        repeatedFlowPaths,
        protoNetwork,
        semanticLeakCount = 0,
        nanOrInfinityCount = 0,
        timestamp,
    } = params;

    const candidates: NowSummaryLine[] = [];
    let dataCount = 0;

    // ── Priority 1: Diagnostic warnings (highest priority) ──────────────────

    if (nanOrInfinityCount > 0) {
        candidates.push({
            id: 'nanWarning',
            priority: 1,
            text: `Diagnostic: ${nanOrInfinityCount} NaN / Infinity value(s) detected in field buffers.`,
            source: 'diagnostic check',
            valueKind: 'check',
        });
    }

    // ── Priority 2: Risk lines ────────────────────────────────────────────────

    if (viability) {
        dataCount++;
        const sat = viability.saturationRisk ?? 0;
        const ext = viability.extinctionRisk ?? 0;

        if (sat >= 0.65) {
            candidates.push({
                id: 'satRiskHigh',
                priority: 2,
                text: 'Saturation risk is elevated — echo and activity accumulation above threshold.',
                source: 'DynamicViabilityState.saturationRisk',
                valueKind: 'proxy',
            });
        } else if (sat >= 0.35) {
            candidates.push({
                id: 'satRiskMod',
                priority: 2,
                text: 'Saturation risk is moderate — echo accumulation is being monitored.',
                source: 'DynamicViabilityState.saturationRisk',
                valueKind: 'proxy',
            });
        }

        if (ext >= 0.65) {
            candidates.push({
                id: 'extRiskHigh',
                priority: 2,
                text: 'Extinction risk is elevated — field activity is near collapse threshold.',
                source: 'DynamicViabilityState.extinctionRisk',
                valueKind: 'proxy',
            });
        } else if (ext >= 0.35) {
            candidates.push({
                id: 'extRiskMod',
                priority: 2,
                text: 'Extinction risk is moderate — field activity continuity is reduced.',
                source: 'DynamicViabilityState.extinctionRisk',
                valueKind: 'proxy',
            });
        }
    }

    // ── Priority 3: Flow / Energy ─────────────────────────────────────────────

    if (viability) {
        const flow = viability.flowContinuity ?? 0;
        const energy = viability.energyThroughput ?? 0;

        if (flow >= 0.7) {
            candidates.push({
                id: 'flowHigh',
                priority: 3,
                text: 'Torus field flow continuity is high.',
                source: 'DynamicViabilityState.flowContinuity',
                valueKind: 'derived',
            });
        } else if (flow >= 0.3) {
            candidates.push({
                id: 'flowMod',
                priority: 3,
                text: 'Torus field is maintaining moderate flow.',
                source: 'DynamicViabilityState.flowContinuity',
                valueKind: 'derived',
            });
        } else {
            candidates.push({
                id: 'flowLow',
                priority: 3,
                text: 'Torus field flow continuity is low.',
                source: 'DynamicViabilityState.flowContinuity',
                valueKind: 'derived',
            });
        }

        if (energy >= 0.7) {
            candidates.push({
                id: 'energyHigh',
                priority: 4,
                text: 'Energy throughput is high.',
                source: 'DynamicViabilityState.energyThroughput',
                valueKind: 'derived',
            });
        } else if (energy < 0.15) {
            candidates.push({
                id: 'energyLow',
                priority: 3,
                text: 'Energy throughput is low — field activity may be declining.',
                source: 'DynamicViabilityState.energyThroughput',
                valueKind: 'derived',
            });
        }
    }

    // ── Priority 4: Return / Closure ──────────────────────────────────────────

    if (closure) {
        dataCount++;
        const ret = closure.returnStrength ?? 0;
        const stab = closure.closureStability ?? 0;
        const mismatch = closure.returnMismatch ?? 0;
        const delay = closure.roundTripDelay ?? 0;

        if (mismatch >= 0.6) {
            candidates.push({
                id: 'mismatchHigh',
                priority: 3,
                text: 'Reafference mismatch is elevated — return does not match expected pattern.',
                source: 'BodyWorldClosureState.returnMismatch',
                valueKind: 'derived',
            });
        }

        if (ret >= 0.5) {
            const delayNote = delay >= 0.5 ? ' Return delay is above average.' : '';
            candidates.push({
                id: 'returnPresent',
                priority: 4,
                text: `Sensory return from world medium is active.${delayNote}`,
                source: 'BodyWorldClosureState.returnStrength',
                valueKind: 'derived',
            });
        } else if (ret < 0.1) {
            candidates.push({
                id: 'returnWeak',
                priority: 4,
                text: 'Return signal from world medium is weak.',
                source: 'BodyWorldClosureState.returnStrength',
                valueKind: 'derived',
            });
        } else {
            const delayNote = delay >= 0.5 ? ' Return is delayed.' : '';
            candidates.push({
                id: 'returnDelayed',
                priority: 4,
                text: `A delayed return is entering from the world medium.${delayNote}`,
                source: 'BodyWorldClosureState.returnStrength',
                valueKind: 'derived',
            });
        }

        if (stab >= 0.5) {
            candidates.push({
                id: 'closureStable',
                priority: 5,
                text: 'Closure loop stability is moderate.',
                source: 'BodyWorldClosureState.closureStability',
                valueKind: 'proxy',
            });
        } else if (stab < 0.2) {
            candidates.push({
                id: 'closureWeak',
                priority: 4,
                text: 'Closure loop match is weak — loop closure is not well-established.',
                source: 'BodyWorldClosureState.closureStability',
                valueKind: 'proxy',
            });
        }
    }

    // ── Priority 4: Echo / Medium ─────────────────────────────────────────────

    if (mediumProfile) {
        dataCount++;
        const echoStrength = mediumProfile.echo.echoStrength ?? 0;
        const echoPersistence = mediumProfile.echo.echoPersistence ?? 0;
        const satRisk = mediumProfile.echo.echoSaturationRisk ?? 0;

        if (satRisk >= 0.6) {
            candidates.push({
                id: 'echoSatRisk',
                priority: 2,
                text: 'Echo saturation risk is elevated — world medium echo is accumulating.',
                source: 'MediumProfileState.echo.echoSaturationRisk',
                valueKind: 'proxy',
            });
        } else if (echoStrength >= 0.4 && echoPersistence >= 0.4) {
            candidates.push({
                id: 'echoPersists',
                priority: 5,
                text: 'Echo is present in world medium but is not saturating.',
                source: 'MediumProfileState.echo',
                valueKind: 'derived',
            });
        } else if (echoStrength < 0.1) {
            candidates.push({
                id: 'echoFaint',
                priority: 6,
                text: 'Echo in world medium is faint — trace residue is near baseline.',
                source: 'MediumProfileState.echo.echoStrength',
                valueKind: 'derived',
            });
        }
    }

    // ── Priority 5: Local Excitability ────────────────────────────────────────

    if (localField) {
        dataCount++;
        const near = localField.nearThresholdRegionCount ?? 0;
        const high = localField.highExcitabilityRegionCount ?? 0;

        if (near >= 2) {
            candidates.push({
                id: 'localExcite',
                priority: 4,
                text: `Local excitability conditions are elevated in ${near} region(s).`,
                source: 'LocalExcitabilityFieldState.nearThresholdRegionCount',
                valueKind: 'derived',
            });
        } else if (high >= 1) {
            candidates.push({
                id: 'localHigh',
                priority: 5,
                text: `High excitability observed in ${high} region(s) of the torus.`,
                source: 'LocalExcitabilityFieldState.highExcitabilityRegionCount',
                valueKind: 'derived',
            });
        }
    }

    // ── Priority 5: Repeated Flow Paths ───────────────────────────────────────

    if (repeatedFlowPaths && repeatedFlowPaths.pathCandidateCount > 0) {
        dataCount++;
        candidates.push({
            id: 'rfpPresent',
            priority: 5,
            text: `${repeatedFlowPaths.stablePathCandidateCount} stable repeated flow path candidate(s) observed.`,
            source: 'RepeatedFlowPathObservationState',
            valueKind: 'derived',
        });
    }

    // ── Priority 6: Proto-Network ─────────────────────────────────────────────

    if (protoNetwork && protoNetwork.networkCandidateCount > 0) {
        dataCount++;
        candidates.push({
            id: 'protoNetPresent',
            priority: 5,
            text: `${protoNetwork.networkCandidateCount} pre-semantic proto-network candidate(s) observed [proxy].`,
            source: 'ProtoNetworkObservationState',
            valueKind: 'proxy',
        });
    }

    // ── Priority 7: Safety checks ─────────────────────────────────────────────

    if (semanticLeakCount === 0) {
        candidates.push({
            id: 'semanticLeakClear',
            priority: 7,
            text: 'No semantic layer is active. Semantic leak check: clear.',
            source: 'integrity check',
            valueKind: 'check',
        });
    } else {
        candidates.push({
            id: 'semanticLeakFound',
            priority: 1,
            text: `Warning: ${semanticLeakCount} semantic layer violation(s) detected.`,
            source: 'integrity check',
            valueKind: 'check',
        });
    }

    // ── Fallback when no data available ──────────────────────────────────────

    if (candidates.length === 0 || dataCount === 0) {
        candidates.push({
            id: 'noData',
            priority: 3,
            text: 'Field observation data is not yet available.',
            source: 'fallback',
            valueKind: 'check',
        });
    }

    // ── Sort and select top MAX_LINES by priority ─────────────────────────────

    candidates.sort((a, b) => a.priority - b.priority);
    const lines = candidates.slice(0, MAX_LINES);

    // ── Confidence ────────────────────────────────────────────────────────────

    const maxSources = 5;
    const confidence = Math.min(1, (dataCount / maxSources) + 0.2);

    return { timestamp, lines, confidence };
}
