/**
 * scenarioPreset.ts
 * U7: Scenario UX
 *
 * Defines the ScenarioPreset type — a named observation condition preset.
 * A scenario preset specifies which field layers and panels are relevant for
 * a given set of starting conditions. It does NOT modify runtime dynamics.
 *
 * Principles:
 * - Scenarios are observation condition presets, not behavior systems.
 * - All text is neutral and scientific — no emotion / consciousness / intent claims.
 * - Expected signals are listed as "possible", not "guaranteed".
 *
 * Reference: docs/scientific-ui-ux-principles.md
 */

// ── ScenarioPresetId ──────────────────────────────────────────────────────────

export type ScenarioPresetId =
  | 'quietObservation'
  | 'singleTouch'
  | 'repeatedGentleTouch'
  | 'holdAndRelease'
  | 'delayedReturn'
  | 'highResistanceWorld'
  | 'lowResistanceWorld'
  | 'slowEchoWorld'
  | 'fastEchoWorld'
  | 'longRunNaturalEmergence';

// ── ScenarioPreset ─────────────────────────────────────────────────────────────

/**
 * A named observation condition preset.
 *
 * Specifies suggested layers, panels, and expected observable signals for a
 * given starting configuration. Does not alter runtime field dynamics.
 */
export interface ScenarioPreset {
  /** Unique identifier for this preset */
  id: ScenarioPresetId;

  /** Short display name — must NOT contain emotion / consciousness / desire language */
  title: string;

  /** One-sentence neutral description of the observation condition */
  shortDescription: string;

  /** What the researcher is trying to observe */
  observationGoal: string;

  /**
   * Observable signals that may appear under these conditions.
   * Listed as possible candidates, not guaranteed outcomes.
   */
  expectedSignals: string[];

  /** Suggested field layers to enable for this scenario */
  recommendedLayers: string[];

  /** Suggested panel to open first */
  recommendedPanel: string;

  /** Approximate observation duration hint */
  durationHint: 'short' | 'medium' | 'long';

  /**
   * Optional note about what this scenario does and does not demonstrate.
   * Use to prevent over-interpretation of results.
   */
  safetyNote?: string;
}
