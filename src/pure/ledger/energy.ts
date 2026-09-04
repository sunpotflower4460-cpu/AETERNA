/**
 * PUT-IN: psi at tick start, a ConservativeStepper (PR3, already built
 *   with its own operator/geometry/alpha/g/dt), the medium dissipation
 *   field nu(x), dt
 * EMERGED: psi after one full PR4 tick (conservative step, then
 *   dissipation step) plus an EnergyLedgerEntry recording every N/H
 *   quantity docs/pure-physics-implementation-plan.md §7 requires
 * claim-tier: C3 (see src/tests/pure/ledgerDissipation.test.ts for the
 *   bookkeeping-identity check, numericalDriftScope.test.ts for the
 *   "numericalDriftH belongs to the conservative block only" check,
 *   dissipationNormLoss.test.ts and
 *   uniformDissipationHamiltonianLoss.test.ts for the two sign claims)
 * floors (誠実な床): PR4 has no drive yet - driveWork_N/H are always 0
 *   at this stage (PR5 adds them, and this file's ledger equations will
 *   gain those terms then). dissipationLossH is measured here, not
 *   sign-guaranteed in general (see stepDissipation.ts's module doc for
 *   why); this file's own tests only require it to be >=0 because PR4
 *   always calls this with uniform nu(x).
 *
 * docs/pure-physics-implementation-plan.md §7 帳簿定義:
 *
 *   N(t+1) = N(t) + driveWork_N - dissipationLoss_N + residual_N
 *   H(t+1) = H(t) + driveWork_H - dissipationLoss_H + numericalDrift_H + residual_H
 *
 * PR4時点では driveWork_N = driveWork_H = 0 なので、この式は
 * 3点測定（tick開始時・保存部通過後・散逸通過後）から代数的に閉じる。
 * residual_N と residual_H は「実装バグの検出用」（§7）であり、自由
 * パラメータではない - 下の実装は3点の実測値だけから機械的に導出する。
 *
 *   residualN  = nAfterConservative - nBefore
 *     (保存部自身が持つ、Nについての数値誤差。理論上は0、Cayley/CN
 *     ステップの浮動小数点丸めのみに由来する)
 *   residualH  = (hAfterDissipation - hBefore) + dissipationLossH - numericalDriftH
 *     (定義から代入すると恒等的に0になる式を、あえて実測値から
 *     再構成して残差として書く - 0にならなければ実装のどこかが
 *     矛盾している)
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { TorusGeometry } from '../geometry/torus.ts';
import type { ConservativeStepper } from '../field/stepConservative.ts';
import { computeNorm, computeHamiltonian } from '../field/invariants.ts';
import { applyDissipationStep } from '../field/stepDissipation.ts';

export interface EnergyLedgerEntry {
  nBefore: number;
  nAfterConservative: number;
  nAfterDissipation: number;
  hBefore: number;
  hAfterConservative: number;
  hAfterDissipation: number;
  dissipationLossN: number;
  dissipationLossH: number;
  numericalDriftH: number;
  residualN: number;
  residualH: number;
}

export interface DissipationTickResult {
  psi: ComplexField;
  ledger: EnergyLedgerEntry;
}

export function runDissipationTick(
  psi: ComplexField,
  conservativeStepper: ConservativeStepper,
  geometry: TorusGeometry,
  alpha: number,
  g: number,
  nu: Float64Array,
  dt: number,
): DissipationTickResult {
  const { operator } = conservativeStepper;

  const nBefore = computeNorm(psi, geometry);
  const hBefore = computeHamiltonian(psi, operator, geometry, alpha, g);

  const psiAfterConservative = conservativeStepper.step(psi);
  const nAfterConservative = computeNorm(psiAfterConservative, geometry);
  const hAfterConservative = computeHamiltonian(psiAfterConservative, operator, geometry, alpha, g);

  const psiAfterDissipation = applyDissipationStep(psiAfterConservative, nu, dt);
  const nAfterDissipation = computeNorm(psiAfterDissipation, geometry);
  const hAfterDissipation = computeHamiltonian(psiAfterDissipation, operator, geometry, alpha, g);

  const dissipationLossN = nAfterConservative - nAfterDissipation;
  const dissipationLossH = hAfterConservative - hAfterDissipation;
  const numericalDriftH = hAfterConservative - hBefore;
  const residualN = nAfterConservative - nBefore;
  const residualH = hAfterDissipation - hBefore + dissipationLossH - numericalDriftH;

  return {
    psi: psiAfterDissipation,
    ledger: {
      nBefore,
      nAfterConservative,
      nAfterDissipation,
      hBefore,
      hAfterConservative,
      hAfterDissipation,
      dissipationLossN,
      dissipationLossH,
      numericalDriftH,
      residualN,
      residualH,
    },
  };
}
