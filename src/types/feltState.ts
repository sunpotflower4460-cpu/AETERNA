/**
 * Felt-State Vector
 *
 * AETERNA v0.5 / A1: Felt-State / Interoception Expansion
 *
 * FeltStateVector represents the organism's internal qualitative state
 * as continuous numeric axes. This is NOT a human emotion model.
 * These are primitive-organism-level internal condition qualities.
 *
 * Purpose:
 * - Organize existing organism state into felt-quality axes
 * - Provide unified internal sensing vocabulary
 * - Support future interoceptive hierarchy
 *
 * Important:
 * - Values are continuous (not discrete categories)
 * - Labels like "depletion" are descriptive, not anthropomorphic
 * - This is a DERIVED view, not primary state
 */

export interface FeltStateVector {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Depletion: Energy reserve depletion / exhaustion sense
   * Derived from: energyReserve low, fatigue high
   * Range: 0 (no depletion) to 1+ (severe depletion)
   */
  depletion: number;

  /**
   * Overload: Pressure from excessive activity/perturbation
   * Derived from: overloadLevel, irritability, sustained errors
   * Range: 0 (no overload) to 1+ (severe overload)
   */
  overload: number;

  /**
   * Coherence: Self-coherence / stability sense
   * Derived from: coherenceMemory, cluster stability, selfCoherence
   * Range: 0 (incoherent) to 1 (highly coherent)
   */
  coherence: number;

  /**
   * Boundary Integrity: Sense of self-boundary maintenance
   * Derived from: boundaryIntegrity, fragmentation tendencies
   * Range: 0 (boundary loss) to 1 (strong boundary)
   */
  boundaryIntegrity: number;

  /**
   * Restoration Readiness: Readiness for recovery/restoration
   * Derived from: restorationBias, recoveryDrive
   * Range: 0 (no restoration) to 1 (high restoration readiness)
   */
  restorationReadiness: number;

  /**
   * Perturbation Load: Recent perturbation pressure
   * Derived from: recent perturbation, surprise, prediction errors
   * Range: 0 (calm) to 1+ (high perturbation)
   */
  perturbationLoad: number;

  /**
   * Openness: Openness to external engagement
   * Derived from: touchNeedBaseline, relationEngagement (minimal)
   * Range: 0 (closed) to 1 (open)
   */
  openness: number;
}
