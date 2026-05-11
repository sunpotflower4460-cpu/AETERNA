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
import { deriveCellObservation } from '../observation/deriveCellObservation.ts';
import { deriveNowSummaryPanel } from '../observer/deriveNowSummary.ts';
import type { CellObservation } from '../types/cellObservation.ts';
import type {
    ConservationChainLedgerStatus,
    NowSummaryPanelState,
} from '../types/nowSummary.ts';
import type { LocalConservationSubstrateState } from '../types/localConservationSubstrate.ts';
import type { SpatialWorldMediumState } from '../types/spatialWorldMedium.ts';

/**
 * runChainObservationScenario
 *
 * v4.0 / B wiring example. Runs the full Energy Realness chain
 *   ExternalDriveField → SpatialWorldMedium → MembraneExchange
 *     → LocalConservationSubstrate → CurrentBuffer
 * for `ticks` steps, then asks the observer pipeline to render:
 * - a NowSummaryPanelState with the chain's three pair-ledger statuses
 *   plugged into the new "保存則チェーン" section;
 * - a CellObservation for an inspected cell that includes the v4.0
 *   conservation group populated from live medium + substrate snapshots.
 *
 * The function is deliberately observer-side wrt the *rest* of AETERNA —
 * it does not modify dynamicCore. The point is to show that v4.0 observer
 * surfaces become populated as soon as a caller passes real chain data,
 * rather than the "未提供" placeholder they would otherwise show.
 */
export interface RunChainObservationScenarioConfig {
    width: number;
    height: number;
    ticks: number;
    /** Steady drive per cell, applied each tick to ExternalDriveField. */
    steadyDrivePerCell: number;
    /** Cell index to capture in CellObservation. Default 0. */
    inspectedCellIndex?: number;
    /** Optional injection request per cell (e.g. noise pattern). Default zero. */
    injectionRequestPerCell?: ArrayLike<number>;
    /** Tolerance used across all ledgers. */
    tolerance?: number;
}

export interface RunChainObservationScenarioResult {
    finalMedium: SpatialWorldMediumState;
    finalSubstrate: LocalConservationSubstrateState;
    finalCurrentBuffer: Float64Array;
    /** Total external drive accepted across all ticks. */
    totalAcceptedDrive: number;
    /** Total membrane transfer accumulated (granted into substrate). */
    totalMembraneTransfer: number;
    /** Total injection granted into currentBuffer across all ticks. */
    totalBufferInjectionGranted: number;
    /** Last-tick ledger statuses, one per chain link. */
    finalLedgerStatuses: {
        externalToMedium: ConservationChainLedgerStatus;
        mediumToInternal: ConservationChainLedgerStatus;
        internalClosure: ConservationChainLedgerStatus;
    };
    /** Rendered Now Summary panel with conservation chain section populated. */
    nowSummary: NowSummaryPanelState;
    /** Cell-level observation for the inspected cell at the final tick. */
    inspectedCellObservation: CellObservation;
}

function statusOf(status: 'closed' | 'nearClosed' | 'open' | 'insufficient' | undefined):
    ConservationChainLedgerStatus {
    return (status ?? 'insufficient') as ConservationChainLedgerStatus;
}

export async function runChainObservationScenario(
    config: RunChainObservationScenarioConfig,
): Promise<RunChainObservationScenarioResult> {
    const WIDTH = Math.max(1, Math.floor(config.width));
    const HEIGHT = Math.max(1, Math.floor(config.height));
    const TICKS = Math.max(1, Math.floor(config.ticks));
    const TOL = config.tolerance ?? 1e-9;
    const SIZE = WIDTH * HEIGHT;
    const inspectedCellIndex = config.inspectedCellIndex ?? 0;

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

    let totalAcceptedDrive = 0;
    let totalMembraneTransfer = 0;
    let totalBufferInjectionGranted = 0;

    let lastExternalToMedium: ConservationChainLedgerStatus = 'insufficient';
    let lastMediumToInternal: ConservationChainLedgerStatus = 'insufficient';
    let lastInternalClosure: ConservationChainLedgerStatus = 'insufficient';

    for (let t = 0; t < TICKS; t++) {
        const driveStep = updateSteadyExternalDrive(drive, {
            width: WIDTH,
            height: HEIGHT,
            boundaryMode: 'torus',
            steadyDrivePerCell: config.steadyDrivePerCell,
            dt: 1,
            tolerance: TOL,
        });
        drive = driveStep.state;
        totalAcceptedDrive += driveStep.report.acceptedDriveEnergy;

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
        lastExternalToMedium = statusOf(e2m.report.pairLedger.status);

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
        lastMediumToInternal = statusOf(m2i.report.pairLedger.status);

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
        lastInternalClosure = statusOf(ss.report.ledger.status);

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
    }

    // ── Observation rendering at end of run ─────────────────────────────────────

    const nowSummary = deriveNowSummaryPanel({
        timestamp: TICKS,
        externalToMediumLedgerStatus: lastExternalToMedium,
        membraneToInternalLedgerStatus: lastMediumToInternal,
        internalSubstrateLedgerStatus: lastInternalClosure,
    });

    const inspectedCellObservation = deriveCellObservation({
        timestamp: TICKS,
        tick: TICKS,
        cellIndex: inspectedCellIndex,
        segments: WIDTH, // width === height in this scenario
        spatialWorldMedium: {
            width: medium.width,
            height: medium.height,
            mediumStorageField: medium.mediumStorageField,
            mediumDissipationField: medium.mediumDissipationField,
            mediumResidueField: medium.mediumResidueField,
            mediumOutflowField: medium.mediumOutflowField,
            membraneExchangeField: medium.membraneExchangeField,
            membraneExchangeReleasedField: medium.membraneExchangeReleasedField,
        },
        localConservationSubstrate: {
            width: substrate.width,
            height: substrate.height,
            storageField: substrate.storageField,
            dissipationField: substrate.dissipationField,
            residueField: substrate.residueField,
            outflowField: substrate.outflowField,
        },
    });

    return {
        finalMedium: medium,
        finalSubstrate: substrate,
        finalCurrentBuffer: buffer,
        totalAcceptedDrive,
        totalMembraneTransfer,
        totalBufferInjectionGranted,
        finalLedgerStatuses: {
            externalToMedium: lastExternalToMedium,
            mediumToInternal: lastMediumToInternal,
            internalClosure: lastInternalClosure,
        },
        nowSummary,
        inspectedCellObservation,
    };
}
