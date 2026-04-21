/**
 * Derive Open-State Snapshot
 *
 * AETERNA v0.5 / Quantum-Inspired Q1-1
 *
 * Open-State Snapshot を derived state から作成する pure function
 *
 * Purpose:
 * - felt-state / arousal-awareness / need-motivation から mixed snapshot を作る
 * - stabilityIndex と mixtureEntropy を算出する
 * - dominantPole を便宜的に判定する
 *
 * Important:
 * - これは観測用の純粋関数であり、organism core を変更しない
 * - stabilityIndex / mixtureEntropy は derived / proxy 扱い
 * - dominantPole は observer 用であり、行動分岐には使わない
 */

import type { OpenStateSnapshot } from '../types/openStateSnapshot.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { NeedMotivationState } from '../types/needMotivation.ts';

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate stability index from felt-state and drive components
 *
 * This is a derived / proxy measure of current mixed-state stability.
 * Combines:
 * - coherence (high = stable)
 * - boundaryIntegrity (high = stable)
 * - restorationReadiness (moderate = stable)
 * - overload (low = stable)
 * - safetyNeed (not excessive = stable)
 * - awarenessWindow (not extreme = stable)
 */
function calculateStabilityIndex(
  feltMix: OpenStateSnapshot['feltMix'],
  activationMix: OpenStateSnapshot['activationMix'],
  driveMix: OpenStateSnapshot['driveMix']
): number {
  // Positive stability factors
  const coherenceContribution = clampFinite(feltMix.coherence, 0, 1) * 0.30;
  const boundaryContribution = clampFinite(feltMix.boundaryIntegrity, 0, 1) * 0.25;
  const restorationContribution = clampFinite(feltMix.restorationReadiness, 0, 1) * 0.15;

  // Negative stability factors
  const overloadPenalty = clampFinite(feltMix.overload, 0, 1.5) * 0.15;
  const safetyNeedPenalty = clampFinite(driveMix.safetyNeed, 0, 1.2) * 0.10;

  // Awareness window extremes (too narrow or collapsing)
  const awarenessOk = clampFinite(activationMix.awarenessWindow, 0, 1) > 0.15 ? 0.05 : 0.0;

  const rawStability =
    coherenceContribution +
    boundaryContribution +
    restorationContribution +
    awarenessOk -
    overloadPenalty -
    safetyNeedPenalty;

  return clampFinite(rawStability, 0, 1);
}

/**
 * Calculate mixture entropy (proxy for how mixed the state is)
 *
 * This is NOT literal quantum entropy.
 * This is a rough indicator of concentration vs distribution.
 *
 * Method: Normalize a set of representative axes, then calculate
 * Shannon entropy-like measure from their distribution.
 *
 * Higher entropy = more mixed state (multiple tendencies present)
 * Lower entropy = more concentrated state (single pole dominant)
 */
function calculateMixtureEntropy(
  feltMix: OpenStateSnapshot['feltMix'],
  activationMix: OpenStateSnapshot['activationMix'],
  driveMix: OpenStateSnapshot['driveMix']
): number {
  // Select representative axes for mixture calculation
  const axes = [
    clampFinite(feltMix.depletion, 0, 1.5),
    clampFinite(feltMix.overload, 0, 1.5),
    clampFinite(feltMix.coherence, 0, 1),
    clampFinite(feltMix.restorationReadiness, 0, 1),
    clampFinite(activationMix.arousalLevel, 0, 1),
    clampFinite(activationMix.awarenessWindow, 0, 1),
    clampFinite(driveMix.energyNeed, 0, 1.2),
    clampFinite(driveMix.safetyNeed, 0, 1.2),
    clampFinite(driveMix.noveltyMotivation, 0, 1),
    clampFinite(driveMix.repetitionMotivation, 0, 1),
    clampFinite(driveMix.explorationMotivation, 0, 1),
  ];

  // Normalize to probability distribution
  const sum = axes.reduce((acc, v) => acc + v, 0);
  if (sum < 0.01) {
    // Degenerate case: all near-zero
    return 0.0;
  }

  const probabilities = axes.map(v => v / sum);

  // Shannon entropy: -Σ(p * log2(p))
  let entropy = 0.0;
  for (const p of probabilities) {
    if (p > 0.001) {
      entropy -= p * Math.log2(p);
    }
  }

  return clampFinite(entropy, 0, 4.0);
}

/**
 * Determine dominant pole for observer/debug purposes
 *
 * This is a convenience label and should NOT be used for behavior branching.
 * Returns null if state is truly neutral-mixed.
 */
function determineDominantPole(
  feltMix: OpenStateSnapshot['feltMix'],
  _activationMix: OpenStateSnapshot['activationMix'],
  driveMix: OpenStateSnapshot['driveMix']
): string | null {
  // Check for restoration dominance
  if (feltMix.restorationReadiness > 0.6 && driveMix.restorationNeed > 0.4) {
    return 'restoration';
  }

  // Check for overload dominance
  if (feltMix.overload > 0.7 || driveMix.safetyNeed > 0.8) {
    return 'overload';
  }

  // Check for exploration dominance
  if (driveMix.explorationMotivation > 0.6 && driveMix.noveltyMotivation > 0.5) {
    return 'exploration';
  }

  // Check for safety/withdraw dominance
  if (driveMix.safetyNeed > 0.6 && feltMix.boundaryIntegrity < 0.4) {
    return 'safety';
  }

  // Otherwise, state is neutral-mixed
  return 'neutral-mixed';
}

/**
 * Derive complete OpenStateSnapshot from organism state
 *
 * This is a pure function - no side effects.
 * Creates a snapshot of mixed internal tendencies for observation.
 */
export function deriveOpenStateSnapshot(
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  needMotivation: NeedMotivationState
): OpenStateSnapshot {
  // Build feltMix directly from FeltStateVector
  const feltMix = {
    depletion: feltState.depletion,
    overload: feltState.overload,
    coherence: feltState.coherence,
    boundaryIntegrity: feltState.boundaryIntegrity,
    restorationReadiness: feltState.restorationReadiness,
    perturbationLoad: feltState.perturbationLoad,
    openness: feltState.openness,
  };

  // Build activationMix from ArousalAwarenessState
  const activationMix = {
    arousalLevel: arousalAwareness.arousalLevel,
    awarenessWindow: arousalAwareness.awarenessWindow,
    salienceOpenness: arousalAwareness.salienceOpenness,
    foregroundPressure: arousalAwareness.foregroundPressure,
  };

  // Build driveMix from NeedMotivationState
  const driveMix = {
    energyNeed: needMotivation.energyNeed,
    safetyNeed: needMotivation.safetyNeed,
    restorationNeed: needMotivation.restorationNeed,
    noveltyMotivation: needMotivation.noveltyMotivation,
    repetitionMotivation: needMotivation.repetitionMotivation,
    explorationMotivation: needMotivation.explorationMotivation,
  };

  // Calculate derived indices
  const stabilityIndex = calculateStabilityIndex(feltMix, activationMix, driveMix);
  const mixtureEntropy = calculateMixtureEntropy(feltMix, activationMix, driveMix);
  const dominantPole = determineDominantPole(feltMix, activationMix, driveMix);

  return {
    timestamp: feltState.timestamp,
    feltMix,
    activationMix,
    driveMix,
    stabilityIndex,
    mixtureEntropy,
    dominantPole,
  };
}
