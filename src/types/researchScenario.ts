/**
 * researchScenario.ts
 * AETERNA-NATURAL v1.3 Research Scenarios / Preset Experiments
 *
 * Defines the ResearchScenario type — a reproducible observation scenario with
 * explicit seed / config / ticks / expected observation targets.
 *
 * Design principles:
 * - Scenarios are observation condition presets, not behavior systems.
 * - expectedObservationKinds lists observation targets — not guaranteed outcomes.
 * - Absence of expected observations is a valid result.
 * - No consciousness / emotion / life / intelligence claims in any field.
 * - No fake results, no fake events, no emergence guarantees.
 *
 * Reference: docs/research-scenarios-preset-experiments.md
 */

// ── ResearchScenarioId ────────────────────────────────────────────────────────

export type ResearchScenarioId =
  | 'quietBaseline'
  | 'singlePulseReturn'
  | 'repeatedGentlePulse'
  | 'phaseVortexEmergence'
  | 'curvatureBiasObservation'
  | 'membraneOverlapObservation'
  | 'plasticityTraceObservation'
  | 'neutralVsLegacyConstants'
  | 'observedRatioSurvey'
  | 'longRunNaturalComparison';

// ── ResearchScenario ──────────────────────────────────────────────────────────

/**
 * A reproducible research scenario with explicit observation conditions.
 *
 * Each scenario provides `defaultSeed` as the recommended seed for
 * reproducibility. Experiments may use this value or a different explicit seed,
 * but must always record their seed for export.
 *
 * IMPORTANT: expectedObservationKinds lists what to observe — not what will
 * definitely be observed. No emergence is a valid result.
 */
export interface ResearchScenario {
  /** Unique identifier for this research scenario */
  id: ResearchScenarioId;

  /** Short display name — must NOT contain consciousness / emotion language */
  title: string;

  /** One-sentence neutral description of the research condition */
  shortDescription: string;

  /** The research question this scenario is designed to investigate */
  researchQuestion: string;

  /** What the researcher is attempting to measure or observe */
  observationGoal: string;

  /** Default random seed — recommended for reproducibility; may be overridden by experiments */
  defaultSeed: number;

  /** Default number of ticks to run */
  defaultTicks: number;

  /** Take a snapshot every N ticks */
  sampleEveryTicks: number;

  /** Primary recommended runtime preset ID */
  recommendedPresetId: string;

  /** Additional compatible runtime preset IDs for comparison */
  compatiblePresetIds: string[];

  /** Recommended field layers to enable */
  recommendedLayers: string[];

  /** Recommended UI panels to open */
  recommendedPanels: string[];

  /**
   * Observable metric kinds that are the focus of this scenario.
   * These are observation targets — NOT guaranteed outcomes.
   * Absence of an expected observation is a valid result.
   */
  expectedObservationKinds: string[];

  /**
   * Notes clarifying what this scenario does NOT demonstrate.
   * Use to prevent over-interpretation of results.
   */
  nonGuaranteedNotes: string[];

  /**
   * Safety level for this scenario.
   * 'safe'        : uses safe-mode runtime config (safeBaseline or equivalent)
   * 'research'    : uses research-mode presets (no runtime feedback)
   * 'experimental': uses experimental presets (runtime feedback paths active)
   */
  safetyLevel: 'safe' | 'research' | 'experimental';

  /** Tags for export filtering and grouping */
  exportTags: string[];
}
