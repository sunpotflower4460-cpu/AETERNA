/**
 * Derive Pressure Competition State
 *
 * AETERNA Phase 6 / Q2-1: Annealing-Inspired Pressure Competition
 *
 * Derives PressureCompetitionState from existing NeedMotivationState.
 * Multiple life-field pressures coexist and compete via a softmax-like
 * energy landscape rather than fixed if-branch priority ordering.
 *
 * Core principles:
 * - Pressures co-exist simultaneously — no single winner forced
 * - Competition result merely tilts the field toward a pressure, not locks it
 * - annealingTemperature is derived (not scheduled), based on spread of pressures
 * - dominantPressure is soft foreground, not a mode switch
 * - No semantic nodes, goals, or intentions are added
 *
 * This is a pure function for testability.
 */

import type { PressureCompetitionState } from '../types/pressureCompetitionState.ts';
import type { NeedMotivationState } from '../types/needMotivation.ts';

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Names for the six pressure axes, in index order.
 */
const PRESSURE_NAMES = [
  'safety',
  'restoration',
  'novelty',
  'repetition',
  'exploration',
  'withdrawal',
] as const;

type PressureName = (typeof PRESSURE_NAMES)[number];

/**
 * Compute softmax of values at a given temperature.
 * Uses max-subtraction for numerical stability.
 * Temperature must be > 0.
 */
function softmax(values: number[], temperature: number): number[] {
  const temp = Math.max(temperature, 0.01);
  const scaled = values.map(v => v / temp);
  const maxVal = Math.max(...scaled);
  const exps = scaled.map(v => Math.exp(v - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  if (sum === 0) return values.map(() => 1 / values.length);
  return exps.map(e => e / sum);
}

/**
 * Compute Shannon entropy of a probability distribution.
 * Returns 0 if the distribution is degenerate.
 */
function shannonEntropy(probs: number[]): number {
  return -probs.reduce((sum, p) => {
    if (p <= 0) return sum;
    return sum + p * Math.log(p);
  }, 0);
}

/**
 * Derive PressureCompetitionState from NeedMotivationState.
 *
 * Mapping:
 *   safetyPressure     ← safetyNeed
 *   restorationPressure ← restorationNeed * 0.6 + settlingMotivation * 0.4
 *   noveltyPressure    ← noveltyMotivation
 *   repetitionPressure ← repetitionMotivation
 *   explorationPressure ← explorationMotivation
 *   withdrawalPressure ← withdrawMotivation
 *
 * annealingTemperature is derived from how spread the pressures are:
 *   - High when pressures are similar (contested/diffuse)
 *   - Lower when one pressure clearly exceeds others (foregrounded)
 *
 * This is a pure function — no side effects.
 *
 * @param needMotivation  Current NeedMotivationState (already derived)
 * @param baseTemperature Base temperature for the competition (default 0.5)
 */
export function derivePressureCompetition(
  needMotivation: NeedMotivationState,
  baseTemperature = 0.5,
): PressureCompetitionState {
  // --- Map NeedMotivationState to 6 pressure axes ---

  const safetyPressure = clampFinite(needMotivation.safetyNeed, 0, 1.2);

  // Restoration blends restoration need (deficiency) and settling motivation (tendency)
  const restorationPressure = clampFinite(
    needMotivation.restorationNeed * 0.6 + needMotivation.settlingMotivation * 0.4,
    0,
    1,
  );

  const noveltyPressure = clampFinite(needMotivation.noveltyMotivation, 0, 1);
  const repetitionPressure = clampFinite(needMotivation.repetitionMotivation, 0, 1);
  const explorationPressure = clampFinite(needMotivation.explorationMotivation, 0, 1);
  const withdrawalPressure = clampFinite(needMotivation.withdrawMotivation, 0, 1);

  const pressureValues: number[] = [
    safetyPressure,
    restorationPressure,
    noveltyPressure,
    repetitionPressure,
    explorationPressure,
    withdrawalPressure,
  ];

  // --- Pressure energy: mean squared pressure (overall intensity proxy) ---
  const pressureEnergy =
    pressureValues.reduce((sum, v) => sum + v * v, 0) / pressureValues.length;

  // --- Derive annealing temperature from pressure spread ---
  // spread = max - mean: large spread means one axis dominates → lower temperature
  // small spread means all similar → higher temperature
  const maxPressure = Math.max(...pressureValues);
  const meanPressure = pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length;
  const pressureSpread = clampFinite(maxPressure - meanPressure, 0, 1);

  // Temperature decreases as one pressure emerges above others.
  // baseTemperature * (1 - spread * 0.5): range stays well above 0.
  const annealingTemperature = clampFinite(
    baseTemperature * (1.0 - pressureSpread * 0.5),
    0.05,
    2.0,
  );

  // --- Softmax competition ---
  const softmaxWeights = softmax(pressureValues, annealingTemperature);

  // --- Candidate energies: softmax weight per pressure name ---
  const candidateEnergies: Record<string, number> = {};
  PRESSURE_NAMES.forEach((name: PressureName, i) => {
    candidateEnergies[name] = softmaxWeights[i];
  });

  // --- Dominant pressure: highest softmax weight, only if clearly above uniform ---
  // Uniform weight = 1/6 ≈ 0.167. Require 1.35× uniform ≈ 0.225 to count as dominant.
  const uniformWeight = 1 / softmaxWeights.length;
  const dominanceThreshold = uniformWeight * 1.35;

  let dominantIdx = 0;
  let dominantWeight = softmaxWeights[0];
  for (let i = 1; i < softmaxWeights.length; i++) {
    if (softmaxWeights[i] > dominantWeight) {
      dominantWeight = softmaxWeights[i];
      dominantIdx = i;
    }
  }

  const dominantPressure: string | null =
    dominantWeight > dominanceThreshold ? PRESSURE_NAMES[dominantIdx] : null;

  // --- Shannon entropy (normalized) ---
  // maxEntropy = ln(N) for N equally likely outcomes; here N = 6
  const maxEntropy = Math.log(softmaxWeights.length);
  const rawEntropy = shannonEntropy(softmaxWeights);
  const competitionEntropy = clampFinite(rawEntropy / maxEntropy, 0, 1);

  // --- Competition stability: inverse of entropy ---
  const competitionStability = clampFinite(1 - competitionEntropy, 0, 1);

  return {
    timestamp: needMotivation.timestamp,
    safetyPressure,
    restorationPressure,
    noveltyPressure,
    repetitionPressure,
    explorationPressure,
    withdrawalPressure,
    dominantPressure,
    competitionEntropy,
    competitionStability,
    annealingTemperature,
    pressureEnergy,
    candidateEnergies,
  };
}
