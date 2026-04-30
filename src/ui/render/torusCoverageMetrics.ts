/**
 * torusCoverageMetrics.ts
 * U3: Scientific Torus Renderer — coverage metrics computation
 *
 * Computes coverage statistics for the torus field to help distinguish:
 *   A. Actually only part of the field is active (field state)
 *   B. Only part appears active due to display settings (presentation issue)
 *
 * These metrics are observer-side derived values. They do NOT change
 * field dynamics, energy, trace, or return values.
 *
 * Reference: docs/torus-visualization-requirements.md §4.3
 */

/** Coverage statistics for the current torus field state. */
export interface TorusCoverageMetrics {
    /** Total number of torus regions sampled */
    totalRegionCount: number;
    /** Number of regions with activity above the active threshold */
    activeRegionCount: number;
    /** Number of regions at or below the active threshold */
    inactiveRegionCount: number;
    /** Fraction of total regions that are active (0–1) */
    activeCoverageRatio: number;
    /**
     * Concentration of activity in a subset of regions.
     * 0 = evenly distributed; 1 = entirely concentrated in one region.
     * Derived from normalized entropy of activity distribution.
     */
    activeRegionConcentration: number;
    /**
     * Fraction of torus surface currently visible to the camera.
     * Approximated from camera elevation and distance.
     * This is a presentation metric, not a field metric.
     */
    visibleCoverageRatio: number;
    /**
     * Index of the region with the highest mean activity.
     * -1 if no active regions.
     */
    maxActivityRegionIndex: number;
    /** Mean activity value in the max-activity region */
    maxActivityRegionValue: number;
    /** Mean activity across all active regions */
    meanActiveRegionActivity: number;
}

/**
 * Compute torus coverage metrics from node activity values.
 *
 * @param currentBuffer  Node activity values (absolute values will be used)
 * @param numNodes       Total number of nodes
 * @param segmentSize    Nodes per region side (torus is segmentSize × segmentSize regions)
 * @param activeThreshold  Minimum mean activity to count a region as active (default 0.05)
 * @param visibleCoverageRatio  Estimated fraction of torus visible to camera (0–1)
 */
export function computeTorusCoverageMetrics(
    currentBuffer: ArrayLike<number>,
    numNodes: number,
    segmentSize: number,
    activeThreshold = 0.05,
    visibleCoverageRatio = 0.6
): TorusCoverageMetrics {
    const regionCount = segmentSize * segmentSize;
    const nodesPerRegion = Math.max(1, Math.floor(numNodes / regionCount));

    // Compute mean absolute activity per region
    const regionActivity = new Float64Array(regionCount);
    for (let n = 0; n < numNodes; n++) {
        const regionIdx = Math.floor(n / nodesPerRegion) % regionCount;
        regionActivity[regionIdx] += Math.abs(currentBuffer[n]);
    }
    for (let r = 0; r < regionCount; r++) {
        regionActivity[r] /= nodesPerRegion;
    }

    let activeCount = 0;
    let inactiveCount = 0;
    let totalActiveActivity = 0;
    let maxVal = -Infinity;
    let maxIdx = -1;

    for (let r = 0; r < regionCount; r++) {
        if (regionActivity[r] > activeThreshold) {
            activeCount++;
            totalActiveActivity += regionActivity[r];
            if (regionActivity[r] > maxVal) {
                maxVal = regionActivity[r];
                maxIdx = r;
            }
        } else {
            inactiveCount++;
        }
    }

    const activeCoverageRatio = activeCount / Math.max(1, regionCount);
    const meanActiveRegionActivity = activeCount > 0 ? totalActiveActivity / activeCount : 0;

    // Concentration: normalized entropy of activity distribution
    // concentration = 0 when perfectly uniform; 1 when all activity in one region
    let concentration = 0;
    const totalActivity = Array.from(regionActivity).reduce((a, b) => a + b, 0);
    if (totalActivity > 0 && activeCount > 1) {
        let entropy = 0;
        for (let r = 0; r < regionCount; r++) {
            const p = regionActivity[r] / totalActivity;
            if (p > 0) entropy -= p * Math.log2(p);
        }
        const maxEntropy = Math.log2(activeCount);
        if (maxEntropy > 0) {
            concentration = 1 - entropy / maxEntropy;
        }
    } else if (activeCount === 1) {
        concentration = 1;
    }

    return {
        totalRegionCount: regionCount,
        activeRegionCount: activeCount,
        inactiveRegionCount: inactiveCount,
        activeCoverageRatio,
        activeRegionConcentration: Math.max(0, Math.min(1, concentration)),
        visibleCoverageRatio: Math.max(0, Math.min(1, visibleCoverageRatio)),
        maxActivityRegionIndex: maxIdx,
        maxActivityRegionValue: maxIdx >= 0 ? maxVal : 0,
        meanActiveRegionActivity,
    };
}

/**
 * Estimate the fraction of the torus surface visible to the camera
 * based on camera elevation angle (radians from equator).
 *
 * For a torus viewed from elevation ε:
 *  - ε ≈ 0 (equatorial): ~50% visible
 *  - ε ≈ π/2 (polar): ~70% visible (can see outer and inner rim)
 *
 * This is a presentation-side approximation only.
 */
export function estimateVisibleCoverageRatio(elevationRadians: number): number {
    const e = Math.abs(elevationRadians);
    // Empirical approximation: 0.5 + 0.2 * sin(e)
    return Math.min(1, 0.5 + 0.2 * Math.sin(e));
}
