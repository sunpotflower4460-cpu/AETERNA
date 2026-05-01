import type { MembraneState } from '../types/membraneState.ts';
import type { MembraneObservationState } from '../types/membraneObservation.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function deriveMembraneObservation(
  membraneState: MembraneState | null | undefined,
): MembraneObservationState {
  if (!membraneState) {
    return {
      timestamp: 0,
      averagePermeability: 0,
      averageTension: 0,
      averageDeformation: 0,
      averageTwoSidedness: 0,
      highDeformationRegionCount: 0,
      highTwoSidednessRegionCount: 0,
      actuationReturnOverlap: 0,
      membraneRecoveryBalance: 1,
      membraneAsymmetry: 0,
      membraneIntegrity: 1,
      observationConfidence: 0,
      nanOrInfinityCount: 0,
    };
  }

  const cells = membraneState.cells;
  const highDeformationRegionCount = cells.filter((cell) => cell.deformation >= 0.35).length;
  const highTwoSidednessRegionCount = cells.filter((cell) => cell.twoSidedness >= 0.35).length;
  const actuationReturnOverlap = clamp01(average(
    cells.map((cell) => Math.min(cell.actuationImprint, cell.returnImprint)),
  ) * 2.2);
  const membraneRecoveryBalance = clamp01(
    membraneState.averageRecovery * 0.65 + (1 - membraneState.averageDeformation) * 0.35,
  );

  const leftCells = cells.filter((cell) => Math.floor(cell.index / membraneState.segments) < membraneState.segments / 2);
  const rightCells = cells.filter((cell) => Math.floor(cell.index / membraneState.segments) >= membraneState.segments / 2);
  const leftMean = average(leftCells.map((cell) => cell.deformation));
  const rightMean = average(rightCells.map((cell) => cell.deformation));
  const membraneAsymmetry = clamp01(Math.abs(leftMean - rightMean) * 2);
  const observationConfidence = clamp01(
    membraneState.membraneConfidence * 0.55
      + membraneState.membraneIntegrity * 0.25
      + (1 - clamp01(membraneState.nanOrInfinityCount / Math.max(1, cells.length))) * 0.2,
  );

  return {
    timestamp: membraneState.timestamp,
    averagePermeability: membraneState.averagePermeability,
    averageTension: membraneState.averageTension,
    averageDeformation: membraneState.averageDeformation,
    averageTwoSidedness: membraneState.averageTwoSidedness,
    highDeformationRegionCount,
    highTwoSidednessRegionCount,
    actuationReturnOverlap,
    membraneRecoveryBalance,
    membraneAsymmetry,
    membraneIntegrity: membraneState.membraneIntegrity,
    observationConfidence,
    nanOrInfinityCount: membraneState.nanOrInfinityCount,
  };
}
