/**
 * Sensory Return Packet
 *
 * W4: Sensory Return Introduction
 *
 * SensoryReturnPacket represents pre-semantic sensory signals that return from
 * the World Medium back to AETERNA. These are NOT semantic inputs or meanings.
 * They are simulated signals from the world that may eventually feed into the
 * perturbation/mismatch pipeline.
 *
 * Design principles:
 * - Sensory Return is NOT semantic input
 * - It is pre-semantic signal from World Medium
 * - W4 only handles simulated return (no real sensors yet)
 * - Reafference Comparison (self-caused vs world-caused) is W5, not W4
 * - All values are continuous, typically in [0, 1] range
 * - No NaN or Infinity values permitted
 *
 * Future phases:
 * - W5: Reafference Comparison — distinguishing self-caused vs world-caused
 * - Later: Real sensors (camera, mic, IMU) replace simulated world
 */

/**
 * Channel types for sensory return.
 * These correspond to simulated modalities from the World Medium.
 */
export type SensoryReturnChannel =
  | 'simulatedLight'
  | 'simulatedNoise'
  | 'simulatedPressure'
  | 'simulatedMotion'
  | 'simulatedEcho';

/**
 * SensoryReturnPacket represents a pre-semantic signal returning from
 * World Medium to AETERNA.
 */
export interface SensoryReturnPacket {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Sensory channel — which modality this signal corresponds to.
   * Maps to World Medium fields:
   * - simulatedLight ← ambientLight change
   * - simulatedNoise ← ambientNoise change
   * - simulatedPressure ← surfaceResistance change
   * - simulatedMotion ← motionDrift change
   * - simulatedEcho ← echoLevel change
   */
  channel: SensoryReturnChannel;

  /**
   * Intensity: strength of the returning signal.
   * Range: 0–1
   */
  intensity: number;

  /**
   * Novelty: how different this return is from previous returns.
   * Computed from change in World Medium state.
   * Range: 0–1
   */
  novelty: number;

  /**
   * Locality: how localized vs global this return is.
   * High locality = local change, low = global/ambient.
   * Range: 0–1
   */
  locality: number;

  /**
   * Rhythm: periodicity or rhythmic quality of the return.
   * Derived from temporal patterns in World Medium changes.
   * Range: 0–1
   */
  rhythm: number;

  /**
   * World origin strength: how strongly this signal appears to originate
   * from the World Medium rather than being noise.
   * W4 does NOT yet distinguish self-caused vs world-caused (that's W5).
   * Range: 0–1
   */
  worldOriginStrength: number;

  /**
   * Return delay hint: estimate of how delayed this return is.
   * Derived from World Medium feedbackDelay.
   * Range: 0–1
   */
  returnDelayHint: number;

  /**
   * Medium stability hint: how stable the World Medium was when
   * generating this return.
   * Derived from World Medium mediumStability.
   * Range: 0–1
   */
  mediumStabilityHint: number;

  /**
   * Optional: Cross-modal linkage hints.
   * These represent weak correlations between different sensory channels.
   * All range 0–1.
   */
  echoLinked?: number;
  motionLinked?: number;
  pressureLinked?: number;
  lightLinked?: number;

  /**
   * Optional: Return readiness proxy.
   * How ready the world was to generate this return.
   * Range: 0–1
   */
  returnReadiness?: number;
}
