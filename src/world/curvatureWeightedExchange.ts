import type { TorusGeometry } from '../core/torusGeometry.ts';
import type {
    CurvatureWeightedExchangeConfig,
    CurvatureWeightFields,
} from '../types/curvatureWeightedExchange.ts';

export type {
    CurvatureWeightedExchangeBoundaryMode,
    CurvatureWeightedExchangeConfig,
    CurvatureWeightFields,
} from '../types/curvatureWeightedExchange.ts';

/**
 * deriveCurvatureWeights
 *
 * v4.1 structure step.
 *
 * Produces per-edge weights for the local exchange step in spatialWorldMedium and
 * localConservationSubstrate. The weights are derived from the torus geometry's
 * areaElement at adjacent cells. Each edge has ONE weight that is shared by both
 * cells at its endpoints, which is required to keep the antisymmetric delta
 * accounting (`exchangeDelta[i] -= d; exchangeDelta[right] += d`) leak-free.
 *
 * For v4.1 the weights MUST be normalized so that mean(weight) = 1 across all
 * edges. This is pure redistribution: no global gain change. v4.2 will allow a
 * `curvatureSensitivityCoefficient > 1` to break the mean=1 constraint, but v4.1
 * is structure-only.
 *
 * Stability note: callers should still cap `exchangeRate * weight` per edge to
 * avoid over-exchange.
 */

function finiteNonNegative(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function uniformWeights(width: number, height: number): CurvatureWeightFields {
    const size = width * height;
    const right = new Float64Array(size);
    const down = new Float64Array(size);
    right.fill(1);
    down.fill(1);
    return {
        width,
        height,
        rightEdgeWeight: right,
        downEdgeWeight: down,
        meanWeight: 1,
        minWeight: 1,
        maxWeight: 1,
        isUniform: true,
    };
}

/**
 * Derive curvature-weighted edge weights for the medium grid mapped onto a
 * torus geometry.
 *
 * Index convention: medium index = y * width + x. Medium x ↔ torus minor (j),
 * medium y ↔ torus major (i). Both axes are periodic.
 *
 * If `torusGeometry` is null OR the sensitivity coefficient is 0, returns
 * uniform weights (all 1) — the bit-identical fallback for v4.1's
 * flat-equivalence verification.
 */
export function deriveCurvatureWeights(
    torusGeometry: TorusGeometry | null | undefined,
    config: CurvatureWeightedExchangeConfig,
): CurvatureWeightFields {
    const width = Math.max(1, Math.floor(config.width));
    const height = Math.max(1, Math.floor(config.height));
    const sensitivity = finiteNonNegative(config.curvatureSensitivityCoefficient, 0);
    const size = width * height;

    if (!torusGeometry || sensitivity <= 0) {
        return uniformWeights(width, height);
    }

    const segments = torusGeometry.config.segments;
    if (segments * segments !== size) {
        // Grid does not match torus segments; fall back to uniform weights.
        return uniformWeights(width, height);
    }

    const cellAt = (x: number, y: number) => {
        const i = ((y % segments) + segments) % segments;
        const j = ((x % segments) + segments) % segments;
        return torusGeometry.cells[i * segments + j];
    };

    const right = new Float64Array(size);
    const down = new Float64Array(size);
    let sumRaw = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const here = cellAt(x, y);
            const nbR = cellAt(x + 1, y);
            const nbD = cellAt(x, y + 1);
            const rawR = 0.5 * (here.areaElement + nbR.areaElement);
            const rawD = 0.5 * (here.areaElement + nbD.areaElement);
            right[idx] = rawR;
            down[idx] = rawD;
            sumRaw += rawR + rawD;
        }
    }

    const totalEdges = 2 * size;
    const meanRaw = sumRaw / totalEdges;
    if (!Number.isFinite(meanRaw) || meanRaw <= 0) {
        return uniformWeights(width, height);
    }
    const inverseMean = 1 / meanRaw;

    let minW = Number.POSITIVE_INFINITY;
    let maxW = Number.NEGATIVE_INFINITY;
    let sumOut = 0;
    let allOnes = true;
    const epsilon = 1e-15;

    for (let i = 0; i < size; i++) {
        // weight = 1 + sensitivity * (rawNorm - 1) — preserves mean=1 because mean(rawNorm-1)=0.
        const rNorm = right[i] * inverseMean;
        const dNorm = down[i] * inverseMean;
        const rW = 1 + sensitivity * (rNorm - 1);
        const dW = 1 + sensitivity * (dNorm - 1);
        right[i] = rW;
        down[i] = dW;
        sumOut += rW + dW;
        if (rW < minW) minW = rW;
        if (rW > maxW) maxW = rW;
        if (dW < minW) minW = dW;
        if (dW > maxW) maxW = dW;
        if (Math.abs(rW - 1) > epsilon || Math.abs(dW - 1) > epsilon) allOnes = false;
    }

    return {
        width,
        height,
        rightEdgeWeight: right,
        downEdgeWeight: down,
        meanWeight: sumOut / totalEdges,
        minWeight: minW,
        maxWeight: maxW,
        isUniform: allOnes,
    };
}
