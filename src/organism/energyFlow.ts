/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * energyFlow.ts
 *
 * Phase F: Information-Energy Exchange
 *
 * This module handles energy flow in AETERNA as a dissipative structure.
 * Energy is not raw data quantity but structured change/novelty from environment.
 *
 * Core principles:
 * - Environment provides energy through sound, light, motion
 * - Activity, maintenance, and rewriting consume energy
 * - Low energy leads to gradual reduction in activity
 * - Structure is preserved during low energy states
 * - Recovery occurs when environment input returns
 */

// Energy flow constants
const ENERGY_RESERVE_MIN = 0.0;
const ENERGY_RESERVE_MAX = 1.5;
const ENERGY_RESERVE_INITIAL = 0.6;
const ENERGY_SMOOTHING = 0.08;

// Inflow calculation weights
const SOUND_NOVELTY_WEIGHT = 0.35;
const SOUND_LEVEL_WEIGHT = 0.15;
const LIGHT_NOVELTY_WEIGHT = 0.3;
const LIGHT_LEVEL_WEIGHT = 0.1;
const MOTION_NOVELTY_WEIGHT = 0.4;
const MOTION_LEVEL_WEIGHT = 0.2;
const BASELINE_INFLOW = 0.02; // Minimal inflow even without external stimuli

// Cost calculation baselines
const MAINTENANCE_BASE_COST = 0.015;
const ACTIVITY_BASE_COST = 0.008;
const REWRITE_BASE_COST = 0.005;

// Low energy thresholds
const LOW_ENERGY_THRESHOLD = 0.3;
const CRITICAL_ENERGY_THRESHOLD = 0.15;
const RECOVERY_THRESHOLD = 0.4;

export interface EnergyFlowState {
  energyReserve: number;
  energyInflow: number;
  energyOutflow: number;
  maintenanceCost: number;
  activityCost: number;
  rewriteCost: number;
  structuralIntegrity: number;
  lowEnergyPressure: number;
  recoveryDrive: number;
  lastEnergyCollapseTime: number;
  wasDormantByEnergy: boolean;
}

export function createInitialEnergyFlowState(): EnergyFlowState {
  return {
    energyReserve: ENERGY_RESERVE_INITIAL,
    energyInflow: BASELINE_INFLOW,
    energyOutflow: 0,
    maintenanceCost: MAINTENANCE_BASE_COST,
    activityCost: 0,
    rewriteCost: 0,
    structuralIntegrity: 1.0,
    lowEnergyPressure: 0,
    recoveryDrive: 0,
    lastEnergyCollapseTime: 0,
    wasDormantByEnergy: false,
  };
}

/**
 * Calculate energy inflow from external modalities.
 * Focus on novelty and change, not just raw input level.
 */
export function calculateEnergyInflow({
  soundNovelty = 0,
  soundLevel = 0,
  soundActive = false,
  lightNovelty = 0,
  lightLevel = 0,
  lightActive = false,
  motionNovelty = 0,
  motionLevel = 0,
  motionActive = false,
}: {
  soundNovelty?: number;
  soundLevel?: number;
  soundActive?: boolean;
  lightNovelty?: number;
  lightLevel?: number;
  lightActive?: boolean;
  motionNovelty?: number;
  motionLevel?: number;
  motionActive?: boolean;
}): number {
  const soundContribution = soundActive
    ? soundNovelty * SOUND_NOVELTY_WEIGHT + soundLevel * SOUND_LEVEL_WEIGHT
    : 0;

  const lightContribution = lightActive
    ? lightNovelty * LIGHT_NOVELTY_WEIGHT + lightLevel * LIGHT_LEVEL_WEIGHT
    : 0;

  const motionContribution = motionActive
    ? motionNovelty * MOTION_NOVELTY_WEIGHT + motionLevel * MOTION_LEVEL_WEIGHT
    : 0;

  const totalInflow = BASELINE_INFLOW + soundContribution + lightContribution + motionContribution;

  return clamp01(totalInflow);
}

/**
 * Calculate maintenance cost for structure preservation.
 * Always present to maintain topology, geometry, and connections.
 */
export function calculateMaintenanceCost({
  numNodes = 72,
  structuralIntegrity = 1.0,
}: {
  numNodes?: number;
  structuralIntegrity?: number;
}): number {
  // Scale slightly with number of nodes, modulated by integrity
  const scaleFactor = Math.log(numNodes + 1) / 10;
  return MAINTENANCE_BASE_COST * scaleFactor * structuralIntegrity;
}

/**
 * Calculate activity cost based on current arousal and activity level.
 */
export function calculateActivityCost({
  arousal = 0,
  sigma = 1.0,
  clusterRatio = 0,
  meanActivity = 0,
}: {
  arousal?: number;
  sigma?: number;
  clusterRatio?: number;
  meanActivity?: number;
}): number {
  const arousalContribution = arousal * 0.4;
  const sigmaDeviation = Math.abs(sigma - 1.0) * 0.3;
  const clusterContribution = clusterRatio * 0.2;
  const activityContribution = meanActivity * 0.1;

  const totalCost = ACTIVITY_BASE_COST + arousalContribution + sigmaDeviation + clusterContribution + activityContribution;

  return clamp01(totalCost);
}

/**
 * Calculate rewrite cost for plasticity and learning.
 */
export function calculateRewriteCost({
  rewritePressureMean = 0,
  globalRewriteLoad = 0,
  priorBiasMean = 0,
}: {
  rewritePressureMean?: number;
  globalRewriteLoad?: number;
  priorBiasMean?: number;
}): number {
  const pressureContribution = rewritePressureMean * 0.5;
  const loadContribution = globalRewriteLoad * 0.35;
  const priorContribution = priorBiasMean * 0.15;

  const totalCost = REWRITE_BASE_COST + pressureContribution + loadContribution + priorContribution;

  return clamp01(totalCost);
}

/**
 * Update energy reserve based on inflow and outflow.
 */
export function updateEnergyReserve(
  currentReserve: number,
  inflow: number,
  outflow: number,
): number {
  const targetReserve = currentReserve + inflow - outflow;
  const smoothedReserve = currentReserve * (1 - ENERGY_SMOOTHING) + targetReserve * ENERGY_SMOOTHING;
  return clampFinite(smoothedReserve, ENERGY_RESERVE_MIN, ENERGY_RESERVE_MAX, currentReserve);
}

/**
 * Calculate low energy pressure - increases as energy drops.
 */
export function calculateLowEnergyPressure(energyReserve: number): number {
  if (energyReserve >= LOW_ENERGY_THRESHOLD) return 0;
  if (energyReserve <= CRITICAL_ENERGY_THRESHOLD) return 1.0;

  const normalized = (LOW_ENERGY_THRESHOLD - energyReserve) / (LOW_ENERGY_THRESHOLD - CRITICAL_ENERGY_THRESHOLD);
  return clamp01(normalized);
}

/**
 * Calculate recovery drive - increases when energy is low but inflow is returning.
 */
export function calculateRecoveryDrive(
  energyReserve: number,
  energyInflow: number,
  previousInflow: number,
): number {
  // Only calculate recovery drive when reserve is low
  if (energyReserve >= RECOVERY_THRESHOLD) return 0;

  // Recovery drive is strong when inflow is increasing
  const inflowIncrease = Math.max(0, energyInflow - previousInflow);
  const reserveDeficit = Math.max(0, RECOVERY_THRESHOLD - energyReserve);

  const drive = (inflowIncrease * 0.6 + energyInflow * 0.4) * reserveDeficit * 2.0;
  return clamp01(drive);
}

/**
 * Calculate structural integrity - degrades slowly under sustained low energy.
 */
export function updateStructuralIntegrity(
  currentIntegrity: number,
  energyReserve: number,
  lowEnergyPressure: number,
): number {
  // Structural integrity only degrades under critical energy for extended periods
  if (energyReserve > CRITICAL_ENERGY_THRESHOLD) {
    // Slowly recover when energy is adequate
    return Math.min(1.0, currentIntegrity + 0.001);
  }

  // Very slow degradation even under critical energy
  const degradation = lowEnergyPressure * 0.0005;
  return Math.max(0.5, currentIntegrity - degradation); // Never drop below 0.5
}

/**
 * Main update function for energy flow state.
 */
export function updateEnergyFlowState(
  state: EnergyFlowState,
  {
    soundNovelty = 0,
    soundLevel = 0,
    soundActive = false,
    lightNovelty = 0,
    lightLevel = 0,
    lightActive = false,
    motionNovelty = 0,
    motionLevel = 0,
    motionActive = false,
    arousal = 0,
    sigma = 1.0,
    clusterRatio = 0,
    meanActivity = 0,
    rewritePressureMean = 0,
    globalRewriteLoad = 0,
    priorBiasMean = 0,
    numNodes = 72,
    simTime = 0,
  }: {
    soundNovelty?: number;
    soundLevel?: number;
    soundActive?: boolean;
    lightNovelty?: number;
    lightLevel?: number;
    lightActive?: boolean;
    motionNovelty?: number;
    motionLevel?: number;
    motionActive?: boolean;
    arousal?: number;
    sigma?: number;
    clusterRatio?: number;
    meanActivity?: number;
    rewritePressureMean?: number;
    globalRewriteLoad?: number;
    priorBiasMean?: number;
    numNodes?: number;
    simTime?: number;
  } = {},
): EnergyFlowState {
  const previousInflow = state.energyInflow;

  // Calculate inflow from environment
  const inflow = calculateEnergyInflow({
    soundNovelty,
    soundLevel,
    soundActive,
    lightNovelty,
    lightLevel,
    lightActive,
    motionNovelty,
    motionLevel,
    motionActive,
  });

  // Calculate costs
  const maintenanceCost = calculateMaintenanceCost({
    numNodes,
    structuralIntegrity: state.structuralIntegrity,
  });

  const activityCost = calculateActivityCost({
    arousal,
    sigma,
    clusterRatio,
    meanActivity,
  });

  const rewriteCost = calculateRewriteCost({
    rewritePressureMean,
    globalRewriteLoad,
    priorBiasMean,
  });

  const outflow = maintenanceCost + activityCost + rewriteCost;

  // Update reserve
  const newReserve = updateEnergyReserve(state.energyReserve, inflow, outflow);

  // Calculate pressures
  const lowEnergyPressure = calculateLowEnergyPressure(newReserve);
  const recoveryDrive = calculateRecoveryDrive(newReserve, inflow, previousInflow);

  // Update structural integrity
  const newIntegrity = updateStructuralIntegrity(
    state.structuralIntegrity,
    newReserve,
    lowEnergyPressure,
  );

  // Track dormancy transitions
  const wasDormant = state.wasDormantByEnergy;
  const isDormant = lowEnergyPressure > 0.7;
  const lastCollapseTime = !wasDormant && isDormant ? simTime : state.lastEnergyCollapseTime;

  return {
    energyReserve: newReserve,
    energyInflow: inflow,
    energyOutflow: outflow,
    maintenanceCost,
    activityCost,
    rewriteCost,
    structuralIntegrity: newIntegrity,
    lowEnergyPressure,
    recoveryDrive,
    lastEnergyCollapseTime: lastCollapseTime,
    wasDormantByEnergy: isDormant,
  };
}

/**
 * Get energy flow influence on baseline gain.
 * Low energy reduces baseline, but never to zero.
 */
export function getEnergyBaselineGainModulation(
  lowEnergyPressure: number,
  recoveryDrive: number,
): number {
  const reduction = lowEnergyPressure * 0.35;
  const recovery = recoveryDrive * 0.15;
  return 1.0 - reduction + recovery; // Ranges from ~0.65 to 1.15
}

/**
 * Get energy flow influence on rewrite gain.
 * Low energy reduces plasticity significantly.
 */
export function getEnergyRewriteGainModulation(
  lowEnergyPressure: number,
  recoveryDrive: number,
): number {
  const reduction = lowEnergyPressure * 0.5;
  const recovery = recoveryDrive * 0.1;
  return 1.0 - reduction + recovery; // Ranges from ~0.5 to 1.1
}

/**
 * Get energy flow influence on activity gain.
 * Low energy reduces activity level.
 */
export function getEnergyActivityGainModulation(
  lowEnergyPressure: number,
  recoveryDrive: number,
): number {
  const reduction = lowEnergyPressure * 0.4;
  const recovery = recoveryDrive * 0.12;
  return 1.0 - reduction + recovery; // Ranges from ~0.6 to 1.12
}

/**
 * Get energy debug summary for UI.
 */
export function getEnergyFlowDebugSummary(state: EnergyFlowState) {
  return {
    energyReserve: state.energyReserve,
    energyInflow: state.energyInflow,
    energyOutflow: state.energyOutflow,
    maintenanceCost: state.maintenanceCost,
    activityCost: state.activityCost,
    rewriteCost: state.rewriteCost,
    structuralIntegrity: state.structuralIntegrity,
    lowEnergyPressure: state.lowEnergyPressure,
    recoveryDrive: state.recoveryDrive,
    isDormant: state.wasDormantByEnergy,
    timeSinceCollapse: state.lastEnergyCollapseTime > 0
      ? 'tracked'
      : 'never',
  };
}

// Utility functions
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
