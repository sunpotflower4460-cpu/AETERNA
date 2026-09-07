/**
 * PUT-IN: PureCoreParams, a DriveSpec, a tick budget, a checkpoint
 *   interval, and ledger-residual tolerances (verification harness
 *   settings, per docs/pure-physics-implementation-plan.md §6.3 - not
 *   physics)
 * EMERGED: the run advanced tick-by-tick, producing periodic snapshots
 *   (src/pure/persist/snapshot.ts), until either the tick budget is
 *   reached or an AGENTS.md stop condition is detected
 * claim-tier: C2 (see src/tests/pure/longRun.test.ts: a run that hits a
 *   deliberately-tiny residual tolerance stops exactly where expected
 *   and preserves the last good state, not the corrupted one; a normal
 *   run reaches its full tick budget and produces the expected number
 *   of checkpoints)
 * floors (誠実な床): checks only the RUNTIME stop conditions from
 *   AGENTS.md that make sense to evaluate tick-by-tick during a run
 *   (NaN/Infinity in psi/nu/chi, and the N/H ledger residual exceeding
 *   its tolerance). The other AGENTS.md conditions (self-adjointness/
 *   conservation-law test failures, seed non-reproducibility, forbidden
 *   source patterns, docs/impl contradiction, observer non-
 *   interference) are source-scan or test-suite concerns, not something
 *   a running loop can detect about itself - those stay the job of
 *   src/tests/pure/ and are not duplicated here.
 *
 * ## なぜ「停止」は例外を投げず値として返すか
 *
 * AGENTS.md「停止は失敗ではありません」——呼び出し側が
 * try/catchを書かなければ扱えない例外より、`stopped`/`stopCondition`
 * を持つ通常の戻り値の方が「隠さず報告する」を自然に強制する
 * （呼び出し側は結果を見るだけで停止の有無と理由を知る）。
 *
 * 停止が検出されたtickの**壊れた値はそのまま状態に採用しない**。
 * 直前の（正常な）psi/nu を最終状態として保持し、その時点の
 * チェックポイントを作る。これにより、壊れた場でスナップショットを
 * 作ろうとして`createSnapshot`自身が(意図どおり)例外を投げる、という
 * 二重の失敗を避けつつ、「どこまでは正常だったか」を必ず再現可能な形で
 * 残す。
 */

import { createTorusGeometry, type ComplexField } from '../geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../field/stepConservative.ts';
import { createPureFieldState } from '../field/state.ts';
import type { PureCoreParams, PureCoreSolverSettings, LinearSolverKind } from '../params.ts';
import { defaultPureCoreSolverSettings } from '../params.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import { runMediumHistoryTick, type DriveTickLedgerEntry } from '../ledger/energy.ts';
import { createSnapshot, type PureCoreSnapshot } from '../persist/snapshot.ts';

export interface LedgerResidualTolerance {
  n: number;
  h: number;
}

export interface LongRunConfig {
  params: PureCoreParams;
  drive: DriveSpec;
  totalTicks: number;
  checkpointInterval: number;
  residualTolerance: LedgerResidualTolerance;
  linearSolverKind?: LinearSolverKind;
}

export interface StopConditionReport {
  reason: 'non-finite-psi' | 'non-finite-nu' | 'ledger-residual-exceeded' | 'tick-execution-error';
  /** The tick that would have produced the bad value - NOT reached; finalTick stays at the last good tick. */
  attemptedTick: number;
  detail: string;
}

export interface LongRunCheckpoint {
  tick: number;
  snapshot: PureCoreSnapshot;
}

export interface LongRunResult {
  requestedTicks: number;
  finalTick: number;
  stopped: boolean;
  stopCondition?: StopConditionReport;
  checkpoints: LongRunCheckpoint[];
  finalPsi: ComplexField;
  finalNu: Float64Array;
  solverSettings: PureCoreSolverSettings;
}

function findNonFinite(values: Float64Array): number {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) return i;
  }
  return -1;
}

export function runLongRun(config: LongRunConfig): LongRunResult {
  if (!Number.isInteger(config.totalTicks) || config.totalTicks < 0) {
    throw new Error(`runLongRun: totalTicks must be a non-negative integer, got ${config.totalTicks}`);
  }
  if (!Number.isInteger(config.checkpointInterval) || config.checkpointInterval < 1) {
    throw new Error(`runLongRun: checkpointInterval must be a positive integer, got ${config.checkpointInterval}`);
  }

  const { params, drive } = config;
  const geometry = createTorusGeometry({ R: params.R, r: params.r, N: params.N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const solverSettings = defaultPureCoreSolverSettings();
  const stepper = createConservativeStepper(operator, geometry, { alpha: params.alpha, g: params.g, dt: params.dt, linearSolverKind: config.linearSolverKind });
  const mediumParams: MediumHistoryParams = { kappa: params.kappa, rho: params.rho, nu0: params.nu0 };

  const initial = createPureFieldState(params, geometry);
  let psi: ComplexField = { real: initial.real, imag: initial.imag };
  let nu: Float64Array = initial.nu;

  const checkpoints: LongRunCheckpoint[] = [];
  let stopCondition: StopConditionReport | undefined;
  let finalTick = 0;

  const takeCheckpoint = (tick: number): void => {
    checkpoints.push({ tick, snapshot: createSnapshot({ params, solverSettings, tick, psi, nu }) });
  };

  for (let tick = 0; tick < config.totalTicks; tick++) {
    const t = tick * params.dt;
    const attemptedTick = tick + 1;
    let result: { psi: ComplexField; nu: Float64Array; ledger: DriveTickLedgerEntry };
    try {
      result = runMediumHistoryTick(psi, stepper, geometry, params.alpha, params.g, nu, drive, t, params.dt, mediumParams);
    } catch (error) {
      stopCondition = { reason: 'tick-execution-error', attemptedTick, detail: `runMediumHistoryTick threw: ${error instanceof Error ? error.message : String(error)}` };
      break;
    }

    const badPsiReal = findNonFinite(result.psi.real);
    const badPsiImag = findNonFinite(result.psi.imag);
    if (badPsiReal >= 0 || badPsiImag >= 0) {
      const idx = badPsiReal >= 0 ? badPsiReal : badPsiImag;
      const part = badPsiReal >= 0 ? 'real' : 'imag';
      stopCondition = { reason: 'non-finite-psi', attemptedTick, detail: `psi.${part}[${idx}] is non-finite` };
      break;
    }
    const badNu = findNonFinite(result.nu);
    if (badNu >= 0) {
      stopCondition = { reason: 'non-finite-nu', attemptedTick, detail: `nu[${badNu}] is non-finite` };
      break;
    }
    if (Math.abs(result.ledger.residualN) > config.residualTolerance.n) {
      stopCondition = {
        reason: 'ledger-residual-exceeded',
        attemptedTick,
        detail: `residualN (${result.ledger.residualN}) exceeds tolerance (${config.residualTolerance.n})`,
      };
      break;
    }
    if (Math.abs(result.ledger.residualH) > config.residualTolerance.h) {
      stopCondition = {
        reason: 'ledger-residual-exceeded',
        attemptedTick,
        detail: `residualH (${result.ledger.residualH}) exceeds tolerance (${config.residualTolerance.h})`,
      };
      break;
    }

    psi = result.psi;
    nu = result.nu;
    finalTick = attemptedTick;

    if (finalTick % config.checkpointInterval === 0) {
      takeCheckpoint(finalTick);
    }
  }

  if (stopCondition || checkpoints.length === 0 || checkpoints[checkpoints.length - 1].tick !== finalTick) {
    takeCheckpoint(finalTick);
  }

  return {
    requestedTicks: config.totalTicks,
    finalTick,
    stopped: stopCondition !== undefined,
    stopCondition,
    checkpoints,
    finalPsi: psi,
    finalNu: nu,
    solverSettings,
  };
}
