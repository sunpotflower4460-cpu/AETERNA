import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DelayProfileState } from '../types/delayProfileState.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

const MAX_DELAY_SAMPLES = 12;
const DELAY_BAND_COUNT = 5;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + clamp01(value), 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = average(values);
  return clamp01(
    values.reduce((sum, value) => sum + (clamp01(value) - mean) ** 2, 0) / values.length,
  );
}

function latestTimestamp(values: Array<number | undefined>): number {
  const finiteValues = values.filter((value): value is number => Number.isFinite(value));
  return finiteValues.length > 0 ? Math.max(...finiteValues) : 0;
}

function delayHistogram(samples: number[]): number[] {
  if (samples.length === 0) return Array.from({ length: DELAY_BAND_COUNT }, () => 0);
  const counts = Array.from({ length: DELAY_BAND_COUNT }, () => 0);
  for (const sample of samples) {
    const index = Math.min(DELAY_BAND_COUNT - 1, Math.floor(clamp01(sample) * DELAY_BAND_COUNT));
    counts[index] += 1;
  }
  return counts.map((count) => clamp01(count / samples.length));
}

function stableWindowScore(samples: number[]): number {
  if (samples.length <= 1) return samples.length === 1 ? 0.5 : 0;
  let stablePairs = 0;
  for (let index = 1; index < samples.length; index += 1) {
    if (Math.abs(samples[index] - samples[index - 1]) <= 0.08) {
      stablePairs += 1;
    }
  }
  return clamp01((stablePairs / (samples.length - 1)) * Math.min(samples.length / 6, 1));
}

export function deriveDelayProfile(params: {
  closure: BodyWorldClosureState | null;
  reafference: ReafferenceComparisonState | null;
  returns: SensoryReturnPacket[];
  world: WorldMediumState | null;
  previousProfile?: DelayProfileState | null;
  dt: number;
}): DelayProfileState {
  const {
    closure,
    reafference,
    returns,
    world,
    previousProfile = null,
    dt,
  } = params;

  const timestamp = latestTimestamp([
    closure?.timestamp,
    reafference?.timestamp,
    world?.timestamp,
    returns[returns.length - 1]?.timestamp,
    previousProfile?.timestamp,
  ]);

  const measuredDelays = [
    closure?.roundTripDelay,
    reafference?.returnDelay,
    world?.feedbackDelay,
    returns.length > 0 ? average(returns.map((packet) => packet.returnDelayHint)) : undefined,
  ].filter((value): value is number => Number.isFinite(value));

  const currentDelay = measuredDelays.length > 0 ? average(measuredDelays) : 0;
  const previousSamples = previousProfile?.recentDelaySamples ?? [];
  const recentDelaySamples = [...previousSamples, currentDelay]
    .map((sample) => clamp01(sample))
    .slice(-MAX_DELAY_SAMPLES);

  const averageReturnDelay = average(recentDelaySamples);
  const minReturnDelay = recentDelaySamples.length > 0 ? Math.min(...recentDelaySamples) : 0;
  const maxReturnDelay = recentDelaySamples.length > 0 ? Math.max(...recentDelaySamples) : 0;
  const delayVariance = variance(recentDelaySamples);
  const stableDelayWindow = stableWindowScore(recentDelaySamples);
  const unstableDelayScore = clamp01(
    delayVariance * 0.55 +
      Math.abs(maxReturnDelay - minReturnDelay) * 0.25 +
      Math.max(0, 1 - stableDelayWindow) * 0.20,
  );

  const delayedEchoScore = clamp01(average([
    reafference?.delayedEchoScore ?? 0,
    averageReturnDelay * (world?.echoLevel ?? 0),
    averageReturnDelay * average(returns.map((packet) => packet.echoLinked ?? 0)),
  ]));

  const histogram = delayHistogram(recentDelaySamples);
  let dominantDelayBand = 0;
  let dominantBandValue = -1;
  histogram.forEach((value, index) => {
    if (value > dominantBandValue) {
      dominantBandValue = value;
      dominantDelayBand = index / (DELAY_BAND_COUNT - 1);
    }
  });

  const sourceCoverage = clamp01(measuredDelays.length / 4);
  const historyCoverage = clamp01(recentDelaySamples.length / 6);
  const dtQuality = Number.isFinite(dt) && dt > 0 ? clamp01(dt / 0.12) : 0.35;
  const delayProfileConfidence = clamp01(
    sourceCoverage * 0.45 +
      historyCoverage * 0.25 +
      (1 - unstableDelayScore) * 0.15 +
      (1 - Math.abs(currentDelay - averageReturnDelay)) * 0.1 +
      dtQuality * 0.05,
  );

  return {
    timestamp,
    averageReturnDelay,
    minReturnDelay,
    maxReturnDelay,
    delayVariance,
    stableDelayWindow,
    unstableDelayScore,
    delayedEchoScore,
    delayProfileConfidence,
    recentDelaySamples,
    delayHistogram: histogram,
    dominantDelayBand,
  };
}
