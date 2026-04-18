/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SubTorusSummaryPacket, LayerAggregatePacket } from '../types/packets.js';

/**
 * Extract representative values from a single sub-torus for upward propagation.
 *
 * This function aggregates the state of a sub-torus into a compact summary packet
 * that can be consumed by the upper torus layer.
 */
export function extractSubTorusSummary(subTorus: any): SubTorusSummaryPacket {
  const N = subTorus.numNodes;

  let sumActivity = 0;
  for (let i = 0; i < N; i++) {
    sumActivity += subTorus.spikeTrace[i];
  }
  const meanActivity = sumActivity / N;

  const arousal = subTorus.currGenFiring / N;
  const sigma = subTorus.sigmaDisplay;
  const clusterRatio = subTorus.cachedMaxClusterSize / N;
  const phiProxy = subTorus.cachedPhiApprox;

  let sumPredError = 0;
  for (let i = 0; i < N; i++) {
    sumPredError += Math.abs(subTorus.predictionError[i]);
  }
  const predictionErrorMean = sumPredError / N;

  return {
    meanActivity,
    arousal,
    sigma,
    clusterRatio,
    phiProxy,
    predictionErrorMean,
  };
}

/**
 * Aggregate summaries from all sub-tori into a single packet.
 */
export function aggregateSubToriSummaries(
  subTori: any[],
  gridWidth: number,
  gridHeight: number
): LayerAggregatePacket {
  const summaries = subTori.map(st => extractSubTorusSummary(st));
  return {
    summaries,
    gridWidth,
    gridHeight,
  };
}

/**
 * Map aggregated sub-torus summaries to upper torus input.
 *
 * Each node in the upper torus corresponds to one sub-torus.
 * This function converts the summary packet into an input signal
 * that can be injected into the upper torus.
 */
export function mapSummariesToUpperInput(
  aggregate: LayerAggregatePacket,
  upperTorusSize: number
): Float32Array {
  const input = new Float32Array(upperTorusSize);

  for (let i = 0; i < Math.min(aggregate.summaries.length, upperTorusSize); i++) {
    const summary = aggregate.summaries[i];
    input[i] = summary.meanActivity * 0.5 + summary.arousal * 0.3 + summary.phiProxy * 0.2;
  }

  return input;
}
