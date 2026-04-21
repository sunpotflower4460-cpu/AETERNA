/**
 * Beautiful Loop Minimal L3: Packet → Organism Modulation
 *
 * This module implements THIN modulation from Beautiful Loop packets
 * back to organism core. The purpose is to close the loop minimally,
 * returning internal observation as weak bias to existing dynamics.
 *
 * CRITICAL CONSTRAINTS:
 * - Packet does NOT become the main driver
 * - Modulation is WEAK (small deltas, heavily clamped)
 * - No direct mode switching or hard state overrides
 * - Must be possible to disable without breaking organism core
 * - Existing homeostasis/prediction/rewrite remain primary drivers
 */

import type { InteroceptionPacket } from '../types/interoception.ts';
import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';

/**
 * Beautiful Loop Modulation Bundle
 *
 * Contains weak delta values to be applied to organism core biases.
 * All deltas are small and clamped to prevent runaway.
 */
export interface BeautifulLoopModulation {
  /** Weak bias to novelty/surprise sensitivity (used in prediction) */
  noveltyBiasDelta: number;

  /** Weak bias toward withdraw/protection tendencies */
  withdrawBiasDelta: number;

  /** Weak pressure adjustment for rewrite tendency */
  rewritePressureDelta: number;

  /** Weak bias toward restoration/recovery */
  restorationBiasDelta: number;

  /** Weak adjustment to touch openness */
  touchOpennessDelta: number;
}

/**
 * Modulation configuration
 */
export interface ModulationConfig {
  /** Enable/disable modulation (for ablation studies) */
  enabled: boolean;

  /** Enable/disable interoception feedback */
  interoceptionFeedbackEnabled: boolean;

  /** Enable/disable self-world feedback */
  selfWorldFeedbackEnabled: boolean;

  /** Global modulation strength multiplier (0-1) */
  globalStrength: number;

  /** EMA smoothing factor for modulation deltas */
  smoothingFactor: number;
}

/**
 * Default modulation configuration
 */
export function createDefaultModulationConfig(): ModulationConfig {
  return {
    enabled: true,
    interoceptionFeedbackEnabled: true,
    selfWorldFeedbackEnabled: true,
    globalStrength: 1.0,
    smoothingFactor: 0.15,  // Smooth modulation over multiple frames
  };
}

/**
 * Clamp and finite-check utility
 */
function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute novelty bias delta from packet state
 *
 * When selfCoherence is low and worldPressure is high,
 * increase sensitivity to novelty slightly.
 */
function computeNoveltyBiasDelta(
  interoception: InteroceptionPacket | null,
  selfWorld: SelfWorldModelPacket | null
): number {
  if (!interoception || !selfWorld) return 0;

  const { overloadSense } = interoception;
  const { selfCoherence, worldPressure } = selfWorld;

  // Low coherence + high world pressure → slightly more sensitive to novelty
  const coherenceLoss = clampFinite(1.0 - selfCoherence, 0, 1);
  const overloadFactor = clampFinite(overloadSense, 0, 1);
  const worldPressFactor = clampFinite(worldPressure, 0, 1);

  // Weighted combination - weak effect
  const rawDelta = coherenceLoss * 0.15 + worldPressFactor * 0.12 + overloadFactor * 0.08;

  // Clamp to very small range
  return clampFinite(rawDelta, -0.05, 0.05);
}

/**
 * Compute withdraw bias delta from packet state
 *
 * When overloadSense is high and boundarySense is low,
 * slightly increase withdraw/protection tendency.
 */
function computeWithdrawBiasDelta(
  interoception: InteroceptionPacket | null,
  selfWorld: SelfWorldModelPacket | null
): number {
  if (!interoception || !selfWorld) return 0;

  const { overloadSense, boundarySense } = interoception;
  const { worldPressure } = selfWorld;

  // High overload + low boundary + high world pressure → withdraw
  const overloadFactor = clampFinite(overloadSense, 0, 1);
  const boundaryLoss = clampFinite(1.0 - boundarySense, 0, 1);
  const worldPressFactor = clampFinite(worldPressure, 0, 1);

  // Weighted combination
  const rawDelta = overloadFactor * 0.18 + boundaryLoss * 0.12 + worldPressFactor * 0.10;

  // Clamp to small range
  return clampFinite(rawDelta, -0.02, 0.08);
}

/**
 * Compute rewrite pressure delta from packet state
 *
 * When selfContinuity drops rapidly (comparing to previous frame),
 * slightly increase rewrite pressure to support re-stabilization.
 */
function computeRewritePressureDelta(
  interoception: InteroceptionPacket | null,
  selfWorld: SelfWorldModelPacket | null,
  previousSelfWorld: SelfWorldModelPacket | null
): number {
  if (!interoception || !selfWorld) return 0;

  const { selfCoherence, selfContinuity } = selfWorld;

  // Continuity drop detection
  let continuityDropFactor = 0;
  if (previousSelfWorld) {
    const continuityDelta = previousSelfWorld.selfContinuity - selfContinuity;
    if (continuityDelta > 0) {
      // Continuity decreased
      continuityDropFactor = clampFinite(continuityDelta * 2.0, 0, 1);
    }
  }

  // Low coherence also suggests need for rewrite
  const coherenceLoss = clampFinite(1.0 - selfCoherence, 0, 1);

  // Weighted combination - very weak to avoid rewrite explosion
  const rawDelta = continuityDropFactor * 0.10 + coherenceLoss * 0.05;

  // Clamp to very small range (rewrite is powerful, must be gentle)
  return clampFinite(rawDelta, -0.01, 0.03);
}

/**
 * Compute restoration bias delta from packet state
 *
 * When restorationSense is high and conditions are favorable,
 * support the return to baseline slightly.
 */
function computeRestorationBiasDelta(
  interoception: InteroceptionPacket | null,
  selfWorld: SelfWorldModelPacket | null
): number {
  if (!interoception || !selfWorld) return 0;

  const { restorationSense, energySense, overloadSense } = interoception;
  const { selfCoherence } = selfWorld;

  // High restoration sense + decent energy + low overload → support restoration
  const restorationFactor = clampFinite(restorationSense, 0, 1);
  const energyFactor = clampFinite(energySense, 0, 1);
  const overloadPenalty = clampFinite(overloadSense, 0, 1);
  const coherenceFactor = clampFinite(selfCoherence, 0, 1);

  // Favorable conditions amplify restoration
  const favorableConditions = (energyFactor * 0.5 + coherenceFactor * 0.5) * (1.0 - overloadPenalty * 0.6);

  // Weighted combination
  const rawDelta = restorationFactor * 0.20 * favorableConditions;

  // Clamp to small range
  return clampFinite(rawDelta, -0.02, 0.06);
}

/**
 * Compute touch openness delta from packet state
 *
 * RelationEngagement weakly affects touch openness.
 * High engagement → slightly more open to touch.
 */
function computeTouchOpennessDelta(
  interoception: InteroceptionPacket | null,
  selfWorld: SelfWorldModelPacket | null
): number {
  if (!interoception || !selfWorld) return 0;

  const { relationEngagement } = selfWorld;
  const { overloadSense, energySense } = interoception;

  // High relation engagement → more touch openness
  const engagementFactor = clampFinite(relationEngagement, 0, 1);

  // But penalize if overloaded or low energy
  const overloadPenalty = clampFinite(overloadSense, 0, 1);
  const energyFactor = clampFinite(energySense, 0, 1);
  const viableConditions = (1.0 - overloadPenalty * 0.7) * (0.3 + energyFactor * 0.7);

  // Weighted combination
  const rawDelta = engagementFactor * 0.15 * viableConditions;

  // Clamp to small range
  return clampFinite(rawDelta, -0.03, 0.05);
}

/**
 * Compute full modulation bundle from packets
 */
export function computeBeautifulLoopModulation(
  interoceptionPacket: InteroceptionPacket | null,
  selfWorldModelPacket: SelfWorldModelPacket | null,
  previousSelfWorldPacket: SelfWorldModelPacket | null,
  config: ModulationConfig
): BeautifulLoopModulation {
  // If disabled, return zeros
  if (!config.enabled) {
    return {
      noveltyBiasDelta: 0,
      withdrawBiasDelta: 0,
      rewritePressureDelta: 0,
      restorationBiasDelta: 0,
      touchOpennessDelta: 0,
    };
  }

  // Compute raw deltas
  let noveltyDelta = 0;
  let withdrawDelta = 0;
  let rewriteDelta = 0;
  let restorationDelta = 0;
  let touchDelta = 0;

  if (config.interoceptionFeedbackEnabled && config.selfWorldFeedbackEnabled) {
    noveltyDelta = computeNoveltyBiasDelta(interoceptionPacket, selfWorldModelPacket);
    withdrawDelta = computeWithdrawBiasDelta(interoceptionPacket, selfWorldModelPacket);
    rewriteDelta = computeRewritePressureDelta(interoceptionPacket, selfWorldModelPacket, previousSelfWorldPacket);
    restorationDelta = computeRestorationBiasDelta(interoceptionPacket, selfWorldModelPacket);
    touchDelta = computeTouchOpennessDelta(interoceptionPacket, selfWorldModelPacket);
  } else if (config.interoceptionFeedbackEnabled) {
    // Only interoception feedback (limited modulation)
    withdrawDelta = computeWithdrawBiasDelta(interoceptionPacket, null);
    restorationDelta = computeRestorationBiasDelta(interoceptionPacket, null);
  } else if (config.selfWorldFeedbackEnabled) {
    // Only self-world feedback (limited modulation)
    noveltyDelta = computeNoveltyBiasDelta(null, selfWorldModelPacket);
    touchDelta = computeTouchOpennessDelta(null, selfWorldModelPacket);
  }

  // Apply global strength multiplier
  noveltyDelta *= config.globalStrength;
  withdrawDelta *= config.globalStrength;
  rewriteDelta *= config.globalStrength;
  restorationDelta *= config.globalStrength;
  touchDelta *= config.globalStrength;

  return {
    noveltyBiasDelta: noveltyDelta,
    withdrawBiasDelta: withdrawDelta,
    rewritePressureDelta: rewriteDelta,
    restorationBiasDelta: restorationDelta,
    touchOpennessDelta: touchDelta,
  };
}

/**
 * Apply EMA smoothing to modulation bundle
 *
 * This prevents sudden jumps in modulation values.
 */
export function smoothModulation(
  current: BeautifulLoopModulation,
  previous: BeautifulLoopModulation | null,
  smoothingFactor: number
): BeautifulLoopModulation {
  if (!previous) return current;

  const alpha = clampFinite(smoothingFactor, 0, 1);
  const beta = 1.0 - alpha;

  return {
    noveltyBiasDelta: current.noveltyBiasDelta * alpha + previous.noveltyBiasDelta * beta,
    withdrawBiasDelta: current.withdrawBiasDelta * alpha + previous.withdrawBiasDelta * beta,
    rewritePressureDelta: current.rewritePressureDelta * alpha + previous.rewritePressureDelta * beta,
    restorationBiasDelta: current.restorationBiasDelta * alpha + previous.restorationBiasDelta * beta,
    touchOpennessDelta: current.touchOpennessDelta * alpha + previous.touchOpennessDelta * beta,
  };
}

/**
 * Clamp modulation bundle to prevent runaway
 *
 * This is a safety check to ensure modulation stays within acceptable bounds.
 */
export function clampModulation(modulation: BeautifulLoopModulation): BeautifulLoopModulation {
  return {
    noveltyBiasDelta: clampFinite(modulation.noveltyBiasDelta, -0.08, 0.08),
    withdrawBiasDelta: clampFinite(modulation.withdrawBiasDelta, -0.05, 0.10),
    rewritePressureDelta: clampFinite(modulation.rewritePressureDelta, -0.02, 0.05),
    restorationBiasDelta: clampFinite(modulation.restorationBiasDelta, -0.03, 0.08),
    touchOpennessDelta: clampFinite(modulation.touchOpennessDelta, -0.05, 0.08),
  };
}

/**
 * Create initial zero modulation bundle
 */
export function createZeroModulation(): BeautifulLoopModulation {
  return {
    noveltyBiasDelta: 0,
    withdrawBiasDelta: 0,
    rewritePressureDelta: 0,
    restorationBiasDelta: 0,
    touchOpennessDelta: 0,
  };
}
