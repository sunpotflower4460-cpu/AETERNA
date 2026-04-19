/**
 * PredictionCore
 *
 * Responsible for:
 * - Local prediction updates
 * - Mismatch/error computation
 * - Touch expectation connection
 * - Prediction packet assembly
 *
 * This core handles prediction error calculation and local prediction state,
 * separated from dynamics and plasticity.
 */

import type { PredictionPacket } from '../types/packets.js';

export interface IPredictionCore {
  /**
   * Build prediction packet from current network state
   */
  buildPredictionPacket(network: any): PredictionPacket; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class PredictionCore implements IPredictionCore {
  buildPredictionPacket(network: any): PredictionPacket { // eslint-disable-line @typescript-eslint/no-explicit-any
    const meanPredError = this.computeMeanPredictionError(network);
    const meanLocalPredError = this.computeMeanLocalPredictionError(network);
    const maxPredError = this.computeMaxPredictionError(network);

    return {
      meanPredictionError: meanPredError,
      meanLocalPredictionError: meanLocalPredError,
      maxPredictionError: maxPredError,
    };
  }

  private computeMeanPredictionError(network: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
    let sum = 0;
    for (let i = 0; i < network.numNodes; i++) {
      sum += Math.abs(network.predictionError[i]);
    }
    return sum / network.numNodes;
  }

  private computeMeanLocalPredictionError(network: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
    let sum = 0;
    for (let i = 0; i < network.numNodes; i++) {
      const pred = network.localPrediction[i];
      const actual = network.currentBuffer[i];
      const err = Math.abs(actual - pred);
      sum += err;
    }
    return sum / network.numNodes;
  }

  private computeMaxPredictionError(network: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
    let max = 0;
    for (let i = 0; i < network.numNodes; i++) {
      const err = Math.abs(network.predictionError[i]);
      if (err > max) max = err;
    }
    return max;
  }
}

/**
 * Create a new PredictionCore instance
 */
export function createPredictionCore(): PredictionCore {
  return new PredictionCore();
}
