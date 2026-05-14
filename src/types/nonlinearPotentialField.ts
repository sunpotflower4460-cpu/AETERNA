import type { WaveBoundaryMode } from './waveCapableMedium.ts';

export interface NonlinearPotentialFieldConfig {
  width: number;
  height: number;
  boundaryMode: WaveBoundaryMode;
  /** Local quadratic coefficient for position-field amplitude. Material-like, not an outcome instruction. */
  localQuadraticCoefficient: number;
  /** Local quartic coefficient for amplitude-dependent stiffness. Material-like, not an outcome instruction. */
  localQuarticCoefficient: number;
  tolerance?: number;
}

export interface NonlinearPotentialFieldPreparationReport {
  source: 'nonlinear-potential-field-preparation';
  mediumTick: number;
  potentialEnergyTotal: number;
  potentialEnergyMax: number;
  potentialEnergyField: Float64Array;
  gradientRealField: Float64Array;
  gradientImagField: Float64Array;
  maxGradientMagnitude: number;
  gradientEnergyProxy: number;
  finiteCellCount: number;
  nonFiniteCellCount: number;
  mediumChangedFieldCount: number;
  warnings: string[];
  metricKind: 'derived';
}

export interface NonlinearPotentialForcePreviewConfig extends NonlinearPotentialFieldConfig {
  /** Preview-only scale for converting local potential gradient into a force candidate. Nonnegative and not an outcome target. */
  previewForceScale: number;
}

export interface NonlinearPotentialForcePreviewReport {
  source: 'nonlinear-potential-force-preview';
  mediumTick: number;
  preparation: NonlinearPotentialFieldPreparationReport;
  requestedPreviewForceScale: number;
  effectivePreviewForceScale: number;
  previewForceRealField: Float64Array;
  previewForceImagField: Float64Array;
  maxPreviewForceMagnitude: number;
  previewForceEnergyProxy: number;
  finiteCellCount: number;
  nonFiniteCellCount: number;
  mediumChangedFieldCount: number;
  warnings: string[];
  metricKind: 'derived';
}

export interface NonlinearPotentialAccelerationPreviewConfig extends NonlinearPotentialForcePreviewConfig {
  /** Preview-only local mass divisor for converting force candidates into acceleration candidates. Must be positive. */
  previewMass: number;
}

export interface NonlinearPotentialAccelerationPreviewReport {
  source: 'nonlinear-potential-acceleration-preview';
  mediumTick: number;
  forcePreview: NonlinearPotentialForcePreviewReport;
  requestedPreviewMass: number;
  effectivePreviewMass: number;
  previewAccelerationRealField: Float64Array;
  previewAccelerationImagField: Float64Array;
  maxPreviewAccelerationMagnitude: number;
  previewAccelerationEnergyProxy: number;
  finiteCellCount: number;
  nonFiniteCellCount: number;
  mediumChangedFieldCount: number;
  warnings: string[];
  metricKind: 'derived';
}

export type NonlinearPotentialBoundaryAuditStatus = 'pass' | 'warning' | 'fail';

export interface NonlinearPotentialBoundaryAuditReport {
  source: 'nonlinear-potential-boundary-audit';
  mediumTick: number;
  accelerationPreview: NonlinearPotentialAccelerationPreviewReport;
  boundaryAuditStatus: NonlinearPotentialBoundaryAuditStatus;
  appliedRuntimeReady: boolean;
  mediumFieldChangeCount: number;
  previewReportChangeCount: number;
  boundaryViolationCount: number;
  numericWarningCount: number;
  findings: string[];
  warnings: string[];
  mediumChangedFieldCount: number;
  metricKind: 'derived';
}

export type NonlinearPotentialAppliedUpdateProposalStatus = 'proposed' | 'blocked';

export interface NonlinearPotentialAppliedUpdateProposalConfig extends NonlinearPotentialAccelerationPreviewConfig {
  /** Proposal-only timestep for converting acceleration candidates into velocity delta candidates. Nonnegative and not applied in v6.4. */
  proposedDt: number;
  /** Proposal-only scale for velocity delta candidates. Nonnegative and not an outcome target. */
  proposedVelocityUpdateScale: number;
}

export interface NonlinearPotentialAppliedUpdateProposalReport {
  source: 'nonlinear-potential-applied-update-proposal';
  mediumTick: number;
  boundaryAudit: NonlinearPotentialBoundaryAuditReport;
  proposalStatus: NonlinearPotentialAppliedUpdateProposalStatus;
  appliedRuntimeReady: boolean;
  requestedProposedDt: number;
  effectiveProposedDt: number;
  requestedProposedVelocityUpdateScale: number;
  effectiveProposedVelocityUpdateScale: number;
  proposedVelocityDeltaRealField: Float64Array;
  proposedVelocityDeltaImagField: Float64Array;
  maxProposedVelocityDeltaMagnitude: number;
  proposedVelocityDeltaEnergyProxy: number;
  proposedTickDelta: number;
  allowedMutationFields: string[];
  forbiddenMutationFields: string[];
  requiredEnergyAccounting: string[];
  findings: string[];
  warnings: string[];
  mediumChangedFieldCount: number;
  metricKind: 'derived';
}
