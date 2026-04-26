/**
 * World Medium State
 *
 * W3: Simulated World Medium Introduction
 *
 * WorldMediumState represents the minimal external environment that receives
 * AETERNA's Actuation Pulse and changes in response. This is NOT part of
 * AETERNA's internal state. It is an external simulation — a small "world"
 * that AETERNA acts upon.
 *
 * Design principles:
 * - World Medium is OUTSIDE AETERNA, not part of the organism
 * - Receives Actuation Pulse and changes state accordingly
 * - Changes naturally over time (slow drift, decay) even without pulses
 * - Does NOT yet return Sensory Return to AETERNA (W4)
 * - Does NOT perform semantic interpretation or meaning assignment
 * - All values are continuous, typically in [0, 1] range
 * - No NaN or Infinity values permitted
 *
 * Future phases:
 * - W4: Sensory Return — World Medium changes feed back to AETERNA
 * - W5: Reafference Comparison — distinguishing self-caused vs world-caused
 * - Later: Real sensors (camera, mic, IMU) replace simulated world
 */

export interface WorldMediumState {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Ambient light level in the simulated environment.
   * May be affected by visual pulses from AETERNA.
   * Future: may return as simulatedLight sensory input (W4+).
   * Range: 0–1
   */
  ambientLight: number;

  /**
   * Ambient noise level in the simulated environment.
   * Background sound/vibration in the virtual world.
   * Future: may return as simulatedSound/Echo (W4+).
   * Range: 0–1
   */
  ambientNoise: number;

  /**
   * Surface resistance: how much the world absorbs/resists AETERNA's actuation.
   * High resistance = pulses are dampened/absorbed.
   * Low resistance = pulses propagate more freely.
   * Range: 0–1
   */
  surfaceResistance: number;

  /**
   * Echo level: how much AETERNA's pulses reverberate in the world.
   * High echo = pulses leave lingering traces.
   * Low echo = pulses dissipate quickly.
   * Range: 0–1
   */
  echoLevel: number;

  /**
   * Motion drift: slow autonomous movement/change in the world.
   * Represents the world's own dynamics independent of AETERNA.
   * Range: 0–1
   */
  motionDrift: number;

  /**
   * Field temperature: how easily the world changes state.
   * NOT physical temperature — a proxy for world mutability.
   * High = world is volatile, changes easily.
   * Low = world is stable, changes slowly.
   * Range: 0–1
   */
  fieldTemperature: number;

  /**
   * Feedback delay: baseline delay for future Sensory Return (W4+).
   * Represents how long it takes for world changes to "return" to perception.
   * Range: 0–1 (normalized delay factor)
   */
  feedbackDelay: number;

  /**
   * Last pulse impact: how strongly the most recent Actuation Pulse
   * affected the world. Decays over time.
   * Range: 0–1
   */
  lastPulseImpact: number;

  /**
   * Medium stability: how stable/predictable the world state is.
   * High = world is in a stable configuration.
   * Low = world is volatile/turbulent.
   * Range: 0–1
   */
  mediumStability: number;

  /**
   * Visual residue (optional): lingering effect of visual pulses.
   * Decays naturally over time.
   * Range: 0–1
   */
  visualResidue?: number;

  /**
   * Force residue (optional): lingering effect of simulated force pulses.
   * Decays naturally over time.
   * Range: 0–1
   */
  forceResidue?: number;

  /**
   * World turbulence (optional): current level of chaotic activity in the world.
   * May rise with strong pulses or high fieldTemperature.
   * Range: 0–1
   */
  worldTurbulence?: number;

  /**
   * Return readiness (optional): proxy for how ready the world is to
   * generate Sensory Return (W4+).
   * Range: 0–1
   */
  returnReadiness?: number;
}
