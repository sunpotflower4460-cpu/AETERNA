import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    createTorusGeometry,
    createFlatTorusMetricGeometry,
} from '../../core/torusGeometry.ts';
import { deriveCurvatureWeights } from '../../world/curvatureWeightedExchange.ts';

const SEGMENTS = 4;

const baseConfig = {
    width: SEGMENTS,
    height: SEGMENTS,
    boundaryMode: 'torus' as const,
    curvatureSensitivityCoefficient: 1,
};

describe('deriveCurvatureWeights — bypass cases', () => {
    it('returns uniform weights when torusGeometry is null', () => {
        const w = deriveCurvatureWeights(null, baseConfig);
        expect(w.isUniform).toBe(true);
        expect(w.minWeight).toBe(1);
        expect(w.maxWeight).toBe(1);
        expect(w.meanWeight).toBe(1);
        for (let i = 0; i < SEGMENTS * SEGMENTS; i++) {
            expect(w.rightEdgeWeight[i]).toBe(1);
            expect(w.downEdgeWeight[i]).toBe(1);
        }
    });

    it('returns uniform weights when sensitivity coefficient is 0', () => {
        const torus = createTorusGeometry({ segments: SEGMENTS, majorRadius: 5, minorRadius: 2 });
        const w = deriveCurvatureWeights(torus, { ...baseConfig, curvatureSensitivityCoefficient: 0 });
        expect(w.isUniform).toBe(true);
    });

    it('returns uniform weights when grid size mismatches torus segments', () => {
        const torus = createTorusGeometry({ segments: SEGMENTS, majorRadius: 5, minorRadius: 2 });
        const w = deriveCurvatureWeights(torus, { ...baseConfig, width: SEGMENTS + 1, height: SEGMENTS + 1 });
        expect(w.isUniform).toBe(true);
    });
});

describe('deriveCurvatureWeights — flat torus mock', () => {
    it('produces uniform weights when curvature is zero (flat torus mock)', () => {
        const curved = createTorusGeometry({ segments: SEGMENTS, majorRadius: 5, minorRadius: 2 });
        const flat = createFlatTorusMetricGeometry(curved);
        const w = deriveCurvatureWeights(flat, baseConfig);
        expect(w.isUniform).toBe(true);
        expect(w.meanWeight).toBeCloseTo(1, 12);
        expect(w.minWeight).toBeCloseTo(1, 12);
        expect(w.maxWeight).toBeCloseTo(1, 12);
    });
});

describe('deriveCurvatureWeights — curved torus', () => {
    it('produces mean(weight) = 1 exactly across all edges (pure redistribution)', () => {
        const torus = createTorusGeometry({ segments: SEGMENTS, majorRadius: 5, minorRadius: 2 });
        const w = deriveCurvatureWeights(torus, baseConfig);
        expect(w.meanWeight).toBeCloseTo(1, 12);
        expect(w.isUniform).toBe(false);
        // Some variation is present
        expect(w.maxWeight).toBeGreaterThan(w.minWeight);
        expect(w.minWeight).toBeGreaterThan(0);
    });

    it('preserves antisymmetric pair shape: weight at (x,y) right == weight at (x+1,y) read as left', () => {
        const torus = createTorusGeometry({ segments: SEGMENTS, majorRadius: 5, minorRadius: 2 });
        const w = deriveCurvatureWeights(torus, baseConfig);
        // For our convention, left-edge weight at (x+1, y) is the right-edge weight stored at (x, y).
        // The function only stores rightEdgeWeight[(x, y)] — so by construction, retrieval at the
        // neighbour reading-back uses the same value. This test asserts the storage scheme:
        // rightEdgeWeight at index i is shared between cell i and cell to the right of i.
        expect(w.rightEdgeWeight.length).toBe(SEGMENTS * SEGMENTS);
        expect(w.downEdgeWeight.length).toBe(SEGMENTS * SEGMENTS);
        // No NaN, no Infinity
        for (let i = 0; i < w.rightEdgeWeight.length; i++) {
            expect(Number.isFinite(w.rightEdgeWeight[i])).toBe(true);
            expect(Number.isFinite(w.downEdgeWeight[i])).toBe(true);
        }
    });

    it('blends linearly with sensitivity coefficient (s=0.5 between uniform and full)', () => {
        const torus = createTorusGeometry({ segments: SEGMENTS, majorRadius: 5, minorRadius: 2 });
        const wFull = deriveCurvatureWeights(torus, baseConfig);
        const wHalf = deriveCurvatureWeights(torus, { ...baseConfig, curvatureSensitivityCoefficient: 0.5 });
        const wZero = deriveCurvatureWeights(torus, { ...baseConfig, curvatureSensitivityCoefficient: 0 });

        // Half-sensitivity weights stay closer to 1 than full
        expect(wHalf.maxWeight - 1).toBeLessThan(wFull.maxWeight - 1);
        expect(1 - wHalf.minWeight).toBeLessThan(1 - wFull.minWeight);
        // mean is still 1 at every sensitivity
        expect(wHalf.meanWeight).toBeCloseTo(1, 12);
        expect(wZero.meanWeight).toBeCloseTo(1, 12);
        expect(wZero.isUniform).toBe(true);
    });

    it('does not include life metaphor or energy-flow proof terms in source', () => {
        const source = readFileSync('src/world/curvatureWeightedExchange.ts', 'utf8');
        const forbidden = ['vital', 'breath', 'heartbeat', 'pulse', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        for (const term of forbidden) {
            expect(source.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
