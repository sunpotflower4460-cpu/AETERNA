/**
 * observedRatioInvolvement.test.ts
 * v1.8: Causal Trace / Layer Correlation — buildObservedRatioInvolvement unit tests
 *
 * Verifies:
 * - When no ratio data → returns empty array
 * - Returns caution string in every involvement entry
 * - No fake components fabricated
 */

import { describe, it, expect } from 'vitest';
import { buildObservedRatioInvolvement } from '../../observation/buildObservedRatioInvolvement.js';
import type {
    BuildObservedRatioInvolvementParams,
    ObservedRatiosStateInput,
} from '../../observation/buildObservedRatioInvolvement.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRatiosState(
    ratioIds: string[],
    componentsByRatioId: Record<string, number[]> = {},
): ObservedRatiosStateInput {
    return {
        observedRatios: ratioIds.map((id) => ({
            id,
            source: `source-${id}`,
            value: 1.5,
            componentCellIndices: componentsByRatioId[id],
        })),
        strongestMatch: ratioIds.length > 0
            ? { observedRatioId: ratioIds[0], referenceRatioId: 'ref-phi', matchStrength: 0.7 }
            : null,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildObservedRatioInvolvement: no ratio data', () => {
    it('returns empty array when observedRatiosState is null', () => {
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: null,
            cellIndex: 0,
        };
        const result = buildObservedRatioInvolvement(params);
        expect(result).toHaveLength(0);
    });

    it('returns empty array when no ratios', () => {
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: { observedRatios: [], strongestMatch: null },
            cellIndex: 0,
        };
        const result = buildObservedRatioInvolvement(params);
        expect(result).toHaveLength(0);
    });
});

describe('buildObservedRatioInvolvement: involvement', () => {
    it('includes ratio when cell is in componentCellIndices', () => {
        const state = makeRatiosState(['r1', 'r2'], { r1: [0, 1, 2], r2: [5, 6] });
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: state,
            cellIndex: 0,
        };
        const result = buildObservedRatioInvolvement(params);
        expect(result.some((r) => r.observedRatioId === 'r1')).toBe(true);
        expect(result.some((r) => r.observedRatioId === 'r2')).toBe(false);
    });

    it('includes all ratios when componentCellIndices is undefined (unavailable)', () => {
        const state = makeRatiosState(['r1', 'r2']); // no componentCellIndices
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: state,
            cellIndex: 99,
        };
        const result = buildObservedRatioInvolvement(params);
        expect(result.length).toBe(2);
    });
});

describe('buildObservedRatioInvolvement: caution', () => {
    it('every involvement entry has a caution string', () => {
        const state = makeRatiosState(['r1'], { r1: [0, 1] });
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: state,
            cellIndex: 0,
        };
        const result = buildObservedRatioInvolvement(params);
        for (const inv of result) {
            expect(typeof inv.caution).toBe('string');
            expect(inv.caution.length).toBeGreaterThan(0);
        }
    });

    it('caution says "observational only" when components unavailable', () => {
        const state = makeRatiosState(['r1']); // no componentCellIndices → unavailable
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: state,
            cellIndex: 0,
        };
        const result = buildObservedRatioInvolvement(params);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].caution.toLowerCase()).toMatch(/unavailable|observational/);
    });
});

describe('buildObservedRatioInvolvement: no fake components', () => {
    it('componentCellIndices is empty when ratio has empty array', () => {
        const state: ObservedRatiosStateInput = {
            observedRatios: [{
                id: 'r1',
                source: 'test',
                value: 1.0,
                componentCellIndices: [],
            }],
            strongestMatch: null,
        };
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: state,
            cellIndex: 5,
        };
        const result = buildObservedRatioInvolvement(params);
        // Cell 5 is not in [] so should not be included
        expect(result).toHaveLength(0);
    });

    it('does not invent component cells beyond what is provided', () => {
        const state = makeRatiosState(['r1'], { r1: [3, 7] });
        const params: BuildObservedRatioInvolvementParams = {
            observedRatiosState: state,
            cellIndex: 3,
        };
        const result = buildObservedRatioInvolvement(params);
        expect(result).toHaveLength(1);
        expect(result[0].componentCellIndices).toEqual([3, 7]);
    });
});
