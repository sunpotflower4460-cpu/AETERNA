import type { ActuationPulse } from './actuationPulse.ts';

export type BufferToActuationCellMapping = 'aggregate';
export type BufferToActuationPairLedgerStatus = 'closed' | 'open' | 'insufficient';

export interface BufferToActuationTransferConfig {
    /**
     * Rate-like coefficient multiplied by dt in later phases. In the zero
     * step it is structurally present but accepted as zero only.
     */
    transferCoefficient: number;
    dt: number;
    tolerance?: number;
    /**
     * Mapping from the buffer (per-cell) energy down to the pulse (scalar
     * footprint). Currently only 'aggregate' (sum buffer, draw a single
     * footprint amount).
     */
    cellMapping?: BufferToActuationCellMapping;
}

export interface BufferToActuationPairLedgerState {
    source: 'CurrentBuffer';
    destination: 'ActuationPulse';
    sourceOutEnergy: number;
    destinationInputEnergy: number;
    signedResidual: number;
    residual: number;
    tolerance: number;
    status: BufferToActuationPairLedgerStatus;
    matched: boolean;
    warnings: string[];
}

export interface BufferToActuationTransferZeroReport {
    tick: number;
    acceptedTransferCoefficient: number;
    attemptedTransferCoefficient: number;
    rejectedTransferCoefficient: number;
    transferEnergy: number;
    bufferEnergyBefore: number;
    bufferEnergyAfter: number;
    pulseFootprintEnergy: number;
    pairLedger: BufferToActuationPairLedgerState;
    warnings: string[];
}

export interface BufferToActuationTransferZeroResult {
    currentBuffer: Float64Array;
    /** Echoed (unchanged) for symmetry with the positive step. */
    pulse: ActuationPulse | null;
    report: BufferToActuationTransferZeroReport;
}

export interface BufferToActuationTransferPositiveReport extends BufferToActuationTransferZeroReport {
    transferRate: number;
    bufferEnergyDelta: number;
}

export interface BufferToActuationTransferPositiveResult {
    currentBuffer: Float64Array;
    pulse: ActuationPulse | null;
    report: BufferToActuationTransferPositiveReport;
}
