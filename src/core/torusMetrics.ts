/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DynamicsPacket } from '../types/packets.js';
import {
  computeIntegrationProxy,
  computeLargestCluster,
  computeMeanLocalPredError,
  computeMeanPredictionError,
  computePhaseCoherence,
  updateDerivedStateCaches,
} from './derivedMetrics.ts';

export {
  computeIntegrationProxy,
  computeLargestCluster,
  computeMeanLocalPredError,
  computeMeanPredictionError,
  computePhaseCoherence,
  updateDerivedStateCaches,
};

export function runTorusMetricsStage(network: any, dynamicsPacket: DynamicsPacket): DynamicsPacket {
  updateDerivedStateCaches(network, dynamicsPacket.freqRatio);
  return {
    ...dynamicsPacket,
    clusterRatio: network.cachedMaxClusterSize / network.numNodes,
    phiProxy: network.cachedPhiApprox,
    phaseCoherence: network.cachedPhaseCoherence,
  };
}
