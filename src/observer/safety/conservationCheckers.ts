export interface ConservationSample {
  measuredEnergy: number;
  expectedEnergy: number;
  measuredMomentum: number;
  expectedMomentum: number;
  measuredWinding: number;
  expectedWinding: number;
}

export interface ConservationResiduals {
  energyResidual: number;
  momentumResidual: number;
  windingResidual: number;
}

function residual(measured: number, expected: number): number {
  if (!Number.isFinite(measured) || !Number.isFinite(expected)) return Number.POSITIVE_INFINITY;
  return Math.abs(measured - expected);
}

export function deriveConservationResiduals(sample: ConservationSample): ConservationResiduals {
  return {
    energyResidual: residual(sample.measuredEnergy, sample.expectedEnergy),
    momentumResidual: residual(sample.measuredMomentum, sample.expectedMomentum),
    windingResidual: residual(sample.measuredWinding, sample.expectedWinding),
  };
}
