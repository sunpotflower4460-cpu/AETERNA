import type { SensoryReturnPacket } from './sensoryReturnPacket.ts';
import type { WorldMediumState } from './worldMediumState.ts';

export type WorldToSensoryCellMapping = 'aggregate';
export type WorldToSensoryPairLedgerStatus = 'closed' | 'open' | 'insufficient';

export interface WorldToSensoryTransferConfig {
    /**
     * Rate-like coefficient multiplied by dt in later phases. In the zero
     * step it is structurally present but accepted as zero only.
     */
    transferCoefficient: number;
    dt: number;
    tolerance?: number;
    cellMapping?: WorldToSensoryCellMapping;
}

export interface WorldToSensoryPairLedgerState {
    source: 'WorldMediumState.delta';
    destination: 'SensoryReturnPackets + worldRetainedEnergy';
    sourceOutEnergy: number;
    destinationInputEnergy: number;
    signedResidual: number;
    residual: number;
    tolerance: number;
    status: WorldToSensoryPairLedgerStatus;
    matched: boolean;
    warnings: string[];
}

export interface WorldToSensoryTransferReport {
    tick: number;
    acceptedTransferCoefficient: number;
    attemptedTransferCoefficient: number;
    rejectedTransferCoefficient: number;
    transferRate: number;
    /** Sum of |after - before| across comparable world fields. */
    worldDeltaMagnitude: number;
    /** Sum of packet intensities (the AETERNA-side sensory inflow). */
    totalPacketIntensity: number;
    /**
     * Named destination for world delta that did NOT exit as packets.
     * Always >= 0. Represents energy that stayed inside the world (residue,
     * turbulence, dissipation at the world side).
     */
    worldRetainedEnergy: number;
    /**
     * Negative-side warning amount: when packet sum exceeds world delta
     * (e.g. due to amplification in deriveSensoryReturn), the gap is
     * reported here. Always >= 0. Non-zero indicates the pair-ledger is
     * 'open' (more output observed than input world delta).
     */
    sensoryOversupplyEnergy: number;
    pairLedger: WorldToSensoryPairLedgerState;
    warnings: string[];
}

export interface WorldToSensoryTransferZeroResult {
    /** Echoed unchanged in the zero step. */
    packets: SensoryReturnPacket[];
    report: WorldToSensoryTransferReport;
}

export interface WorldToSensoryTransferPositiveResult {
    packets: SensoryReturnPacket[];
    report: WorldToSensoryTransferReport;
}

export interface WorldToSensoryTransferInput {
    currentWorld: WorldMediumState;
    previousWorld: WorldMediumState | null;
    tick: number;
    config: WorldToSensoryTransferConfig;
}
