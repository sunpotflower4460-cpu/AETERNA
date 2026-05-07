/**
 * publicResearchScenarioSet.ts
 * AETERNA-NATURAL v2.2 — Public Research Scenario Classification
 *
 * Classifies the 10 research scenarios into public-safe, cautious, and advanced sets.
 * v2.2: Added beginner / observation / advanced grouping with one-line descriptions
 * for improved first-user display in ResearchScenarioPanel.
 *
 * Does NOT modify any scenario definitions.
 *
 * Public-safe:  quietBaseline, singlePulseReturn, repeatedGentlePulse,
 *               phaseVortexEmergence, curvatureBiasObservation, observedRatioSurvey
 * Cautious:     plasticityTraceObservation, neutralVsLegacyConstants,
 *               longRunNaturalComparison
 * Advanced:     fullNaturalLongRun (hidden / gated)
 *
 * Reference: docs/public-research-mode.md §4, docs/public-demo-polish.md §6
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

// ── Grouped display for public mode ───────────────────────────────────────────

export type ScenarioDisplayGroup = 'beginner' | 'observation' | 'advanced';

export interface ScenarioDisplayEntry {
  id: string;
  group: ScenarioDisplayGroup;
  oneLineDescription: string;
  oneLineDescriptionJa: string;
}

/**
 * Ordered display list for public mode scenarios.
 * Grouped into beginner / observation / advanced for first-user orientation.
 * Each entry includes a one-line "what to observe" description.
 */
export const PUBLIC_SCENARIO_DISPLAY_LIST: ScenarioDisplayEntry[] = [
  // ── Beginner ──────────────────────────────────────────────────────────────
  {
    id: 'quietBaseline',
    group: 'beginner',
    oneLineDescription: 'Observe the resting-state field with minimal external input.',
    oneLineDescriptionJa: '外部刺激を最小にして、場の基底状態を観測します。',
  },
  {
    id: 'singlePulseReturn',
    group: 'beginner',
    oneLineDescription: 'Apply a single gentle pulse and observe whether the field returns to baseline.',
    oneLineDescriptionJa: '単発の穏やかなパルスを与え、場が基底状態に戻るかを観測します。',
  },
  // ── Observation ───────────────────────────────────────────────────────────
  {
    id: 'phaseVortexEmergence',
    group: 'observation',
    oneLineDescription: 'Observe how phase changes and vortex candidates appear in the field.',
    oneLineDescriptionJa: '位相変化と渦候補がどう現れるかを観測します。',
  },
  {
    id: 'curvatureBiasObservation',
    group: 'observation',
    oneLineDescription: 'Observe how curvature bias affects field geometry and vortex distribution.',
    oneLineDescriptionJa: '曲率バイアスが場の幾何と渦分布にどう影響するかを観測します。',
  },
  {
    id: 'observedRatioSurvey',
    group: 'observation',
    oneLineDescription: 'Compare observed ratios against reference values. This is comparison, not proof.',
    oneLineDescriptionJa: '観測された比率が参照値に近いかを比較します。ただし証明ではありません。',
  },
  // ── Advanced ──────────────────────────────────────────────────────────────
  {
    id: 'plasticityTraceObservation',
    group: 'advanced',
    oneLineDescription: 'Observe weak plasticity trace accumulation over longer runs.',
    oneLineDescriptionJa: '弱可塑性痕跡の蓄積を長時間にわたって観測します。',
  },
  {
    id: 'longRunNaturalComparison',
    group: 'advanced',
    oneLineDescription: 'Compare natural-mode field behaviour over an extended run.',
    oneLineDescriptionJa: 'ナチュラルモードの場の変化を長時間で比較観測します。',
  },
];

/**
 * Returns display entries for a specific group.
 */
export function getScenarioDisplayGroup(group: ScenarioDisplayGroup): ScenarioDisplayEntry[] {
  return PUBLIC_SCENARIO_DISPLAY_LIST.filter(e => e.group === group);
}

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
