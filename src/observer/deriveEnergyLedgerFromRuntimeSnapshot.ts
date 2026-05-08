import { deriveEnergyLedger, estimateBufferEnergy } from './deriveEnergyLedger.ts';
import type { EnergyLedgerState } from '../types/energyLedger.ts';

export interface RuntimeEnergyLedgerSnapshotInput {
  timestamp?: number;
  source?: string;
  tolerance?: number;

  /** Previous and current internal buffers. Used only to estimate internal stock delta. */
  previousInternalBuffer?: ArrayLike<number> | null;
  currentInternalBuffer?: ArrayLike<number> | null;
  bufferEnergyMode?: 'squared' | 'absolute';

  /** Explicit accounting terms. Missing terms remain missing; they are not assumed to be zero. */
  inputEnergy?: number;
  dissipatedEnergy?: number;
  actuationOutputEnergy?: number;
  residueConvertedEnergy?: number;
  clampLossOrOverflow?: number;
  measuredOutflowEnergy?: number;

  /** Optional explicit override when buffer estimates are unavailable or intentionally not used. */
  internalEnergyBefore?: number;
  internalEnergyAfter?: number;
  internalAccumulationDelta?: number;
}

export interface RuntimeEnergyLedgerObservation {
  ledger: EnergyLedgerState;
  internalEnergyEstimateMode: 'squared' | 'absolute';
  previousInternalEnergyEstimate: number | null;
  currentInternalEnergyEstimate: number | null;
  finiteSampleCount: number;
  nonFiniteSampleCount: number;
  warnings: string[];
}

function hasBuffer(buffer: ArrayLike<number> | null | undefined): buffer is ArrayLike<number> {
  return buffer != null && typeof buffer.length === 'number';
}

/**
 * deriveEnergyLedgerFromRuntimeSnapshot
 *
 * Lightweight observer adapter for v2.9.
 *
 * This connects the EnergyLedger to observable runtime buffers without changing
 * AETERNA runtime dynamics. It deliberately does not infer input/dissipation/
 * actuation/residue conversion from scalar proxy state. Missing flow terms stay
 * missing and the ledger remains `insufficient` until they are explicitly
 * provided or properly instrumented.
 */
export function deriveEnergyLedgerFromRuntimeSnapshot(
  input: RuntimeEnergyLedgerSnapshotInput,
): RuntimeEnergyLedgerObservation {
  const mode = input.bufferEnergyMode ?? 'squared';

  const previousEstimate = hasBuffer(input.previousInternalBuffer)
    ? estimateBufferEnergy(input.previousInternalBuffer, mode)
    : null;
  const currentEstimate = hasBuffer(input.currentInternalBuffer)
    ? estimateBufferEnergy(input.currentInternalBuffer, mode)
    : null;

  const internalEnergyBefore = input.internalEnergyBefore
    ?? previousEstimate?.value;
  const internalEnergyAfter = input.internalEnergyAfter
    ?? currentEstimate?.value;

  const finiteSampleCount =
    (previousEstimate?.finiteCount ?? 0) +
    (currentEstimate?.finiteCount ?? 0);
  const nonFiniteSampleCount =
    (previousEstimate?.nonFiniteCount ?? 0) +
    (currentEstimate?.nonFiniteCount ?? 0);

  const ledger = deriveEnergyLedger({
    timestamp: input.timestamp,
    source: input.source ?? 'runtime-snapshot-observer-adapter',
    tolerance: input.tolerance,
    inputEnergy: input.inputEnergy,
    internalEnergyBefore,
    internalEnergyAfter,
    internalAccumulationDelta: input.internalAccumulationDelta,
    dissipatedEnergy: input.dissipatedEnergy,
    actuationOutputEnergy: input.actuationOutputEnergy,
    residueConvertedEnergy: input.residueConvertedEnergy,
    clampLossOrOverflow: input.clampLossOrOverflow,
    measuredOutflowEnergy: input.measuredOutflowEnergy,
  });

  const warnings = [...ledger.warnings];
  if (previousEstimate === null || currentEstimate === null) {
    warnings.push('Internal buffer before/after estimate is incomplete.');
  }
  if (nonFiniteSampleCount > 0) {
    warnings.push('Non-finite samples were ignored in internal energy estimates.');
  }
  if (ledger.status === 'insufficient') {
    warnings.push('Runtime snapshot adapter does not infer missing flow terms from proxy state.');
  }

  return {
    ledger,
    internalEnergyEstimateMode: mode,
    previousInternalEnergyEstimate: previousEstimate?.value ?? null,
    currentInternalEnergyEstimate: currentEstimate?.value ?? null,
    finiteSampleCount,
    nonFiniteSampleCount,
    warnings,
  };
}
