/**
 * publicResearchScenarioSet.ts
 * AETERNA-NATURAL v1.4 — Public Research Scenario Classification
 *
 * Classifies the 10 research scenarios into public-safe, cautious, and advanced sets.
 * Does NOT modify any scenario definitions.
 *
 * Public-safe:  quietBaseline, singlePulseReturn, repeatedGentlePulse,
 *               phaseVortexEmergence, curvatureBiasObservation, observedRatioSurvey
 * Cautious:     plasticityTraceObservation, neutralVsLegacyConstants,
 *               longRunNaturalComparison
 * Advanced:     fullNaturalLongRun (hidden / gated)
 *
 * Reference: docs/public-research-mode.md §4
 */

// ── Public-safe scenarios ──────────────────────────────────────────────────────

/**
 * Scenarios safe for all public users.
 * Stable baseline conditions, single-pulse perturbations, and survey-level observations.
 */
export const PUBLIC_SAFE_SCENARIO_IDS: string[] = [
  'quietBaseline',
  'singlePulseReturn',
  'repeatedGentlePulse',
  'phaseVortexEmergence',
  'curvatureBiasObservation',
  'observedRatioSurvey',
];

// ── Cautious scenarios ─────────────────────────────────────────────────────────

/**
 * Scenarios that require care or prior knowledge.
 * Plasticity accumulation, legacy constant comparisons, and long-run dynamics.
 */
export const CAUTIOUS_SCENARIO_IDS: string[] = [
  'plasticityTraceObservation',
  'neutralVsLegacyConstants',
  'longRunNaturalComparison',
];

// ── Advanced scenarios ─────────────────────────────────────────────────────────

/**
 * Scenarios that are hidden or gated in public mode.
 * Long-run full-natural runs with experimental dynamics.
 */
export const ADVANCED_SCENARIO_IDS: string[] = [
  'fullNaturalLongRun',
];

// ── Helper functions ───────────────────────────────────────────────────────────

export function isPublicSafeScenario(id: string): boolean {
  return PUBLIC_SAFE_SCENARIO_IDS.includes(id);
}

export function isCautiousScenario(id: string): boolean {
  return CAUTIOUS_SCENARIO_IDS.includes(id);
}

export function isAdvancedScenario(id: string): boolean {
  return ADVANCED_SCENARIO_IDS.includes(id);
}
