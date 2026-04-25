export interface RecoveryState {
  timestamp: number;
  recoveryPressure: number;
  relaxationLevel: number;
  stabilizationPull: number;
  collapseRisk: number;
  restorationBias: number;
  boundaryRepairPressure?: number;
  selfPreservationDrive?: number;
  overloadDrain?: number;
}

export type RecoveryTrajectoryLabel =
  | 'recover'
  | 'shift'
  | 'degrade'
  | 'partial_repair';

export type CollapseModeLabel =
  | 'stable'
  | 'soft_collapse'
  | 'hard_collapse'
  | 'runaway';
