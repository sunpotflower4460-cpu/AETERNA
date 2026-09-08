/**
 * PUT-IN: psi's TorusGeometry, chi's ExchangeRingGeometry
 * EMERGED: the single flattened psi cell index chosen as the exchange
 *   boundary S, and validation that chi's geometry is consistent with it
 * claim-tier: C2 (unit-validated: selection is deterministic and
 *   matches the geometric rule; see src/tests/pure/exchangeBoundary.test.ts)
 * floors (誠実な床): S is a SINGLE cell, not a distributed multi-cell
 *   mask - docs/vessel/K5-exchange-medium-adr.md choice 2 explains why
 *   this is the minimal, deliberately-scoped instance of "a subset of
 *   cells," with a distributed boundary left as a future extension.
 *   phi=0 is an arbitrary (not "effect-selected") choice among
 *   equivalent columns, since the torus geometry has no distinguished
 *   phi - only theta=0 (the outer equator, where dA is maximized) is a
 *   genuine geometric landmark.
 *
 * ## 幾何的選択規則（「効果が良いから」ではない）
 *
 * torus.ts の cellArea は dA = r*(R+r*cos(theta))*dTheta*dPhi なので、
 * theta=0（外環赤道）で最大になる。この基準（θ=0に最も近いセル）は
 * torus.ts が既に持つ計量情報だけから決まり、実験結果を見てから
 * 選んだものではない。
 */

import type { TorusGeometry } from '../geometry/torus.ts';
import type { ExchangeRingGeometry } from './ringGeometry.ts';

/** Selects the flattened psi cell index nearest the outer equator (theta=0), at a fixed phi column (default 0, an arbitrary but fixed choice - the geometry has no distinguished phi). */
export function selectExchangeBoundaryCell(geometry: TorusGeometry, phiIndex = 0): number {
  if (!Number.isInteger(phiIndex) || phiIndex < 0 || phiIndex >= geometry.N) {
    throw new Error(`selectExchangeBoundaryCell: phiIndex must be an integer in [0, ${geometry.N}), got ${phiIndex}`);
  }

  let bestRow = 0;
  let bestAngularDistance = Infinity;
  for (let i = 0; i < geometry.N; i++) {
    const theta = geometry.theta[i];
    const angularDistance = Math.min(theta, 2 * Math.PI - theta);
    if (angularDistance < bestAngularDistance) {
      bestAngularDistance = angularDistance;
      bestRow = i;
    }
  }

  return bestRow * geometry.N + phiIndex;
}

export interface ExchangeCouplingConfig {
  lambda: number;
  boundaryCellIndex: number;
  /** chi's ring cell index acting as the coupling port. Canonically 0. */
  portCellIndex: number;
}

/**
 * Builds a validated coupling config. Throws if chi's ring geometry
 * does not have the SAME cellArea as psi's boundary cell - this equality
 * is what makes the exact Rabi-rotation coupling's N-bookkeeping exactly
 * equal-and-opposite (see docs/vessel/K5-exchange-medium-adr.md choice 3);
 * it is a geometric consistency requirement, not a free parameter.
 */
export function createExchangeCouplingConfig(
  psiGeometry: TorusGeometry,
  chiGeometry: ExchangeRingGeometry,
  lambda: number,
  phiIndex = 0,
): ExchangeCouplingConfig {
  const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, phiIndex);
  const portCellIndex = 0;

  const psiCellArea = psiGeometry.cellArea[boundaryCellIndex];
  const chiCellArea = chiGeometry.cellArea[portCellIndex];
  const relativeMismatch = Math.abs(psiCellArea - chiCellArea) / Math.max(psiCellArea, chiCellArea);
  if (relativeMismatch > 1e-12) {
    throw new Error(
      `createExchangeCouplingConfig: chi's ring dx (cellArea=${chiCellArea}) must match psi's boundary cellArea (${psiCellArea}) for the exchange bookkeeping to close exactly; construct chi's ring with dx = psiGeometry.cellArea[boundaryCellIndex]`,
    );
  }

  if (!Number.isFinite(lambda) || lambda < 0) {
    throw new Error(`createExchangeCouplingConfig: lambda must be a finite non-negative number, got ${lambda}`);
  }

  return { lambda, boundaryCellIndex, portCellIndex };
}
