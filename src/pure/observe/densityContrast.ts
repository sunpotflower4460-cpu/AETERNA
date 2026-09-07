/**
 * PUT-IN: a complex field psi, its TorusGeometry, and a pre-registered
 *   `relativeDeviation` (how far |psi|^2 must differ from the dA-
 *   weighted mean density, as a fraction of that mean, to count as part
 *   of a structure)
 * EMERGED: findDensityBlobs partitions the grid into connected
 *   components of cells whose density deviates from the mean by at
 *   least `relativeDeviation` (4-neighbor, torus-periodic connectivity)
 *   - a density-RELATIVE proxy for Aeterna-Genesis L4's "周囲から区別
 *   される領域（内外差）", per docs/vessel/K-series-II-brain-and-
 *   universe-plan.md K11's explicit instruction to cut on a ratio to
 *   mean density, never an invented absolute threshold. evaluateContrast
 *   turns one blob into the L4 "inside_outside_contrast" number.
 * claim-tier: C2 (unit-validated against hand-constructed density
 *   fields with a known planted blob - a density EXCESS region, a
 *   density DEFICIT region, no blob at all (uniform field), two
 *   disjoint blobs, and a blob that wraps across the periodic seam -
 *   in src/tests/pure/densityContrast.test.ts. This is a measurement
 *   instrument, not yet a claim about what AETERNA's own dynamics
 *   produce - that is K12/K13/K14's job.)
 * floors (誠実な床):
 *   - AETERNA's dynamics can plausibly produce either density EXCESS
 *     structures (solitons/breathers) or density DEFICIT structures
 *     (vortex cores in a background condensate) - which one, if either,
 *     is exactly the open question K12+ investigates. This module
 *     therefore flags a cell as "inside" a structure when its density
 *     deviates from the mean by at least relativeDeviation in EITHER
 *     direction (excess or deficit), rather than presupposing one. A
 *     future finding that only one direction ever matters would be a
 *     K12+ result, not something to bake in here ahead of time.
 *   - "mean density" is the dA-weighted mean, exactly the convention
 *     src/pure/observe/correlation.ts already uses for nu/|psi|^2
 *     correlation - not a naive unweighted grid average, since the
 *     torus's cell area varies with theta.
 *   - Connected components use 4-neighbor (N/S/E/W) adjacency, matching
 *     detectVortexCandidates' own plaquette adjacency convention - not
 *     8-neighbor (diagonal) adjacency. Two outlier cells touching only
 *     diagonally are NOT considered connected here.
 *   - contrastRatio compares a blob's own mean density against the mean
 *     density of everything OUTSIDE ANY blob (not against the whole-
 *     field mean, which would include the blob itself and understate
 *     the contrast for a large blob).
 *   - A blob's contrastRatio is defined as max(inside/outside,
 *     outside/inside) so it is always >= 1 regardless of whether the
 *     blob is a density excess or deficit - "how many times different,"
 *     not signed.
 *   - This module never reads N, H, nu, chi, or any ledger value - only
 *     the ComplexField and TorusGeometry it is handed. It has no
 *     reachable path back into src/pure/field, src/pure/ledger,
 *     src/pure/drive, src/pure/medium, or src/pure/exchange (checked by
 *     src/tests/pure/observerNonIntervention.test.ts's import-direction
 *     scan, which covers everything under observe/ automatically).
 */

import type { ComplexField, TorusGeometry } from '../geometry/torus.ts';

export interface DensityBlob {
  /** Flattened cell indices (i*N+j) belonging to this connected component. */
  cellIndices: number[];
  /** dA-weighted mean density (|psi|^2) over this blob's cells. */
  meanDensityInside: number;
  /** true if this blob is a density EXCESS relative to the whole-field mean, false if a DEFICIT. */
  isExcess: boolean;
}

function computeDensity(psi: ComplexField): Float64Array {
  const size = psi.real.length;
  const density = new Float64Array(size);
  for (let k = 0; k < size; k++) {
    density[k] = psi.real[k] * psi.real[k] + psi.imag[k] * psi.imag[k];
  }
  return density;
}

function weightedMean(values: Float64Array, weights: Float64Array, indices?: readonly number[]): number {
  let sum = 0;
  let weightSum = 0;
  const keys = indices ?? values.keys();
  for (const k of keys) {
    sum += weights[k] * values[k];
    weightSum += weights[k];
  }
  return weightSum > 0 ? sum / weightSum : 0;
}

export function findDensityBlobs(psi: ComplexField, geometry: TorusGeometry, relativeDeviation: number): DensityBlob[] {
  if (!(Number.isFinite(relativeDeviation) && relativeDeviation > 0)) {
    throw new Error(`findDensityBlobs: relativeDeviation must be a finite positive number, got ${relativeDeviation}`);
  }
  const { N, cellArea } = geometry;
  const density = computeDensity(psi);
  const meanDensity = weightedMean(density, cellArea);

  const isOutlier = new Uint8Array(density.length);
  if (meanDensity > 0) {
    for (let k = 0; k < density.length; k++) {
      const ratio = density[k] / meanDensity;
      if (ratio >= 1 + relativeDeviation || ratio <= 1 - relativeDeviation) {
        isOutlier[k] = 1;
      }
    }
  }

  const visited = new Uint8Array(density.length);
  const blobs: DensityBlob[] = [];

  for (let start = 0; start < density.length; start++) {
    if (!isOutlier[start] || visited[start]) continue;

    const component: number[] = [];
    const queue: number[] = [start];
    visited[start] = 1;
    while (queue.length > 0) {
      const cell = queue.pop()!;
      component.push(cell);
      const i = Math.floor(cell / N);
      const j = cell % N;
      const neighbors = [((i + 1) % N) * N + j, ((i - 1 + N) % N) * N + j, i * N + ((j + 1) % N), i * N + ((j - 1 + N) % N)];
      for (const nb of neighbors) {
        if (isOutlier[nb] && !visited[nb]) {
          visited[nb] = 1;
          queue.push(nb);
        }
      }
    }

    const meanDensityInside = weightedMean(density, cellArea, component);
    blobs.push({ cellIndices: component, meanDensityInside, isExcess: meanDensityInside > meanDensity });
  }

  return blobs;
}

export interface ContrastEvaluation {
  meanDensityOutside: number;
  /** max(inside/outside, outside/inside) - always >= 1 (or 0 if either mean is exactly 0). */
  contrastRatio: number;
  /** contrastRatio > thetaContrast, the pre-registered L4 threshold. */
  exceedsThreshold: boolean;
}

/**
 * Evaluates ONE blob's contrast against everything outside every blob
 * detected in the same field (so a second, unrelated blob elsewhere
 * does not count as part of "outside" being contaminated by ITS OWN
 * density - it does, deliberately: "outside" means "not inside any
 * detected structure," matching Genesis's own "区別できるまとまり"
 * (distinguishable from its surroundings), not "not inside THIS blob".
 */
export function evaluateContrast(blob: DensityBlob, allBlobs: readonly DensityBlob[], psi: ComplexField, geometry: TorusGeometry, thetaContrast: number): ContrastEvaluation {
  const { cellArea } = geometry;
  const density = computeDensity(psi);
  const insideAny = new Set<number>();
  for (const b of allBlobs) {
    for (const cell of b.cellIndices) insideAny.add(cell);
  }
  const outsideIndices: number[] = [];
  for (let k = 0; k < density.length; k++) {
    if (!insideAny.has(k)) outsideIndices.push(k);
  }
  const meanDensityOutside = weightedMean(density, cellArea, outsideIndices);

  let contrastRatio = 0;
  if (blob.meanDensityInside > 0 && meanDensityOutside > 0) {
    contrastRatio = Math.max(blob.meanDensityInside / meanDensityOutside, meanDensityOutside / blob.meanDensityInside);
  }

  return { meanDensityOutside, contrastRatio, exceedsThreshold: contrastRatio > thetaContrast };
}
