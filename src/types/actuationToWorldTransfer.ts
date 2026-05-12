import type { ActuationPulse } from './actuationPulse.ts';
import type { EnergyLedgerState } from './energyLedger.ts';
import type { WorldMediumState } from './worldMediumState.ts';

export type ActuationToWorldCellMapping = 'aggregate';
export type ActuationToWorldPairLedgerStatus = 'closed' | 'open' | 'insufficient';

export interface ActuationToWorldTransferConfig {
    /**
     * Rate-like coefficient multiplied by dt in later phases. In the zero
     * step it is structurally present but accepted as zero only.
     */
    transferCoefficient: number;
    dt: number;
    tolerance?: number;
    cellMapping?: ActuationToWorldCellMapping;
}

export interface ActuationToWorldPairLedgerState {
    source: 'ActuationPulse';
    destination: 'WorldMediumState';
    sourceOutEnergy: number;
    destinationInputEnergy: number;
    signedResidual: number;
    residual: number;
    tolerance: number;
    status: ActuationToWorldPairLedgerStatus;
    matched: boolean;
    warnings: string[];
}

export interface ActuationToWorldTransferReport {
    tick: number;
    acceptedTransferCoefficient: number;
    attemptedTransferCoefficient: number;
    rejectedTransferCoefficient: number;
    transferRate: number;
    transferEnergy: number;
    pulseFootprintEnergy: number;
    /** Observed sum of |world field delta| attributable to the pulse step. */
    observedWorldDeltaMagnitude: number;
    pairLedger: ActuationToWorldPairLedgerState;
    /** EnergyLedger view with actuationOutputEnergy populated by the granted amount. */
    energyLedger: EnergyLedgerState;
    warnings: string[];
}

export interface ActuationToWorldTransferZeroResult {
    worldState: WorldMediumState;
    report: ActuationToWorldTransferReport;
}

export interface ActuationToWorldTransferPositiveResult {
    worldState: WorldMediumState;
    report: ActuationToWorldTransferReport;
}

/** Input shape for the positive step. */
export interface ActuationToWorldTransferInput {
    world: WorldMediumState;
    pulse: ActuationPulse | null;
    tick: number;
    config: ActuationToWorldTransferConfig;
}
