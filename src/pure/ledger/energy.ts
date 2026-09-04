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
import type { DriveSpec } from '../drive/drive.ts';
import { evaluateDrive } from '../drive/drive.ts';
import { applyDriveStep } from '../field/stepDrive.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import { applyMediumHistoryStep } from '../medium/history.ts';

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

/**
 * PUT-IN (PR5 addition): psi at tick start, the same ConservativeStepper/
 *   nu/dt runDissipationTick takes, plus a DriveSpec and the current time t
 * EMERGED: psi after one full PR5 tick (conservative -> dissipation ->
 *   drive, the fixed order in PURE_CORE_SOLVER_STEP_ORDER) plus
 *   driveWork_N/H
 * claim-tier: C3 (see src/tests/pure/driveWork.test.ts for the positive-
 *   phase and ledger-closure checks, negativeDriveWork.test.ts for the
 *   sign-flip check)
 * floors (誠実な床): mediumHistory and observe are not implemented yet
 *   (PR6/PR7) - this is still not the full solver tick.
 *
 * docs/pure-physics-implementation-plan.md §7, 駆動を含めた完全形:
 *
 *   N(t+1) = N(t) + driveWork_N - dissipationLoss_N + residual_N
 *   H(t+1) = H(t) + driveWork_H - dissipationLoss_H + numericalDrift_H + residual_H
 *
 * runDissipationTick は既に residual_N/H を「保存部＋散逸部だけ」の
 * 恒等式として確定している（residualH は代数的に厳密0、residualN は
 * 保存部自身の浮動小数点誤差のみ）。この事実は駆動の有無に依存しない
 * ので、その値を変えずにそのまま再利用できる。駆動はその出力へ
 * もう一段適用されるだけであり、上の完全形は
 *
 *   N(t+1) = nAfterDrive = nAfterDissipation + driveWorkN
 *          = (nBefore - dissipationLossN + residualN) + driveWorkN
 *
 * という代入だけで成立する（H側も同様）。
 */
export interface DriveTickLedgerEntry extends EnergyLedgerEntry {
  nAfterDrive: number;
  hAfterDrive: number;
  driveWorkN: number;
  driveWorkH: number;
}

export interface DriveTickResult {
  psi: ComplexField;
  ledger: DriveTickLedgerEntry;
}

export function runDriveTick(
  psi: ComplexField,
  conservativeStepper: ConservativeStepper,
  geometry: TorusGeometry,
  alpha: number,
  g: number,
  nu: Float64Array,
  drive: DriveSpec,
  t: number,
  dt: number,
): DriveTickResult {
  const { operator } = conservativeStepper;
  const { psi: psiAfterDissipation, ledger } = runDissipationTick(psi, conservativeStepper, geometry, alpha, g, nu, dt);

  const driveField = evaluateDrive(drive, t);
  const psiAfterDrive = applyDriveStep(psiAfterDissipation, driveField, dt);
  const nAfterDrive = computeNorm(psiAfterDrive, geometry);
  const hAfterDrive = computeHamiltonian(psiAfterDrive, operator, geometry, alpha, g);

  const driveWorkN = nAfterDrive - ledger.nAfterDissipation;
  const driveWorkH = hAfterDrive - ledger.hAfterDissipation;

  return {
    psi: psiAfterDrive,
    ledger: {
      ...ledger,
      nAfterDrive,
      hAfterDrive,
      driveWorkN,
      driveWorkH,
    },
  };
}

/**
 * PUT-IN (PR6 addition): everything runDriveTick takes, plus the current
 *   nu(x) (reused as-is - the tick's dissipation step already consumed
 *   it) and MediumHistoryParams
 * EMERGED: psi after the full PR6 tick (conservative -> dissipation ->
 *   drive -> mediumHistory, the fixed solverStepOrder up through PR6;
 *   observe is still PR7) plus nu(x) advanced by one tick, plus the same
 *   DriveTickLedgerEntry runDriveTick already produced
 * claim-tier: C3 (see src/tests/pure/mediumNonContact.test.ts for the
 *   "psi/N/H provably unchanged by this step" check - which is why this
 *   function returns runDriveTick's own ledger unmodified rather than
 *   re-measuring N/H after the medium-history step)
 * floors (誠実な床): observe (PR7) is not implemented yet.
 *
 * docs/pure-physics-implementation-plan.md PR6 の要求「媒質履歴ステップ
 * 前後でψは変わらない」「媒質履歴ステップ前後でN/Hは変わらない」は、
 * ここでは「そもそも測り直さない」という実装で満たす。ledgerは
 * runDriveTick が確定した値をそのまま返す（medium history が
 * ψ・N・Hに影響する経路を持たないことの直接的な帰結であり、
 * 何かを追加で保証するコードではない）。
 *
 * nu の更新には、この tick の「最終的な」psi（駆動まで終えた後の値）
 * を使う（`applyMediumHistoryStep` の PUT-IN 参照）。使う nu 自体は
 * この tick 開始時の値（= このtickの散逸ステップが実際に使った値）
 * であり、次tickの散逸ステップはここで返す nuNext を使う。
 */
export interface MediumHistoryTickResult {
  psi: ComplexField;
  nu: Float64Array;
  ledger: DriveTickLedgerEntry;
}

export function runMediumHistoryTick(
  psi: ComplexField,
  conservativeStepper: ConservativeStepper,
  geometry: TorusGeometry,
  alpha: number,
  g: number,
  nu: Float64Array,
  drive: DriveSpec,
  t: number,
  dt: number,
  mediumParams: MediumHistoryParams,
): MediumHistoryTickResult {
  const { psi: psiAfterDrive, ledger } = runDriveTick(psi, conservativeStepper, geometry, alpha, g, nu, drive, t, dt);
  const nuNext = applyMediumHistoryStep(psiAfterDrive, nu, mediumParams, dt);

  return {
    psi: psiAfterDrive,
    nu: nuNext,
    ledger,
  };
}
