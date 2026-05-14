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
