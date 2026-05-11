import type { LocalConservationSubstrateState } from './localConservationSubstrate.ts';

export type InternalToBufferBoundaryMode = 'torus';
export type InternalToBufferCellMapping = 'same-index';
export type InternalToBufferPairLedgerStatus = 'closed' | 'open' | 'insufficient';

export interface InternalToBufferTransferConfig {
    width: number;
    height: number;
    boundaryMode: InternalToBufferBoundaryMode;
    cellMapping: InternalToBufferCellMapping;
    /**
     * Rate-like coefficient multiplied by dt in later phases. In v4.3-c
     * structure step it is accepted as zero only.
     */
    transferCoefficient: number;
    dt: number;
    tolerance?: number;
}

export interface InternalToBufferPairLedgerState {
    source: 'LocalConservationSubstrate.storageField';
    destination: 'CurrentBuffer';
    sourceOutEnergy: number;
    destinationInputEnergy: number;
    signedResidual: number;
    residual: number;
    tolerance: number;
    status: InternalToBufferPairLedgerStatus;
    matched: boolean;
    warnings: string[];
}

export interface InternalToBufferTransferZeroReport {
    tick: number;
    acceptedTransferCoefficient: number;
    attemptedTransferCoefficient: number;
    rejectedTransferCoefficient: number;
    transferEnergy: number;
    substrateStorageBefore: number;
    substrateStorageAfter: number;
    bufferEnergyBefore: number;
    bufferEnergyAfter: number;
    pairLedger: InternalToBufferPairLedgerState;
    warnings: string[];
}

export interface InternalToBufferTransferZeroResult {
    substrateState: LocalConservationSubstrateState;
    /** Returned as a fresh Float64Array clone so callers can swap into the network. */
    currentBuffer: Float64Array;
    report: InternalToBufferTransferZeroReport;
}

export interface InternalToBufferTransferPositiveReport extends InternalToBufferTransferZeroReport {
    transferRate: number;
    substrateStorageDelta: number;
    bufferEnergyDelta: number;
}

export interface InternalToBufferTransferPositiveResult {
    substrateState: LocalConservationSubstrateState;
    currentBuffer: Float64Array;
    report: InternalToBufferTransferPositiveReport;
}

/**
 * Per-cell limited injection request shape. Used by injection sites that want
 * to draw from substrate without exceeding what is locally available.
 */
export interface InternalToBufferInjectionRequest {
    /** Requested injection amount per cell (length = width * height). Non-negative. */
    requestedPerCell: ArrayLike<number>;
}

export interface InternalToBufferInjectionReport {
    tick: number;
    /** Sum of requested amounts. */
    totalRequested: number;
    /** Sum of granted amounts (bounded by per-cell substrate availability). */
    totalGranted: number;
    /** Sum of requested-but-not-granted (substrate was empty at the cell). */
    totalUngranted: number;
    pairLedger: InternalToBufferPairLedgerState;
    warnings: string[];
}

export interface InternalToBufferInjectionResult {
    substrateState: LocalConservationSubstrateState;
    currentBuffer: Float64Array;
    /** Per-cell amounts that were actually granted (bounded by substrate availability). */
    grantedPerCell: Float64Array;
    report: InternalToBufferInjectionReport;
}
