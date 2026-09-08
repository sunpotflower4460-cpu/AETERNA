import type { WorldMediumState } from '../types/worldMediumState.ts';

/**
 * initializeWorldMediumState
 *
 * W3: Initialize the simulated World Medium with stable, moderate starting values.
 *
 * Design principles:
 * - Start with moderate, non-extreme values
 * - All values in [0, 1] range
 * - No NaN or Infinity
 * - Bias toward stability to establish a baseline
 * - Values should allow for both pulse-driven and natural change
 *
 * This is the initial state of the external world simulation,
 * not part of AETERNA's internal state.
 */
export function initializeWorldMediumState(): WorldMediumState {
  return {
    // Simulated time in ms, not wall-clock: starts at 0 and accumulates by
    // dt in updateWorldMedium. Using Date.now() here made every run
    // (and the "natural drift" phase computed from it) depend on real
    // elapsed wall-clock time, defeating seed-based reproducibility -
    // see docs/vessel/vessel-roadmap.md K1.
    timestamp: 0,

    // Moderate ambient conditions
    ambientLight: 0.5, // Mid-range light level
    ambientNoise: 0.2, // Low background noise

    // Moderate resistance and echo
    surfaceResistance: 0.4, // Moderate absorption of pulses
    echoLevel: 0.2, // Low initial echo/reverberation

    // Slow natural dynamics
    motionDrift: 0.1, // Small autonomous drift
    fieldTemperature: 0.35, // Moderately stable world

    // Feedback parameters for future use (W4+)
    feedbackDelay: 0.2, // Moderate baseline delay

    // Impact and stability
    lastPulseImpact: 0.0, // No pulse received yet
    mediumStability: 0.7, // Relatively stable starting state

    // Optional fields initialized to low values
    visualResidue: 0.0,
    forceResidue: 0.0,
    worldTurbulence: 0.15, // Low initial turbulence
    returnReadiness: 0.3, // Moderate readiness baseline
  };
}
