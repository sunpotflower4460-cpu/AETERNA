/**
 * Organism State Types
 *
 * Defines internal organism state including network buffers, living state,
 * homeostasis, prediction, rewrite, mode, energy, and action tendencies.
 *
 * Organism state is INTERNAL - it represents the organism's own dynamics,
 * memory, and homeostatic variables, independent of presentation layer.
 */

/**
 * Core network internal buffers
 */
export interface OrganismNetworkBuffers {
  /** Previous activation buffer */
  prevBuffer: Float32Array;
  /** Current activation buffer */
  currentBuffer: Float32Array;
  /** Next activation buffer (swap target) */
  nextBuffer: Float32Array;
  /** Spike trace for temporal dynamics */
  spikeTrace: Float32Array;
  /** Last spike time per node */
  lastSpikeTime: Float32Array;
}

/**
 * Living state - slow organism variables
 */
export interface OrganismLivingState {
  fatigue: number;
  coherenceMemory: number;
  preferredErgodicity: number;
  longBaselineTone: number;
  recentHistoryBias: number;
  residueBias: number;
  predictionSensitivity: number;
  touchNeedBaseline: number;
}

/**
 * Homeostatic state - survival-related variables
 */
export interface OrganismHomeostaticState {
  stabilityIndex: number;
  boundaryIntegrity: number;
  selfPreservationBias: number;
  irritabilityLevel: number;
  restorationBias: number;
  collapseRisk: number;
  homeostaticStress: number;
  preferredStabilityBand: number;
  consecutiveQuietFrames: number;
}

/**
 * Energy flow state
 */
export interface OrganismEnergyState {
  energyReserve: number;
  energyInflow: number;
  energyOutflow: number;
  maintenanceCost: number;
  activityCost: number;
  rewriteCost: number;
  structuralIntegrity: number;
  lowEnergyPressure: number;
  recoveryDrive: number;
  wasDormantByEnergy: boolean;
}

/**
 * Mode state - wake/sleep/dream
 */
export interface OrganismModeState {
  modeState: 'wake' | 'sleep' | 'dream';
  modePhase: number;
  wakeDrive: number;
  sleepPressure: number;
  dreamPressure: number;
  modeConfidence: number;
  dreamReplayActive: boolean;
  dreamReplayStrength: number;
}

/**
 * Action tendency state
 */
export interface OrganismActionState {
  actionState: 'idle' | 'orient' | 'explore' | 'withdraw' | 'settle';
  actionPulseLevel: number;
  actionDirection: [number, number] | null;
}

/**
 * Complete organism internal state
 */
export interface OrganismState {
  /** Network internal buffers */
  buffers: OrganismNetworkBuffers;
  /** Living state variables */
  livingState: OrganismLivingState;
  /** Homeostatic state */
  homeostaticState: OrganismHomeostaticState;
  /** Energy flow state */
  energyState: OrganismEnergyState;
  /** Mode state */
  modeState: OrganismModeState;
  /** Action state */
  actionState: OrganismActionState;
  /** Current organism energy (0-1) */
  energy: number;
  /** Current organism stability (0-1) */
  stability: number;
  /** Current organism overload (0-1) */
  overload: number;
}
