/**
 * curvatureWeightedExchange types.
 *
 * Pure type definitions for v4.1 curvature-weighted exchange. Kept here (in
 * types/) so consumers in types/spatialWorldMedium.ts and
 * types/localConservationSubstrate.ts can reference them without pulling
 * world/ implementation files into the type-check graph.
 *
 * The deriving function lives in src/world/curvatureWeightedExchange.ts.
 */

export type CurvatureWeightedExchangeBoundaryMode = 'torus';

export interface CurvatureWeightedExchangeConfig {
    width: number;
    height: number;
    boundaryMode: CurvatureWeightedExchangeBoundaryMode;
    /**
     * Sensitivity blend (variance only).
     * - 0: weights are uniformly 1 (no curvature effect).
     * - 1: weights fully reflect normalized curvature variation.
     * - between 0 and 1: linearly blend toward uniform.
     * Mean across all edges remains 1 regardless of this value (the formula
     * `1 + s*(rawNorm - 1)` has zero-mean offset).
     */
    curvatureSensitivityCoefficient: number;
    /**
     * v4.2 (drive step) global gain.
     *
     * Applied as a uniform multiplier AFTER the sensitivity blend. When set to
     * a value other than 1, the mean(weight) constraint is released and
     * mean = globalGainCoefficient. v4.1 default is 1 (mean=1 preserved).
     *
     * Stability: callers still cap each edge rate to 0.25, so a globalGain
     * value greater than (0.25 / exchangeRate) clamps per-edge.
     */
    globalGainCoefficient?: number;
}

export interface CurvatureWeightFields {
    width: number;
    height: number;
    /** Edge weight from cell (x, y) to cell (x+1, y) (toroidal wrap). Length = width * height. */
    rightEdgeWeight: Float64Array;
    /** Edge weight from cell (x, y) to cell (x, y+1) (toroidal wrap). Length = width * height. */
    downEdgeWeight: Float64Array;
    meanWeight: number;
    minWeight: number;
    maxWeight: number;
    /** Whether the weights are exactly uniform (all == 1). Used for fast equivalence checks. */
    isUniform: boolean;
}
