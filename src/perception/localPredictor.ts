/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PredictionPacket } from '../types/packets.js';
import { computeMeanLocalPredError, computeMeanPredictionError } from '../core/torusMetrics.ts';
import { updatePredictionError } from '../core/torusDynamics.ts';
import { updateLocalPrediction } from './localPrediction.ts';

export { updateLocalPrediction };

export function runLocalPredictorStage(network: any) {
  updateLocalPrediction(network);
}

export function buildPredictionPacket(network: any): PredictionPacket {
  updatePredictionError(network);
  let predictionSum = 0;
  let maxPredictionError = 0;
  for (let i = 0; i < network.numNodes; i++) {
    predictionSum += network.localPrediction[i];
    const errorAbs = Math.abs(network.predictionError[i]);
    if (errorAbs > maxPredictionError) maxPredictionError = errorAbs;
  }
  return {
    meanPrediction: predictionSum / network.numNodes,
    meanPredictionError: computeMeanPredictionError(network),
    maxPredictionError,
    meanLocalPredictionError: computeMeanLocalPredError(network),
  };
}
