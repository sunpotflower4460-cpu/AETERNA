/**
 * NoiseField
 *
 * Responsible for:
 * - Baseline noise generation
 * - Spatially structured fluctuations
 * - Hardware random noise source
 * - Tension-based noise modulation
 *
 * This field handles stochastic noise injection to maintain variability
 * and ongoing activity, separated from deterministic dynamics.
 */

import { triggerNoise as triggerNoiseImpl } from './dynamicCore.js';

export interface INoiseField {
  /**
   * Trigger noise injection based on tension and sigma
   */
  triggerNoise(network: any, tension: number, sigmaDisplay: number): void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class NoiseField implements INoiseField {
  triggerNoise(network: any, tension: number, sigmaDisplay: number): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Actual noise logic remains in dynamicCore.ts for now
    // This is a thin wrapper that will evolve to contain noise logic
    triggerNoiseImpl(network, tension, sigmaDisplay);
  }
}

/**
 * Create a new NoiseField instance
 */
export function createNoiseField(): NoiseField {
  return new NoiseField();
}
