/**
 * Derive Need / Motivation State
 *
 * AETERNA v0.5 / A4: Need / Motivation Split
 *
 * Derives NeedMotivationState from existing organism state.
 * This separates deficiency/maintenance pressure (need) from
 * directional behavioral tendency (motivation).
 *
 * Core principles:
 * - Need comes from deficiency / damage / depletion
 * - Motivation comes from arousal / awareness / replay / history
 * - They are INDEPENDENT - high need doesn't guarantee high motivation
 * - Both are continuous, gradual quantities
 *
 * This is a pure function for testability.
 */

import type { NeedMotivationState } from '../types/needMotivation.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { ReplayState } from '../types/replayState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { OrganismLivingState } from '../types/organismState.ts';
import type { OrganismEnergyState } from '../types/organismState.ts';
import type { OrganismHomeostaticState } from '../types/organismState.ts';
import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Derive energy need from depletion and energy state
 */
function deriveEnergyNeed(
  feltState: FeltStateVector,
  energyState: OrganismEnergyState,
  livingState: OrganismLivingState
): number {
  // Primary: depletion sense
  const depletionContribution = clampFinite(feltState.depletion, 0, 1.5) * 0.5;

  // Secondary: low energy reserve
  const lowEnergyContribution = clampFinite(1.0 - energyState.energyReserve, 0, 1) * 0.3;

  // Tertiary: fatigue
  const fatigueContribution = clampFinite(livingState.fatigue, 0, 1) * 0.2;

  const rawNeed = depletionContribution + lowEnergyContribution + fatigueContribution;

  return clampFinite(rawNeed, 0, 1.2);
}

/**
 * Derive safety need from overload and boundary state
 */
function deriveSafetyNeed(
  feltState: FeltStateVector,
  snapshot: OrganismSnapshot,
  homeostaticState: OrganismHomeostaticState
): number {
  // Primary: overload sense
  const overloadContribution = clampFinite(feltState.overload, 0, 1.5) * 0.4;

  // Secondary: boundary integrity loss
  const boundaryLoss = clampFinite(1.0 - feltState.boundaryIntegrity, 0, 1) * 0.25;

  // Tertiary: perturbation load
  const perturbationContribution = clampFinite(feltState.perturbationLoad, 0, 1.5) * 0.2;

  // Quaternary: instability
  const instability = clampFinite(1.0 - homeostaticState.stabilityIndex, 0, 1) * 0.15;

  const rawNeed = overloadContribution + boundaryLoss + perturbationContribution + instability;

  return clampFinite(rawNeed, 0, 1.2);
}

/**
 * Derive restoration need from restoration readiness and unrecovered state
 */
function deriveRestorationNeed(
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  energyState: OrganismEnergyState,
  homeostaticState: OrganismHomeostaticState
): number {
  // Need is high when restoration readiness is present BUT not yet recovered
  const restorationReadiness = clampFinite(feltState.restorationReadiness, 0, 1);

  // Unrecovered indicators
  const hasDepletion = clampFinite(feltState.depletion, 0, 1.5) * 0.3;
  const hasOverload = clampFinite(feltState.overload, 0, 1.5) * 0.25;
  const lowRestDepth = (1.0 - arousalAwareness.restDepth) * 0.2;
  const lowCoherence = (1.0 - feltState.coherence) * 0.15;

  // Restoration need = readiness * unrecovered state
  const unrecoveredFactor = hasDepletion + hasOverload + lowRestDepth + lowCoherence;
  const rawNeed = restorationReadiness * unrecoveredFactor;

  return clampFinite(rawNeed, 0, 1);
}

/**
 * Derive contact need from touch baseline and engagement
 */
function deriveContactNeed(
  livingState: OrganismLivingState,
  snapshot: OrganismSnapshot,
  selfWorld: SelfWorldModelPacket | null,
  homeostaticState: OrganismHomeostaticState
): number {
  // Primary: touch need baseline
  const touchNeedBaseline = clampFinite(livingState.touchNeedBaseline, 0, 1) * 0.5;

  // Secondary: recent touch absence (quiet frames indicator)
  const quietFrames = clampFinite(homeostaticState.consecutiveQuietFrames, 0, 500);
  const absenceFactor = Math.min(1.0, quietFrames / 200.0) * 0.3;

  // Tertiary: low engagement (if available)
  let engagementDeficit = 0.0;
  if (selfWorld) {
    engagementDeficit = (1.0 - clampFinite(selfWorld.relationEngagement, 0, 1)) * 0.2;
  }

  const rawNeed = touchNeedBaseline + absenceFactor + engagementDeficit;

  return clampFinite(rawNeed, 0, 1);
}

/**
 * Derive novelty motivation from arousal/awareness/salience state
 * NOT simply from need - this is an independent tendency
 */
function deriveNoveltyMotivation(
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  snapshot: OrganismSnapshot,
  safetyNeed: number
): number {
  // Favorable conditions: moderate arousal
  const arousalOk = arousalAwareness.arousalLevel > 0.2 && arousalAwareness.arousalLevel < 0.7 ? 0.3 : 0.0;

  // Moderate awareness window
  const awarenessOk = clampFinite(arousalAwareness.awarenessWindow, 0, 1) * 0.25;

  // Salience openness
  const salienceOk = clampFinite(arousalAwareness.salienceOpenness, 0, 1) * 0.2;

  // Unresolved perturbation (mild)
  const perturbationPush = clampFinite(feltState.perturbationLoad, 0, 1) * 0.15;

  // Penalty: high overload or safety need
  const overloadPenalty = clampFinite(feltState.overload, 0, 1.5) > 0.7 ? -0.2 : 0.0;
  const safetyPenalty = safetyNeed > 0.6 ? -0.15 : 0.0;

  const rawMotivation = arousalOk + awarenessOk + salienceOk + perturbationPush + overloadPenalty + safetyPenalty;

  return clampFinite(rawMotivation, 0, 1);
}

/**
 * Derive repetition motivation from replay traces and familiarity
 */
function deriveRepetitionMotivation(
  replayState: ReplayState,
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  snapshot: OrganismSnapshot
): number {
  // Primary: recent replay activity indicates familiar pattern reinforcement
  const replayActivity = clampFinite(replayState.recentReplaySalience, 0, 1) * 0.35;

  // Secondary: consolidation depth
  const consolidationDepth = clampFinite(replayState.restConsolidationDepth, 0, 1) * 0.25;

  // Tertiary: coherence (stable patterns)
  const coherenceFactor = clampFinite(feltState.coherence, 0, 1) * 0.2;

  // Quaternary: settling window availability
  const settlingAvailable = clampFinite(arousalAwareness.settlingWindow, 0, 1) * 0.15;

  // Small baseline
  const rawMotivation = 0.05 + replayActivity + consolidationDepth + coherenceFactor + settlingAvailable;

  return clampFinite(rawMotivation, 0, 1);
}

/**
 * Derive exploration motivation from openness and moderate novelty
 * This is NOT uncertainty (we don't have explicit uncertainty yet)
 */
function deriveExplorationMotivation(
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  noveltyMotivation: number,
  safetyNeed: number
): number {
  // Primary: openness
  const opennessFactor = clampFinite(feltState.openness, 0, 1) * 0.35;

  // Secondary: moderate novelty motivation
  const noveltyFactor = clampFinite(noveltyMotivation, 0, 1) * 0.3;

  // Tertiary: moderate arousal
  const arousalFactor = arousalAwareness.arousalLevel > 0.3 && arousalAwareness.arousalLevel < 0.6 ? 0.2 : 0.0;

  // Penalty: high safety need suppresses exploration
  const safetyPenalty = safetyNeed > 0.5 ? -safetyNeed * 0.4 : 0.0;

  // Penalty: low boundary integrity
  const boundaryPenalty = feltState.boundaryIntegrity < 0.4 ? -0.15 : 0.0;

  const rawMotivation = opennessFactor + noveltyFactor + arousalFactor + safetyPenalty + boundaryPenalty;

  return clampFinite(rawMotivation, 0, 1);
}

/**
 * Derive settling motivation from restoration readiness and coherence
 */
function deriveSettlingMotivation(
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  replayState: ReplayState
): number {
  // Primary: restoration readiness
  const restorationFactor = clampFinite(feltState.restorationReadiness, 0, 1) * 0.35;

  // Secondary: coherence
  const coherenceFactor = clampFinite(feltState.coherence, 0, 1) * 0.25;

  // Tertiary: settling window
  const settlingWindow = clampFinite(arousalAwareness.settlingWindow, 0, 1) * 0.2;

  // Quaternary: rest depth
  const restDepth = clampFinite(arousalAwareness.restDepth, 0, 1) * 0.15;

  // Small post-replay bonus
  const postReplayBonus = replayState.activeReplayCount > 0 ? 0.05 : 0.0;

  const rawMotivation = restorationFactor + coherenceFactor + settlingWindow + restDepth + postReplayBonus;

  return clampFinite(rawMotivation, 0, 1);
}

/**
 * Derive withdraw motivation from safety need and overload
 */
function deriveWithdrawMotivation(
  safetyNeed: number,
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  snapshot: OrganismSnapshot
): number {
  // Primary: safety need
  const safetyFactor = clampFinite(safetyNeed, 0, 1.2) * 0.4;

  // Secondary: overload sense
  const overloadFactor = clampFinite(feltState.overload, 0, 1.5) * 0.3;

  // Tertiary: low boundary integrity
  const boundaryThreat = (1.0 - clampFinite(feltState.boundaryIntegrity, 0, 1)) * 0.2;

  // Quaternary: harsh recent interaction (perturbation load)
  const harshInteraction = clampFinite(feltState.perturbationLoad, 0, 1.5) > 0.6 ?
    clampFinite(feltState.perturbationLoad, 0, 1.5) * 0.15 : 0.0;

  const rawMotivation = safetyFactor + overloadFactor + boundaryThreat + harshInteraction;

  return clampFinite(rawMotivation, 0, 1);
}

/**
 * Derive complete NeedMotivationState
 *
 * This is a pure function - no side effects.
 */
export function deriveNeedMotivation(
  snapshot: OrganismSnapshot,
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  replayState: ReplayState,
  livingState: OrganismLivingState,
  energyState: OrganismEnergyState,
  homeostaticState: OrganismHomeostaticState,
  selfWorld: SelfWorldModelPacket | null = null
): NeedMotivationState {
  // Derive needs first (independent of each other)
  const energyNeed = deriveEnergyNeed(feltState, energyState, livingState);
  const safetyNeed = deriveSafetyNeed(feltState, snapshot, homeostaticState);
  const restorationNeed = deriveRestorationNeed(feltState, arousalAwareness, energyState, homeostaticState);
  const contactNeed = deriveContactNeed(livingState, snapshot, selfWorld, homeostaticState);

  // Derive motivations (may reference needs but not simple mappings)
  const noveltyMotivation = deriveNoveltyMotivation(arousalAwareness, feltState, snapshot, safetyNeed);
  const repetitionMotivation = deriveRepetitionMotivation(replayState, arousalAwareness, feltState, snapshot);
  const explorationMotivation = deriveExplorationMotivation(feltState, arousalAwareness, noveltyMotivation, safetyNeed);
  const settlingMotivation = deriveSettlingMotivation(feltState, arousalAwareness, replayState);
  const withdrawMotivation = deriveWithdrawMotivation(safetyNeed, feltState, arousalAwareness, snapshot);

  return {
    timestamp: snapshot.timestamp,
    energyNeed,
    safetyNeed,
    restorationNeed,
    contactNeed,
    noveltyMotivation,
    repetitionMotivation,
    explorationMotivation,
    settlingMotivation,
    withdrawMotivation,
  };
}
