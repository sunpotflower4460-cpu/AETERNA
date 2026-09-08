/**
 * PUT-IN: psi's TorusGeometry, chi's TorusGeometry (K13 - chi is now
 *   also a 2D torus, not K5's 1D ring), and k (how many boundary
 *   cell-pairs to use)
 * EMERGED: k pairs (psi cell index, chi cell index), one per phi
 *   column 0..k-1 at each geometry's own outer equator (theta=0) row -
 *   docs/vessel/K13-world-constitution-adr.md Choice 2
 * claim-tier: C3 for the pairing/validation (deterministic, reuses
 *   K5's already-proven selectExchangeBoundaryCell unmodified - see
 *   src/tests/pure/distributedBoundary.test.ts). C3 for N conservation
 *   across the whole coupling (each pair's exact unitarity was already
 *   proven in K5; the ADR's tensor-product argument - disjoint unitary
 *   pairs compose to a unitary on the whole system - needs no new
 *   proof technique, only the disjointness confirmed here in tests).
 * floors (誠実な床): per docs/vessel/K13-world-constitution-adr.md's
 *   correction, dA-matching does NOT hold automatically across
 *   different N even with the same R/r (torus.ts's cellArea includes
 *   a (2*pi/N)^2 factor) - selectDistributedBoundary THROWS on any
 *   mismatched pair rather than silently coupling with an inexact
 *   equal-and-opposite property. All k pairs share one lambda (no
 *   per-pair coupling strength) - a deliberately minimal choice
 *   (ADR Choice 2's own floor), not a limitation of the mechanism.
 */

import type { ComplexField, TorusGeometry } from '../geometry/torus.ts';
import { selectExchangeBoundaryCell } from '../exchange/boundary.ts';
import { applyExchangeCoupling } from '../exchange/coupling.ts';
import type { ExchangeCouplingConfig } from '../exchange/boundary.ts';

export interface DistributedBoundaryPair {
  psiCellIndex: number;
  chiCellIndex: number;
}

/**
 * Selects k pairs (psiGeometry's phi=0..k-1 cells at its outer equator,
 * chiGeometry's phi=0..k-1 cells at ITS OWN outer equator), reusing
 * K5's selectExchangeBoundaryCell unmodified for each side. Throws if
 * any pair's cell areas don't match (the exact bookkeeping symmetry
 * K5's coupling.ts derivation depends on) rather than coupling anyway.
 */
export function selectDistributedBoundary(psiGeometry: TorusGeometry, chiGeometry: TorusGeometry, k: number): DistributedBoundaryPair[] {
  if (!Number.isInteger(k) || k < 1) {
    throw new Error(`selectDistributedBoundary: k must be a positive integer, got ${k}`);
  }
  if (k > psiGeometry.N) {
    throw new Error(`selectDistributedBoundary: k (${k}) exceeds psi's N (${psiGeometry.N}) - cannot select that many distinct phi columns`);
  }
  if (k > chiGeometry.N) {
    throw new Error(`selectDistributedBoundary: k (${k}) exceeds chi's N (${chiGeometry.N}) - cannot select that many distinct phi columns`);
  }

  const pairs: DistributedBoundaryPair[] = [];
  for (let phi = 0; phi < k; phi++) {
    const psiCellIndex = selectExchangeBoundaryCell(psiGeometry, phi);
    const chiCellIndex = selectExchangeBoundaryCell(chiGeometry, phi);
    const psiArea = psiGeometry.cellArea[psiCellIndex];
    const chiArea = chiGeometry.cellArea[chiCellIndex];
    const relativeMismatch = Math.abs(psiArea - chiArea) / Math.max(psiArea, chiArea);
    if (relativeMismatch > 1e-12) {
      throw new Error(
        `selectDistributedBoundary: pair phi=${phi} has mismatched cell area (psi=${psiArea}, chi=${chiArea}) - construct chi's geometry (R,r,N) so its outer-equator cell area matches psi's (docs/vessel/K13-world-constitution-adr.md Choice 3's corrected floor: this does NOT happen automatically just from sharing R/r when N differs)`,
      );
    }
    pairs.push({ psiCellIndex, chiCellIndex });
  }
  return pairs;
}

export interface DistributedExchangeResult {
  psi: ComplexField;
  chi: ComplexField;
}

/**
 * Applies K5's exact single-pair Rabi rotation (coupling.ts,
 * unmodified) independently to each of the k pairs, all sharing one
 * lambda. Pairs touch disjoint cell indices (distinct phi per pair on
 * each side), so applying them in sequence is mathematically
 * equivalent to applying them "simultaneously" - see
 * src/tests/pure/distributedBoundary.test.ts's order-independence
 * check.
 */
export function applyDistributedExchangeCoupling(
  psi: ComplexField,
  chi: ComplexField,
  pairs: readonly DistributedBoundaryPair[],
  lambda: number,
  dt: number,
): DistributedExchangeResult {
  let currentPsi = psi;
  let currentChi = chi;
  for (const pair of pairs) {
    const config: ExchangeCouplingConfig = { lambda, boundaryCellIndex: pair.psiCellIndex, portCellIndex: pair.chiCellIndex };
    const result = applyExchangeCoupling(currentPsi, currentChi, config, dt);
    currentPsi = result.psi;
    currentChi = result.chi;
  }
  return { psi: currentPsi, chi: currentChi };
}
