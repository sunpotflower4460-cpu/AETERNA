import type { RecoveryState, RecoveryTrajectoryLabel, CollapseModeLabel } from '../types/recoveryState.ts';

export interface DeriveRecoveryStateInput {
  timestamp: number;
  meanPredictionError: number;
  perturbationLoad: number;
  boundaryIntegrity: number;
  restorationBias: number;
  stability: number;
  overload: number;
  depletion: number;
  selfPreservationBias: number;
  replaySuppression?: number;
  touchOpennessDamping?: number;
  recentPerturbationHistory?: number[];
}

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function deriveRecoveryState(input: DeriveRecoveryStateInput): RecoveryState {
  const mismatch = clampFinite(input.meanPredictionError, 0, 2);
  const perturbationLoad = clampFinite(input.perturbationLoad, 0, 2);
  const boundaryIntegrity = clampFinite(input.boundaryIntegrity, 0, 1);
  const restorationBias = clampFinite(input.restorationBias, 0, 1);
  const stability = clampFinite(input.stability, 0, 1);
  const overload = clampFinite(input.overload, 0, 1.5);
  const depletion = clampFinite(input.depletion, 0, 1.5);
  const selfPreservationBias = clampFinite(input.selfPreservationBias, 0, 1);
  const replaySuppression = clampFinite(input.replaySuppression ?? 0, 0, 1);
  const touchOpennessDamping = clampFinite(input.touchOpennessDamping ?? 0, 0, 1);
  const recentPerturbationMean = mean((input.recentPerturbationHistory ?? []).slice(-40));

  const overloadDrain = clampFinite(
    overload * 0.56 + depletion * 0.28 + mismatch * 0.12,
    0,
    1.5,
  );

  const selfPreservationDrive = clampFinite(
    selfPreservationBias * 0.65 +
    restorationBias * 0.18 +
    replaySuppression * 0.1 +
    touchOpennessDamping * 0.07,
    0,
    1,
  );

  const boundaryRepairPressure = clampFinite(
    restorationBias * 0.45 +
    selfPreservationDrive * 0.35 +
    stability * 0.25 -
    overload * 0.22 -
    mismatch * 0.08,
    0,
    1,
  );

  const recoveryPressure = clampFinite(
    restorationBias * 0.35 +
    boundaryRepairPressure * 0.28 +
    selfPreservationDrive * 0.17 +
    (1 - overloadDrain / 1.5) * 0.2,
    0,
    1,
  );

  const relaxationLevel = clampFinite(
    stability * 0.45 +
    (1 - mismatch / 2) * 0.25 +
    (1 - overload) * 0.2 +
    restorationBias * 0.1,
    0,
    1,
  );

  const stabilizationPull = clampFinite(
    stability * 0.38 +
    boundaryIntegrity * 0.26 +
    restorationBias * 0.2 +
    selfPreservationDrive * 0.16 -
    recentPerturbationMean * 0.15,
    0,
    1,
  );

  const collapseRisk = clampFinite(
    overloadDrain * 0.35 +
    (1 - boundaryIntegrity) * 0.25 +
    mismatch * 0.14 +
    perturbationLoad * 0.16 +
    (1 - stabilizationPull) * 0.1 -
    recoveryPressure * 0.1,
    0,
    1,
  );

  return {
    timestamp: input.timestamp,
    recoveryPressure,
    relaxationLevel,
    stabilizationPull,
    collapseRisk,
    restorationBias,
    boundaryRepairPressure,
    selfPreservationDrive,
    overloadDrain,
  };
}

export function classifyRecoveryTrajectory(
  state: RecoveryState,
  {
    stability,
    boundaryIntegrity,
  }: {
    stability: number;
    boundaryIntegrity: number;
  },
): RecoveryTrajectoryLabel {
  const s = clampFinite(stability, 0, 1);
  const boundary = clampFinite(boundaryIntegrity, 0, 1);

  if (state.collapseRisk > 0.72 || (s < 0.28 && boundary < 0.58)) return 'degrade';
  if (state.recoveryPressure > 0.62 && state.relaxationLevel > 0.55) return 'recover';
  if (state.boundaryRepairPressure !== undefined && state.boundaryRepairPressure > 0.52 && state.recoveryPressure > 0.45) {
    return 'partial_repair';
  }
  return 'shift';
}

export function classifyCollapseMode(
  state: RecoveryState,
  {
    meanActivity,
    maxActivity,
    boundaryIntegrity,
  }: {
    meanActivity: number;
    maxActivity: number;
    boundaryIntegrity: number;
  },
): CollapseModeLabel {
  const activity = clampFinite(meanActivity, 0, 100);
  const maxAct = clampFinite(maxActivity, 0, 100);
  const boundary = clampFinite(boundaryIntegrity, 0, 1);

  if (maxAct > 8.2 && state.collapseRisk > 0.62) return 'runaway';
  if (activity < 0.02 && state.collapseRisk > 0.7) return 'hard_collapse';
  if ((boundary < 0.7 && state.collapseRisk > 0.45) || (activity < 0.06 && state.relaxationLevel < 0.25)) {
    return 'soft_collapse';
  }
  return 'stable';
}
