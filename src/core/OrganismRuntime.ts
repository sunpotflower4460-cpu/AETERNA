/**
 * OrganismRuntime
 *
 * Responsible for:
 * - Organism tick coordination
 * - Living state management
 * - Engine orchestration
 * - Mediation between engines and organism state
 *
 * This runtime serves as the central coordinator for organism-level
 * updates, delegating to specialized engines while maintaining coherence.
 */

import type { DynamicsEngine } from './DynamicsEngine.js';
import type { PredictionCore } from './PredictionCore.js';
import type { PlasticityEngine } from './PlasticityEngine.js';
import type { NoiseField } from './NoiseField.js';

export interface OrganismRuntimeConfig {
  dynamicsEngine: DynamicsEngine;
  predictionCore: PredictionCore;
  plasticityEngine: PlasticityEngine;
  noiseField: NoiseField;
}

export class OrganismRuntime {
  private dynamicsEngine: DynamicsEngine;
  private predictionCore: PredictionCore;
  private plasticityEngine: PlasticityEngine;
  private noiseField: NoiseField;

  constructor(config: OrganismRuntimeConfig) {
    this.dynamicsEngine = config.dynamicsEngine;
    this.predictionCore = config.predictionCore;
    this.plasticityEngine = config.plasticityEngine;
    this.noiseField = config.noiseField;
  }

  /**
   * Run one organism tick
   * Coordinates all engines and returns organism state
   */
  tick(network: any, inputs: any): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    // For now, this is a placeholder that delegates to the network's existing updateDynamics
    // Future iterations will move more orchestration logic here

    return {
      dynamicsEngine: this.dynamicsEngine,
      predictionCore: this.predictionCore,
      plasticityEngine: this.plasticityEngine,
      noiseField: this.noiseField,
    };
  }

  /**
   * Get references to engines for external access
   */
  getEngines() {
    return {
      dynamics: this.dynamicsEngine,
      prediction: this.predictionCore,
      plasticity: this.plasticityEngine,
      noise: this.noiseField,
    };
  }
}

/**
 * Create a new OrganismRuntime with default engines
 */
export function createOrganismRuntime(config: OrganismRuntimeConfig): OrganismRuntime {
  return new OrganismRuntime(config);
}
