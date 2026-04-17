import type { TorusStatePacket } from './torusState.js';

export type TouchPatternName = 'tap' | 'repeat' | 'hold' | 'stroke';
export type RewriteTendency = 'novelty' | 'recurrence' | 'persistence' | 'directionality';
export type ModeStateName = 'sleep' | 'wake' | 'dream';
export type ActionStateName = 'idle' | 'orient' | 'withdraw' | 'settle';

export type PatternScores = Record<TouchPatternName, number>;
export type PacketDirection = [number, number] | null;

export interface BaselineResiduePacket {
  baselineLevel: number;
  residueLevel: number;
}

export interface TouchInputPacket {
  activeTouchCount: number;
  lastTouchCentroid: [number, number] | null;
  touchDuration: number;
  touchVelocity: number;
  touchRepeatCount: number;
  lastTouchDirection: PacketDirection;
  touchDirectionStrength: number;
}

export interface TouchPerceptPacket extends TouchInputPacket {
  rawTouchMean: number;
  onsetMean: number;
  offsetMean: number;
  noveltyMean: number;
  meanTouchTrace: number;
  replayExternalLevel: number;
  dominantPattern: TouchPatternName | null;
  patternScores: PatternScores;
}

export interface SoundPerceptPacket {
  level: number;
  delta: number;
  bandLow: number;
  bandMid: number;
  bandHigh: number;
  novelty: number;
  persistence: number;
  recurrence: number;
  directionality: number;
  active: boolean;
}

export interface LightPerceptPacket {
  level: number;
  delta: number;
  novelty: number;
  persistence: number;
  recurrence: number;
  directionality: number;
  active: boolean;
}

export interface MotionPerceptPacket {
  level: number;
  delta: number;
  novelty: number;
  persistence: number;
  recurrence: number;
  directionality: number;
  active: boolean;
}

export interface TimePerceptPacket {
  phase: number;
  level: number;
  novelty: number;
  persistence: number;
  recurrence: number;
  directionality: number;
  active: boolean;
}

export interface PredictionPacket {
  meanPrediction: number;
  meanPredictionError: number;
  maxPredictionError: number;
  meanLocalPredictionError: number;
}

export interface RewritePacket {
  rewritePressureMean: number;
  rewritePressureMax: number;
  globalRewriteLoad: number;
  dominantRewriteTendency: RewriteTendency | null;
  priorBiasMean: number;
  priorBiasSummary: Record<RewriteTendency, number>;
  lastRewriteEvent: unknown;
}

export interface ModePacket {
  modeState: ModeStateName;
  wakeDrive: number;
  sleepPressure: number;
  dreamPressure: number;
  modePhase: number;
  modeConfidence: number;
  lastModeChangeTime: number;
  lastModeChangeFrames: number;
  dreamReplayActive: boolean;
  dreamReplayStrength: number;
}

export interface OrganismPacket {
  energy: number;
  stability: number;
  overload: number;
  restDrive: number;
  orientingDrive: number;
  comfortBias: number;
}

export interface ActionPacket {
  actionState: ActionStateName;
  actionPulseLevel: number;
  actionDirection: PacketDirection;
  lastActionChangeTime: number;
  lastActionChangeFrames: number;
}

export interface DynamicsPacket {
  arousal: number;
  sigma: number;
  clusterRatio: number;
  phiProxy: number;
  phaseCoherence: number;
  firingRateError: number;
  freqRatio: number;
}

export type BridgeFacingNumericPacket = Pick<
  TorusStatePacket,
  | 'arousal'
  | 'sigma'
  | 'phi_proxy'
  | 'cluster_ratio'
  | 'touch_pattern'
  | 'touch_pattern_scores'
  | 'sound_level'
  | 'sound_delta'
  | 'sound_band_low'
  | 'sound_band_mid'
  | 'sound_band_high'
  | 'sound_novelty'
  | 'sound_persistence'
  | 'sound_recurrence'
  | 'sound_directionality'
  | 'sound_active'
  | 'light_level'
  | 'light_delta'
  | 'light_novelty'
  | 'light_persistence'
  | 'light_active'
  | 'motion_level'
  | 'motion_delta'
  | 'motion_novelty'
  | 'motion_persistence'
  | 'motion_active'
  | 'time_phase'
  | 'time_level'
  | 'time_persistence'
  | 'time_active'
  | 'mode_state'
  | 'wake_drive'
  | 'sleep_pressure'
  | 'dream_pressure'
  | 'energy'
  | 'stability'
  | 'overload'
  | 'action_state'
  | 'orienting_drive'
  | 'rest_drive'
>;

// Core packets stay numeric so the bridge can later forward them directly to
// Signal Runtime. Japanese text synthesis remains a downstream bridge concern.
