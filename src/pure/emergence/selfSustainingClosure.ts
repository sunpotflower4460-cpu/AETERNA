/**
 * This module lives in src/pure/emergence/ (alongside
 * naturalEmergenceStudy.ts and perturbationRecovery.ts), not
 * src/pure/observe/: it orchestrates its own closed-loop run rather
 * than being a read-only instrument.
 *
 * PUT-IN: a SelfSustainingClosureConfig - a full K5 closed-loop
 *   scenario, a driveTicks phase (build up structure under the normal
 *   external drive), a postDriveTicks phase (continue with the drive
 *   forced to zero), and a density-contrast structureThreshold
 * EMERGED: the structure indicator (src/pure/observe/densityContrast.ts's
 *   largest-blob contrast ratio) recorded tick-by-tick across both
 *   phases, and whether it stayed above structureThreshold for LONGER
 *   than the baseline dissipation time 1/nu0 after the drive was cut -
 *   this is docs/vessel/K-series-II-brain-and-universe-plan.md K11's
 *   explicit, OBSERVATIONAL (not implementational) definition of
 *   Aeterna-Genesis L6 "自己維持閉環" (self-sustaining closure): "長時間
 *   走行後に世界へのエネルギー流入を止め、構造指標が散逸時間 1/ν₀ を
 *   超えて持続するか (load-bearing closure の最小版)"
 * claim-tier: C2 (implemented; this is a measurement PROCEDURE - it
 *   answers "did THIS run's structure outlast its own baseline
 *   dissipation time once cut off from the world," not yet a claim
 *   that AETERNA's own dynamics exhibit self-sustaining closure.
 *   K12/K13/K14 supply the actual configs and results.)
 * floors (誠実な床):
 *   - "世界へのエネルギー流入を止める" is operationalized as replacing
 *     the DriveSpec's amplitude with exactly zero for postDriveTicks -
 *     in the CURRENT K5 architecture, the DriveSpec (into psi) is the
 *     ONLY external energy port on the whole psi+chi closed system
 *     (chi has no drive of its own, only its own dissipation and the
 *     exchange coupling with psi - see exchangeLedger.ts). Cutting
 *     psi's drive is therefore exactly "stopping the world's external
 *     energy inflow," not an approximation of it.
 *   - This is the MINIMAL version of load-bearing closure the plan
 *     itself names: it checks persistence past the drive cutoff, not
 *     that breaking a specific emergent relation collapses the whole
 *     structure (Genesis's fuller L6 judgment,
 *     `emergent_relations_identified AND breaking_one_collapses_whole
 *     AND no_external_oracle`). Genesis's own L6 section explicitly
 *     allows this narrower framing ("最小版").
 *   - `dissipationTimeTicks` = (1/nu0)/dt requires nu0 > 0; this
 *     function throws for nu0 <= 0, since "outlasting the dissipation
 *     time" is not a well-posed comparison when there is no baseline
 *     dissipation to outlast.
 *   - `survivalTicksPastDriveOff` counts CONSECUTIVE ticks, starting
 *     immediately after the drive is cut, that the indicator stays
 *     >= structureThreshold; it stops counting at the first tick that
 *     falls below threshold. If the indicator never drops below
 *     threshold before postDriveTicks runs out, `censored` is true and
 *     survivalTicksPastDriveOff equals postDriveTicks EXACTLY - this
 *     is a right-censored observation (the true survival time is
 *     UNKNOWN and could be longer), not a measured value, and callers
 *     must not treat a censored result as "confirmed persistence
 *     forever." satisfiesL6 is still computed from the (possibly
 *     censored) count, since "at least this long, possibly longer" is
 *     already sufficient to exceed a threshold, even though it cannot
 *     confirm an upper bound.
 *   - Reuses exactly the same closed-loop setup pattern as
 *     naturalEmergenceStudy.ts / perturbationRecovery.ts
 *     (createTorusGeometry + createLaplaceBeltramiOperator +
 *     createConservativeStepper + createExchangeRingGeometry +
 *     createRingLaplacian + createExchangeCouplingConfig +
 *     runFullClosedLoopTick) - no new dynamics are introduced here.
 */

import { createPureFieldState } from '../field/state.ts';
import type { PureCoreParams, LinearSolverKind } from '../params.ts';
import { createTorusGeometry, type ComplexField } from '../geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../field/stepConservative.ts';
import { createExchangeRingGeometry } from '../exchange/ringGeometry.ts';
import { createRingLaplacian } from '../exchange/ringLaplacian.ts';
import { selectExchangeBoundaryCell, createExchangeCouplingConfig } from '../exchange/boundary.ts';
import { runFullClosedLoopTick } from '../exchange/exchangeLedger.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import { findDensityBlobs, evaluateContrast } from '../observe/densityContrast.ts';

export interface SelfSustainingClosureConfig {
  N: number;
  alpha: number;
  g: number;
  nu0: number;
  kappa: number;
  rho: number;
  dt: number;
  M: number;
  shiftCellsPerTick: number;
  lambda: number;
  driveAmplitude: number;
  driveOmega: number;
  seed: number;
  /** Ticks to run WITH the normal external drive, to build up structure before cutoff. */
  driveTicks: number;
  /** Ticks to run AFTER the drive is forced to zero, to observe persistence. */
  postDriveTicks: number;
  relativeDeviation: number;
  /** Contrast ratio a structure must meet or exceed to count as "present" that tick. */
  structureThreshold: number;
  linearSolverKind?: LinearSolverKind;
}

export interface SelfSustainingClosureResult {
  /** Structure indicator per tick, in order: driveTicks entries, then postDriveTicks entries (drive off). */
  indicatorHistory: number[];
  dissipationTimeTicks: number;
  survivalTicksPastDriveOff: number;
  /** true if survivalTicksPastDriveOff hit postDriveTicks exactly - the true survival time is unknown and could be longer; NOT a confirmed measurement of exactly that duration. */
  censored: boolean;
  satisfiesL6: boolean;
}

function structureIndicator(psi: ComplexField, geometry: ReturnType<typeof createTorusGeometry>, relativeDeviation: number): number {
  const blobs = findDensityBlobs(psi, geometry, relativeDeviation);
  if (blobs.length === 0) return 0;
  const largest = blobs.reduce((a, b) => (b.cellIndices.length > a.cellIndices.length ? b : a));
  return evaluateContrast(largest, blobs, psi, geometry, 0).contrastRatio;
}

export function runSelfSustainingClosureProtocol(config: SelfSustainingClosureConfig): SelfSustainingClosureResult {
  if (!Number.isInteger(config.driveTicks) || config.driveTicks < 1) {
    throw new Error(`runSelfSustainingClosureProtocol: driveTicks must be a positive integer, got ${config.driveTicks}`);
  }
  if (!Number.isInteger(config.postDriveTicks) || config.postDriveTicks < 1) {
    throw new Error(`runSelfSustainingClosureProtocol: postDriveTicks must be a positive integer, got ${config.postDriveTicks}`);
  }
  if (!(Number.isFinite(config.nu0) && config.nu0 > 0)) {
    throw new Error(`runSelfSustainingClosureProtocol: nu0 must be a finite positive number (dissipation time 1/nu0 is undefined otherwise), got ${config.nu0}`);
  }

  const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: config.N });
  const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
  const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha: config.alpha, g: config.g, dt: config.dt, linearSolverKind: config.linearSolverKind });
  const size = config.N * config.N;
  const driveOn: DriveSpec = { spatialProfile: new Float64Array(size).fill(config.driveAmplitude), omega: config.driveOmega, phase: 0 };
  const driveOff: DriveSpec = { spatialProfile: new Float64Array(size), omega: config.driveOmega, phase: 0 };
  const mediumParams: MediumHistoryParams = { kappa: config.kappa, rho: config.rho, nu0: config.nu0 };

  const params: PureCoreParams = { R: 3, r: 1, N: config.N, dt: config.dt, alpha: config.alpha, g: config.g, nu0: config.nu0, kappa: config.kappa, rho: config.rho, seed: config.seed };
  const initial = createPureFieldState(params, psiGeometry);
  let psi: ComplexField = { real: initial.real, imag: initial.imag };
  let nu: Float64Array = Float64Array.from({ length: size }, () => config.nu0);

  const boundaryCellIndex = selectExchangeBoundaryCell(psiGeometry, 0);
  const chiGeometry = createExchangeRingGeometry(config.M, psiGeometry.cellArea[boundaryCellIndex]);
  const chiOperator = createRingLaplacian(chiGeometry);
  const nuChi = new Float64Array(config.M);
  const couplingConfig = createExchangeCouplingConfig(psiGeometry, chiGeometry, config.lambda);
  let chi: ComplexField = { real: new Float64Array(config.M), imag: new Float64Array(config.M) };

  const indicatorHistory: number[] = [];

  const stepOnce = (tick: number, drive: DriveSpec): void => {
    const t = tick * config.dt;
    const result = runFullClosedLoopTick(
      psi, stepper, psiGeometry, config.alpha, config.g, nu, drive, t, config.dt,
      chi, chiOperator, chiGeometry, 1, config.shiftCellsPerTick, nuChi, couplingConfig, mediumParams,
    );
    psi = result.psi;
    nu = result.nu;
    chi = result.chi;
    indicatorHistory.push(structureIndicator(psi, psiGeometry, config.relativeDeviation));
  };

  for (let tick = 0; tick < config.driveTicks; tick++) {
    stepOnce(tick, driveOn);
  }
  for (let k = 0; k < config.postDriveTicks; k++) {
    stepOnce(config.driveTicks + k, driveOff);
  }

  const postDriveIndicators = indicatorHistory.slice(config.driveTicks);
  let survivalTicksPastDriveOff = 0;
  for (const value of postDriveIndicators) {
    if (value >= config.structureThreshold) {
      survivalTicksPastDriveOff++;
    } else {
      break;
    }
  }
  const censored = survivalTicksPastDriveOff === config.postDriveTicks;

  const dissipationTimeTicks = 1 / config.nu0 / config.dt;
  const satisfiesL6 = survivalTicksPastDriveOff > dissipationTimeTicks;

  return { indicatorHistory, dissipationTimeTicks, survivalTicksPastDriveOff, censored, satisfiesL6 };
}
