/**
 * buildObservedRatioInvolvement.ts
 * v1.8: Causal Trace / Layer Correlation
 *
 * Pure function that extracts observed ratio involvement for a given cell.
 *
 * Design principles:
 * - Never fabricates components — returns caution when components unavailable.
 * - Returns empty array when no ratio data is present.
 * - No consciousness / emotion / life / soul / mystical claims.
 * - No LLM or API calls.
 *
 * Reference: docs/causal-trace-layer-correlation.md §6
 */

// ── ObservedRatioInvolvement ──────────────────────────────────────────────────

/**
 * Describes how a cell is involved in an observed ratio.
 *
 * IMPORTANT: This is observational data only. Component relationships
 * are geometric/structural proxies — not causal proof.
 */
export interface ObservedRatioInvolvement {
    observedRatioId: string;
    label: string;
    source: string;
    value: number;
    componentCellIndices: number[];
    componentEventIds: string[];
    componentVortexCandidateIds: string[];
    numeratorLabel?: string;
    denominatorLabel?: string;
    closestReferenceLabel?: string | null;
    matchStrength?: number;
    caution: string;
}

// ── BuildObservedRatioInvolvementParams ───────────────────────────────────────

export interface ObservedRatiosStateInput {
    observedRatios: Array<{
        id: string;
        source: string;
        value?: number;
        numeratorLabel?: string;
        denominatorLabel?: string;
        componentCellIndices?: number[];
        componentEventIds?: string[];
        componentVortexCandidateIds?: string[];
    }>;
    strongestMatch: {
        observedRatioId: string;
        referenceRatioId: string;
        matchStrength: number;
    } | null;
    referenceMatches?: Array<{
        observedRatioId: string;
        referenceRatioId: string;
        matchStrength: number;
    }>;
}

export interface BuildObservedRatioInvolvementParams {
    observedRatiosState: ObservedRatiosStateInput | null;
    cellIndex: number;
}

// ── buildObservedRatioInvolvement ─────────────────────────────────────────────

/**
 * Extract ObservedRatioInvolvement entries for a given cell.
 *
 * Returns an empty array when no ratio data is available.
 * Returns a caution note when component data is unavailable.
 *
 * @param params - BuildObservedRatioInvolvementParams
 * @returns Array of ObservedRatioInvolvement
 */
export function buildObservedRatioInvolvement(
    params: BuildObservedRatioInvolvementParams,
): ObservedRatioInvolvement[] {
    const { observedRatiosState, cellIndex } = params;

    if (!observedRatiosState || observedRatiosState.observedRatios.length === 0) {
        return [];
    }

    const results: ObservedRatioInvolvement[] = [];

    for (const ratio of observedRatiosState.observedRatios) {
        const componentCellIndices = ratio.componentCellIndices ?? [];
        const componentEventIds = ratio.componentEventIds ?? [];
        const componentVortexCandidateIds = ratio.componentVortexCandidateIds ?? [];

        // Only include this ratio if the cell is in its component cells,
        // or if component data is unavailable (we report cautiously)
        const hasComponentData = ratio.componentCellIndices !== undefined;
        const isInvolved = !hasComponentData || componentCellIndices.includes(cellIndex);

        if (!isInvolved) continue;

        // Find closest reference match
        const refMatches = observedRatiosState.referenceMatches ?? [];
        const bestMatch = observedRatiosState.strongestMatch?.observedRatioId === ratio.id
            ? observedRatiosState.strongestMatch
            : (refMatches.find((m) => m.observedRatioId === ratio.id) ?? null);

        const caution = !hasComponentData
            ? 'Component cell data unavailable. Involvement is inferred from ratio source, not direct component list.'
            : 'Ratio involvement is observational only. This is not causal proof.';

        results.push({
            observedRatioId: ratio.id,
            label: `Observed ratio: ${ratio.id}`,
            source: ratio.source,
            value: typeof ratio.value === 'number' && Number.isFinite(ratio.value) ? ratio.value : 0,
            componentCellIndices,
            componentEventIds,
            componentVortexCandidateIds,
            numeratorLabel: ratio.numeratorLabel,
            denominatorLabel: ratio.denominatorLabel,
            closestReferenceLabel: bestMatch?.referenceRatioId ?? null,
            matchStrength: bestMatch?.matchStrength,
            caution,
        });
    }

    return results;
}
