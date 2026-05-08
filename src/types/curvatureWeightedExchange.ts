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
     * Sensitivity blend.
     * - 0: weights are uniformly 1 (no curvature effect).
     * - 1: weights fully reflect normalized curvature variation (mean still 1).
     * - between 0 and 1: linearly blend toward uniform.
     * v4.1 default is 1.
     */
    curvatureSensitivityCoefficient: number;
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
