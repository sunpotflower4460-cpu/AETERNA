import { describe, expect, it } from 'vitest';
import {
    createTorusGeometry,
    createFlatTorusMetricGeometry,
} from '../../core/torusGeometry.ts';
import { deriveCurvatureWeights } from '../../world/curvatureWeightedExchange.ts';
import {
    createSpatialWorldMedium,
    updateSpatialWorldMedium,
} from '../../world/spatialWorldMedium.ts';
import {
    createLocalConservationSubstrate,
    updateLocalConservationSubstrate,
} from '../../substrate/localConservationSubstrate.ts';
import type { SpatialWorldMediumConfig } from '../../types/spatialWorldMedium.ts';
import type { LocalConservationSubstrateConfig } from '../../types/localConservationSubstrate.ts';

const SEG = 4;
const TOL = 1e-9;

const mediumBase: SpatialWorldMediumConfig = {
    width: SEG,
    height: SEG,
    boundaryMode: 'torus',
    localExchangeCoefficient: 0.1,
    localDissipationCoefficient: 0.05,
    residueConversionCoefficient: 0.05,
    outflowCoefficient: 0.05,
    membraneExchangeCoefficient: 0.1,
    dt: 1,
    tolerance: TOL,
};

const substrateBase: LocalConservationSubstrateConfig = {
    width: SEG,
    height: SEG,
    boundaryMode: 'torus',
    localExchangeCoefficient: 0.1,
    localDissipationCoefficient: 0.05,
    residueConversionCoefficient: 0.05,
    outflowCoefficient: 0.05,
    dt: 1,
    tolerance: TOL,
};

function seedField() {
    const arr = new Float64Array(SEG * SEG);
    for (let i = 0; i < arr.length; i++) arr[i] = (i % 3) + 0.25 * Math.floor(i / 3);
    return arr;
}

describe('spatialWorldMedium — curvature weights flat-equivalence (v4.1 structure)', () => {
    it('produces bit-identical mediumStorageField when curvatureWeights are absent', () => {
        const seed = seedField();
        const a = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const b = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);

        const stepA = updateSpatialWorldMedium(a, mediumBase);
        const stepB = updateSpatialWorldMedium(b, { ...mediumBase, curvatureWeights: undefined });

        for (let i = 0; i < SEG * SEG; i++) {
            expect(stepA.state.mediumStorageField[i]).toBe(stepB.state.mediumStorageField[i]);
        }
        expect(stepA.report.ledger.status).toBe('closed');
        expect(stepB.report.ledger.status).toBe('closed');
        expect(stepA.report.ledger.conservationResidual).toBeCloseTo(stepB.report.ledger.conservationResidual, 12);
    });

    it('produces bit-identical results with flat-torus-mock weights (curvature = 0)', () => {
        const seed = seedField();
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const flat = createFlatTorusMetricGeometry(torus);
        const flatWeights = deriveCurvatureWeights(flat, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });
        expect(flatWeights.isUniform).toBe(true);

        const a = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const b = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);

        const stepA = updateSpatialWorldMedium(a, mediumBase);
        const stepB = updateSpatialWorldMedium(b, { ...mediumBase, curvatureWeights: flatWeights });

        for (let i = 0; i < SEG * SEG; i++) {
            expect(stepA.state.mediumStorageField[i]).toBe(stepB.state.mediumStorageField[i]);
            expect(stepA.state.mediumDissipationField[i]).toBe(stepB.state.mediumDissipationField[i]);
            expect(stepA.state.membraneExchangeField[i]).toBe(stepB.state.membraneExchangeField[i]);
        }
    });

    it('with curved torus weights, ledger remains closed (conservation preserved)', () => {
        const seed = seedField();
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const weights = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });
        expect(weights.isUniform).toBe(false);

        const state = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const step = updateSpatialWorldMedium(state, { ...mediumBase, curvatureWeights: weights });

        expect(step.report.ledger.status).toBe('closed');
        expect(step.report.ledger.conservationResidual).toBeLessThan(TOL);
    });

    it('with curved torus weights, total medium energy is conserved when only local exchange is active', () => {
        const seed = seedField();
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const weights = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });

        const state = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const exchangeOnlyConfig: SpatialWorldMediumConfig = {
            ...mediumBase,
            localDissipationCoefficient: 0,
            residueConversionCoefficient: 0,
            outflowCoefficient: 0,
            membraneExchangeCoefficient: 0,
            curvatureWeights: weights,
        };

        let medium = state;
        const totalBefore = Array.from(medium.mediumStorageField).reduce((a, v) => a + v, 0);
        for (let t = 0; t < 50; t++) {
            const step = updateSpatialWorldMedium(medium, exchangeOnlyConfig);
            medium = step.state;
            expect(step.report.ledger.status).toBe('closed');
        }
        const totalAfter = Array.from(medium.mediumStorageField).reduce((a, v) => a + v, 0);
        expect(totalAfter).toBeCloseTo(totalBefore, 9);
    });

    it('curved-torus result differs from flat-equivalence (asymmetric redistribution is observable)', () => {
        const seed = seedField();
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const weightsCurved = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });

        const stateUniform = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const stateCurved = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);

        const stepUniform = updateSpatialWorldMedium(stateUniform, mediumBase);
        const stepCurved = updateSpatialWorldMedium(stateCurved, { ...mediumBase, curvatureWeights: weightsCurved });

        let anyDiff = false;
        for (let i = 0; i < SEG * SEG; i++) {
            if (Math.abs(stepUniform.state.mediumStorageField[i] - stepCurved.state.mediumStorageField[i]) > 1e-12) {
                anyDiff = true;
                break;
            }
        }
        expect(anyDiff).toBe(true);
    });
});

describe('localConservationSubstrate — curvature weights flat-equivalence (v4.1 structure)', () => {
    it('produces bit-identical storageField when curvatureWeights are absent', () => {
        const seed = seedField();
        const a = createLocalConservationSubstrate({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const b = createLocalConservationSubstrate({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);

        const stepA = updateLocalConservationSubstrate(a, substrateBase);
        const stepB = updateLocalConservationSubstrate(b, { ...substrateBase, curvatureWeights: undefined });

        for (let i = 0; i < SEG * SEG; i++) {
            expect(stepA.state.storageField[i]).toBe(stepB.state.storageField[i]);
        }
    });

    it('produces bit-identical results with flat-torus-mock weights', () => {
        const seed = seedField();
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const flat = createFlatTorusMetricGeometry(torus);
        const flatWeights = deriveCurvatureWeights(flat, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });

        const a = createLocalConservationSubstrate({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const b = createLocalConservationSubstrate({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);

        const stepA = updateLocalConservationSubstrate(a, substrateBase);
        const stepB = updateLocalConservationSubstrate(b, { ...substrateBase, curvatureWeights: flatWeights });

        for (let i = 0; i < SEG * SEG; i++) {
            expect(stepA.state.storageField[i]).toBe(stepB.state.storageField[i]);
        }
    });

    it('with curved torus weights, substrate ledger remains closed', () => {
        const seed = seedField();
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const weights = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });

        const state = createLocalConservationSubstrate({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed);
        const step = updateLocalConservationSubstrate(state, { ...substrateBase, curvatureWeights: weights });

        expect(step.report.ledger.status).toBe('closed');
        expect(step.report.ledger.conservationResidual).toBeLessThan(TOL);
    });
});
