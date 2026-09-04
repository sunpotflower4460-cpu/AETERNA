/**
 * PUT-IN: a list of (params, drive) combinations, a tick count, and a
 *   caller-supplied mechanical condition function
 * EMERGED: for each combination, whether the condition held and the raw
 *   detail behind that verdict - nothing more
 * claim-tier: C2 (unit-validated: same combinations + same seeds give
 *   bit-identical results, see src/tests/pure/autoSweepDeterminism.test.ts)
 * floors (誠実な床): this file performs no ranking, scoring, or
 *   "best parameter region" selection. docs/pure-physics-implementation-
 *   plan.md PR7's merge gate is explicit: 「自動スイープは条件を満たした
 *   パラメータ領域を列挙する」「優劣判断や意識確定をしない」(the sweep
 *   enumerates which parameter regions satisfy a condition; it makes no
 *   superiority judgment and no consciousness determination). The
 *   condition itself is supplied by the caller (see
 *   src/pure/observe/vortexCandidates.ts's vortexPersistenceAtLeast for
 *   one concrete, pre-registerable example) - this module does not
 *   choose or default to any particular condition.
 */

import { runPureExperiment, type PureExperimentResult } from './runPureExperiment.ts';
import type { PureCoreParams } from '../params.ts';
import type { DriveSpec } from '../drive/drive.ts';
import { vortexPersistenceAtLeast, type VortexPersistenceCheck } from '../observe/vortexCandidates.ts';

export interface SweepCombination {
  params: PureCoreParams;
  drive: DriveSpec;
}

export interface SweepConditionResult {
  satisfied: boolean;
  detail: unknown;
}

export type SweepCondition = (result: PureExperimentResult) => SweepConditionResult;

export interface SweepEntry {
  combination: SweepCombination;
  conditionResult: SweepConditionResult;
}

/** Runs `condition` against every combination, enumerating results in the input order. No sorting, no selection. */
export function runParameterSweep(combinations: readonly SweepCombination[], ticks: number, condition: SweepCondition): SweepEntry[] {
  const entries: SweepEntry[] = [];
  for (const combination of combinations) {
    const result = runPureExperiment({ params: combination.params, drive: combination.drive, ticks, observe: true });
    entries.push({ combination, conditionResult: condition(result) });
  }
  return entries;
}

/**
 * A ready-made SweepCondition adapting vortexPersistenceAtLeast to the
 * PureExperimentResult shape runParameterSweep uses. One concrete,
 * mechanically-defined example - not the only condition a sweep may use.
 */
export function vortexPersistenceSweepCondition(thresholdTicks: number): SweepCondition {
  const check = vortexPersistenceAtLeast(thresholdTicks);
  return (result: PureExperimentResult): SweepConditionResult => {
    const candidateHistory = result.observationHistory.map((observation) => observation.vortexCandidates);
    const verdict: VortexPersistenceCheck = check(candidateHistory);
    return { satisfied: verdict.satisfied, detail: verdict };
  };
}
