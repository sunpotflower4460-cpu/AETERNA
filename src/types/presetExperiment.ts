/**
 * presetExperiment.ts
 * AETERNA-NATURAL v1.3 Research Scenarios / Preset Experiments
 *
 * Defines the PresetExperiment type — a named, reproducible experiment that
 * binds a ResearchScenario to a specific runtime preset, seed, tick count,
 * and sampling interval.
 *
 * Design principles:
 * - A PresetExperiment is a concrete, runnable unit of observation.
 * - It links exactly one ResearchScenario to one runtime preset.
 * - seed / ticks / sampleEveryTicks are explicit for reproducibility.
 * - runtimeConfigOverrides, if present, must not activate runtime feedback paths
 *   unless safetyLevel = 'experimental'.
 * - expectedObservationKinds are observation targets — not guarantees.
 * - Fake results and fake events are prohibited.
 *
 * Reference: docs/research-scenarios-preset-experiments.md
 */

import type { ResearchScenarioId } from './researchScenario.ts';
import type { ExperimentKind } from '../observer/experimentKind.ts';

// ── PresetExperiment ──────────────────────────────────────────────────────────

/**
 * A concrete, named experiment referencing a ResearchScenario and a runtime
 * preset by ID. Each experiment specifies the seed, tick count, and sampling
 * interval needed to reproduce the observation conditions.
 */
export interface PresetExperiment {
  /** Unique identifier for this preset experiment */
  id: string;

  /** Phase 0 required explicit experiment classification */
  experimentKind: ExperimentKind;

  /** Short display name for use in UI and export headers */
  title: string;

  /** Neutral one-paragraph description of this experiment's purpose */
  description: string;

  /** The research scenario this experiment is designed to investigate */
  scenarioId: ResearchScenarioId;

  /** Explicit random seed for reproducibility */
  seed: number;

  /** Number of simulation ticks to run */
  ticks: number;

  /** Take a snapshot every N ticks */
  sampleEveryTicks: number;

  /** ID of the AeternaNaturalPreset to apply at runtime */
  runtimePresetId: string;

  /**
   * Optional partial overrides applied on top of the runtime preset config.
   * Keys must correspond to AeternaNaturalRuntimeConfig fields.
   * Must not activate runtime feedback paths unless safetyLevel = 'experimental'.
   */
  runtimeConfigOverrides?: Record<string, unknown>;

  /**
   * Observable metric kinds that are the focus of this experiment.
   * These are observation targets — NOT guaranteed outcomes.
   */
  expectedObservationKinds: string[];

  /**
   * Safety level for this experiment.
   * 'safe'        : uses safe-mode runtime config only
   * 'research'    : uses research-mode preset (no runtime feedback coupling)
   * 'experimental': uses experimental preset (runtime feedback paths may be active)
   */
  safetyLevel: 'safe' | 'research' | 'experimental';

  /** Tags for export filtering, grouping, and search */
  exportTags: string[];

  /** Optional clarifying notes about what this experiment does not demonstrate */
  notes?: string[];
}
