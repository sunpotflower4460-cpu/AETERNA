/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { deriveNowSummaryPanel } from '../observer/deriveNowSummary.ts';
import type { ActuationPulse } from '../types/actuationPulse.ts';
import type {
    ConservationChainLedgerStatus,
    NowSummaryPanelState,
} from '../types/nowSummary.ts';
import type { LocalConservationSubstrateState } from '../types/localConservationSubstrate.ts';
import type { MembraneState } from '../types/membraneState.ts';
import type { SpatialWorldMediumState } from '../types/spatialWorldMedium.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

/**
 * runFullClosedChainObservation
 *
 * D4 deliverable. Drives the full body-world energy loop:
 *
 *   inflow:  ExternalDriveField → SpatialWorldMedium → MembraneExchange
 *              → LocalConservationSubstrate → CurrentBuffer
 *   outflow: CurrentBuffer → ActuationPulse → WorldMediumState (scalar)
 *              → SensoryReturnPackets → Membrane (receivedSensoryField)
 *
 * for `ticks` ticks, capturing all 8 per-tick pair-ledger statuses and
 * feeding them into a single Now Summary render at the end.
 *
 * Note: the inflow chain uses the spatial torus medium / per-cell
 * substrate (v3.x). The outflow chain uses the scalar W3 worldMediumState
 * (parallel, per the D mini-plan design decision). Both worlds run side
 * by side and the Now Summary surfaces statuses for each chain link.
 */

export interface RunFullClosedChainObservationConfig {
    width: number;
    height: number;
    ticks: number;
    steadyDrivePerCell: number;
    /** Per-cell injection request used in the inflow Internal→Buffer step. */
    injectionRequestPerCell?: ArrayLike<number>;
    /** Stub actuation pulse used in the outflow Buffer→Actuation→World step. */
    actuationPulse?: ActuationPulse | null;
    /** Membrane snapshot the outflow chain returns into. */
    membrane: MembraneState;
    /** Cutoff: if defined and t >= this, external drive is set to zero. */
    supplyCutoffTick?: number;
    tolerance?: number;
}

export interface FullChainLedgerStatuses {
    externalToMedium: ConservationChainLedgerStatus;
    mediumToInternal: ConservationChainLedgerStatus;
    internalClosure: ConservationChainLedgerStatus;
    bufferToActuation: ConservationChainLedgerStatus;
    actuationToWorld: ConservationChainLedgerStatus;
    worldToSensory: ConservationChainLedgerStatus;
    sensoryToMembrane: ConservationChainLedgerStatus;
}

export interface RunFullClosedChainObservationResult {
    finalMedium: SpatialWorldMediumState;
    finalSubstrate: LocalConservationSubstrateState;
    finalCurrentBuffer: Float64Array;
    finalWorldMedium: WorldMediumState;
    finalMembrane: MembraneState;
    totalAcceptedDrive: number;
    totalMembraneTransfer: number;
    totalBufferInjectionGranted: number;
    totalActuationOutputEnergy: number;
    totalWorldRetainedEnergy: number;
    totalBoundaryDissipationEnergy: number;
    /** Last-tick statuses across all 8 chain links (membraneToInternal counted twice = 7 unique). */
    finalLedgerStatuses: FullChainLedgerStatuses;
    /** Whether all 8 ledgers are 'closed' at the final tick. */
    allClosedAtFinal: boolean;
    nowSummary: NowSummaryPanelState;
}

function statusOf(
    status: 'closed' | 'nearClosed' | 'open' | 'insufficient' | undefined,
): ConservationChainLedgerStatus {
    return (status ?? 'insufficient') as ConservationChainLedgerStatus;
}

export async function runFullClosedChainObservation(
    config: RunFullClosedChainObservationConfig,
): Promise<RunFullClosedChainObservationResult> {
    const WIDTH = Math.max(1, Math.floor(config.width));
    const HEIGHT = Math.max(1, Math.floor(config.height));
    const TICKS = Math.max(1, Math.floor(config.ticks));
    const TOL = config.tolerance ?? 1e-9;
    const SIZE = WIDTH * HEIGHT;
    const supplyCutoffTick = config.supplyCutoffTick ?? Number.POSITIVE_INFINITY;

    const injectionRequest = new Float64Array(SIZE);
    if (config.injectionRequestPerCell) {
        const len = Math.min(SIZE, config.injectionRequestPerCell.length);
        for (let i = 0; i < len; i++) injectionRequest[i] = config.injectionRequestPerCell[i];
    }

    let drive = createExternalDriveField({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let medium = createSpatialWorldMedium({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let substrate = createLocalConservationSubstrate({
        width: WIDTH,
        height: HEIGHT,
        boundaryMode: 'torus',
    });
    let buffer = new Float64Array(SIZE);

    let worldMedium = initializeWorldMediumState();
    let prevWorldMedium: WorldMediumState | null = null;
    let membrane: MembraneState = config.membrane;

    let totalAcceptedDrive = 0;
    let totalMembraneTransfer = 0;
    let totalBufferInjectionGranted = 0;
    let totalActuationOutputEnergy = 0;
    let totalWorldRetainedEnergy = 0;
    let totalBoundaryDissipationEnergy = 0;

    let last: FullChainLedgerStatuses = {
        externalToMedium: 'insufficient',
        mediumToInternal: 'insufficient',
        internalClosure: 'insufficient',
        bufferToActuation: 'insufficient',
        actuationToWorld: 'insufficient',
        worldToSensory: 'insufficient',
        sensoryToMembrane: 'insufficient',
    };

    for (let t = 0; t < TICKS; t++) {
        const drivePerCell = t >= supplyCutoffTick ? 0 : config.steadyDrivePerCell;

        // ── Inflow ─────────────────────────────────────────────────────────
        if (drivePerCell > 0) {
            const ds = updateSteadyExternalDrive(drive, {
                width: WIDTH,
                height: HEIGHT,
                boundaryMode: 'torus',
                steadyDrivePerCell: drivePerCell,
                dt: 1,
                tolerance: TOL,
            });
            drive = ds.state;
            totalAcceptedDrive += ds.report.acceptedDriveEnergy;
        }

        const e2m = updateExternalDriveToMediumTransferPositive(drive, medium, {
            width: WIDTH,
            height: HEIGHT,
            boundaryMode: 'torus',
            cellMapping: 'same-index',
            transferCoefficient: 0.6,
            dt: 1,
            tolerance: TOL,
        });
        drive = e2m.externalDriveState;
        medium = e2m.spatialWorldMediumState;
        last.externalToMedium = statusOf(e2m.report.pairLedger.status);

        const ms = updateSpatialWorldMedium(medium, {
            width: WIDTH,
            height: HEIGHT,
            boundaryMode: 'torus',
            localExchangeCoefficient: 0.02,
            localDissipationCoefficient: 0.02,
            residueConversionCoefficient: 0.02,
            outflowCoefficient: 0.02,
            membraneExchangeCoefficient: 0.3,
            dt: 1,
            tolerance: TOL,
        });
        medium = ms.state;

        const m2i = updateMembraneToInternalTransferPositive(medium, substrate, {
            width: WIDTH,
            height: HEIGHT,
            boundaryMode: 'torus',
            cellMapping: 'same-index',
            transferCoefficient: 0.6,
            dt: 1,
            tolerance: TOL,
        });
        medium = m2i.spatialWorldMediumState;
        substrate = m2i.localConservationSubstrateState;
        totalMembraneTransfer += m2i.report.transferEnergy;
        last.mediumToInternal = statusOf(m2i.report.pairLedger.status);

        const ss = updateLocalConservationSubstrate(substrate, {
            width: WIDTH,
            height: HEIGHT,
            boundaryMode: 'torus',
            localExchangeCoefficient: 0.02,
            localDissipationCoefficient: 0.02,
            residueConversionCoefficient: 0.02,
            outflowCoefficient: 0.02,
            dt: 1,
            tolerance: TOL,
        });
        substrate = ss.state;
        last.internalClosure = statusOf(ss.report.ledger.status);

        if (config.injectionRequestPerCell) {
            const inj = applyInternalToBufferInjectionRequest(
                substrate,
                buffer,
                { requestedPerCell: injectionRequest },
                WIDTH,
                HEIGHT,
                TOL,
            );
            substrate = inj.substrateState;
            buffer = inj.currentBuffer;
            totalBufferInjectionGranted += inj.report.totalGranted;
        }

        // ── Outflow ────────────────────────────────────────────────────────
        const pulse = config.actuationPulse ?? null;
        const b2a = updateBufferToActuationTransferPositive(buffer, pulse, t, {
            transferCoefficient: 1,
            dt: 1,
            tolerance: TOL,
            cellMapping: 'aggregate',
        });
        buffer = b2a.currentBuffer;
        last.bufferToActuation = statusOf(b2a.report.pairLedger.status);

        prevWorldMedium = worldMedium;
        const a2w = updateActuationToWorldTransferPositive(worldMedium, b2a.pulse, t, {
            transferCoefficient: 60,
            dt: 1 / 60,
            tolerance: TOL,
            cellMapping: 'aggregate',
        });
        worldMedium = a2w.worldState;
        totalActuationOutputEnergy += a2w.report.transferEnergy;
        last.actuationToWorld = statusOf(a2w.report.pairLedger.status);

        const w2s = updateWorldToSensoryTransferPositive(worldMedium, prevWorldMedium, t, {
            transferCoefficient: 60,
            dt: 1 / 60,
            tolerance: TOL,
            cellMapping: 'aggregate',
        });
        totalWorldRetainedEnergy += w2s.report.worldRetainedEnergy;
        last.worldToSensory = statusOf(w2s.report.pairLedger.status);

        const s2m = updateSensoryToMembraneTransferPositive(w2s.packets, membrane, t, {
            transferCoefficient: 60,
            dt: 1 / 60,
            tolerance: TOL,
            cellMapping: 'aggregate',
        });
        membrane = s2m.membraneState;
        totalBoundaryDissipationEnergy += s2m.report.boundaryDissipationEnergy;
        last.sensoryToMembrane = statusOf(s2m.report.pairLedger.status);
    }

    const allClosedAtFinal =
        last.externalToMedium === 'closed' &&
        last.mediumToInternal === 'closed' &&
        last.internalClosure === 'closed' &&
        last.bufferToActuation === 'closed' &&
        last.actuationToWorld === 'closed' &&
        last.worldToSensory === 'closed' &&
        last.sensoryToMembrane === 'closed';

    const nowSummary = deriveNowSummaryPanel({
        timestamp: TICKS,
        externalToMediumLedgerStatus: last.externalToMedium,
        membraneToInternalLedgerStatus: last.mediumToInternal,
        internalSubstrateLedgerStatus: last.internalClosure,
        bufferToActuationLedgerStatus: last.bufferToActuation,
        actuationToWorldLedgerStatus: last.actuationToWorld,
        worldToSensoryLedgerStatus: last.worldToSensory,
        sensoryToMembraneLedgerStatus: last.sensoryToMembrane,
    });

    return {
        finalMedium: medium,
        finalSubstrate: substrate,
        finalCurrentBuffer: buffer,
        finalWorldMedium: worldMedium,
        finalMembrane: membrane,
        totalAcceptedDrive,
        totalMembraneTransfer,
        totalBufferInjectionGranted,
        totalActuationOutputEnergy,
        totalWorldRetainedEnergy,
        totalBoundaryDissipationEnergy,
        finalLedgerStatuses: last,
        allClosedAtFinal,
        nowSummary,
    };
}
