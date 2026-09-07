/**
 * PUT-IN: a TimescaleSweepConfig (arm A: existing nu(x), varying
 *   kappa/rho) or a GChannelSweepConfig (arm B: the K12 g(x) channel,
 *   nu(x) frozen at kappa=0), per docs/vessel/K12-memory-channel-
 *   preregistration.md
 * EMERGED: whether L2 and L3 (per K11's frozen instruments,
 *   src/pure/observe/vortexCandidates.ts, localization.ts,
 *   vortexTracking.ts) were observed over the run, for one (config,
 *   seed) pair
 * claim-tier: C2 (implemented exactly per the frozen pre-registration;
 *   this module runs whatever config it is given - it does not itself
 *   decide the grid, seed count, or tick budget, all of which are
 *   frozen in the pre-registration doc, not here)
 * floors (誠実な床): measures only L2/L3, per the pre-registration's
 *   own scope (L4/L6 are out of scope this phase). Neither function
 *   uses K5's chi/exchange machinery - arm A and arm B are both
 *   defined purely in terms of psi + nu(x) (+ g(x) for arm B), matching
 *   the plan's own K12 text, which never mentions chi for either arm.
 */

import { createPureFieldState } from '../field/state.ts';
import type { PureCoreParams, LinearSolverKind } from '../params.ts';
import { createTorusGeometry } from '../geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../field/stepConservative.ts';
import type { ComplexField } from '../geometry/torus.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import { runMediumHistoryTick, runGHistoryTick } from '../ledger/energy.ts';
import type { GHistoryParams } from '../medium/gHistory.ts';
import { detectVortexCandidates, vortexPersistenceAtLeast, type VortexCandidate } from '../observe/vortexCandidates.ts';
import { checkLocalization, type LocalizationCheck } from '../observe/localization.ts';
import { trackVortices, evaluateL3 } from '../observe/vortexTracking.ts';

export interface MemoryChannelConditionResult {
  l2Satisfied: boolean;
  maxPersistenceTicks: number;
  l3Satisfied: boolean;
  finalLocalization: LocalizationCheck;
  windingDetectedAnyTick: boolean;
}

function buildDrive(N: number, driveAmplitude: number, driveOmega: number): DriveSpec {
  return { spatialProfile: new Float64Array(N * N).fill(driveAmplitude), omega: driveOmega, phase: 0 };
}

function judge(
  candidateHistory: VortexCandidate[][],
  finalCandidates: VortexCandidate[],
  geometry: ReturnType<typeof createTorusGeometry>,
  tauMin: number,
  maxLocalizedFraction: number,
  maxDisplacementCells: number,
  dt: number,
): MemoryChannelConditionResult {
  const windingDetectedAnyTick = candidateHistory.some((tick) => tick.length > 0);
  const finalLocalization = checkLocalization(finalCandidates, geometry, maxLocalizedFraction);
  const persistenceCheck = vortexPersistenceAtLeast(tauMin)(candidateHistory);
  const l2Satisfied = windingDetectedAnyTick && finalLocalization.localized && persistenceCheck.satisfied;

  const tracks = trackVortices(candidateHistory, geometry, { maxDisplacementCells }, dt);
  const l3Judgments = evaluateL3(tracks);
  const l3Satisfied = l3Judgments.some((j) => j.satisfiesL3);

  return { l2Satisfied, maxPersistenceTicks: persistenceCheck.maxPersistenceTicks, l3Satisfied, finalLocalization, windingDetectedAnyTick };
}

export interface TimescaleSweepConfig {
  N: number;
  alpha: number;
  g: number;
  nu0: number;
  kappa: number;
  rho: number;
  dt: number;
  driveAmplitude: number;
  driveOmega: number;
  totalTicks: number;
  tauMin: number;
  maxLocalizedFraction: number;
  maxDisplacementCells: number;
  seed: number;
  linearSolverKind?: LinearSolverKind;
}

export function runTimescaleSweepCondition(config: TimescaleSweepConfig): MemoryChannelConditionResult {
  const geometry = createTorusGeometry({ R: 3, r: 1, N: config.N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha: config.alpha, g: config.g, dt: config.dt, linearSolverKind: config.linearSolverKind });
  const drive = buildDrive(config.N, config.driveAmplitude, config.driveOmega);
  const mediumParams: MediumHistoryParams = { kappa: config.kappa, rho: config.rho, nu0: config.nu0 };

  const params: PureCoreParams = { R: 3, r: 1, N: config.N, dt: config.dt, alpha: config.alpha, g: config.g, nu0: config.nu0, kappa: config.kappa, rho: config.rho, seed: config.seed };
  const initial = createPureFieldState(params, geometry);
  let psi: ComplexField = { real: initial.real, imag: initial.imag };
  let nu = initial.nu;

  const candidateHistory: VortexCandidate[][] = [];
  for (let tick = 0; tick < config.totalTicks; tick++) {
    const t = tick * config.dt;
    const result = runMediumHistoryTick(psi, stepper, geometry, config.alpha, config.g, nu, drive, t, config.dt, mediumParams);
    psi = result.psi;
    nu = result.nu;
    candidateHistory.push(detectVortexCandidates(psi, geometry));
  }

  const finalCandidates = candidateHistory.length > 0 ? candidateHistory[candidateHistory.length - 1] : [];
  return judge(candidateHistory, finalCandidates, geometry, config.tauMin, config.maxLocalizedFraction, config.maxDisplacementCells, config.dt);
}

export interface GChannelSweepConfig {
  N: number;
  alpha: number;
  nu0: number;
  dt: number;
  driveAmplitude: number;
  driveOmega: number;
  totalTicks: number;
  tauMin: number;
  maxLocalizedFraction: number;
  maxDisplacementCells: number;
  seed: number;
  kappaG: number;
  rhoG: number;
  g0: number;
  g1: number;
  linearSolverKind?: LinearSolverKind;
}

/** Arm B: nu(x) frozen at nu0 (kappa=0) per docs/vessel/K12-memory-channel-preregistration.md; g(x) evolves per kappaG/rhoG/g0/g1. kappaG=0 (with g1 unused) is the B-control condition (g stays uniform g0 forever). */
export function runGChannelSweepCondition(config: GChannelSweepConfig): MemoryChannelConditionResult {
  const geometry = createTorusGeometry({ R: 3, r: 1, N: config.N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha: config.alpha, g: config.g0, dt: config.dt, linearSolverKind: config.linearSolverKind });
  const drive = buildDrive(config.N, config.driveAmplitude, config.driveOmega);
  const mediumParams: MediumHistoryParams = { kappa: 0, rho: 0, nu0: config.nu0 };
  const gHistoryParams: GHistoryParams = { kappaG: config.kappaG, rhoG: config.rhoG, g0: config.g0, g1: config.g1 };

  const params: PureCoreParams = { R: 3, r: 1, N: config.N, dt: config.dt, alpha: config.alpha, g: config.g0, nu0: config.nu0, kappa: 0, rho: 0, seed: config.seed };
  const initial = createPureFieldState(params, geometry);
  let psi: ComplexField = { real: initial.real, imag: initial.imag };
  let nu: Float64Array = initial.nu;
  let gField: Float64Array = new Float64Array(config.N * config.N).fill(config.g0);

  const candidateHistory: VortexCandidate[][] = [];
  for (let tick = 0; tick < config.totalTicks; tick++) {
    const t = tick * config.dt;
    const result = runGHistoryTick(psi, stepper, geometry, config.alpha, gField, nu, drive, t, config.dt, mediumParams, gHistoryParams);
    psi = result.psi;
    nu = result.nu;
    gField = result.gField;
    candidateHistory.push(detectVortexCandidates(psi, geometry));
  }

  const finalCandidates = candidateHistory.length > 0 ? candidateHistory[candidateHistory.length - 1] : [];
  return judge(candidateHistory, finalCandidates, geometry, config.tauMin, config.maxLocalizedFraction, config.maxDisplacementCells, config.dt);
}
