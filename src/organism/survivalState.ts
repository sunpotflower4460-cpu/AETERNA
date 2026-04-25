/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AETERNA Phase 4: Homeostatic State & Survival Objective
 *
 * This module implements the expanded homeostatic state that gives AETERNA
 * an inherent tendency toward self-maintenance and persistence.
 *
 * Key principles:
 * - Homeostasis is internal pressure, not external control
 * - Energy is activity/maintenance/rewrite capacity, not HP
 * - Survival objective is持続 tendency, not hard-coded goal
 * - All updates are gradual (slow variables)
 * - Connections to organism core are weak biases, not overrides
 */

/**
 * Extended homeostatic state interface
 * These variables track the organism's current self-maintenance pressures
 */
export interface HomeostaticState {
  // Core state from energy/stability/overload
  energyReserve: number;           // From energyFlow (already exists)
  stabilityIndex: number;           // From organism stability (already exists)
  overloadLevel: number;            // From organism overload (already exists)

  // Recovery and low-energy pressures
  recoveryDrive: number;            // Pressure toward restoration
  lowEnergyPressure: number;        // Pressure to reduce consumption

  // Boundary and integrity
  boundaryIntegrity: number;        // Organizational cohesion

  // Self-preservation tendency
  selfPreservationBias: number;     // Weak tendency to sustain operation

  // Irritability and restoration (Phase 4 core additions)
  irritabilityLevel: number;        // Increased sensitivity after disturbance
  restorationBias: number;          // Tendency toward prior coherent states

  // Derived pressures
  collapseRisk: number;             // Composite risk of activity cessation
  homeostaticStress: number;        // Overall deviation from viable operation
  preferredStabilityBand: number;   // Target stability level for this organism

  // Temporal tracking
  lastHighOverloadTime: number;     // When overload last exceeded threshold
  lastLowEnergyTime: number;        // When energy last dropped critically
  consecutiveQuietFrames: number;   // Frames without significant external input
}

/**
 * Initialize homeostatic state with organism-typical defaults
 */
export function createInitialHomeostaticState(): HomeostaticState {
  return {
    energyReserve: 0.6,              // Moderate starting energy
    stabilityIndex: 0.5,              // Neutral starting stability
    overloadLevel: 0.0,               // No initial overload
    recoveryDrive: 0.0,               // No recovery pressure initially
    lowEnergyPressure: 0.0,           // No energy pressure initially
    boundaryIntegrity: 1.0,           // Full integrity at start
    selfPreservationBias: 0.5,        // Neutral preservation tendency
    irritabilityLevel: 0.0,           // Not irritated initially
    restorationBias: 0.5,             // Neutral restoration tendency
    collapseRisk: 0.0,                // No collapse risk initially
    homeostaticStress: 0.0,           // No stress initially
    preferredStabilityBand: 0.5,      // Neutral preference
    lastHighOverloadTime: 0,
    lastLowEnergyTime: 0,
    consecutiveQuietFrames: 0,
  };
}

/**
 * Update homeostatic state each tick
 * This is the core of Phase 4 - gradual pressure accumulation
 * Phase BL-L3: Now accepts Beautiful Loop modulation deltas
 */
export function updateHomeostaticState(
  state: HomeostaticState,
  network: any,
  {
    arousal = 0,
    predictionError = 0,
    noveltyLevel = 0,
    rewriteLoad = 0,
    clusterRatio = 0,
    phaseCoherence = 0,
    activeTouchCount = 0,
    meanRawTouch = 0,
    simTime = 0,
    blModulation = null,
  }: {
    arousal?: number;
    predictionError?: number;
    noveltyLevel?: number;
    rewriteLoad?: number;
    clusterRatio?: number;
    phaseCoherence?: number;
    activeTouchCount?: number;
    meanRawTouch?: number;
    simTime?: number;
    blModulation?: {
      restorationBiasDelta?: number;
      withdrawBiasDelta?: number;
    } | null;
  } = {},
): HomeostaticState {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));

  // Get energy flow state if available (Phase F integration)
  const energyFlowState = network.energyFlowState;
  const energyReserve = energyFlowState?.energyReserve ?? state.energyReserve;
  const lowEnergyPressure = energyFlowState?.lowEnergyPressure ?? state.lowEnergyPressure;
  const recoveryDrive = energyFlowState?.recoveryDrive ?? state.recoveryDrive;

  // Get organism state (existing integration)
  const stability = network.stability ?? state.stabilityIndex;
  const overload = network.overload ?? state.overloadLevel;

  // 1. Update overloadLevel
  // Rises with high activity, prediction error, novelty, rewrite
  const overloadRise = clamp(
    predictionError * 0.16 +
    noveltyLevel * 0.14 +
    rewriteLoad * 0.12 +
    arousal * 0.08,
    0,
    0.5,
  );
  const overloadDecay = 0.025;
  const newOverload = clamp(
    overload * 0.95 + overloadRise - overloadDecay,
    0,
    1,
  );

  // Track high overload events
  const highOverloadThreshold = 0.6;
  const lastHighOverloadTime = newOverload > highOverloadThreshold
    ? simTime
    : state.lastHighOverloadTime;

  // 2. Update stabilityIndex
  // Rises during coherent, quiet periods; falls under perturbation
  const stabilityRise = clamp(
    phaseCoherence * 0.18 +
    (1 - arousal) * 0.12 +
    (activeTouchCount === 0 ? 0.08 : 0),
    0,
    0.4,
  );
  const stabilityDrop = clamp(
    predictionError * 0.14 +
    noveltyLevel * 0.12 +
    newOverload * 0.08,
    0,
    0.4,
  );
  const stabilityTarget = clamp(
    stability + stabilityRise - stabilityDrop,
    0.1,
    1.0,
  );
  const newStability = clamp(
    stability * 0.98 + stabilityTarget * 0.02,
    0,
    1,
  );

  // 3. Update irritabilityLevel
  // Increases with unexpected perturbations, sustained high prediction error
  let perturbationSurprise = 0;
  if (network.touchSurpriseMetrics) {
    perturbationSurprise = network.touchSurpriseMetrics.totalSurprise;
  }

  const irritabilityRise = clamp(
    perturbationSurprise * 0.05 +
    predictionError * 0.08 +
    (newOverload > 0.5 ? (newOverload - 0.5) * 0.15 : 0),
    0,
    0.2,
  );
  const irritabilityDecay = 0.015;
  const newIrritability = clamp(
    state.irritabilityLevel + irritabilityRise - irritabilityDecay,
    0,
    1,
  );

  // 4. Update restorationBias
  // Increases during stable periods, strengthens after recovery
  // BL-L3: Weakly influenced by interoception packet feedback
  const wasStable = stability > 0.6;
  const isRecovering = recoveryDrive > 0.3;
  const restorationRise = clamp(
    (wasStable ? 0.008 : 0) +
    (isRecovering ? recoveryDrive * 0.012 : 0) +
    (newOverload < 0.2 && state.irritabilityLevel > 0.3 ? 0.005 : 0),
    0,
    0.05,
  );
  const restorationDecay = 0.002;
  // BL-L3: Apply thin modulation delta if available
  const blRestorationDelta = blModulation?.restorationBiasDelta ?? 0;
  const newRestoration = clamp(
    state.restorationBias + restorationRise - restorationDecay + blRestorationDelta,
    0.3,
    0.9,
  );

  // 5. Update boundaryIntegrity
  // Decreases under chaos/overload, increases during coherent periods
  const mismatchBoundaryStress = clamp(
    predictionError * 0.0012 + perturbationSurprise * 0.0009 + noveltyLevel * 0.0006,
    0,
    0.004,
  );
  const boundaryDegradation = clamp(
    (newOverload > 0.7 ? (newOverload - 0.7) * 0.003 : 0) +
    (predictionError > 1.5 ? (predictionError - 1.5) * 0.002 : 0) +
    (clusterRatio < 0.2 ? (0.2 - clusterRatio) * 0.001 : 0) +
    mismatchBoundaryStress,
    0,
    0.01,
  );
  const boundaryRepairPressure = clamp(
    newRestoration * 0.45 +
    state.selfPreservationBias * 0.3 +
    newStability * 0.2 -
    newOverload * 0.25,
    0,
    1,
  );
  const boundaryRecovery = clamp(
    (phaseCoherence > 0.5 ? phaseCoherence * 0.0015 : 0) +
    (newStability > 0.6 ? (newStability - 0.6) * 0.002 : 0) +
    boundaryRepairPressure * 0.0012,
    0,
    0.005,
  );
  const newBoundaryIntegrity = clamp(
    state.boundaryIntegrity - boundaryDegradation + boundaryRecovery,
    0.5,
    1.0,
  );

  // 6. Update selfPreservationBias
  // Very slow drift based on overall organism condition
  const isVulnerable = energyReserve < 0.3 || newOverload > 0.6 || newBoundaryIntegrity < 0.7;
  const preservationDrift = isVulnerable ? 0.0002 : -0.0001;
  const newPreservation = clamp(
    state.selfPreservationBias + preservationDrift,
    0.3,
    0.8,
  );

  // 7. Update collapseRisk
  // Composite measure of how close to activity cessation
  const collapseRisk = clamp(
    (energyReserve < 0.2 ? (0.2 - energyReserve) * 2.0 : 0) +
    (newOverload > 0.7 ? (newOverload - 0.7) * 1.5 : 0) +
    (newBoundaryIntegrity < 0.6 ? (0.6 - newBoundaryIntegrity) * 1.2 : 0) +
    (newStability < 0.2 ? (0.2 - newStability) * 1.0 : 0),
    0,
    1,
  );

  // Track low energy events
  const criticalEnergyThreshold = 0.2;
  const lastLowEnergyTime = energyReserve < criticalEnergyThreshold
    ? simTime
    : state.lastLowEnergyTime;

  // 8. Update homeostaticStress
  // Overall deviation from viable operating range
  const homeostaticStress = clamp(
    Math.abs(energyReserve - 0.5) * 0.3 +
    Math.abs(newStability - state.preferredStabilityBand) * 0.25 +
    newOverload * 0.25 +
    (1 - newBoundaryIntegrity) * 0.2,
    0,
    1,
  );

  // 9. Track quiet periods
  const isQuiet = activeTouchCount === 0 && arousal < 0.3 && meanRawTouch < 0.1;
  const consecutiveQuietFrames = isQuiet ? state.consecutiveQuietFrames + 1 : 0;

  // 10. Update preferredStabilityBand (very slow drift toward experienced stability)
  const bandDrift = 0.00005;
  const newPreferredBand = clamp(
    state.preferredStabilityBand * (1 - bandDrift) + newStability * bandDrift,
    0.3,
    0.7,
  );

  return {
    energyReserve,
    stabilityIndex: newStability,
    overloadLevel: newOverload,
    recoveryDrive,
    lowEnergyPressure,
    boundaryIntegrity: newBoundaryIntegrity,
    selfPreservationBias: newPreservation,
    irritabilityLevel: newIrritability,
    restorationBias: newRestoration,
    collapseRisk,
    homeostaticStress,
    preferredStabilityBand: newPreferredBand,
    lastHighOverloadTime,
    lastLowEnergyTime,
    consecutiveQuietFrames,
  };
}

/**
 * Get homeostatic influence on organism core mechanisms
 * These are WEAK modulations, not hard overrides
 */
export function getHomeostaticInfluence(state: HomeostaticState): {
  baselineGainModifier: number;
  rewriteGainModifier: number;
  predictionSensitivityModifier: number;
  modeDriftBias: number;
  actionThresholdBias: number;
  touchResponseSensitivity: number;
} {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : (min + max) / 2));

  // Baseline gain: reduced by low energy, boosted slightly by recovery
  const baselineGainModifier = clamp(
    1.0 - state.lowEnergyPressure * 0.3 + state.recoveryDrive * 0.1,
    0.65,
    1.15,
  );

  // Rewrite gain: reduced by high overload and low energy
  const rewriteGainModifier = clamp(
    1.0 - state.overloadLevel * 0.25 - state.lowEnergyPressure * 0.2 - state.collapseRisk * 0.15,
    0.5,
    1.1,
  );

  // Prediction sensitivity: increased by irritability
  const predictionSensitivityModifier = clamp(
    1.0 + state.irritabilityLevel * 0.15,
    0.9,
    1.25,
  );

  // Mode drift bias: prefer rest when overloaded or low energy
  const modeDriftBias = clamp(
    state.restorationBias * 0.12 - state.overloadLevel * 0.08 - state.lowEnergyPressure * 0.1,
    -0.15,
    0.15,
  );

  // Action threshold bias: higher threshold when vulnerable (less reactive)
  const actionThresholdBias = clamp(
    state.collapseRisk * 0.08 + state.homeostaticStress * 0.06,
    0,
    0.2,
  );

  // Touch response sensitivity: modulated by irritability and boundary integrity
  const touchResponseSensitivity = clamp(
    1.0 + state.irritabilityLevel * 0.12 - (1 - state.boundaryIntegrity) * 0.15,
    0.75,
    1.2,
  );

  return {
    baselineGainModifier,
    rewriteGainModifier,
    predictionSensitivityModifier,
    modeDriftBias,
    actionThresholdBias,
    touchResponseSensitivity,
  };
}

/**
 * Get debug summary for UI/metrics
 */
export function getHomeostaticDebugSummary(state: HomeostaticState): Record<string, number> {
  return {
    energyReserve: state.energyReserve,
    stabilityIndex: state.stabilityIndex,
    overloadLevel: state.overloadLevel,
    recoveryDrive: state.recoveryDrive,
    lowEnergyPressure: state.lowEnergyPressure,
    boundaryIntegrity: state.boundaryIntegrity,
    selfPreservationBias: state.selfPreservationBias,
    irritabilityLevel: state.irritabilityLevel,
    restorationBias: state.restorationBias,
    collapseRisk: state.collapseRisk,
    homeostaticStress: state.homeostaticStress,
    preferredStabilityBand: state.preferredStabilityBand,
    consecutiveQuietFrames: state.consecutiveQuietFrames,
  };
}

// ============================================================================
// Legacy bodyState.ts functions (maintained for backwards compatibility)
// These will be gradually migrated to use HomeostaticState
// ============================================================================

import {
  MODE_AROUSAL_NORM,
  MODE_PREDICTION_NORM,
  ORGANISM_HISTORY_LIMIT,
  ORGANISM_UPDATE_SMOOTHING,
} from '../core/aeternaTuning.ts';

export function recordOrganismSnapshot(network: any) {
  network.organismStateHistory.unshift({
    time: network.simTime,
    energy: network.energy,
    stability: network.stability,
    overload: network.overload,
    restDrive: network.restDrive,
    orientingDrive: network.orientingDrive,
  });
  if (network.organismStateHistory.length > ORGANISM_HISTORY_LIMIT) network.organismStateHistory.pop();
}

export function getOrganismDebugSummary(network: any) {
  return {
    energy: network.energy,
    stability: network.stability,
    overload: network.overload,
    restDrive: network.restDrive,
    orientingDrive: network.orientingDrive,
    comfortBias: network.comfortBias,
  };
}

export function updateOrganismState(network: any, {
  activeTouchCount = 0,
  meanRawTouch = 0,
  meanTouchOnset = 0,
  meanTouchNovelty = 0,
  meanTouchTrace = 0,
  patternScores = network.touchPatternScores,
  arousal = 0,
  meanPredictionError = 0,
  residueLevel = 0,
  rewritePressureMean = 0,
  globalRewriteLoad = 0,
} = {}) {
  const activeTouch = activeTouchCount > 0 ? 1 : 0;
  const noveltyLevel = network.clamp01(meanTouchNovelty * 8 + patternScores.tap * 0.16 + patternScores.stroke * 0.1, 0);
  const gentleContact = network.clamp01(activeTouch * 0.1 + meanRawTouch * 0.35 + patternScores.hold * 0.32 + meanTouchTrace * 0.08 - patternScores.tap * 0.06, 0);
  const repeatIntensity = network.clamp01(patternScores.repeat * 0.8 + patternScores.tap * 0.25, 0);
  const arousalNorm = network.clamp01(arousal * MODE_AROUSAL_NORM, 0);
  const predictionNorm = network.clamp01(meanPredictionError * MODE_PREDICTION_NORM, 0);
  const quietness = network.clamp01((1 - activeTouch) * 0.35 + (1 - network.clamp01(meanRawTouch * 5, 0)) * 0.2 + (1 - arousalNorm) * 0.25 + (1 - noveltyLevel) * 0.2, 0);

  const overloadRise = predictionNorm * 0.16 + noveltyLevel * 0.14 + repeatIntensity * 0.08 + globalRewriteLoad * 0.05 + rewritePressureMean * 0.6;
  const overloadRelease = 0.025 + quietness * 0.035 + network.stability * 0.02 + (network.actionState === 'settle' ? network.actionPulseLevel * 0.08 : 0);
  network.overload = network.clamp01(network.overload * 0.95 + overloadRise - overloadRelease, network.overload);

  const energyTarget = network.clamp01(0.42 + quietness * 0.22 + network.stability * 0.12 + gentleContact * 0.06 - arousalNorm * 0.14 - network.overload * 0.24 - globalRewriteLoad * 0.08 - network.actionPulseLevel * 0.05, network.energy);
  const stabilityTarget = network.clamp01(0.38 + quietness * 0.18 + gentleContact * 0.18 + residueLevel * 0.06 - network.overload * 0.26 - predictionNorm * 0.12 - repeatIntensity * 0.08, network.stability);
  const restTarget = network.clamp01(0.12 + (1 - network.energy) * 0.42 + network.overload * 0.34 + (1 - network.stability) * 0.12 - activeTouch * 0.06, network.restDrive);
  const orientTarget = network.clamp01(0.08 + noveltyLevel * 0.34 + activeTouch * 0.18 + patternScores.stroke * 0.12 + meanTouchOnset * 0.7 - quietness * 0.18 - network.overload * 0.12, network.orientingDrive);

  network.energy = network.clamp01(network.energy * (1 - ORGANISM_UPDATE_SMOOTHING) + energyTarget * ORGANISM_UPDATE_SMOOTHING, network.energy);
  network.stability = network.clamp01(network.stability * (1 - ORGANISM_UPDATE_SMOOTHING) + stabilityTarget * ORGANISM_UPDATE_SMOOTHING, network.stability);
  network.restDrive = network.clamp01(network.restDrive * (1 - ORGANISM_UPDATE_SMOOTHING) + restTarget * ORGANISM_UPDATE_SMOOTHING, network.restDrive);
  network.orientingDrive = network.clamp01(network.orientingDrive * (1 - ORGANISM_UPDATE_SMOOTHING) + orientTarget * ORGANISM_UPDATE_SMOOTHING, network.orientingDrive);
  network.comfortBias = network.clamp01(network.comfortBias * 0.92 + (quietness * 0.45 + network.stability * 0.35 + gentleContact * 0.2 - network.overload * 0.25) * 0.08, network.comfortBias);

  if (network.simTime % 30 === 0) recordOrganismSnapshot(network);
  return getOrganismDebugSummary(network);
}
