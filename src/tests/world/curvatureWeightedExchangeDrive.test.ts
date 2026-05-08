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
import type { SpatialWorldMediumConfig } from '../../types/spatialWorldMedium.ts';

const SEG = 6;
const TOL = 1e-9;

const exchangeOnlyMedium: SpatialWorldMediumConfig = {
    width: SEG,
    height: SEG,
    boundaryMode: 'torus',
    localExchangeCoefficient: 0.05,
    localDissipationCoefficient: 0,
    residueConversionCoefficient: 0,
    outflowCoefficient: 0,
    membraneExchangeCoefficient: 0,
    dt: 1,
    tolerance: TOL,
};

const fullMedium: SpatialWorldMediumConfig = {
    width: SEG,
    height: SEG,
    boundaryMode: 'torus',
    localExchangeCoefficient: 0.05,
    localDissipationCoefficient: 0.02,
    residueConversionCoefficient: 0.02,
    outflowCoefficient: 0.02,
    membraneExchangeCoefficient: 0.05,
    dt: 1,
    tolerance: TOL,
};

describe('deriveCurvatureWeights — globalGainCoefficient (v4.2 drive)', () => {
    it('default globalGain = 1 preserves mean(weight) = 1 (v4.1 contract)', () => {
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const w = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });
        expect(w.meanWeight).toBeCloseTo(1, 12);
    });

    it('globalGain = 2 shifts mean to 2 (mean=1 constraint released)', () => {
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const w = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
            globalGainCoefficient: 2,
        });
        expect(w.meanWeight).toBeCloseTo(2, 12);
        expect(w.isUniform).toBe(false);
    });

    it('globalGain = 0.5 shifts mean to 0.5 (sub-uniform global flow)', () => {
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const w = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
            globalGainCoefficient: 0.5,
        });
        expect(w.meanWeight).toBeCloseTo(0.5, 12);
    });

    it('uniform path (sensitivity=0) still respects globalGain', () => {
        const w = deriveCurvatureWeights(null, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 0,
            globalGainCoefficient: 3,
        });
        expect(w.meanWeight).toBe(3);
        expect(w.minWeight).toBe(3);
        expect(w.maxWeight).toBe(3);
        // isUniform reflects "all weights == 1"; with globalGain != 1 it's false.
        expect(w.isUniform).toBe(false);
    });

    it('negative globalGain is clamped to 0 (finiteNonNegative fallback)', () => {
        const w = deriveCurvatureWeights(null, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
            globalGainCoefficient: -1,
        });
        // finiteNonNegative(-1, 1) returns 0 (Math.max(0, -1)). Mean = 0 means no exchange.
        expect(w.meanWeight).toBe(0);
    });
});

describe('spatialWorldMedium — drive step ledger closure under globalGain (v4.2)', () => {
    function seed() {
        const arr = new Float64Array(SEG * SEG);
        // Localized peak at (0, 0)
        arr[0] = 4;
        return arr;
    }

    it.each([
        { gain: 0.5, label: 'sub-uniform' },
        { gain: 1, label: 'mean = 1 (v4.1)' },
        { gain: 2, label: 'super-uniform' },
        { gain: 4, label: 'high gain (clamped per edge)' },
    ])('keeps medium ledger closed for 50 ticks with globalGain=$gain ($label)', ({ gain }) => {
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const weights = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
            globalGainCoefficient: gain,
        });

        let medium = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed());
        let openLedgerCount = 0;
        for (let t = 0; t < 50; t++) {
            const step = updateSpatialWorldMedium(medium, { ...fullMedium, curvatureWeights: weights });
            medium = step.state;
            if (step.report.ledger.status !== 'closed') openLedgerCount++;
        }
        expect(openLedgerCount).toBe(0);
    });
});

describe('spatialWorldMedium — directional drift under curved weights (v4.2)', () => {
    /**
     * With curved torus geometry and a non-uniform initial peak, diffusion
     * proceeds asymmetrically: the inner-rim-side (smaller areaElement, smaller
     * weights) and outer-rim-side (larger areaElement, larger weights) of the
     * peak spread at different rates. This is observable as a difference in
     * the post-diffusion column sums between equivalent positions on the
     * inner rim and outer rim.
     */
    it('curved weights cause asymmetric spread that flat weights do not produce', () => {
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const flat = createFlatTorusMetricGeometry(torus);

        const weightsCurved = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });
        const weightsFlat = deriveCurvatureWeights(flat, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 1,
        });
        expect(weightsFlat.isUniform).toBe(true);

        function seed() {
            const arr = new Float64Array(SEG * SEG);
            // Place a peak at the center; observe spread.
            const cx = Math.floor(SEG / 2);
            const cy = Math.floor(SEG / 2);
            arr[cy * SEG + cx] = 10;
            return arr;
        }

        let mediumCurved = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed());
        let mediumFlat = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed());

        for (let t = 0; t < 30; t++) {
            mediumCurved = updateSpatialWorldMedium(mediumCurved, {
                ...exchangeOnlyMedium,
                curvatureWeights: weightsCurved,
            }).state;
            mediumFlat = updateSpatialWorldMedium(mediumFlat, {
                ...exchangeOnlyMedium,
                curvatureWeights: weightsFlat,
            }).state;
        }

        // Compute spatial variance of the resulting distribution.
        function variance(field: Float64Array) {
            const n = field.length;
            let mean = 0;
            for (let i = 0; i < n; i++) mean += field[i];
            mean /= n;
            let sq = 0;
            for (let i = 0; i < n; i++) sq += (field[i] - mean) ** 2;
            return sq / n;
        }

        const varCurved = variance(mediumCurved.mediumStorageField);
        const varFlat = variance(mediumFlat.mediumStorageField);

        // Both should still preserve total energy (no dissipation in this config).
        const sumCurved = Array.from(mediumCurved.mediumStorageField).reduce((a, v) => a + v, 0);
        const sumFlat = Array.from(mediumFlat.mediumStorageField).reduce((a, v) => a + v, 0);
        expect(sumCurved).toBeCloseTo(10, 6);
        expect(sumFlat).toBeCloseTo(10, 6);

        // Curved and flat distributions must differ.
        let observableDiff = false;
        for (let i = 0; i < mediumCurved.mediumStorageField.length; i++) {
            if (Math.abs(mediumCurved.mediumStorageField[i] - mediumFlat.mediumStorageField[i]) > 1e-6) {
                observableDiff = true;
                break;
            }
        }
        expect(observableDiff).toBe(true);

        // Sanity: variance differs (curved diffusion is asymmetric).
        expect(Math.abs(varCurved - varFlat)).toBeGreaterThan(0);
    });

    it('higher globalGain accelerates spread (peak loses height faster) without breaking ledger', () => {
        const torus = createTorusGeometry({ segments: SEG, majorRadius: 5, minorRadius: 2 });
        const weightsLow = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 0,
            globalGainCoefficient: 1,
        });
        const weightsHigh = deriveCurvatureWeights(torus, {
            width: SEG,
            height: SEG,
            boundaryMode: 'torus',
            curvatureSensitivityCoefficient: 0,
            globalGainCoefficient: 3,
        });

        function seed() {
            const arr = new Float64Array(SEG * SEG);
            arr[0] = 10;
            return arr;
        }

        let mLow = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed());
        let mHigh = createSpatialWorldMedium({ width: SEG, height: SEG, boundaryMode: 'torus' }, seed());

        let openLow = 0;
        let openHigh = 0;
        for (let t = 0; t < 20; t++) {
            const sLow = updateSpatialWorldMedium(mLow, { ...exchangeOnlyMedium, curvatureWeights: weightsLow });
            const sHigh = updateSpatialWorldMedium(mHigh, { ...exchangeOnlyMedium, curvatureWeights: weightsHigh });
            mLow = sLow.state;
            mHigh = sHigh.state;
            if (sLow.report.ledger.status !== 'closed') openLow++;
            if (sHigh.report.ledger.status !== 'closed') openHigh++;
        }

        expect(openLow).toBe(0);
        expect(openHigh).toBe(0);

        // Higher gain -> the peak at index 0 is lower (more spread out).
        expect(mHigh.mediumStorageField[0]).toBeLessThan(mLow.mediumStorageField[0]);
    });
});
