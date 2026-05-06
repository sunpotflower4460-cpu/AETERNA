/**
 * publicPresetExperimentSet.ts
 * AETERNA-NATURAL v1.4 — Public Preset Experiment Classification
 *
 * Classifies the 14 preset experiments (E01–E14) into public-safe and advanced sets.
 * Does NOT modify any experiment definitions.
 *
 * Public-safe:  E01 through E09, E13
 * Advanced:     E10_plasticityTraceLongRun, E11_neutralConstants,
 *               E12_legacyConstants, E14_longRunNaturalComparison
 *
 * Reference: docs/public-research-mode.md §5
 */

// ── Public-safe experiments ────────────────────────────────────────────────────

/**
 * Experiments safe for all public users.
 * Quiet baselines, pulse returns, vortex emergence, curvature, membrane,
 * and ratio survey — all at safe or research safety level.
 */
export const PUBLIC_SAFE_EXPERIMENT_IDS: string[] = [
  'E01_quietBaselineSafe',
  'E02_quietBaselineNatural',
  'E03_singlePulseReturn',
  'E04_repeatedGentlePulse',
  'E05_repeatedGentlePulsePlasticity',
  'E06_phaseVortexEmergence',
  'E07_phaseVortexNatural',
  'E08_curvatureBiasGeometry',
  'E09_membraneOverlap',
  'E13_observedRatioSurvey',
];

// ── Advanced experiments ───────────────────────────────────────────────────────

/**
 * Experiments that are hidden or gated in public mode.
 * Long-run plasticity trace, neutral/legacy constant comparisons,
 * and full long-run natural comparison.
 */
export const ADVANCED_EXPERIMENT_IDS: string[] = [
  'E10_plasticityTraceLongRun',
  'E11_neutralConstants',
  'E12_legacyConstants',
  'E14_longRunNaturalComparison',
];

// ── Helper functions ───────────────────────────────────────────────────────────

export function isPublicSafeExperiment(id: string): boolean {
  return PUBLIC_SAFE_EXPERIMENT_IDS.includes(id);
}

export function isAdvancedExperiment(id: string): boolean {
  return ADVANCED_EXPERIMENT_IDS.includes(id);
}
