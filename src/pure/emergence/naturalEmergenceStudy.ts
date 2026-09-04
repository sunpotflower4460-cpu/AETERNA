/**
 * PUT-IN: a NaturalEmergenceConfig (per docs/vessel/K7-natural-
 *   emergence-preregistration.md's frozen values) and a seed
 * EMERGED: whether L2 (per Aeterna-Genesis/docs/EMERGENCE_LEVELS.md,
 *   operationalized in the pre-registration) was observed over a long,
 *   naturally-driven run, in either the minimal (condition 1: nu
 *   frozen, no chi) or full (condition 2: medium history + exchange
 *   coupling) configuration
 * claim-tier: C2 (implemented exactly per the frozen pre-registration;
 *   see src/tests/pure/naturalEmergenceStudy.test.ts for small-scale
 *   orchestration/determinism checks, and
 *   src/tests/pure/naturalEmergenceFrozenFinding.test.ts for the
 *   actual, once-run, pinned result at the full frozen scale)
 * floors (誠実な床): this only tests L2. L3 (motion tracking) and L4
 *   (inside/outside contrast, perturbation recovery) need instruments
 *   this module does not build - see the pre-registration's own
 *   "誠実な限界" section.
 *
 * docs/vessel/K7-natural-emergence-preregistration.md の凍結内容を
 * そのまま実装する。
 */

import { createPureFieldState } from '../field/state.ts';
import type { PureCoreParams } from '../params.ts';
import { createTorusGeometry, type ComplexField } from '../geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../field/stepConservative.ts';
import { createExchangeRingGeometry } from '../exchange/ringGeometry.ts';
import { createRingLaplacian } from '../exchange/ringLaplacian.ts';
import { selectExchangeBoundaryCell, createExchangeCouplingConfig } from '../exchange/boundary.ts';
import { runFullClosedLoopTick } from '../exchange/exchangeLedger.ts';
import { runDriveTick } from '../ledger/energy.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import { detectVortexCandidates, vortexPersistenceAtLeast, type VortexCandidate } from '../observe/vortexCandidates.ts';
import { checkLocalization, type LocalizationCheck } from '../observe/localization.ts';

export interface NaturalEmergenceConfig {
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
  useChi: boolean;
  M?: number;
  shiftCellsPerTick?: number;
  lambda?: number;
}

export interface NaturalEmergenceResult {
  l2Satisfied: boolean;
  windingDetectedAnyTick: boolean;
  maxPersistenceTicks: number;
  finalLocalization: LocalizationCheck;
}

function buildUniformDrive(config: NaturalEmergenceConfig, size: number): DriveSpec {
  return {
    spatialProfile: new Float64Array(size).fill(config.driveAmplitude),
    omega: config.driveOmega,
    phase: 0,
  };
}

export function runNaturalEmergenceCondition(config: NaturalEmergenceConfig, seed: number): NaturalEmergenceResult {
  const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: config.N });
  const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
  const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha: config.alpha, g: config.g, dt: config.dt });
  const size = config.N * config.N;
  const drive = buildUniformDrive(config, size);
  const mediumParams: MediumHistoryParams = { kappa: config.kappa, rho: config.rho, nu0: config.nu0 };

  const params: PureCoreParams = { R: 3, r: 1, N: config.N, dt: config.dt, alpha: config.alpha, g: config.g, nu0: config.nu0, kappa: config.kappa, rho: config.rho, seed };
  const state = createPureFieldState(params, psiGeometry);
  let psi: ComplexField = { real: state.real, imag: state.imag };
  let nu: Float64Array = Float64Array.from({ length: size }, () => config.nu0);

  let chi: ComplexField | null = null;
  let chiOperator: ReturnType<typeof createRingLaplacian> | null = null;
  let chiGeometry: ReturnType<typeof createExchangeRingGeometry> | null = null;
  let nuChi: Float64Array | null = null;
  let couplingConfig: ReturnType<typeof createExchangeCouplingConfig> | null = null;

  if (config.useChi) {
    const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
    chiGeometry = createExchangeRingGeometry(config.M!, psiGeometry.cellArea[boundaryCellIndex]);
    chiOperator = createRingLaplacian(chiGeometry);
    nuChi = new Float64Array(config.M!);
    couplingConfig = createExchangeCouplingConfig(psiGeometry, chiGeometry, config.lambda!);
    chi = { real: new Float64Array(config.M!), imag: new Float64Array(config.M!) };
  }

  const candidateHistory: VortexCandidate[][] = [];
  let windingDetectedAnyTick = false;
  let finalCandidates: VortexCandidate[] = [];

  for (let tick = 0; tick < config.totalTicks; tick++) {
    const t = tick * config.dt;

    if (config.useChi) {
      const result = runFullClosedLoopTick(
        psi, stepper, psiGeometry, config.alpha, config.g, nu, drive, t, config.dt,
        chi!, chiOperator!, chiGeometry!, 1, config.shiftCellsPerTick!, nuChi!, couplingConfig!, mediumParams,
      );
      psi = result.psi;
      nu = result.nu;
      chi = result.chi;
    } else if (config.kappa === 0 && config.rho === 0) {
      const result = runDriveTick(psi, stepper, psiGeometry, config.alpha, config.g, nu, drive, t, config.dt);
      psi = result.psi;
    } else {
      throw new Error('runNaturalEmergenceCondition: non-degenerate medium history without chi is not a pre-registered condition');
    }

    const candidates = detectVortexCandidates(psi, psiGeometry);
    candidateHistory.push(candidates);
    if (candidates.length > 0) windingDetectedAnyTick = true;
    finalCandidates = candidates;
  }

  const persistenceCheck = vortexPersistenceAtLeast(config.tauMin)(candidateHistory);
  const localizationCheck = checkLocalization(finalCandidates, psiGeometry, config.maxLocalizedFraction);

  const l2Satisfied = windingDetectedAnyTick && localizationCheck.localized && persistenceCheck.satisfied;

  return {
    l2Satisfied,
    windingDetectedAnyTick,
    maxPersistenceTicks: persistenceCheck.maxPersistenceTicks,
    finalLocalization: localizationCheck,
  };
}

export interface NaturalEmergenceStudyResult {
  seed: number;
  result: NaturalEmergenceResult;
}

export function runNaturalEmergenceStudy(config: NaturalEmergenceConfig, seeds: readonly number[]): NaturalEmergenceStudyResult[] {
  return seeds.map((seed) => ({ seed, result: runNaturalEmergenceCondition(config, seed) }));
}
