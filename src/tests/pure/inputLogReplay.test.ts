import { describe, expect, it } from 'vitest';
import { createWorldField, createWorldInitialState, type WorldField } from '../../pure/world/worldField.ts';
import { selectDistributedBoundary, type DistributedBoundaryPair } from '../../pure/world/distributedBoundary.ts';
import { runWorldTick } from '../../pure/world/worldTick.ts';
import { applyTransducerToChiDrive, createTransducerRegistry, type TransducerRegistry } from '../../pure/runtime/transducer.ts';
import { uniformAmplitudeTransducer, singleCellPulseTransducer } from '../../pure/runtime/builtinTransducers.ts';
import { serializeInputLogJsonl, parseInputLogJsonl, resolveChiDriveForTick, type InputLogEntry } from '../../pure/runtime/inputLog.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function baseParams(seed: number): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1, nu0: 0.15, kappa: 1, rho: 0.3, seed };
}

interface Scenario {
  psiWorld: WorldField;
  chiWorld: WorldField;
  pairs: DistributedBoundaryPair[];
  baseDrive: DriveSpec;
  lambda: number;
}

function buildScenario(): Scenario {
  const psiWorld = createWorldField({ params: baseParams(1) });
  const chiWorld = createWorldField({ params: baseParams(2) });
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, 4);
  const baseDrive: DriveSpec = { spatialProfile: new Float64Array(64).fill(0.3), omega: 3, phase: 0.1 };
  return { psiWorld, chiWorld, pairs, baseDrive, lambda: 0.6 };
}

interface RunState {
  psi: ComplexField;
  psiNu: Float64Array;
  chi: ComplexField;
  chiNu: Float64Array;
}

function initialState(scenario: Scenario): RunState {
  const psiInitial = createWorldInitialState(scenario.psiWorld);
  const chiInitial = createWorldInitialState(scenario.chiWorld);
  return {
    psi: { real: psiInitial.real, imag: psiInitial.imag },
    psiNu: psiInitial.nu,
    chi: { real: chiInitial.real, imag: chiInitial.imag },
    chiNu: chiInitial.nu,
  };
}

const TOTAL_TICKS = 20;

/** The "live" run: generates signals at specific ticks and logs each one as it applies it. */
function runLive(scenario: Scenario): { final: RunState; entries: InputLogEntry[] } {
  let state = initialState(scenario);
  const entries: InputLogEntry[] = [];
  for (let tick = 0; tick < TOTAL_TICKS; tick++) {
    const t = tick * scenario.psiWorld.params.dt;
    let drive = scenario.baseDrive;
    if (tick === 3) {
      const signal = 0.15;
      entries.push({ tick, transducerId: uniformAmplitudeTransducer.id, signal });
      drive = applyTransducerToChiDrive(drive, uniformAmplitudeTransducer, signal, t);
    }
    if (tick === 11) {
      const signal = { cellIndex: 5, amplitude: 0.8 };
      entries.push({ tick, transducerId: singleCellPulseTransducer.id, signal });
      drive = applyTransducerToChiDrive(drive, singleCellPulseTransducer, signal, t);
    }
    const result = runWorldTick(state.psi, state.psiNu, scenario.psiWorld, state.chi, state.chiNu, scenario.chiWorld, drive, t, scenario.psiWorld.params.dt, scenario.pairs, scenario.lambda);
    state = { psi: result.psi, psiNu: result.psiNu, chi: result.chi, chiNu: result.chiNu };
  }
  return { final: state, entries };
}

/** The "replay" run: knows ONLY the parsed log and the registry - never calls the live signal-generation code above. */
function runReplay(scenario: Scenario, registry: TransducerRegistry, entries: readonly InputLogEntry[]): RunState {
  let state = initialState(scenario);
  for (let tick = 0; tick < TOTAL_TICKS; tick++) {
    const t = tick * scenario.psiWorld.params.dt;
    const drive = resolveChiDriveForTick(scenario.baseDrive, registry, entries, tick, t);
    const result = runWorldTick(state.psi, state.psiNu, scenario.psiWorld, state.chi, state.chiNu, scenario.chiWorld, drive, t, scenario.psiWorld.params.dt, scenario.pairs, scenario.lambda);
    state = { psi: result.psi, psiNu: result.psiNu, chi: result.chi, chiNu: result.chiNu };
  }
  return state;
}

describe('pure core K15 input log replay: a log-only replay reproduces a live signal-driven run bit-for-bit', () => {
  it('matches exactly through an actual JSONL serialize/parse round trip (simulating a fresh process reading a checkpoint input log)', () => {
    const scenario = buildScenario();
    const { final: liveFinal, entries } = runLive(scenario);

    const jsonl = serializeInputLogJsonl(entries);
    const parsedEntries = parseInputLogJsonl(jsonl);

    const registry = createTransducerRegistry([uniformAmplitudeTransducer, singleCellPulseTransducer]);
    const replayFinal = runReplay(buildScenario(), registry, parsedEntries);

    expect(replayFinal.psi.real).toEqual(liveFinal.psi.real);
    expect(replayFinal.psi.imag).toEqual(liveFinal.psi.imag);
    expect(replayFinal.psiNu).toEqual(liveFinal.psiNu);
    expect(replayFinal.chi.real).toEqual(liveFinal.chi.real);
    expect(replayFinal.chi.imag).toEqual(liveFinal.chi.imag);
    expect(replayFinal.chiNu).toEqual(liveFinal.chiNu);
  });

  it('a run with NO signals at all is unaffected by the transducer machinery (replay of an empty log matches an unmodified baseDrive run)', () => {
    const scenario = buildScenario();
    let state = initialState(scenario);
    for (let tick = 0; tick < TOTAL_TICKS; tick++) {
      const t = tick * scenario.psiWorld.params.dt;
      const result = runWorldTick(state.psi, state.psiNu, scenario.psiWorld, state.chi, state.chiNu, scenario.chiWorld, scenario.baseDrive, t, scenario.psiWorld.params.dt, scenario.pairs, scenario.lambda);
      state = { psi: result.psi, psiNu: result.psiNu, chi: result.chi, chiNu: result.chiNu };
    }

    const registry = createTransducerRegistry([uniformAmplitudeTransducer, singleCellPulseTransducer]);
    const replayFinal = runReplay(buildScenario(), registry, []);

    expect(replayFinal.psi.real).toEqual(state.psi.real);
    expect(replayFinal.chi.real).toEqual(state.chi.real);
  });

  it('a wrong/missing log entry produces a DIFFERENT final state than the live run (the test itself is sensitive to the input, not vacuously true)', () => {
    const scenario = buildScenario();
    const { final: liveFinal, entries } = runLive(scenario);

    const registry = createTransducerRegistry([uniformAmplitudeTransducer, singleCellPulseTransducer]);
    const droppedOneEntry = entries.slice(0, 1); // drop the tick=11 pulse
    const replayFinal = runReplay(buildScenario(), registry, droppedOneEntry);

    expect(replayFinal.psi.real).not.toEqual(liveFinal.psi.real);
  });
});
