/**
 * PUT-IN: psi's own PureCoreParams, chi's own PureCoreParams (K13 -
 *   independent of psi's), k, lambda, chi's DriveSpec, a tick budget, a
 *   checkpoint interval, ledger-residual tolerances, and optionally a
 *   resumeFrom state (tick/psi/psiNu/chi/chiNu restored from a prior
 *   worldSnapshot, possibly in a completely separate process)
 * EMERGED: the K13 world run advanced tick-by-tick from t=0 or from
 *   resumeFrom, driving runWorldTick each step (NOT runMediumHistoryTick
 *   - see the floors note below), producing periodic worldSnapshot
 *   checkpoints, until either the tick budget is reached or an
 *   AGENTS.md stop condition is detected on EITHER psi or chi
 * claim-tier: C2 (see src/tests/pure/worldLongRun.test.ts: a run that
 *   hits a deliberately-tiny residual tolerance on either book stops
 *   exactly where expected and preserves the last good state; a normal
 *   run reaches its full tick budget; resuming from a mid-run
 *   worldSnapshot reproduces the same final state as an uninterrupted
 *   run, mirroring src/tests/pure/longRun.test.ts's own resume check)
 * floors (誠実な床): a NEW file, not an extension of src/pure/run/
 *   longRun.ts - per longRun.ts's own floors note, that module
 *   deliberately does not drive the K5/K13 chi/exchange loop, and this
 *   session's "new mechanism = new file" discipline keeps it that way
 *   (K2-K12's own longRun.ts-based experiments stay reproducible,
 *   unmodified, per docs/vessel/K15-runtime-design.md Choice 3). Checks
 *   only the RUNTIME stop conditions that make sense to evaluate
 *   tick-by-tick (NaN/Infinity in psi/psiNu/chi/chiNu, and either
 *   book's N/H ledger residual exceeding tolerance) - the other
 *   AGENTS.md conditions (self-adjointness/conservation-law test
 *   failures, seed non-reproducibility, forbidden source patterns,
 *   docs/impl contradiction, observer non-interference) stay the job of
 *   src/tests/pure/ and are not duplicated here. Targets K13's REAL
 *   world (runWorldTick) only - the delay-line null-hypothesis control
 *   device (delayLineControl.ts) is out of scope for this runtime
 *   orchestrator, per K15-runtime-design.md Choice 2's floor.
 */

import { createWorldField, createWorldInitialState, type WorldFieldConfig } from '../world/worldField.ts';
import { selectDistributedBoundary, type DistributedBoundaryPair } from '../world/distributedBoundary.ts';
import { runWorldTick, type WorldFourBookLedgerEntry } from '../world/worldTick.ts';
import type { ComplexField } from '../geometry/torus.ts';
import type { PureCoreParams, PureCoreSolverSettings } from '../params.ts';
import { defaultPureCoreSolverSettings } from '../params.ts';
import type { DriveSpec } from '../drive/drive.ts';
import { createWorldSnapshot, type WorldSnapshot } from '../persist/worldSnapshot.ts';

export interface WorldLedgerResidualTolerance {
  n: number;
  h: number;
}

export interface WorldLongRunResumeState {
  tick: number;
  psi: ComplexField;
  psiNu: Float64Array;
  chi: ComplexField;
  chiNu: Float64Array;
}

export interface WorldLongRunConfig {
  psiParams: PureCoreParams;
  chiParams: PureCoreParams;
  k: number;
  lambda: number;
  /** Chi's own drive - per K13's constitution, this is the world's only external energy port. */
  drive: DriveSpec;
  /** Ticks to run FROM the start point (tick 0, or resumeFrom.tick if given) - never an absolute target. */
  totalTicks: number;
  checkpointInterval: number;
  residualTolerance: WorldLedgerResidualTolerance;
  linearSolverKind?: WorldFieldConfig['linearSolverKind'];
  resumeFrom?: WorldLongRunResumeState;
}

export interface WorldStopConditionReport {
  reason: 'non-finite-psi' | 'non-finite-psi-nu' | 'non-finite-chi' | 'non-finite-chi-nu' | 'ledger-residual-exceeded' | 'tick-execution-error';
  /** The tick that would have produced the bad value - NOT reached; finalTick stays at the last good tick. */
  attemptedTick: number;
  detail: string;
}

export interface WorldLongRunCheckpoint {
  tick: number;
  snapshot: WorldSnapshot;
}

export interface WorldLongRunResult {
  requestedTicks: number;
  finalTick: number;
  stopped: boolean;
  stopCondition?: WorldStopConditionReport;
  checkpoints: WorldLongRunCheckpoint[];
  finalPsi: ComplexField;
  finalPsiNu: Float64Array;
  finalChi: ComplexField;
  finalChiNu: Float64Array;
  solverSettings: PureCoreSolverSettings;
}

function findNonFinite(values: Float64Array): number {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) return i;
  }
  return -1;
}

export function runWorldLongRun(config: WorldLongRunConfig): WorldLongRunResult {
  if (!Number.isInteger(config.totalTicks) || config.totalTicks < 0) {
    throw new Error(`runWorldLongRun: totalTicks must be a non-negative integer, got ${config.totalTicks}`);
  }
  if (!Number.isInteger(config.checkpointInterval) || config.checkpointInterval < 1) {
    throw new Error(`runWorldLongRun: checkpointInterval must be a positive integer, got ${config.checkpointInterval}`);
  }
  if (config.resumeFrom && (!Number.isInteger(config.resumeFrom.tick) || config.resumeFrom.tick < 0)) {
    throw new Error(`runWorldLongRun: resumeFrom.tick must be a non-negative integer, got ${config.resumeFrom.tick}`);
  }

  const psiWorld = createWorldField({ params: config.psiParams, linearSolverKind: config.linearSolverKind });
  const chiWorld = createWorldField({ params: config.chiParams, linearSolverKind: config.linearSolverKind });
  const pairs: DistributedBoundaryPair[] = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, config.k);
  const solverSettings = defaultPureCoreSolverSettings();

  const startTick = config.resumeFrom?.tick ?? 0;
  let psi: ComplexField;
  let psiNu: Float64Array;
  let chi: ComplexField;
  let chiNu: Float64Array;
  if (config.resumeFrom) {
    psi = config.resumeFrom.psi;
    psiNu = config.resumeFrom.psiNu;
    chi = config.resumeFrom.chi;
    chiNu = config.resumeFrom.chiNu;
  } else {
    const psiInitial = createWorldInitialState(psiWorld);
    const chiInitial = createWorldInitialState(chiWorld);
    psi = { real: psiInitial.real, imag: psiInitial.imag };
    psiNu = psiInitial.nu;
    chi = { real: chiInitial.real, imag: chiInitial.imag };
    chiNu = chiInitial.nu;
  }

  const checkpoints: WorldLongRunCheckpoint[] = [];
  let stopCondition: WorldStopConditionReport | undefined;
  let finalTick = startTick;

  const takeCheckpoint = (tick: number): void => {
    checkpoints.push({
      tick,
      snapshot: createWorldSnapshot({
        psiParams: config.psiParams,
        chiParams: config.chiParams,
        solverSettings,
        k: config.k,
        lambda: config.lambda,
        tick,
        psi,
        psiNu,
        chi,
        chiNu,
      }),
    });
  };

  for (let i = 0; i < config.totalTicks; i++) {
    const tick = startTick + i;
    const t = tick * psiWorld.params.dt;
    const attemptedTick = tick + 1;
    let result: { psi: ComplexField; psiNu: Float64Array; chi: ComplexField; chiNu: Float64Array; ledger: WorldFourBookLedgerEntry };
    try {
      result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, config.drive, t, psiWorld.params.dt, pairs, config.lambda);
    } catch (error) {
      stopCondition = { reason: 'tick-execution-error', attemptedTick, detail: `runWorldTick threw: ${error instanceof Error ? error.message : String(error)}` };
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
    const badPsiNu = findNonFinite(result.psiNu);
    if (badPsiNu >= 0) {
      stopCondition = { reason: 'non-finite-psi-nu', attemptedTick, detail: `psiNu[${badPsiNu}] is non-finite` };
      break;
    }
    const badChiReal = findNonFinite(result.chi.real);
    const badChiImag = findNonFinite(result.chi.imag);
    if (badChiReal >= 0 || badChiImag >= 0) {
      const idx = badChiReal >= 0 ? badChiReal : badChiImag;
      const part = badChiReal >= 0 ? 'real' : 'imag';
      stopCondition = { reason: 'non-finite-chi', attemptedTick, detail: `chi.${part}[${idx}] is non-finite` };
      break;
    }
    const badChiNu = findNonFinite(result.chiNu);
    if (badChiNu >= 0) {
      stopCondition = { reason: 'non-finite-chi-nu', attemptedTick, detail: `chiNu[${badChiNu}] is non-finite` };
      break;
    }

    const residualChecks: Array<{ label: string; value: number; tolerance: number }> = [
      { label: 'psiLedger.residualN', value: result.ledger.psiLedger.residualN, tolerance: config.residualTolerance.n },
      { label: 'psiLedger.residualH', value: result.ledger.psiLedger.residualH, tolerance: config.residualTolerance.h },
      { label: 'chiLedger.residualN', value: result.ledger.chiLedger.residualN, tolerance: config.residualTolerance.n },
      { label: 'chiLedger.residualH', value: result.ledger.chiLedger.residualH, tolerance: config.residualTolerance.h },
    ];
    const failedResidual = residualChecks.find((check) => Math.abs(check.value) > check.tolerance);
    if (failedResidual) {
      stopCondition = {
        reason: 'ledger-residual-exceeded',
        attemptedTick,
        detail: `${failedResidual.label} (${failedResidual.value}) exceeds tolerance (${failedResidual.tolerance})`,
      };
      break;
    }

    psi = result.psi;
    psiNu = result.psiNu;
    chi = result.chi;
    chiNu = result.chiNu;
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
    finalPsiNu: psiNu,
    finalChi: chi,
    finalChiNu: chiNu,
    solverSettings,
  };
}
