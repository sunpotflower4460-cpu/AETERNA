/**
 * ScenarioComparison.ts
 * U7: Scenario UX
 *
 * Pure TypeScript module for comparing two scenario result summaries.
 * No DOM, no React, no runtime dynamics modifications.
 *
 * Reference: docs/scientific-ui-ux-principles.md
 */

import type { ScenarioResultSummary } from './ScenarioResultSummary.ts';

// ── ScenarioComparisonResult ──────────────────────────────────────────────────

/**
 * The result of comparing two ScenarioResultSummary objects.
 * hasComparison is true only when both summaries have result data.
 */
export interface ScenarioComparisonResult {
  scenarioA: ScenarioResultSummary | null;
  scenarioB: ScenarioResultSummary | null;
  hasComparison: boolean;
}

// ── compareScenarios ──────────────────────────────────────────────────────────

/**
 * Compare two scenario result summaries.
 * Returns a ScenarioComparisonResult.
 * hasComparison is true only when both a and b have hasResult = true.
 */
export function compareScenarios(
    a: ScenarioResultSummary | null,
    b: ScenarioResultSummary | null
): ScenarioComparisonResult {
    const hasComparison = (a?.hasResult === true) && (b?.hasResult === true);
    return {
        scenarioA: a,
        scenarioB: b,
        hasComparison,
    };
}
