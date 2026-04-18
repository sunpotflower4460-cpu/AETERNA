/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SubTorusSummaryPacket, LayerAggregatePacket, TopDownModulationPacket, HierarchicalFeedbackPacket } from '../types/packets.js';

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

/**
 * Generate top-down modulation packets from upper torus state.
 * Phase E2: Create weak, continuous influence that tilts sub-torus reactivity.
 *
 * This is NOT control or command - it's environmental modulation.
 * The upper layer acts as a field that slightly changes lower-layer conditions.
 */
export function generateTopDownModulation(
  upperTorus: any,
  numSubTori: number
): HierarchicalFeedbackPacket {
  const upperSigma = upperTorus.sigmaDisplay;
  const upperPhiProxy = upperTorus.cachedPhiApprox;
  const upperArousal = upperTorus.currGenFiring / upperTorus.numNodes;

  const perSubTorus: TopDownModulationPacket[] = [];

  for (let i = 0; i < numSubTori; i++) {
    // Extract upper torus node state corresponding to this sub-torus
    const upperNodeActivity = i < upperTorus.numNodes ? upperTorus.spikeTrace[i] : 0;
    const upperNodeValue = i < upperTorus.numNodes ? upperTorus.currentBuffer[i] : 0;

    // Compute weak modulation deltas
    // These are intentionally small to avoid upper layer domination
    const baselineGainDelta = computeBaselineGainDelta(
      upperSigma,
      upperArousal,
      upperNodeActivity
    );
    const rewriteGainDelta = computeRewriteGainDelta(
      upperPhiProxy,
      upperNodeValue
    );
    const thresholdDelta = computeThresholdDelta(
      upperSigma,
      upperNodeActivity
    );

    perSubTorus.push({
      baselineGainDelta,
      rewriteGainDelta,
      thresholdDelta,
    });
  }

  return {
    perSubTorus,
    sourceTopLevelSigma: upperSigma,
    sourceTopLevelPhiProxy: upperPhiProxy,
    sourceTopLevelArousal: upperArousal,
  };
}

/**
 * Compute baseline gain delta from upper state.
 * Affects the strength of baseline oscillations in sub-torus.
 */
function computeBaselineGainDelta(
  upperSigma: number,
  upperArousal: number,
  upperNodeActivity: number
): number {
  // Weak influence: higher upper arousal slightly increases baseline
  const arousalComponent = (upperArousal - 0.05) * 0.02;
  // Sigma deviation from 1.0 subtly affects baseline
  const sigmaComponent = (upperSigma - 1.0) * 0.008;
  // Node-specific activity adds local variation
  const nodeComponent = (upperNodeActivity - 0.3) * 0.015;

  const delta = arousalComponent + sigmaComponent + nodeComponent;

  // Clamp to prevent excessive modulation
  return clampDelta(delta, -0.08, 0.08);
}

/**
 * Compute rewrite gain delta from upper state.
 * Affects how strongly rewrite pressure influences sub-torus weights.
 */
function computeRewriteGainDelta(
  upperPhiProxy: number,
  upperNodeValue: number
): number {
  // Higher phi proxy (integration) slightly dampens rewrite
  const phiComponent = (upperPhiProxy - 0.3) * -0.012;
  // Node value contributes weak bias
  const nodeComponent = Math.tanh(upperNodeValue * 0.1) * 0.01;

  const delta = phiComponent + nodeComponent;

  return clampDelta(delta, -0.06, 0.06);
}

/**
 * Compute threshold delta from upper state.
 * Affects firing threshold in sub-torus (reactivity).
 */
function computeThresholdDelta(
  upperSigma: number,
  upperNodeActivity: number
): number {
  // Sigma > 1 (supercritical) slightly lowers threshold
  const sigmaComponent = (upperSigma - 1.0) * -0.01;
  // Active upper node slightly facilitates lower threshold
  const nodeComponent = upperNodeActivity * -0.008;

  const delta = sigmaComponent + nodeComponent;

  return clampDelta(delta, -0.05, 0.05);
}

/**
 * Clamp delta values with smoothing to prevent abrupt changes.
 */
function clampDelta(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;

  // Smooth clamping with tanh-like behavior near boundaries
  if (value < min) {
    return min + (value - min) * 0.1;
  }
  if (value > max) {
    return max + (value - max) * 0.1;
  }

  return value;
}
