/**
 * Torus curvature observation derived from torus metric data.
 *
 * This is an observer-side geometry snapshot. It does not create
 * new runtime entities or semantic labels.
 */
export interface TorusCurvatureObservation {
  timestamp: number;
  minGaussianCurvature: number;
  maxGaussianCurvature: number;
  averageGaussianCurvature: number;
  minMeanCurvature: number;
  maxMeanCurvature: number;
  averageMeanCurvature: number;
  innerRimRegionCount: number;
  outerRimRegionCount: number;
  positiveCurvatureRegionCount: number;
  negativeCurvatureRegionCount: number;
  curvatureAsymmetry: number;
  geometryConfidence: number;
}
