/**
 * PUT-IN: psi's and chi's own PureCoreParams, k, lambda, chi's base
 *   DriveSpec, a checkpoint interval, ledger-residual tolerances, a
 *   TransducerRegistry, and optionally a resumeFrom state (tick/psi/
 *   psiNu/chi/chiNu plus any prior input log entries, from a previous
 *   process's worldSnapshot + logged input)
 * EMERGED: a long-lived, incrementally-advanceable K13 world run: call
 *   `runTicks(n)` repeatedly (each call yields to the event loop every
 *   tick, so a real Node process stays responsive to WebSocket clients
 *   and injected signals while ticks are advancing), `injectSignal` to
 *   queue an external signal for the NEXT tick processed, and read
 *   `getLatestObservationSnapshot`/`getLatestWorldSnapshot`/`getInputLog`/
 *   `getCheckpoints` at any time - the last of these accumulates
 *   automatically every `config.checkpointInterval` ticks
 * claim-tier: C2 (see src/tests/pure/runtimeProcess.test.ts: bit-
 *   identical to a manual runWorldTick loop for the same signals;
 *   checkpoint-and-restart across two RuntimeProcess instances matches
 *   an uninterrupted one; the observation API connected vs disconnected
 *   produces bit-identical trajectories - K15's decisive falsifier,
 *   checked behaviorally here since this orchestrator legitimately
 *   imports the mutating tick machinery, unlike observationApi.ts/
 *   observationState.ts themselves, which are restricted by import per
 *   src/tests/pure/observationImportBoundary.test.ts)
 * floors (誠実な床): a NEW file - does not modify src/pure/run/
 *   worldLongRun.ts, which stays a single-call batch orchestrator with
 *   its own stop-condition logic. This module duplicates a small piece
 *   of that logic (per-tick finiteness/residual checks) because its
 *   execution model is fundamentally different (incremental, yielding,
 *   interactive) rather than because the physics differs - the
 *   PHYSICS entry point is the same runWorldTick both call. Yields via
 *   setImmediate after EVERY tick, not batched - simple and correct,
 *   not throughput-optimal; a real long run pays one setImmediate's
 *   worth of scheduling overhead per tick (this is disclosed, not
 *   hidden, in docs/vessel/K15-runtime-design.md's completion record).
 *   Deliberately performs no filesystem I/O itself (unlike a real
 *   deployment would need for durable checkpoints) - per
 *   docs/pure-physics-implementation-plan.md's determinism principle,
 *   nothing under src/pure/ reads Date.now() or touches the filesystem;
 *   a caller (e.g. a script under scripts/) is responsible for writing
 *   getLatestWorldSnapshot()'s JSON to disk and for attaching any
 *   wall-clock provenance.
 */

import { createWorldField, createWorldInitialState, type WorldFieldConfig } from '../world/worldField.ts';
import { selectDistributedBoundary, type DistributedBoundaryPair } from '../world/distributedBoundary.ts';
import { runWorldTick, type WorldFourBookLedgerEntry } from '../world/worldTick.ts';
import { createWorldSnapshot, type WorldSnapshot } from '../persist/worldSnapshot.ts';
import { buildObservationSnapshot, type ObservationSnapshot } from './observationState.ts';
import { resolveChiDriveForTick, type InputLogEntry } from './inputLog.ts';
import type { TransducerRegistry } from './transducer.ts';
import type { ComplexField } from '../geometry/torus.ts';
import type { PureCoreParams, PureCoreSolverSettings } from '../params.ts';
import { defaultPureCoreSolverSettings } from '../params.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { WorldLedgerResidualTolerance, WorldStopConditionReport } from '../run/worldLongRun.ts';

export interface RuntimeProcessResumeState {
  tick: number;
  psi: ComplexField;
  psiNu: Float64Array;
  chi: ComplexField;
  chiNu: Float64Array;
  /** Entries logged before this resume point (all with tick < resume tick) - kept so getInputLog() returns full history across a restart. */
  priorInputLog?: readonly InputLogEntry[];
}

export interface RuntimeProcessConfig {
  psiParams: PureCoreParams;
  chiParams: PureCoreParams;
  k: number;
  lambda: number;
  baseDrive: DriveSpec;
  checkpointInterval: number;
  residualTolerance: WorldLedgerResidualTolerance;
  transducerRegistry: TransducerRegistry;
  linearSolverKind?: WorldFieldConfig['linearSolverKind'];
  resumeFrom?: RuntimeProcessResumeState;
}

export interface RuntimeProcessTickBatchResult {
  ticksRun: number;
  finalTick: number;
  stopped: boolean;
  stopCondition?: WorldStopConditionReport;
}

function findNonFinite(values: Float64Array): number {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) return i;
  }
  return -1;
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

export class RuntimeProcess {
  private readonly config: RuntimeProcessConfig;
  private readonly psiWorld: ReturnType<typeof createWorldField>;
  private readonly chiWorld: ReturnType<typeof createWorldField>;
  private readonly pairs: DistributedBoundaryPair[];
  private readonly solverSettings: PureCoreSolverSettings;

  private psi: ComplexField;
  private psiNu: Float64Array;
  private chi: ComplexField;
  private chiNu: Float64Array;
  private tick: number;
  private lastLedger: WorldFourBookLedgerEntry | undefined;
  private readonly inputLog: InputLogEntry[];
  private readonly pendingSignals: InputLogEntry[] = [];
  private stopCondition: WorldStopConditionReport | undefined;
  private readonly checkpoints: WorldSnapshot[] = [];

  constructor(config: RuntimeProcessConfig) {
    if (!Number.isInteger(config.checkpointInterval) || config.checkpointInterval < 1) {
      throw new Error(`RuntimeProcess: checkpointInterval must be a positive integer, got ${config.checkpointInterval}`);
    }
    this.config = config;
    this.psiWorld = createWorldField({ params: config.psiParams, linearSolverKind: config.linearSolverKind });
    this.chiWorld = createWorldField({ params: config.chiParams, linearSolverKind: config.linearSolverKind });
    this.pairs = selectDistributedBoundary(this.psiWorld.geometry, this.chiWorld.geometry, config.k);
    this.solverSettings = defaultPureCoreSolverSettings();
    this.inputLog = config.resumeFrom?.priorInputLog ? [...config.resumeFrom.priorInputLog] : [];

    if (config.resumeFrom) {
      this.tick = config.resumeFrom.tick;
      this.psi = config.resumeFrom.psi;
      this.psiNu = config.resumeFrom.psiNu;
      this.chi = config.resumeFrom.chi;
      this.chiNu = config.resumeFrom.chiNu;
    } else {
      const psiInitial = createWorldInitialState(this.psiWorld);
      const chiInitial = createWorldInitialState(this.chiWorld);
      this.tick = 0;
      this.psi = { real: psiInitial.real, imag: psiInitial.imag };
      this.psiNu = psiInitial.nu;
      this.chi = { real: chiInitial.real, imag: chiInitial.imag };
      this.chiNu = chiInitial.nu;
    }
  }

  /** Queues a signal to be applied at the NEXT tick this process advances through. Logged immediately (before the tick even runs) so getInputLog() reflects intent even if the run stops before reaching that tick. */
  injectSignal(transducerId: string, signal: unknown): void {
    const entry: InputLogEntry = { tick: this.tick, transducerId, signal };
    this.pendingSignals.push(entry);
    this.inputLog.push(entry);
  }

  getCurrentTick(): number {
    return this.tick;
  }

  getInputLog(): readonly InputLogEntry[] {
    return this.inputLog;
  }

  getStopCondition(): WorldStopConditionReport | undefined {
    return this.stopCondition;
  }

  getLatestWorldSnapshot(): WorldSnapshot {
    return createWorldSnapshot({
      psiParams: this.config.psiParams,
      chiParams: this.config.chiParams,
      solverSettings: this.solverSettings,
      k: this.config.k,
      lambda: this.config.lambda,
      tick: this.tick,
      psi: this.psi,
      psiNu: this.psiNu,
      chi: this.chi,
      chiNu: this.chiNu,
    });
  }

  /**
   * Snapshots taken automatically every `config.checkpointInterval` ticks
   * (mirroring worldLongRun.ts's own checkpoint cadence), oldest first.
   * A caller still decides whether/how to persist these to disk - this
   * class does none of its own file I/O (see the module floors) - but it
   * now actually DOES something with the checkpointInterval it validates,
   * rather than accepting and ignoring it (a gap caught in review: every
   * caller was re-implementing this exact interval check externally).
   */
  getCheckpoints(): readonly WorldSnapshot[] {
    return this.checkpoints;
  }

  getLatestObservationSnapshot(): ObservationSnapshot | undefined {
    if (!this.lastLedger) return undefined;
    return buildObservationSnapshot({
      tick: this.tick,
      psi: this.psi,
      psiNu: this.psiNu,
      psiGeometry: this.psiWorld.geometry,
      chi: this.chi,
      chiNu: this.chiNu,
      chiGeometry: this.chiWorld.geometry,
      ledger: this.lastLedger,
    });
  }

  /** Advances up to `count` more ticks, yielding to the event loop after each one, stopping early on a finiteness/residual violation. Never throws for a stop condition (matches worldLongRun.ts's "stop is a value, not an exception" convention) - only for invalid arguments. */
  async runTicks(count: number): Promise<RuntimeProcessTickBatchResult> {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`RuntimeProcess.runTicks: count must be a non-negative integer, got ${count}`);
    }
    if (this.stopCondition) {
      return { ticksRun: 0, finalTick: this.tick, stopped: true, stopCondition: this.stopCondition };
    }

    let ticksRun = 0;
    for (let i = 0; i < count; i++) {
      const t = this.tick * this.psiWorld.params.dt;
      const attemptedTick = this.tick + 1;

      const pendingForThisTick = this.pendingSignals.splice(0, this.pendingSignals.length);
      const effectiveDrive = resolveChiDriveForTick(this.config.baseDrive, this.config.transducerRegistry, pendingForThisTick, this.tick, t);

      let result: { psi: ComplexField; psiNu: Float64Array; chi: ComplexField; chiNu: Float64Array; ledger: WorldFourBookLedgerEntry };
      try {
        result = runWorldTick(this.psi, this.psiNu, this.psiWorld, this.chi, this.chiNu, this.chiWorld, effectiveDrive, t, this.psiWorld.params.dt, this.pairs, this.config.lambda);
      } catch (error) {
        this.stopCondition = { reason: 'tick-execution-error', attemptedTick, detail: `runWorldTick threw: ${error instanceof Error ? error.message : String(error)}` };
        break;
      }

      const badPsi = findNonFinite(result.psi.real) >= 0 || findNonFinite(result.psi.imag) >= 0;
      if (badPsi) {
        this.stopCondition = { reason: 'non-finite-psi', attemptedTick, detail: 'psi contains a non-finite value' };
        break;
      }
      if (findNonFinite(result.psiNu) >= 0) {
        this.stopCondition = { reason: 'non-finite-psi-nu', attemptedTick, detail: 'psiNu contains a non-finite value' };
        break;
      }
      const badChi = findNonFinite(result.chi.real) >= 0 || findNonFinite(result.chi.imag) >= 0;
      if (badChi) {
        this.stopCondition = { reason: 'non-finite-chi', attemptedTick, detail: 'chi contains a non-finite value' };
        break;
      }
      if (findNonFinite(result.chiNu) >= 0) {
        this.stopCondition = { reason: 'non-finite-chi-nu', attemptedTick, detail: 'chiNu contains a non-finite value' };
        break;
      }
      const residualChecks: Array<{ label: string; value: number; tolerance: number }> = [
        { label: 'psiLedger.residualN', value: result.ledger.psiLedger.residualN, tolerance: this.config.residualTolerance.n },
        { label: 'psiLedger.residualH', value: result.ledger.psiLedger.residualH, tolerance: this.config.residualTolerance.h },
        { label: 'chiLedger.residualN', value: result.ledger.chiLedger.residualN, tolerance: this.config.residualTolerance.n },
        { label: 'chiLedger.residualH', value: result.ledger.chiLedger.residualH, tolerance: this.config.residualTolerance.h },
      ];
      const failedResidual = residualChecks.find((check) => Math.abs(check.value) > check.tolerance);
      if (failedResidual) {
        this.stopCondition = { reason: 'ledger-residual-exceeded', attemptedTick, detail: `${failedResidual.label} (${failedResidual.value}) exceeds tolerance (${failedResidual.tolerance})` };
        break;
      }

      this.psi = result.psi;
      this.psiNu = result.psiNu;
      this.chi = result.chi;
      this.chiNu = result.chiNu;
      this.lastLedger = result.ledger;
      this.tick = attemptedTick;
      ticksRun++;

      if (this.tick % this.config.checkpointInterval === 0) {
        this.checkpoints.push(this.getLatestWorldSnapshot());
      }

      await yieldToEventLoop();
    }

    return { ticksRun, finalTick: this.tick, stopped: this.stopCondition !== undefined, stopCondition: this.stopCondition };
  }
}
