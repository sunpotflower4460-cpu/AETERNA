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
