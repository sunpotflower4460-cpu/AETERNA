/**
 * DynamicsEngine
 *
 * Responsible for:
 * - Torus wave propagation and flow
 * - Baseline activity updates
 * - Local physical dynamics
 * - Dynamics packet assembly
 *
 * This engine encapsulates the core torus dynamics update loop,
 * separating it from organism-level orchestration.
 */

import type { DynamicsPacket } from '../types/packets.js';
import { updateDynamicsCore } from './dynamicCore.ts';

export interface IDynamicsEngine {
  /**
   * Run one dynamics update cycle
   * Returns dynamics packet with arousal, sigma, cluster ratio, etc.
   */
  runDynamicsUpdate(network: any): DynamicsPacket; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class DynamicsEngine implements IDynamicsEngine {
  runDynamicsUpdate(network: any): DynamicsPacket { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { arousal, freqRatio } = updateDynamicsCore(network);

    return {
      arousal,
      sigma: network.sigmaDisplay,
      clusterRatio: network.cachedMaxClusterSize / network.numNodes,
      phiProxy: network.cachedPhiApprox,
      phaseCoherence: network.cachedPhaseCoherence,
      firingRateError: network.firingRateError,
      freqRatio,
    };
  }
}

/**
 * Create a new DynamicsEngine instance
 */
export function createDynamicsEngine(): DynamicsEngine {
  return new DynamicsEngine();
}
