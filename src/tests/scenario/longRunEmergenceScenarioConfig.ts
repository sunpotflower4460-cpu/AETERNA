/**
 * Long-Run Natural Emergence Scenario Configuration
 *
 * S8: Long-Run Natural Emergence Scenarios
 *
 * Config types for long-run headless scenario runs.
 * No semantic fields, no runtime graph, no Node bridge.
 */

export type LongRunWorldMode =
  | 'quiet'
  | 'weakRepeatedReturn'
  | 'delayedReturn'
  | 'alternatingPerturbation'
  | 'stableMedium'
  | 'unstableMedium'
  | 'highResistance'
  | 'lowResistance'
  | 'slowEcho'
  | 'fastEcho';

export interface LongRunEmergenceScenarioConfig {
  /** World mode controlling the simulated environment behavior */
  worldMode: LongRunWorldMode;
  /** Whether minimal natural feedback is enabled (for ablation comparison) */
  feedbackEnabled: boolean;
  /** Perturbation level 0–1 (0 = quiet, 1 = high) */
  perturbationLevel: number;
  /** Duration scale multiplier (1.0 = base tick count) */
  durationScale: number;
}
