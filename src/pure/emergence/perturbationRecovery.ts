/**
 * This module lives in src/pure/emergence/ (alongside
 * naturalEmergenceStudy.ts), not src/pure/observe/: unlike the read-only
 * instruments in observe/, it ORCHESTRATES its own closed-loop run
 * (builds geometry/steppers, calls runFullClosedLoopTick) and applies a
 * one-tick procedural perturbation, so it is a run/experiment module
 * that USES observe/'s instruments, not one of them.
 *
 * PUT-IN: a PerturbationRecoveryConfig (a full K5 closed-loop scenario,
 *   plus baselineTicks, a single pre-registered pulse amplitude and
 *   target cell, a measurement window, and a recovery tolerance)
 * EMERGED: the density-contrast structure indicator (src/pure/observe/
 *   densityContrast.ts) recorded tick-by-tick across baseline -> pulse
 *   -> measurement window, and whether it returned within tolerance of
 *   its pre-pulse baseline - the "recovers_after_perturbation"
 *   ingredient of Aeterna-Genesis L4, per docs/vessel/K-series-II-
 *   brain-and-universe-plan.md K11
 * claim-tier: C2 (implemented; this is a measurement PROCEDURE - it
 *   answers "did the run's structure indicator recover" for whatever
 *   run it is given, not yet a claim that AETERNA's own dynamics
 *   exhibit recovery. K12/K13/K14 supply the actual configs and
 *   results.)
 * floors (誠実な床):
 *   - The pulse is delivered by directly adding pulseAmplitude to
 *     chi.real AT chi's own exchange PORT CELL (index 0 - see
 *     src/pure/exchange/boundary.ts's createExchangeCouplingConfig,
 *     which always uses portCellIndex=0), immediately before that
 *     tick's ordinary closed-loop step runs. This is a one-time,
 *     external, PROCEDURAL input into the world chi - never into psi
 *     directly - matching K11's explicit instruction ("世界χ経由での
 *     み"). It is not part of chi's own free dynamics or the exchange
 *     coupling's algebra; it is this test procedure reaching in once,
 *     the same way an experimenter would tap the side of a physical
 *     apparatus.
 *   - The "structure indicator" is the CONTRAST RATIO of the largest
 *     density blob detected each tick (0 if no blob is detected that
 *     tick) - a single scalar chosen for this procedure's need for a
 *     continuously-comparable before/after number, not a general-
 *     purpose replacement for evaluateL4Structural's fuller per-track
 *     bookkeeping.
 *   - "Recovered" compares the mean indicator over the last few
 *     baseline ticks against the mean over the last few measurement-
 *     window ticks, within recoveryTolerance (relative to the baseline
 *     magnitude, floored to avoid dividing by ~0). Both the number of
 *     ticks averaged (5, or fewer if the window is shorter) and
 *     recoveryTolerance are PRE-REGISTERED by the caller's config, not
 *     tuned after seeing a result.
 *   - Reuses exactly docs/vessel/K7-natural-emergence-preregistration.md's
 *     / naturalEmergenceStudy.ts's closed-loop setup pattern
 *     (createTorusGeometry + createLaplaceBeltramiOperator +
 *     createConservativeStepper + createExchangeRingGeometry +
 *     createRingLaplacian + createExchangeCouplingConfig +
 *     runFullClosedLoopTick) - no new dynamics are introduced here
 *     beyond the one-tick procedural chi bump described above.
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

export interface PerturbationRecoveryConfig {
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
  baselineTicks: number;
  pulseAmplitude: number;
  measurementWindowTicks: number;
  relativeDeviation: number;
  recoveryTolerance: number;
  linearSolverKind?: LinearSolverKind;
}

export interface PerturbationRecoveryResult {
  /** Structure indicator per tick, in order: baselineTicks entries, then the pulse tick, then measurementWindowTicks entries. */
  indicatorHistory: number[];
  baselineIndicator: number;
  postWindowIndicator: number;
  recovered: boolean;
}

function structureIndicator(psi: ComplexField, geometry: ReturnType<typeof createTorusGeometry>, relativeDeviation: number): number {
  const blobs = findDensityBlobs(psi, geometry, relativeDeviation);
  if (blobs.length === 0) return 0;
  const largest = blobs.reduce((a, b) => (b.cellIndices.length > a.cellIndices.length ? b : a));
  return evaluateContrast(largest, blobs, psi, geometry, 0).contrastRatio;
}

export function runPerturbationRecoveryProtocol(config: PerturbationRecoveryConfig): PerturbationRecoveryResult {
  if (!Number.isInteger(config.baselineTicks) || config.baselineTicks < 1) {
    throw new Error(`runPerturbationRecoveryProtocol: baselineTicks must be a positive integer, got ${config.baselineTicks}`);
  }
  if (!Number.isInteger(config.measurementWindowTicks) || config.measurementWindowTicks < 1) {
    throw new Error(`runPerturbationRecoveryProtocol: measurementWindowTicks must be a positive integer, got ${config.measurementWindowTicks}`);
  }

  const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: config.N });
  const psiOperator = createLaplaceBeltramiOperator(psiGeometry);
  const stepper = createConservativeStepper(psiOperator, psiGeometry, { alpha: config.alpha, g: config.g, dt: config.dt, linearSolverKind: config.linearSolverKind });
  const size = config.N * config.N;
  const drive: DriveSpec = { spatialProfile: new Float64Array(size).fill(config.driveAmplitude), omega: config.driveOmega, phase: 0 };
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

  const stepOnce = (tick: number): void => {
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

  for (let tick = 0; tick < config.baselineTicks; tick++) {
    stepOnce(tick);
  }

  // The single pre-registered pulse: a one-time procedural addition to
  // chi's own state at its exchange PORT CELL (index 0), never touching
  // psi - applied immediately before the next tick's ordinary dynamics.
  const pulsedChiReal = Float64Array.from(chi.real);
  pulsedChiReal[0] += config.pulseAmplitude;
  chi = { real: pulsedChiReal, imag: Float64Array.from(chi.imag) };
  stepOnce(config.baselineTicks);

  for (let k = 0; k < config.measurementWindowTicks; k++) {
    stepOnce(config.baselineTicks + 1 + k);
  }

  const baselineSampleCount = Math.min(5, config.baselineTicks);
  const baselineSlice = indicatorHistory.slice(config.baselineTicks - baselineSampleCount, config.baselineTicks);
  const baselineIndicator = baselineSlice.reduce((a, b) => a + b, 0) / baselineSlice.length;

  const windowSampleCount = Math.min(5, config.measurementWindowTicks);
  const postWindowSlice = indicatorHistory.slice(indicatorHistory.length - windowSampleCount);
  const postWindowIndicator = postWindowSlice.reduce((a, b) => a + b, 0) / postWindowSlice.length;

  const scale = Math.max(Math.abs(baselineIndicator), 1e-9);
  const recovered = Math.abs(postWindowIndicator - baselineIndicator) <= config.recoveryTolerance * scale;

  return { indicatorHistory, baselineIndicator, postWindowIndicator, recovered };
}
