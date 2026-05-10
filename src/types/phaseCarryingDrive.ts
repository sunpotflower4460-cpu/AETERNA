export type PhaseCarryingDriveBoundaryMode = 'torus';

export type SpatialPhaseInitializationMode = 'seededNoise' | 'provided';

export type InjectionMaskInitializationMode = 'centerPoint' | 'provided';

export interface PhaseCarryingDriveConfig {
  width: number;
  height: number;
  boundaryMode: PhaseCarryingDriveBoundaryMode;
  /** Deterministic seed for spatial phase initialization when no phase field is provided. */
  phaseSeed?: number;
  /** Optional per-cell phase in turns [0, 1). If absent, deterministic seeded phase is generated. */
  spatialPhaseField?: ArrayLike<number>;
  /** Optional per-cell injection mask in [0, 1]. If absent, a center-point mask is generated. */
  injectionMask?: ArrayLike<number>;
  tolerance?: number;
}

export interface PhaseCarryingDriveState {
  width: number;
  height: number;
  boundaryMode: PhaseCarryingDriveBoundaryMode;

  /** Complex drive field real component. v5.1.0 creates structure only; values start at zero. */
  driveRealField: Float64Array;

  /** Complex drive field imaginary component. v5.1.0 creates structure only; values start at zero. */
  driveImagField: Float64Array;

  /** Per-cell phase offset in turns [0, 1). This prevents accidental all-zero phase defaults. */
  spatialPhaseField: Float64Array;

  /** Per-cell local injection coefficient in [0, 1]. This defines where later drive injection may act. */
  injectionMask: Float64Array;

  tick: number;
}

export interface PhaseCarryingDriveCreationReport {
  tick: number;
  spatialPhaseMode: SpatialPhaseInitializationMode;
  injectionMaskMode: InjectionMaskInitializationMode;
  activeInjectionCellCount: number;
  injectionMaskTotal: number;
  fullInjectionMask: boolean;
  zeroInjectionMask: boolean;
  allSpatialPhaseSamplesEqual: boolean;
  warnings: string[];
  metricKind: 'derived';
}

export interface PhaseCarryingDriveCreationResult {
  state: PhaseCarryingDriveState;
  report: PhaseCarryingDriveCreationReport;
}

export interface PhaseCarryingDriveDiagnostic {
  driveMagnitudeTotal: number;
  driveMagnitudeMax: number;
  activeInjectionCellCount: number;
  injectionMaskTotal: number;
  phaseSpread: number;
  warnings: string[];
  metricKind: 'derived';
}
