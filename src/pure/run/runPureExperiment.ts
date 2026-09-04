/**
 * PUT-IN: PureCoreParams (validated), a DriveSpec, a tick count, and an
 *   `observe` toggle
 * EMERGED: the field/medium state after `ticks` full PR6 ticks, the full
 *   per-tick N/H ledger history, and (only if `observe` is true) a
 *   per-tick observation history from the readonly instruments in
 *   src/pure/observe/
 * claim-tier: C2 (unit-validated: same seed -> bit-identical trajectory;
 *   the load-bearing safety property - observation changes nothing - is
 *   C3, checked in src/tests/pure/observerNonIntervention.test.ts)
 * floors (誠実な床): does not implement medium history's initial nu(x)
 *   choice beyond what createPureFieldState already does (uniform nu0).
 *   Does not itself interpret the observation history (no vortex-count
 *   thresholds, no coherence trend claims) - that is
 *   src/pure/run/exportPureReport.ts's caller's job, or K6/K7's.
 *
 * ## なぜ observe トグルが非干渉性の直接的な証拠になるか
 *
 * ループの各tickは
 *
 *   1. runMediumHistoryTick(...) を呼び、psi/nu を次のtickの値に更新する
 *   2. observe が true なら、その「更新済みの」psi/nu を読み取り専用の
 *      観測関数（computePhaseCoherence 等）に渡し、結果を
 *      observationHistory 配列に push する
 *
 * という順序で書かれている。ステップ2の出力は配列に追加されるだけで、
 * ステップ1が次のtickで使う psi/nu/ledger のどの変数にも代入されない
 * （そもそも代入先が存在しない）。したがって observe=false と
 * observe=true で finalPsi/finalNu/ledgerHistory が一致することは、
 * 「たまたま一致する」のではなく、コードの構造上、観測が力学変数へ
 * 書き戻る経路を持たないことの帰結である
 * （observerNonIntervention.test.ts はこれを実測で確認する）。
 */

import type { PureCoreParams, PureCoreSolverSettings } from '../params.ts';
import { validatePureCoreParams, defaultPureCoreSolverSettings } from '../params.ts';
import { createTorusGeometry, type ComplexField } from '../geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../field/stepConservative.ts';
import { createPureFieldState } from '../field/state.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import { runMediumHistoryTick, type DriveTickLedgerEntry } from '../ledger/energy.ts';
import { computePhaseCoherence } from '../observe/coherence.ts';
import { computeNuFieldEnergyCorrelation } from '../observe/correlation.ts';
import { detectVortexCandidates, type VortexCandidate } from '../observe/vortexCandidates.ts';

export interface PureExperimentConfig {
  params: PureCoreParams;
  drive: DriveSpec;
  ticks: number;
  /** If true, runs the readonly observer suite every tick and records observationHistory. If false, observationHistory is empty. */
  observe: boolean;
}

export interface TickObservation {
  tick: number;
  coherence: number;
  nuFieldEnergyCorrelation: number;
  vortexCandidates: VortexCandidate[];
}

export interface PureExperimentResult {
  params: PureCoreParams;
  solverSettings: PureCoreSolverSettings;
  finalPsi: ComplexField;
  finalNu: Float64Array;
  finalTick: number;
  ledgerHistory: DriveTickLedgerEntry[];
  observationHistory: TickObservation[];
}

export function runPureExperiment(config: PureExperimentConfig): PureExperimentResult {
  const { params, drive, ticks, observe } = config;
  validatePureCoreParams(params);
  if (!Number.isInteger(ticks) || ticks < 0) {
    throw new Error(`runPureExperiment: ticks must be a non-negative integer, got ${ticks}`);
  }

  const geometry = createTorusGeometry({ R: params.R, r: params.r, N: params.N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha: params.alpha, g: params.g, dt: params.dt });
  const mediumParams: MediumHistoryParams = { kappa: params.kappa, rho: params.rho, nu0: params.nu0 };
  const solverSettings = defaultPureCoreSolverSettings();

  const initialState = createPureFieldState(params, geometry);
  let psi: ComplexField = { real: initialState.real, imag: initialState.imag };
  let nu = initialState.nu;

  const ledgerHistory: DriveTickLedgerEntry[] = [];
  const observationHistory: TickObservation[] = [];

  for (let tick = 0; tick < ticks; tick++) {
    const t = tick * params.dt;
    const tickResult = runMediumHistoryTick(psi, stepper, geometry, params.alpha, params.g, nu, drive, t, params.dt, mediumParams);
    psi = tickResult.psi;
    nu = tickResult.nu;
    ledgerHistory.push(tickResult.ledger);

    if (observe) {
      observationHistory.push({
        tick: tick + 1,
        coherence: computePhaseCoherence(psi, geometry),
        nuFieldEnergyCorrelation: computeNuFieldEnergyCorrelation(nu, psi, geometry),
        vortexCandidates: detectVortexCandidates(psi, geometry),
      });
    }
  }

  return {
    params,
    solverSettings,
    finalPsi: psi,
    finalNu: nu,
    finalTick: ticks,
    ledgerHistory,
    observationHistory,
  };
}
