export type EnergyLedgerMetricKind = 'raw' | 'derived' | 'proxy' | 'check' | 'unknown';

export type EnergyLedgerConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'insufficient';

export type EnergyLedgerStatus =
  | 'closed'
  | 'nearClosed'
  | 'open'
  | 'insufficient';

export interface EnergyLedgerTerm {
  id: string;
  label: string;
  value: number | null;
  kind: EnergyLedgerMetricKind;
  requiredForClosure: boolean;
  note: string;
}

export interface EnergyLedgerInput {
  timestamp?: number;
  tolerance?: number;
  source?: string;

  /** Energy entering the accounting boundary during this tick. */
  inputEnergy?: number;

  /** Optional raw storage values. If both are finite, internalAccumulationDelta can be derived. */
  internalEnergyBefore?: number;
  internalEnergyAfter?: number;

  /** Optional direct delta. Used only when before/after are not both finite. */
  internalAccumulationDelta?: number;

  /** Named destinations / conversions. Use explicit 0 when measured and absent. */
  dissipatedEnergy?: number;
  actuationOutputEnergy?: number;
  residueConvertedEnergy?: number;

  /** Optional named boundary-side transfer that is not actuation/output. */
  boundaryExchangeEnergy?: number;

  /** Optional known loss terms. These are accounted, not silently discarded. */
  clampLossOrOverflow?: number;
  measuredOutflowEnergy?: number;
}

export interface EnergyLedgerState {
  timestamp: number;
  source: string;
  metricKind: 'check';
  tolerance: number;

  inputEnergy: number | null;
  internalEnergyBefore: number | null;
  internalEnergyAfter: number | null;
  internalAccumulationDelta: number | null;
  dissipatedEnergy: number | null;
  actuationOutputEnergy: number | null;
  residueConvertedEnergy: number | null;
  boundaryExchangeEnergy: number | null;
  clampLossOrOverflow: number | null;
  measuredOutflowEnergy: number | null;

  accountedEnergy: number | null;
  signedResidual: number | null;
  conservationResidual: number | null;

  status: EnergyLedgerStatus;
  confidence: EnergyLedgerConfidence;
  verifiedModeledFlow: boolean;

  missingTermIds: string[];
  terms: EnergyLedgerTerm[];
  warnings: string[];
  notes: string[];
}

export interface BufferEnergyEstimate {
  value: number;
  mode: 'squared' | 'absolute';
  sampleCount: number;
  finiteCount: number;
  nonFiniteCount: number;
}
