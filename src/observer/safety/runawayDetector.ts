import type { ConservationResiduals } from './conservationCheckers.ts';

export interface SafetyDetectorSample {
  totalEnergy: number;
  semanticLeakCount: number;
  hasNaNOrInf: boolean;
  residuals: ConservationResiduals;
}

export interface RunawayDetectorConfig {
  residualThreshold: number;
  semanticLeakThreshold: number;
  energyGrowthFactorThreshold: number;
  trendWindow: number;
}

export interface RunawayDetectionResult {
  runaway: boolean;
  reasons: string[];
  shouldStopExperiment: boolean;
  shouldSaveSnapshot: boolean;
  logDirectory: 'logs/safety/';
}

const DEFAULT_CONFIG: RunawayDetectorConfig = {
  residualThreshold: 0.5,
  semanticLeakThreshold: 0,
  energyGrowthFactorThreshold: 1.25,
  trendWindow: 3,
};

function isIncreasing(values: number[]): boolean {
  if (values.length < 2) return false;
  for (let i = 1; i < values.length; i += 1) {
    if (!(values[i] > values[i - 1])) return false;
  }
  return true;
}

function residualTrendExceeded(history: SafetyDetectorSample[], threshold: number, trendWindow: number): boolean {
  const window = history.slice(-trendWindow);
  if (window.length < trendWindow) return false;

  const energy = window.map((item) => item.residuals.energyResidual);
  const momentum = window.map((item) => item.residuals.momentumResidual);
  const winding = window.map((item) => item.residuals.windingResidual);

  const exceeds = (values: number[]) => values.every((value) => Number.isFinite(value) && value > threshold) && isIncreasing(values);

  return exceeds(energy) || exceeds(momentum) || exceeds(winding);
}

function energyExponentialDivergence(history: SafetyDetectorSample[], growthFactorThreshold: number, trendWindow: number): boolean {
  const window = history.slice(-trendWindow);
  if (window.length < trendWindow) return false;

  for (let i = 1; i < window.length; i += 1) {
    const prev = Math.abs(window[i - 1].totalEnergy);
    const current = Math.abs(window[i].totalEnergy);
    if (!Number.isFinite(prev) || !Number.isFinite(current)) return true;
    const denom = Math.max(prev, 1e-12);
    if (current / denom <= growthFactorThreshold) return false;
  }
  return true;
}

export function detectRunaway(
  history: SafetyDetectorSample[],
  config?: Partial<RunawayDetectorConfig>,
): RunawayDetectionResult {
  const merged: RunawayDetectorConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const reasons: string[] = [];

  if (history.some((sample) => sample.hasNaNOrInf)) {
    reasons.push('Field values contain NaN/Inf.');
  }

  const latest = history[history.length - 1];
  if (latest && latest.semanticLeakCount > merged.semanticLeakThreshold) {
    reasons.push('semanticLeakCount exceeded threshold.');
  }

  if (residualTrendExceeded(history, merged.residualThreshold, merged.trendWindow)) {
    reasons.push('Conservation residuals exceeded threshold and kept increasing.');
  }

  if (energyExponentialDivergence(history, merged.energyGrowthFactorThreshold, merged.trendWindow)) {
    reasons.push('Total energy diverged exponentially.');
  }

  const runaway = reasons.length > 0;

  return {
    runaway,
    reasons,
    shouldStopExperiment: runaway,
    shouldSaveSnapshot: runaway,
    logDirectory: 'logs/safety/',
  };
}
