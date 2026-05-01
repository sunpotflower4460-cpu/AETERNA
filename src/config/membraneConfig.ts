export interface MembraneConfig {
  enabled: boolean;
  mode: 'observerOnly' | 'weakCoupling';
  actuationInfluence: number;
  returnInfluence: number;
  recoveryRate: number;
  permeabilityMin: number;
  permeabilityMax: number;
  tensionMin: number;
  tensionMax: number;
  deformationClamp: number;
  couplingToWorld: number;
  couplingToBody: number;
}

export const defaultMembraneConfig: MembraneConfig = {
  enabled: true,
  mode: 'observerOnly',
  actuationInfluence: 0.05,
  returnInfluence: 0.05,
  recoveryRate: 0.02,
  permeabilityMin: 0.05,
  permeabilityMax: 0.95,
  tensionMin: 0.05,
  tensionMax: 0.95,
  deformationClamp: 1.0,
  couplingToWorld: 0,
  couplingToBody: 0,
};
