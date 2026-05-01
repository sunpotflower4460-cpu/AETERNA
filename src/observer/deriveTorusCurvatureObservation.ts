import type { TorusGeometry } from '../core/torusGeometry.ts';
import type { TorusCurvatureObservation } from '../types/torusCurvatureObservation.ts';

export interface DeriveTorusCurvatureObservationParams {
  geometry?: TorusGeometry | null;
  timestamp: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function deriveTorusCurvatureObservation(
  params: DeriveTorusCurvatureObservationParams,
): TorusCurvatureObservation {
  const { geometry, timestamp } = params;

  if (!geometry || geometry.cells.length === 0) {
    return {
      timestamp,
      minGaussianCurvature: 0,
      maxGaussianCurvature: 0,
      averageGaussianCurvature: 0,
      minMeanCurvature: 0,
      maxMeanCurvature: 0,
      averageMeanCurvature: 0,
      innerRimRegionCount: 0,
      outerRimRegionCount: 0,
      positiveCurvatureRegionCount: 0,
      negativeCurvatureRegionCount: 0,
      curvatureAsymmetry: 0,
      geometryConfidence: 0,
    };
  }

  const gaussianValues = geometry.cells.map((cell) => cell.gaussianCurvature);
  const meanValues = geometry.cells.map((cell) => cell.meanCurvature);
  const innerCells = geometry.cells.filter((cell) => cell.innerOuterBias <= -0.5);
  const outerCells = geometry.cells.filter((cell) => cell.innerOuterBias >= 0.5);
  const positiveCurvatureRegionCount = geometry.cells.filter((cell) => cell.gaussianCurvature > 0).length;
  const negativeCurvatureRegionCount = geometry.cells.filter((cell) => cell.gaussianCurvature < 0).length;
  const finiteCellCount = geometry.cells.filter((cell) => (
    Number.isFinite(cell.areaElement)
    && Number.isFinite(cell.gaussianCurvature)
    && Number.isFinite(cell.meanCurvature)
  )).length;
  const outerAverage = average(outerCells.map((cell) => cell.gaussianCurvature));
  const innerAverage = average(innerCells.map((cell) => cell.gaussianCurvature));

  return {
    timestamp,
    minGaussianCurvature: geometry.minGaussianCurvature,
    maxGaussianCurvature: geometry.maxGaussianCurvature,
    averageGaussianCurvature: average(gaussianValues),
    minMeanCurvature: geometry.minMeanCurvature,
    maxMeanCurvature: geometry.maxMeanCurvature,
    averageMeanCurvature: average(meanValues),
    innerRimRegionCount: innerCells.length,
    outerRimRegionCount: outerCells.length,
    positiveCurvatureRegionCount,
    negativeCurvatureRegionCount,
    curvatureAsymmetry: outerAverage - innerAverage,
    geometryConfidence: clamp01(finiteCellCount / Math.max(1, geometry.cells.length)),
  };
}
