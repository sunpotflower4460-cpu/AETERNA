/**
 * PUT-IN: a ReafferenceExperimentConfig and a seed
 * EMERGED: condition A (self-echo through chi) or condition B (external
 *   control drive, energy-calibrated) run to the pre-registered
 *   observation tick, yielding boundaryDensity and globalCoherence
 * claim-tier: C2 (implemented exactly per docs/vessel/K6-reafference-
 *   preregistration.md, which was written and committed before any
 *   condition-A-vs-B run; unit-validated for determinism and internal
 *   consistency in src/tests/pure/reafferenceConditions.test.ts)
 * floors (誠実な床): chi has zero dissipation and alpha_chi is
 *   irrelevant to its dynamics (the conservative step is the exact
 *   shift regardless) - kept simple per the pre-registration's "chi
 *   medium history deferred" scope. The calibration in calibration.ts
 *   that condition B depends on is a single-shot LINEAR approximation,
 *   not an exact energy match - see that file's floors.
 *
 * docs/vessel/K6-reafference-preregistration.md の凍結内容をそのまま
 * 実装する。設計変更が必要になった場合は、まずその文書を更新してから
 * ここを変更する（結果を見てからの調整を避けるため）。
 */

import { createPureFieldState } from '../field/state.ts';
import type { PureCoreParams } from '../params.ts';
import { createTorusGeometry, type ComplexField, type TorusGeometry } from '../geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../field/stepConservative.ts';
import { createExchangeRingGeometry } from '../exchange/ringGeometry.ts';
import { createRingLaplacian } from '../exchange/ringLaplacian.ts';
import { selectExchangeBoundaryCell, createExchangeCouplingConfig } from '../exchange/boundary.ts';
import { runFullClosedLoopTick } from '../exchange/exchangeLedger.ts';
import { runMediumHistoryTick } from '../ledger/energy.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import type { DriveSpec } from '../drive/drive.ts';
import { computePhaseCoherence } from '../observe/coherence.ts';
import { detectVortexCandidates, type VortexCandidate } from '../observe/vortexCandidates.ts';

export interface ReafferenceExperimentConfig {
  N: number;
  M: number;
  shiftCellsPerTick: number;
  alpha: number;
  g: number;
  nu0: number;
  kappa: number;
  rho: number;
  lambda: number;
  dt: number;
  shoutAmplitude: number;
  shoutOmega: number;
  shoutPhase: number;
  shoutTicks: number;
  windowHalfWidth: number;
  observeAfterTicks: number;
}

export interface ReturnWindow {
  roundTripTicks: number;
  start: number;
  end: number;
  observationTick: number;
}

export function computeReturnWindow(config: ReafferenceExperimentConfig): ReturnWindow {
  const roundTripTicks = config.M / config.shiftCellsPerTick;
  if (!Number.isInteger(roundTripTicks) || roundTripTicks <= 0) {
    throw new Error(`computeReturnWindow: M/shiftCellsPerTick must be a positive integer, got ${roundTripTicks}`);
  }
  const start = Math.max(0, roundTripTicks - config.windowHalfWidth);
  const end = roundTripTicks + config.windowHalfWidth;
  const observationTick = end + config.observeAfterTicks;
  return { roundTripTicks, start, end, observationTick };
}

function buildPsiParams(config: ReafferenceExperimentConfig, seed: number): PureCoreParams {
  return {
    R: 3,
    r: 1,
    N: config.N,
    dt: config.dt,
    alpha: config.alpha,
    g: config.g,
    nu0: config.nu0,
    kappa: config.kappa,
    rho: config.rho,
    seed,
  };
}

function zeroDrive(size: number): DriveSpec {
  return { spatialProfile: new Float64Array(size), omega: 0, phase: 0 };
}

function buildShoutDrive(config: ReafferenceExperimentConfig, boundaryCellIndex: number, size: number): DriveSpec {
  const spatialProfile = new Float64Array(size);
  spatialProfile[boundaryCellIndex] = config.shoutAmplitude;
  return { spatialProfile, omega: config.shoutOmega, phase: config.shoutPhase };
}

function buildControlDrive(config: ReafferenceExperimentConfig, boundaryCellIndex: number, size: number, amplitude: number): DriveSpec {
  const spatialProfile = new Float64Array(size);
  spatialProfile[boundaryCellIndex] = amplitude;
  return { spatialProfile, omega: config.shoutOmega, phase: config.shoutPhase };
}

export interface ExperimentSetup {
  psiGeometry: TorusGeometry;
  boundaryCellIndex: number;
  chiGeometryM: number;
  window: ReturnWindow;
}

function setup(config: ReafferenceExperimentConfig): ExperimentSetup {
  const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: config.N });
  const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
  const window = computeReturnWindow(config);
  return { psiGeometry, boundaryCellIndex, chiGeometryM: config.M, window };
}

export interface ConditionAResult {
  boundaryDensity: number;
  globalCoherence: number;
  exchangeWorkNPsiTrajectory: number[];
  vortexCandidateHistory: VortexCandidate[][];
}

/** Condition A: self-echo. chi starts at zero and receives energy only through the coupling during the shared shout - never synthetically pre-seeded. */
export function runConditionA(config: ReafferenceExperimentConfig, seed: number): ConditionAResult {
  const { psiGeometry, boundaryCellIndex, window } = setup(config);
  const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
  const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha: config.alpha, g: config.g, dt: config.dt });
  const size = config.N * config.N;
  const nu = Float64Array.from({ length: size }, () => config.nu0);
  const mediumParams: MediumHistoryParams = { kappa: config.kappa, rho: config.rho, nu0: config.nu0 };

  const chiGeometry = createExchangeRingGeometry(config.M, psiGeometry.cellArea[boundaryCellIndex]);
  const chiOperator = createRingLaplacian(chiGeometry);
  const nuChi = new Float64Array(config.M);
  const couplingConfig = createExchangeCouplingConfig(psiGeometry, chiGeometry, config.lambda);

  const shoutDrive = buildShoutDrive(config, boundaryCellIndex, size);
  const noDrive = zeroDrive(size);

  const state = createPureFieldState(buildPsiParams(config, seed), psiGeometry);
  let psi: ComplexField = { real: state.real, imag: state.imag };
  let nuState: Float64Array = nu;
  let chi: ComplexField = { real: new Float64Array(config.M), imag: new Float64Array(config.M) };

  const exchangeWorkNPsiTrajectory: number[] = [];
  const vortexCandidateHistory: VortexCandidate[][] = [];

  for (let tick = 0; tick < window.observationTick; tick++) {
    const t = tick * config.dt;
    const drive = tick < config.shoutTicks ? shoutDrive : noDrive;
    const result = runFullClosedLoopTick(
      psi, stepper, psiGeometry, config.alpha, config.g, nuState, drive, t, config.dt,
      chi, chiOperator, chiGeometry, 1, config.shiftCellsPerTick, nuChi, couplingConfig, mediumParams,
    );
    psi = result.psi;
    nuState = result.nu;
    chi = result.chi;
    exchangeWorkNPsiTrajectory.push(result.ledger.exchangeWorkNPsi);
    vortexCandidateHistory.push(detectVortexCandidates(psi, psiGeometry));
  }

  const boundaryDensity = (psi.real[boundaryCellIndex] ** 2 + psi.imag[boundaryCellIndex] ** 2) * psiGeometry.cellArea[boundaryCellIndex];
  const globalCoherence = computePhaseCoherence(psi, psiGeometry);

  return { boundaryDensity, globalCoherence, exchangeWorkNPsiTrajectory, vortexCandidateHistory };
}

export interface ConditionBResult {
  boundaryDensity: number;
  globalCoherence: number;
  controlDriveWorkNTrajectory: number[];
}

/** Condition B: lambda=0 (no chi coupling at all), plus a calibrated external control drive active only during the return window. */
export function runConditionB(config: ReafferenceExperimentConfig, seed: number, controlAmplitude: number): ConditionBResult {
  const { psiGeometry, boundaryCellIndex, window } = setup(config);
  const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
  const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha: config.alpha, g: config.g, dt: config.dt });
  const size = config.N * config.N;
  const nu = Float64Array.from({ length: size }, () => config.nu0);
  const mediumParams: MediumHistoryParams = { kappa: config.kappa, rho: config.rho, nu0: config.nu0 };

  const shoutDrive = buildShoutDrive(config, boundaryCellIndex, size);
  const noDrive = zeroDrive(size);
  const controlDrive = buildControlDrive(config, boundaryCellIndex, size, controlAmplitude);

  const state = createPureFieldState(buildPsiParams(config, seed), psiGeometry);
  let psi: ComplexField = { real: state.real, imag: state.imag };
  let nuState: Float64Array = nu;

  const controlDriveWorkNTrajectory: number[] = [];

  for (let tick = 0; tick < window.observationTick; tick++) {
    const t = tick * config.dt;
    const inShout = tick < config.shoutTicks;
    const inReturnWindow = tick >= window.start && tick <= window.end;
    const drive = inShout ? shoutDrive : inReturnWindow ? controlDrive : noDrive;
    const result = runMediumHistoryTick(psi, stepper, psiGeometry, config.alpha, config.g, nuState, drive, t, config.dt, mediumParams);
    psi = result.psi;
    nuState = result.nu;
    if (inReturnWindow) controlDriveWorkNTrajectory.push(result.ledger.driveWorkN);
  }

  const boundaryDensity = (psi.real[boundaryCellIndex] ** 2 + psi.imag[boundaryCellIndex] ** 2) * psiGeometry.cellArea[boundaryCellIndex];
  const globalCoherence = computePhaseCoherence(psi, psiGeometry);

  return { boundaryDensity, globalCoherence, controlDriveWorkNTrajectory };
}
