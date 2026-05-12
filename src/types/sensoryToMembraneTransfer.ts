import type { MembraneState } from './membraneState.ts';
import type { PerturbationEvent } from './perturbationEvent.ts';
import type { SensoryReturnPacket } from './sensoryReturnPacket.ts';

export type SensoryToMembraneCellMapping = 'aggregate';
export type SensoryToMembranePairLedgerStatus = 'closed' | 'open' | 'insufficient';

export interface SensoryToMembraneTransferConfig {
    /**
     * Rate-like coefficient multiplied by dt in later phases. In the zero
     * step it is structurally present but accepted as zero only.
     */
    transferCoefficient: number;
    dt: number;
    tolerance?: number;
    cellMapping?: SensoryToMembraneCellMapping;
    /**
     * Fraction of packet intensity that becomes perturbation energy at the
     * membrane. Matches the legacy `weakScale = 0.3` from
     * sensoryReturnToPerturbation.ts. Default: 0.3. The remainder is named
     * as boundaryDissipationEnergy.
     */
    perturbationWeakScale?: number;
}

export interface SensoryToMembranePairLedgerState {
    source: 'SensoryReturnPackets';
    destination: 'PerturbationEvents + boundaryDissipationEnergy';
    sourceOutEnergy: number;
    destinationInputEnergy: number;
    signedResidual: number;
    residual: number;
    tolerance: number;
    status: SensoryToMembranePairLedgerStatus;
    matched: boolean;
    warnings: string[];
}

export interface SensoryToMembraneTransferReport {
    tick: number;
    acceptedTransferCoefficient: number;
    attemptedTransferCoefficient: number;
    rejectedTransferCoefficient: number;
    transferRate: number;
    /** Sum of packet intensities (source). */
    totalPacketIntensity: number;
    /** Sum of perturbation magnitudes (= source * weakScale). */
    perturbationEnergy: number;
    /** Named destination for the (1 - weakScale) portion of packet energy. */
    boundaryDissipationEnergy: number;
    perturbationEvents: PerturbationEvent[];
    pairLedger: SensoryToMembranePairLedgerState;
    warnings: string[];
}

export interface SensoryToMembraneTransferZeroResult {
    /** Echoed unchanged in the zero step. */
    membraneState: MembraneState;
    perturbationEvents: PerturbationEvent[];
    report: SensoryToMembraneTransferReport;
}

export interface SensoryToMembraneTransferPositiveResult {
    membraneState: MembraneState;
    perturbationEvents: PerturbationEvent[];
    report: SensoryToMembraneTransferReport;
}

export interface SensoryToMembraneTransferInput {
    packets: SensoryReturnPacket[];
    membrane: MembraneState;
    tick: number;
    config: SensoryToMembraneTransferConfig;
}
