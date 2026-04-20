/**
 * Derive Felt-State Vector
 *
 * AETERNA v0.5 / A1: Felt-State / Interoception Expansion
 *
 * Derives FeltStateVector from existing organism state.
 * This is a pure transform - no side effects.
 *
 * Purpose:
 * - Organize existing state into felt-quality axes
 * - Provide unified vocabulary for internal sensing
 * - Keep as pure function for testability/scenario comparison
 *
 * Important:
 * - Does NOT modify organism core
 * - Coefficients are small and straightforward
 * - Finite checks prevent NaN propagation
 */

import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { OrganismLivingState } from '../types/organismState.ts';
import type { OrganismHomeostaticState } from '../types/organismState.ts';
import type { OrganismEnergyState } from '../types/organismState.ts';
import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';

/**
 * Clamp and finite-check utility
 */
function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

/**
 * Derive depletion from energy and fatigue state
 */
function deriveDepletion(
  energyState: OrganismEnergyState,
  livingState: OrganismLivingState
): number {
  // Low energy reserve + high fatigue = high depletion
  const energyDepletion = clampFinite(1.0 - energyState.energyReserve, 0, 1);
  const fatigueContribution = clampFinite(livingState.fatigue, 0, 1);

  // Weighted combination
  const rawDepletion = energyDepletion * 0.6 + fatigueContribution * 0.4;

  return clampFinite(rawDepletion, 0, 1.5);
}

/**
 * Derive overload from overload level and irritability
 */
function deriveOverload(
  snapshot: OrganismSnapshot,
  homeostaticState: OrganismHomeostaticState
): number {
  // Overload level + irritability + sustained errors
  const overloadLevel = clampFinite(snapshot.overload, 0, 1);
  const irritabilityContribution = clampFinite(homeostaticState.irritabilityLevel, 0, 1);
  const errorContribution = clampFinite(snapshot.meanPredictionError * 0.3, 0, 1);

  // Weighted combination
  const rawOverload = overloadLevel * 0.5 + irritabilityContribution * 0.3 + errorContribution * 0.2;

  return clampFinite(rawOverload, 0, 1.5);
}

/**
 * Derive coherence from coherence memory and self-coherence
 */
function deriveCoherence(
  snapshot: OrganismSnapshot,
  livingState: OrganismLivingState,
  selfWorld: SelfWorldModelPacket | null
): number {
  // Coherence memory + current coherence + selfCoherence (if available)
  const coherenceMemory = clampFinite(livingState.coherenceMemory, 0, 1);
  const currentCoherence = clampFinite(snapshot.coherence, 0, 1);

  let rawCoherence: number;
  if (selfWorld) {
    const selfCoherence = clampFinite(selfWorld.selfCoherence, 0, 1);
    rawCoherence = coherenceMemory * 0.4 + currentCoherence * 0.3 + selfCoherence * 0.3;
  } else {
    rawCoherence = coherenceMemory * 0.6 + currentCoherence * 0.4;
  }

  return clampFinite(rawCoherence, 0, 1);
}

/**
 * Derive boundary integrity
 */
function deriveBoundaryIntegrity(
  snapshot: OrganismSnapshot,
  homeostaticState: OrganismHomeostaticState
): number {
  // Boundary integrity - fragmentation tendencies
  const boundary = clampFinite(snapshot.boundary, 0, 1);
  const stabilityIndex = clampFinite(homeostaticState.stabilityIndex, 0, 1);
  const collapseRiskPenalty = clampFinite(homeostaticState.collapseRisk, 0, 1);

  // Weighted combination
  const rawBoundary = boundary * 0.6 + stabilityIndex * 0.3 - collapseRiskPenalty * 0.1;

  return clampFinite(rawBoundary, 0, 1);
}

/**
 * Derive restoration readiness
 */
function deriveRestorationReadiness(
  snapshot: OrganismSnapshot,
  energyState: OrganismEnergyState,
  homeostaticState: OrganismHomeostaticState
): number {
  // Restoration bias + recovery drive
  const restorationBias = clampFinite(snapshot.restorationBias, 0, 1);
  const recoveryDrive = clampFinite(energyState.recoveryDrive, 0, 1);
  const consecutiveQuietBonus = Math.min(1.0, homeostaticState.consecutiveQuietFrames / 100.0) * 0.2;

  // Weighted combination
  const rawRestoration = restorationBias * 0.5 + recoveryDrive * 0.4 + consecutiveQuietBonus;

  return clampFinite(rawRestoration, 0, 1);
}

/**
 * Derive perturbation load
 */
function derivePerturbationLoad(
  snapshot: OrganismSnapshot,
  livingState: OrganismLivingState
): number {
  // Recent perturbation + prediction errors + history bias
  const perturbationPressure = clampFinite(snapshot.recentPerturbationPressure, 0, 1);
  const predictionError = clampFinite(snapshot.meanPredictionError * 0.5, 0, 1);
  const historyBias = clampFinite(Math.abs(livingState.recentHistoryBias), 0, 1);

  // Weighted combination
  const rawPerturbation = perturbationPressure * 0.5 + predictionError * 0.3 + historyBias * 0.2;

  return clampFinite(rawPerturbation, 0, 1.5);
}

/**
 * Derive openness from touch need and relation engagement
 */
function deriveOpenness(
  livingState: OrganismLivingState,
  selfWorld: SelfWorldModelPacket | null,
  energyState: OrganismEnergyState,
  homeostaticState: OrganismHomeostaticState
): number {
  // Touch need baseline + relation engagement (minimal influence)
  const touchNeed = clampFinite(livingState.touchNeedBaseline, 0, 1);

  let rawOpenness: number;
  if (selfWorld) {
    const relationEngagement = clampFinite(selfWorld.relationEngagement, 0, 1);
    rawOpenness = touchNeed * 0.7 + relationEngagement * 0.3;
  } else {
    rawOpenness = touchNeed;
  }

  // Penalize if low energy or high irritability
  const energyFactor = clampFinite(energyState.energyReserve, 0, 1);
  const irritabilityPenalty = clampFinite(homeostaticState.irritabilityLevel, 0, 1);
  const viability = (0.5 + energyFactor * 0.5) * (1.0 - irritabilityPenalty * 0.4);

  return clampFinite(rawOpenness * viability, 0, 1);
}

/**
 * Derive complete FeltStateVector from organism state
 *
 * This is a pure function - no side effects.
 */
export function deriveFeltState(
  snapshot: OrganismSnapshot,
  livingState: OrganismLivingState,
  homeostaticState: OrganismHomeostaticState,
  energyState: OrganismEnergyState,
  selfWorld: SelfWorldModelPacket | null = null
): FeltStateVector {
  return {
    timestamp: snapshot.timestamp,
    depletion: deriveDepletion(energyState, livingState),
    overload: deriveOverload(snapshot, homeostaticState),
    coherence: deriveCoherence(snapshot, livingState, selfWorld),
    boundaryIntegrity: deriveBoundaryIntegrity(snapshot, homeostaticState),
    restorationReadiness: deriveRestorationReadiness(snapshot, energyState, homeostaticState),
    perturbationLoad: derivePerturbationLoad(snapshot, livingState),
    openness: deriveOpenness(livingState, selfWorld, energyState, homeostaticState),
  };
}
