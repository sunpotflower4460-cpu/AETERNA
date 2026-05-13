/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * energyChainHook.ts
 *
 * G1+G2 deliverable. Bridges the production runtime (runScenario,
 * DynamicsEngine) to the v3.x inflow chain and the D2 outflow chain.
 *
 *   inflow:  ExternalDriveField → SpatialWorldMedium → MembraneExchange
 *              → LocalConservationSubstrate → CurrentBuffer
 *   outflow: CurrentBuffer → ActuationPulse → WorldMediumState (scalar)
 *              → SensoryReturnPackets → Membrane (receivedSensoryField)
 *
 * Both chains are GATED behind `network.enableEnergyChain`. When the flag is
 * not set (the default), every helper exported here is a fast no-op and the
 * network is not mutated, preserving legacy runtime behavior bit-for-bit.
 *
 * The hook stores its state under `network.energyChain` so it can be reused
 * across ticks. The per-tick ledger statuses are written into
 * `network.chainLedgerStatuses` so that the Now Summary configuration (G3)
 * can surface them.
 */

import {
    createExternalDriveField,
    updateSteadyExternalDrive,
} from '../world/externalDriveField.ts';
import {
    createSpatialWorldMedium,
    updateSpatialWorldMedium,
} from '../world/spatialWorldMedium.ts';
import {
    createLocalConservationSubstrate,
    updateLocalConservationSubstrate,
} from '../substrate/localConservationSubstrate.ts';
import { updateExternalDriveToMediumTransferPositive } from '../world/externalDriveToMediumTransfer.ts';
import { updateMembraneToInternalTransferPositive } from '../world/membraneToInternalTransfer.ts';
import { applyInternalToBufferInjectionRequest } from '../core/internalToBufferTransfer.ts';
import { updateBufferToActuationTransferPositive } from '../actuation/bufferToActuationTransfer.ts';
import { updateActuationToWorldTransferPositive } from '../world/actuationToWorldTransfer.ts';
import { updateWorldToSensoryTransferPositive } from '../perception/worldToSensoryTransfer.ts';
import { updateSensoryToMembraneTransferPositive } from '../perception/sensoryToMembraneTransfer.ts';
import { initializeWorldMediumState } from '../world/initializeWorldMediumState.ts';

import type { ActuationPulse } from '../types/actuationPulse.ts';
import type {
    ConservationChainLedgerStatus,
    NowSummaryPanelState,
} from '../types/nowSummary.ts';
import {
    deriveNowSummaryPanel,
    type DeriveNowSummaryInput,
} from '../observer/deriveNowSummary.ts';
import type { ExternalDriveFieldState } from '../types/externalDriveField.ts';
import type { LocalConservationSubstrateState } from '../types/localConservationSubstrate.ts';
import type { MembraneState } from '../types/membraneState.ts';
import type { SpatialWorldMediumState } from '../types/spatialWorldMedium.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

export interface EnergyChainConfig {
    width: number;
    height: number;
    steadyDrivePerCell: number;
    externalToMediumCoefficient?: number;
    spatialLocalExchangeCoefficient?: number;
    spatialLocalDissipationCoefficient?: number;
    spatialResidueConversionCoefficient?: number;
    spatialOutflowCoefficient?: number;
    membraneExchangeCoefficient?: number;
    substrateLocalExchangeCoefficient?: number;
    substrateLocalDissipationCoefficient?: number;
    substrateResidueConversionCoefficient?: number;
    substrateOutflowCoefficient?: number;
    bufferInjectionRequestPerCell?: ArrayLike<number>;
    bufferToActuationCoefficient?: number;
    actuationToWorldCoefficient?: number;
    worldToSensoryCoefficient?: number;
    sensoryToMembraneCoefficient?: number;
    tolerance?: number;
}

export interface EnergyChainState {
    config: EnergyChainConfig;
    drive: ExternalDriveFieldState;
    medium: SpatialWorldMediumState;
    substrate: LocalConservationSubstrateState;
    buffer: Float64Array;
    worldMedium: WorldMediumState;
    prevWorldMedium: WorldMediumState | null;
    membrane: MembraneState | null;
    totalAcceptedDrive: number;
    totalMembraneTransfer: number;
    totalBufferInjectionGranted: number;
    totalActuationOutputEnergy: number;
    totalWorldRetainedEnergy: number;
    totalBoundaryDissipationEnergy: number;
}

export interface ChainLedgerStatuses {
    externalToMedium: ConservationChainLedgerStatus;
    mediumToInternal: ConservationChainLedgerStatus;
    internalClosure: ConservationChainLedgerStatus;
    bufferToActuation: ConservationChainLedgerStatus;
    actuationToWorld: ConservationChainLedgerStatus;
    worldToSensory: ConservationChainLedgerStatus;
    sensoryToMembrane: ConservationChainLedgerStatus;
}

function statusOf(
    status: 'closed' | 'nearClosed' | 'open' | 'insufficient' | undefined,
): ConservationChainLedgerStatus {
    return (status ?? 'insufficient') as ConservationChainLedgerStatus;
}

function freshChainLedgerStatuses(): ChainLedgerStatuses {
    return {
        externalToMedium: 'insufficient',
        mediumToInternal: 'insufficient',
        internalClosure: 'insufficient',
        bufferToActuation: 'insufficient',
        actuationToWorld: 'insufficient',
        worldToSensory: 'insufficient',
        sensoryToMembrane: 'insufficient',
    };
}

/**
 * Lazily initialize the energy chain state on the network. Idempotent. Does
 * nothing if `network.enableEnergyChain` is falsy.
 *
 * Returns the EnergyChainState (or null if the chain is disabled).
 */
export function ensureEnergyChainState(
    network: any,
    config: EnergyChainConfig,
): EnergyChainState | null {
    if (!network.enableEnergyChain) return null;
    if (network.energyChain) return network.energyChain as EnergyChainState;

    const WIDTH = Math.max(1, Math.floor(config.width));
    const HEIGHT = Math.max(1, Math.floor(config.height));
    const SIZE = WIDTH * HEIGHT;

    const state: EnergyChainState = {
        config: { ...config, width: WIDTH, height: HEIGHT },
        drive: createExternalDriveField({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' }),
        medium: createSpatialWorldMedium({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' }),
        substrate: createLocalConservationSubstrate({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' }),
        buffer: new Float64Array(SIZE),
        worldMedium: initializeWorldMediumState(),
        prevWorldMedium: null,
        membrane: null,
        totalAcceptedDrive: 0,
        totalMembraneTransfer: 0,
        totalBufferInjectionGranted: 0,
        totalActuationOutputEnergy: 0,
        totalWorldRetainedEnergy: 0,
        totalBoundaryDissipationEnergy: 0,
    };

    network.energyChain = state;
    network.chainLedgerStatuses = freshChainLedgerStatuses();
    // Attach substrate to network so F2 / v4.3-c substrate-backed opt-ins
    // (substrateBackedSpikeEvents, substrateBackedNoiseInjection,
    // emergentBaselineFromSubstrate) can resolve `network.localConservationSubstrate`.
    network.localConservationSubstrate = state.substrate;
    return state;
}

/**
 * G1: run the inflow chain (drive → medium → substrate → buffer) for one
 * tick. Caller passes the current sim tick number `t` and an optional
 * `supplyCutoffTick`: if `t >= supplyCutoffTick`, the steady drive is
 * zeroed and only the trailing flows out of the medium / substrate fire.
 *
 * Returns the updated ChainLedgerStatuses for the inflow legs of this tick.
 */
export function applyEnergyChainInflowTick(
    network: any,
    t: number,
    options?: { supplyCutoffTick?: number },
): ChainLedgerStatuses | null {
    if (!network.enableEnergyChain) return null;
    const state = network.energyChain as EnergyChainState | undefined;
    if (!state) return null;
    const statuses = (network.chainLedgerStatuses as ChainLedgerStatuses) ?? freshChainLedgerStatuses();
    const { config } = state;
    const { width: WIDTH, height: HEIGHT } = config;
    const TOL = config.tolerance ?? 1e-9;
    const supplyCutoffTick = options?.supplyCutoffTick ?? Number.POSITIVE_INFINITY;

    const drivePerCell = t >= supplyCutoffTick ? 0 : config.steadyDrivePerCell;
    if (drivePerCell > 0) {
        const ds = updateSteadyExternalDrive(state.drive, {
            width: WIDTH,
            height: HEIGHT,
            boundaryMode: 'torus',
            steadyDrivePerCell: drivePerCell,
            dt: 1,
            tolerance: TOL,
        });
        state.drive = ds.state;
        state.totalAcceptedDrive += ds.report.acceptedDriveEnergy;
    }

    const e2m = updateExternalDriveToMediumTransferPositive(state.drive, state.medium, {
        width: WIDTH,
        height: HEIGHT,
        boundaryMode: 'torus',
        cellMapping: 'same-index',
        transferCoefficient: config.externalToMediumCoefficient ?? 0.6,
        dt: 1,
        tolerance: TOL,
    });
    state.drive = e2m.externalDriveState;
    state.medium = e2m.spatialWorldMediumState;
    statuses.externalToMedium = statusOf(e2m.report.pairLedger.status);

    const ms = updateSpatialWorldMedium(state.medium, {
        width: WIDTH,
        height: HEIGHT,
        boundaryMode: 'torus',
        localExchangeCoefficient: config.spatialLocalExchangeCoefficient ?? 0.02,
        localDissipationCoefficient: config.spatialLocalDissipationCoefficient ?? 0.02,
        residueConversionCoefficient: config.spatialResidueConversionCoefficient ?? 0.02,
        outflowCoefficient: config.spatialOutflowCoefficient ?? 0.02,
        membraneExchangeCoefficient: config.membraneExchangeCoefficient ?? 0.3,
        dt: 1,
        tolerance: TOL,
    });
    state.medium = ms.state;

    const m2i = updateMembraneToInternalTransferPositive(state.medium, state.substrate, {
        width: WIDTH,
        height: HEIGHT,
        boundaryMode: 'torus',
        cellMapping: 'same-index',
        transferCoefficient: config.membraneExchangeCoefficient ?? 0.6,
        dt: 1,
        tolerance: TOL,
    });
    state.medium = m2i.spatialWorldMediumState;
    state.substrate = m2i.localConservationSubstrateState;
    network.localConservationSubstrate = state.substrate;
    state.totalMembraneTransfer += m2i.report.transferEnergy;
    statuses.mediumToInternal = statusOf(m2i.report.pairLedger.status);

    const ss = updateLocalConservationSubstrate(state.substrate, {
        width: WIDTH,
        height: HEIGHT,
        boundaryMode: 'torus',
        localExchangeCoefficient: config.substrateLocalExchangeCoefficient ?? 0.02,
        localDissipationCoefficient: config.substrateLocalDissipationCoefficient ?? 0.02,
        residueConversionCoefficient: config.substrateResidueConversionCoefficient ?? 0.02,
        outflowCoefficient: config.substrateOutflowCoefficient ?? 0.02,
        dt: 1,
        tolerance: TOL,
    });
    state.substrate = ss.state;
    network.localConservationSubstrate = state.substrate;
    statuses.internalClosure = statusOf(ss.report.ledger.status);

    if (config.bufferInjectionRequestPerCell) {
        const inj = applyInternalToBufferInjectionRequest(
            state.substrate,
            state.buffer,
            { requestedPerCell: config.bufferInjectionRequestPerCell },
            WIDTH,
            HEIGHT,
            TOL,
        );
        state.substrate = inj.substrateState;
        state.buffer = inj.currentBuffer;
        network.localConservationSubstrate = state.substrate;
        state.totalBufferInjectionGranted += inj.report.totalGranted;
    }

    network.chainLedgerStatuses = statuses;
    return statuses;
}

/**
 * G2: run the outflow chain (buffer → actuation → world → sensory → membrane)
 * for one tick. The `pulse` is normally the actuation pulse derived from
 * AETERNA's normal action pipeline; if null the transfer is still recorded
 * but with zero energy.
 *
 * Returns the updated ChainLedgerStatuses for the outflow legs of this tick.
 */
export function applyEnergyChainOutflowTick(
    network: any,
    t: number,
    pulse: ActuationPulse | null,
    membrane: MembraneState,
): ChainLedgerStatuses | null {
    if (!network.enableEnergyChain) return null;
    const state = network.energyChain as EnergyChainState | undefined;
    if (!state) return null;
    const statuses = (network.chainLedgerStatuses as ChainLedgerStatuses) ?? freshChainLedgerStatuses();
    const { config } = state;
    const TOL = config.tolerance ?? 1e-9;

    const b2a = updateBufferToActuationTransferPositive(state.buffer, pulse, t, {
        transferCoefficient: config.bufferToActuationCoefficient ?? 1,
        dt: 1,
        tolerance: TOL,
        cellMapping: 'aggregate',
    });
    state.buffer = b2a.currentBuffer;
    statuses.bufferToActuation = statusOf(b2a.report.pairLedger.status);

    state.prevWorldMedium = state.worldMedium;
    const a2w = updateActuationToWorldTransferPositive(state.worldMedium, b2a.pulse, t, {
        transferCoefficient: config.actuationToWorldCoefficient ?? 60,
        dt: 1 / 60,
        tolerance: TOL,
        cellMapping: 'aggregate',
    });
    state.worldMedium = a2w.worldState;
    state.totalActuationOutputEnergy += a2w.report.transferEnergy;
    statuses.actuationToWorld = statusOf(a2w.report.pairLedger.status);

    const w2s = updateWorldToSensoryTransferPositive(state.worldMedium, state.prevWorldMedium, t, {
        transferCoefficient: config.worldToSensoryCoefficient ?? 60,
        dt: 1 / 60,
        tolerance: TOL,
        cellMapping: 'aggregate',
    });
    state.totalWorldRetainedEnergy += w2s.report.worldRetainedEnergy;
    statuses.worldToSensory = statusOf(w2s.report.pairLedger.status);

    const s2m = updateSensoryToMembraneTransferPositive(w2s.packets, membrane, t, {
        transferCoefficient: config.sensoryToMembraneCoefficient ?? 60,
        dt: 1 / 60,
        tolerance: TOL,
        cellMapping: 'aggregate',
    });
    state.membrane = s2m.membraneState;
    state.totalBoundaryDissipationEnergy += s2m.report.boundaryDissipationEnergy;
    statuses.sensoryToMembrane = statusOf(s2m.report.pairLedger.status);

    network.chainLedgerStatuses = statuses;
    return statuses;
}

/**
 * G3 helper: returns the current ledger statuses suitable for direct
 * forwarding into `deriveNowSummaryPanel`. Returns null if the chain is
 * disabled or has not yet ticked.
 */
export function getChainLedgerStatusesForNowSummary(network: any): ChainLedgerStatuses | null {
    if (!network.enableEnergyChain) return null;
    return (network.chainLedgerStatuses as ChainLedgerStatuses) ?? null;
}

/**
 * G3 helper: map ChainLedgerStatuses into the partial-DeriveNowSummaryInput
 * shape expected by `deriveNowSummaryPanel`. Spread the result into the
 * Now Summary input alongside whatever organism-level fields are also being
 * derived. Returns an empty object if the chain is disabled.
 */
export function buildNowSummaryConservationInput(
    network: any,
): Partial<DeriveNowSummaryInput> {
    const s = getChainLedgerStatusesForNowSummary(network);
    if (!s) return {};
    return {
        externalToMediumLedgerStatus: s.externalToMedium,
        membraneToInternalLedgerStatus: s.mediumToInternal,
        internalSubstrateLedgerStatus: s.internalClosure,
        bufferToActuationLedgerStatus: s.bufferToActuation,
        actuationToWorldLedgerStatus: s.actuationToWorld,
        worldToSensoryLedgerStatus: s.worldToSensory,
        sensoryToMembraneLedgerStatus: s.sensoryToMembrane,
    };
}

/**
 * G3 helper (convenience): render the Now Summary with only the chain
 * conservation sections populated. Tests / observation harnesses use this
 * to check that the chain section reports `calm` severity when all 7
 * ledgers are closed.
 */
export function deriveChainOnlyNowSummary(
    network: any,
    timestamp: number,
): NowSummaryPanelState | null {
    if (!network.enableEnergyChain) return null;
    return deriveNowSummaryPanel({
        timestamp,
        ...buildNowSummaryConservationInput(network),
    });
}

/**
 * Returns whether all 7 inflow + outflow ledgers are `closed` for the most
 * recent tick. Useful for acceptance tests (G4).
 */
export function isEnergyChainFullyClosed(network: any): boolean {
    const s = getChainLedgerStatusesForNowSummary(network);
    if (!s) return false;
    return (
        s.externalToMedium === 'closed' &&
        s.mediumToInternal === 'closed' &&
        s.internalClosure === 'closed' &&
        s.bufferToActuation === 'closed' &&
        s.actuationToWorld === 'closed' &&
        s.worldToSensory === 'closed' &&
        s.sensoryToMembrane === 'closed'
    );
}
