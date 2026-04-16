/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DynamicsPacket } from '../types/packets.js';
import {
  autoPredictAndError,
  injectPredictionError,
  triggerNoise,
  updateBaseline,
  updateBaselineAndResidue,
  updateDynamicsCore,
  updatePredictionError,
  updateResidue,
} from './dynamicCore.ts';

export {
  autoPredictAndError,
  injectPredictionError,
  triggerNoise,
  updateBaseline,
  updatePredictionError,
  updateResidue,
};

export function runTorusDynamicsStage(network: any): DynamicsPacket {
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

export function runBaselineResidueStage(network: any) {
  return updateBaselineAndResidue(network);
}
