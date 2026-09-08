/**
 * K13 version of src/pure/emergence/selfSustainingClosure.ts: the same
 * L6 protocol (build up structure under drive, cut the world's ONLY
 * external energy port, see whether the structure indicator outlasts
 * the baseline dissipation time 1/nu0), but using K13's real 2D world
 * chi + distributed boundary (runWorldTick) instead of K5's single-cell
 * ring. Per docs/vessel/K-series-II-brain-and-universe-plan.md K14's
 * "K9〜K13を揃えた器で" instruction.
 *
 * PUT-IN / EMERGED / claim-tier / floors: identical to
 * selfSustainingClosure.ts's own module doc, with "chi" now meaning
 * K13's real 2D field. The one floor worth restating: per K13's
 * constitution, psi has no drive parameter to cut in the first place -
 * "stopping the world's external energy inflow" means forcing CHI's
 * drive amplitude to zero (the only external port in the K13
 * architecture, exactly as K5's own version cut psi's drive being the
 * only port THERE).
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { DriveSpec } from '../drive/drive.ts';
import { createWorldField, createWorldInitialState, type WorldFieldConfig } from '../world/worldField.ts';
import { selectDistributedBoundary, type DistributedBoundaryPair } from '../world/distributedBoundary.ts';
import { runWorldTick } from '../world/worldTick.ts';
import { findDensityBlobs, evaluateContrast } from '../observe/densityContrast.ts';
import type { TorusGeometry } from '../geometry/torus.ts';

export interface WorldSelfSustainingClosureConfig {
  psiConfig: WorldFieldConfig;
  chiConfig: WorldFieldConfig;
  k: number;
  lambda: number;
  driveAmplitude: number;
  driveOmega: number;
  driveTicks: number;
  postDriveTicks: number;
  relativeDeviation: number;
  structureThreshold: number;
}

export interface WorldSelfSustainingClosureResult {
  indicatorHistory: number[];
  dissipationTimeTicks: number;
  survivalTicksPastDriveOff: number;
  censored: boolean;
  satisfiesL6: boolean;
}

function structureIndicator(psi: ComplexField, geometry: TorusGeometry, relativeDeviation: number): number {
  const blobs = findDensityBlobs(psi, geometry, relativeDeviation);
  if (blobs.length === 0) return 0;
  const largest = blobs.reduce((a, b) => (b.cellIndices.length > a.cellIndices.length ? b : a));
  return evaluateContrast(largest, blobs, psi, geometry, 0).contrastRatio;
}

export function runWorldSelfSustainingClosureProtocol(config: WorldSelfSustainingClosureConfig): WorldSelfSustainingClosureResult {
  if (!Number.isInteger(config.driveTicks) || config.driveTicks < 1) {
    throw new Error(`runWorldSelfSustainingClosureProtocol: driveTicks must be a positive integer, got ${config.driveTicks}`);
  }
  if (!Number.isInteger(config.postDriveTicks) || config.postDriveTicks < 1) {
    throw new Error(`runWorldSelfSustainingClosureProtocol: postDriveTicks must be a positive integer, got ${config.postDriveTicks}`);
  }
  const nu0 = config.psiConfig.params.nu0;
  if (!(Number.isFinite(nu0) && nu0 > 0)) {
    throw new Error(`runWorldSelfSustainingClosureProtocol: psiConfig.params.nu0 must be a finite positive number, got ${nu0}`);
  }

  const psiWorld = createWorldField(config.psiConfig);
  const chiWorld = createWorldField(config.chiConfig);
  const pairs: DistributedBoundaryPair[] = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, config.k);

  const size = psiWorld.params.N * psiWorld.params.N;
  const driveOn: DriveSpec = { spatialProfile: new Float64Array(size).fill(config.driveAmplitude), omega: config.driveOmega, phase: 0 };
  const driveOff: DriveSpec = { spatialProfile: new Float64Array(size), omega: config.driveOmega, phase: 0 };

  const psiInitial = createWorldInitialState(psiWorld);
  const chiInitial = createWorldInitialState(chiWorld);
  let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
  let psiNu = psiInitial.nu;
  let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
  let chiNu = chiInitial.nu;

  const indicatorHistory: number[] = [];
  const dt = psiWorld.params.dt;

  const stepOnce = (tick: number, drive: DriveSpec): void => {
    const t = tick * dt;
    const result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, drive, t, dt, pairs, config.lambda);
    psi = result.psi;
    psiNu = result.psiNu;
    chi = result.chi;
    chiNu = result.chiNu;
    indicatorHistory.push(structureIndicator(psi, psiWorld.geometry, config.relativeDeviation));
  };

  for (let tick = 0; tick < config.driveTicks; tick++) {
    stepOnce(tick, driveOn);
  }
  for (let i = 0; i < config.postDriveTicks; i++) {
    stepOnce(config.driveTicks + i, driveOff);
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

  const dissipationTimeTicks = 1 / nu0 / dt;
  const satisfiesL6 = survivalTicksPastDriveOff > dissipationTimeTicks;

  return { indicatorHistory, dissipationTimeTicks, survivalTicksPastDriveOff, censored, satisfiesL6 };
}
