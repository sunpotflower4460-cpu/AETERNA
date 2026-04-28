/**
 * Local Excitability Field
 *
 * S5: Local Excitability Field
 *
 * These types describe a pre-neural / pre-semantic field profile that captures
 * the local excitability conditions across coarse regions of the torus life-field.
 *
 * Design principles:
 * - This is an observation field, not a neuron placement layer.
 * - regionId values are observation units, not semantic labels.
 * - All values are continuous, typically in [0, 1] range.
 * - No NaN or Infinity values permitted.
 * - No semantic interpretation (no label, meaning, concept, category, sameObject).
 * - Excitability describes conditions, not commands; firing is not triggered here.
 *
 * Future phases:
 * - S6: Path Formation by Repeated Flow (uses excitability field as pre-condition)
 * - S7: Proto-Network (uses path formation as scaffold)
 */

/**
 * LocalExcitabilityCell represents the excitability profile of a single coarse
 * torus region observed at one point in time. It is an observation unit, not a neuron.
 */
export interface LocalExcitabilityCell {
  /** Coarse region identifier on the torus. Not a semantic label. */
  regionId: string;

  /** Current activity level in this region. Range: 0–1 */
  activationLevel: number;

  /**
   * Derived composite measure of how excitable this region is.
   * Synthesized from activationLevel, thresholdProximity, traceResidue,
   * returnInfluence, propagationTendency, recoveryProgress, and localResistance.
   * Range: 0–1. Does not command firing.
   */
  excitability: number;

  /**
   * How close this region is to a threshold-like condition.
   * High value means a small perturbation could trigger local activity.
   * Range: 0–1. Observation only; no firing occurs in S5.
   */
  thresholdProximity: number;

  /**
   * Depth of temporary post-activation suppression.
   * High value means the region recently had strong local activation and
   * is now in a low-excitability recovery phase.
   * Range: 0–1.
   */
  refractoryDepth: number;

  /**
   * Progress toward recovery from refractory / depletion condition.
   * 0 = just entered refractory, 1 = fully recovered.
   * Range: 0–1.
   */
  recoveryProgress: number;

  /**
   * Residue from past flow, return, or activation events still present in this region.
   * Not semantic memory. Pre-semantic trace.
   * Range: 0–1.
   */
  traceResidue: number;

  /**
   * How much influence sensory return from the World Medium has on this region.
   * World Loop derived, pre-semantic.
   * Range: 0–1.
   */
  returnInfluence: number;

  /**
   * Tendency for local activity to propagate toward neighboring regions.
   * Derived from activation gradient, resistance, dissipation, and trace continuity.
   * Range: 0–1.
   */
  propagationTendency: number;

  /**
   * How much this region impedes flow or activity passage.
   * High localResistance means flow passes through with difficulty.
   * Range: 0–1.
   */
  localResistance: number;

  /**
   * How quickly activity and trace dissipate in this region.
   * High localDissipation means residue does not persist long.
   * Range: 0–1.
   */
  localDissipation: number;

  /**
   * Confidence in this local observation.
   * Not a measure of semantic certainty. Reflects data availability and stability.
   * Range: 0–1.
   */
  confidence: number;
}

/**
 * LocalExcitabilityFieldState aggregates the per-region cells and
 * provides field-level summary statistics.
 */
export interface LocalExcitabilityFieldState {
  /** Frame timestamp */
  timestamp: number;

  /** Number of coarse regions in this observation */
  regionCount: number;

  /** Mean excitability across all regions */
  averageExcitability: number;

  /** Maximum excitability across all regions */
  maxExcitability: number;

  /** Mean thresholdProximity across all regions */
  averageThresholdProximity: number;

  /** Mean traceResidue across all regions */
  averageTraceResidue: number;

  /** Mean returnInfluence across all regions */
  averageReturnInfluence: number;

  /** Mean propagationTendency across all regions */
  averagePropagationTendency: number;

  /** Count of regions with excitability >= 0.6 */
  highExcitabilityRegionCount: number;

  /** Count of regions with thresholdProximity >= 0.6 */
  nearThresholdRegionCount: number;

  /** Count of regions actively in recovery (recoveryProgress > 0.05 && refractoryDepth > 0.1) */
  recoveringRegionCount: number;

  /** Per-region cell observations */
  cells: LocalExcitabilityCell[];

  /**
   * Aggregate confidence in this field observation.
   * Derived from mean cell confidence and data availability.
   * Range: 0–1.
   */
  fieldConfidence: number;

  /** Variance of excitability across regions (optional) */
  excitabilityVariance?: number;

  /**
   * Proxy for how strong spatial gradients in excitability are
   * across adjacent regions (optional).
   */
  regionalGradientStrength?: number;

  /** Count of local hotspot regions (excitability > 0.7) (optional) */
  localHotspotCount?: number;
}
