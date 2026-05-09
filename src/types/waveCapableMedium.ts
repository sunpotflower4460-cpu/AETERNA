import type { EnergyLedgerState } from './energyLedger.ts';

export type WaveBoundaryMode = 'torus';

export interface WaveCapableMediumConfig {
  width: number;
  height: number;
  boundaryMode: WaveBoundaryMode;
  /** Local restoring coefficient for neighboring cells. This is a material-like coefficient, not a target outcome. */
  localElasticCoupling: number;
  /** Local velocity damping coefficient. Accounted into named wave-energy destination fields in later update phases. */
  localWaveDamping: number;
  /** Numeric safety limit for wave amplitudes. Any future excess must be accounted as clamp/overflow. */
  amplitudeClamp: number;
  dt: number;
  tolerance?: number;
}

export interface WaveCapableMediumState {
  width: number;
  height: number;
  boundaryMode: WaveBoundaryMode;

  /** Complex scalar field components. */
  mediumRealField: Float64Array;
  mediumImagField: Float64Array;

  /** Time derivative components for future leap-frog updates. */
  mediumRealVelocityField: Float64Array;
  mediumImagVelocityField: Float64Array;

  /** Named destinations for later wave-energy accounting. v5.0.0 only defines and reads them. */
  waveEnergyDissipationField: Float64Array;
  waveEnergyResidueField: Float64Array;
  waveEnergyOutflowField: Float64Array;

  tick: number;
}

export interface WaveEnergySnapshot {
  kineticEnergy: number;
  elasticEnergy: number;
  totalEnergy: number;
  finiteCellCount: number;
  nonFiniteCellCount: number;
  metricKind: 'derived';
}

export interface WaveEnergyLedgerCheck {
  source: 'wave-energy-math-foundation';
  energyBefore: number;
  energyAfter: number;
  inputEnergy: number;
  dissipatedEnergy: number;
  residueConvertedEnergy: number;
  measuredOutflowEnergy: number;
  clampLossOrOverflow: number;
  ledger: EnergyLedgerState;
  metricKind: 'derived';
}
