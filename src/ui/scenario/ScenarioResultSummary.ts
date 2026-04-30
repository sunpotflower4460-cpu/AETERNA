/**
 * ScenarioResultSummary.ts
 * U7: Scenario UX
 *
 * Data structure and factory functions for scenario result summaries.
 * Pure TypeScript — no DOM, no React, no runtime dynamics modifications.
 *
 * Principles:
 * - All values come from externally supplied params — no hardcoded results.
 * - No fake data, no synthetic metrics.
 * - Does NOT modify any runtime state.
 *
 * Reference: docs/scientific-ui-ux-principles.md
 */

import type { ScenarioPresetId } from '../../types/scenarioPreset.ts';

// ── ScenarioResultSummary ─────────────────────────────────────────────────────

/**
 * A summary of field metric observations recorded during a scenario run.
 * All nullable fields are null if the scenario has not been run or data is absent.
 */
export interface ScenarioResultSummary {
  /** Scenario preset ID, or null if no scenario was active */
  scenarioId: ScenarioPresetId | null;

  /** Human-readable scenario title */
  scenarioTitle: string;

  /** Total wall-clock duration of the run in milliseconds, or null */
  durationMs: number | null;

  /** Number of simulation ticks observed, or null */
  ticks: number | null;

  /** Average flow continuity over the run, or null */
  averageFlowContinuity: number | null;

  /** Average return signal strength over the run, or null */
  averageReturnStrength: number | null;

  /** Average echo strength over the run, or null */
  averageEchoStrength: number | null;

  /** Average closure stability over the run, or null */
  averageClosureStability: number | null;

  /** Count of high-excitability region observations, or null */
  highExcitabilityRegionCount: number | null;

  /** Count of repeated flow path candidate observations, or null */
  repeatedFlowPathCandidateCount: number | null;

  /** Count of proto-network candidate observations, or null */
  protoNetworkCandidateCount: number | null;

  /** Total semantic leak count observed during the run */
  semanticLeakCount: number;

  /** Total NaN or Infinity value count observed during the run */
  nanOrInfinityCount: number;

  /** Whether this summary contains actual result data */
  hasResult: boolean;
}

// ── Params for makeResultSummary ──────────────────────────────────────────────

export interface MakeResultSummaryParams {
  scenarioId: ScenarioPresetId | null;
  scenarioTitle: string;
  durationMs: number | null;
  ticks: number | null;
  averageFlowContinuity: number | null;
  averageReturnStrength: number | null;
  averageEchoStrength: number | null;
  averageClosureStability: number | null;
  highExcitabilityRegionCount: number | null;
  repeatedFlowPathCandidateCount: number | null;
  protoNetworkCandidateCount: number | null;
  semanticLeakCount: number;
  nanOrInfinityCount: number;
}

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Create an empty result summary with no data.
 * hasResult is false — indicates no scenario has been run yet.
 */
export function makeEmptyResultSummary(): ScenarioResultSummary {
    return {
        scenarioId: null,
        scenarioTitle: '',
        durationMs: null,
        ticks: null,
        averageFlowContinuity: null,
        averageReturnStrength: null,
        averageEchoStrength: null,
        averageClosureStability: null,
        highExcitabilityRegionCount: null,
        repeatedFlowPathCandidateCount: null,
        protoNetworkCandidateCount: null,
        semanticLeakCount: 0,
        nanOrInfinityCount: 0,
        hasResult: false,
    };
}

/**
 * Create a result summary from observed field metric data.
 * All values come from the supplied params — no hardcoded results.
 * hasResult is true.
 */
export function makeResultSummary(params: MakeResultSummaryParams): ScenarioResultSummary {
    return {
        scenarioId: params.scenarioId,
        scenarioTitle: params.scenarioTitle,
        durationMs: params.durationMs,
        ticks: params.ticks,
        averageFlowContinuity: params.averageFlowContinuity,
        averageReturnStrength: params.averageReturnStrength,
        averageEchoStrength: params.averageEchoStrength,
        averageClosureStability: params.averageClosureStability,
        highExcitabilityRegionCount: params.highExcitabilityRegionCount,
        repeatedFlowPathCandidateCount: params.repeatedFlowPathCandidateCount,
        protoNetworkCandidateCount: params.protoNetworkCandidateCount,
        semanticLeakCount: params.semanticLeakCount,
        nanOrInfinityCount: params.nanOrInfinityCount,
        hasResult: true,
    };
}
