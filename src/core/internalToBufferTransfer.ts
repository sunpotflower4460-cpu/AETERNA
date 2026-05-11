import type {
    LocalConservationSubstrateState,
} from '../types/localConservationSubstrate.ts';
import type {
    InternalToBufferInjectionRequest,
    InternalToBufferInjectionReport,
    InternalToBufferInjectionResult,
    InternalToBufferPairLedgerState,
    InternalToBufferTransferConfig,
    InternalToBufferTransferPositiveReport,
    InternalToBufferTransferPositiveResult,
    InternalToBufferTransferZeroReport,
    InternalToBufferTransferZeroResult,
} from '../types/internalToBufferTransfer.ts';

function finiteNonNegative(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function total(field: ArrayLike<number>): number {
    let sum = 0;
    for (let i = 0; i < field.length; i++) {
        const v = field[i];
        if (Number.isFinite(v)) sum += Math.max(0, v);
    }
    return sum;
}

function normalizeConfig(config: InternalToBufferTransferConfig): InternalToBufferTransferConfig {
    return {
        ...config,
        width: Math.max(1, Math.floor(config.width)),
        height: Math.max(1, Math.floor(config.height)),
        transferCoefficient: finiteNonNegative(config.transferCoefficient, 0),
        dt: finiteNonNegative(config.dt, 1),
        tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
    };
}

function ensureShapes(
    substrate: LocalConservationSubstrateState,
    buffer: ArrayLike<number>,
    config: InternalToBufferTransferConfig,
): void {
    const expectedSize = config.width * config.height;
    if (substrate.width !== config.width || substrate.height !== config.height) {
        throw new Error('LocalConservationSubstrate size must match transfer config size.');
    }
    if (buffer.length !== expectedSize) {
        throw new Error('CurrentBuffer length must equal width * height.');
    }
    if (substrate.boundaryMode !== config.boundaryMode) {
        throw new Error('LocalConservationSubstrate boundary mode must match transfer config boundary mode.');
    }
}

export function deriveInternalToBufferPairLedger(
    sourceOutEnergy: number,
    destinationInputEnergy: number,
    toleranceInput = 1e-6,
): InternalToBufferPairLedgerState {
    const tolerance = finiteNonNegative(toleranceInput, 1e-6);
    const signedResidual = sourceOutEnergy - destinationInputEnergy;
    const residual = Math.abs(signedResidual);
    const status = residual <= tolerance ? 'closed' : 'open';
    const warnings: string[] = [];

    if (status !== 'closed') {
        warnings.push(
            'Internal-to-buffer pair ledger is open. Substrate outflow does not match buffer input.',
        );
    }

    return {
        source: 'LocalConservationSubstrate.storageField',
        destination: 'CurrentBuffer',
        sourceOutEnergy,
        destinationInputEnergy,
        signedResidual,
        residual,
        tolerance,
        status,
        matched: status === 'closed',
        warnings,
    };
}

/**
 * updateInternalToBufferTransferZero
 *
 * v4.3-c structure step. Creates the boundary between
 * LocalConservationSubstrate.storageField and CurrentBuffer (the dynamicCore
 * activity field) with a pair ledger but does not move energy. Rejects
 * non-zero transferCoefficient.
 */
export function updateInternalToBufferTransferZero(
    substrate: LocalConservationSubstrateState,
    currentBuffer: ArrayLike<number>,
    configInput: InternalToBufferTransferConfig,
): InternalToBufferTransferZeroResult {
    const config = normalizeConfig(configInput);
    ensureShapes(substrate, currentBuffer, config);

    if (config.cellMapping !== 'same-index') {
        throw new Error('Only same-index transfer mapping is currently supported.');
    }

    const acceptedTransferCoefficient = 0;
    const attemptedTransferCoefficient = config.transferCoefficient;
    const rejectedTransferCoefficient = attemptedTransferCoefficient;
    const transferEnergy = 0;

    const substrateStorageBefore = total(substrate.storageField);
    const bufferEnergyBefore = total(currentBuffer);

    const nextSubstrate: LocalConservationSubstrateState = {
        ...substrate,
        storageField: new Float64Array(substrate.storageField),
        dissipationField: new Float64Array(substrate.dissipationField),
        residueField: new Float64Array(substrate.residueField),
        outflowField: new Float64Array(substrate.outflowField),
        tick: substrate.tick + 1,
    };
    const nextBuffer = new Float64Array(currentBuffer);

    const substrateStorageAfter = total(nextSubstrate.storageField);
    const bufferEnergyAfter = total(nextBuffer);

    const pairLedger = deriveInternalToBufferPairLedger(transferEnergy, 0, config.tolerance);
    const warnings = [...pairLedger.warnings];
    if (rejectedTransferCoefficient > 0) {
        warnings.push('Non-zero transferCoefficient was rejected in the zero step.');
    }

    const report: InternalToBufferTransferZeroReport = {
        tick: nextSubstrate.tick,
        acceptedTransferCoefficient,
        attemptedTransferCoefficient,
        rejectedTransferCoefficient,
        transferEnergy,
        substrateStorageBefore,
        substrateStorageAfter,
        bufferEnergyBefore,
        bufferEnergyAfter,
        pairLedger,
        warnings,
    };

    return {
        substrateState: nextSubstrate,
        currentBuffer: nextBuffer,
        report,
    };
}

/**
 * updateInternalToBufferTransferPositive
 *
 * Bulk transfer from substrate.storageField to currentBuffer (e.g. a steady
 * background flow). Per-cell amount = min(available, available * transferRate).
 * Pair ledger verifies source-out equals destination-input.
 */
export function updateInternalToBufferTransferPositive(
    substrate: LocalConservationSubstrateState,
    currentBuffer: ArrayLike<number>,
    configInput: InternalToBufferTransferConfig,
): InternalToBufferTransferPositiveResult {
    const config = normalizeConfig(configInput);
    ensureShapes(substrate, currentBuffer, config);

    if (config.cellMapping !== 'same-index') {
        throw new Error('Only same-index transfer mapping is currently supported.');
    }

    const size = config.width * config.height;
    const transferRate = Math.min(1, config.transferCoefficient * config.dt);

    const substrateBefore = substrate.storageField;
    const nextSubstrateStorage = new Float64Array(substrateBefore);
    const nextBuffer = new Float64Array(currentBuffer);

    const substrateStorageBefore = total(substrateBefore);
    const bufferEnergyBefore = total(currentBuffer);

    let transferEnergy = 0;
    for (let i = 0; i < size; i++) {
        const available = finiteNonNegative(substrateBefore[i], 0);
        const amount = Math.min(available, available * transferRate);
        nextSubstrateStorage[i] = available - amount;
        nextBuffer[i] += amount;
        transferEnergy += amount;
    }

    const nextSubstrate: LocalConservationSubstrateState = {
        ...substrate,
        storageField: nextSubstrateStorage,
        dissipationField: new Float64Array(substrate.dissipationField),
        residueField: new Float64Array(substrate.residueField),
        outflowField: new Float64Array(substrate.outflowField),
        tick: substrate.tick + 1,
    };

    const substrateStorageAfter = total(nextSubstrateStorage);
    const bufferEnergyAfter = total(nextBuffer);
    const sourceOutEnergy = substrateStorageBefore - substrateStorageAfter;
    const destinationInputEnergy = bufferEnergyAfter - bufferEnergyBefore;
    const pairLedger = deriveInternalToBufferPairLedger(sourceOutEnergy, destinationInputEnergy, config.tolerance);

    const report: InternalToBufferTransferPositiveReport = {
        tick: nextSubstrate.tick,
        acceptedTransferCoefficient: config.transferCoefficient,
        attemptedTransferCoefficient: config.transferCoefficient,
        rejectedTransferCoefficient: 0,
        transferRate,
        transferEnergy,
        substrateStorageBefore,
        substrateStorageAfter,
        substrateStorageDelta: substrateStorageAfter - substrateStorageBefore,
        bufferEnergyBefore,
        bufferEnergyAfter,
        bufferEnergyDelta: bufferEnergyAfter - bufferEnergyBefore,
        pairLedger,
        warnings: [...pairLedger.warnings],
    };

    return {
        substrateState: nextSubstrate,
        currentBuffer: nextBuffer,
        report,
    };
}

/**
 * applyInternalToBufferInjectionRequest
 *
 * Per-cell bounded injection. The caller requests an injection amount per cell
 * (e.g. noise magnitudes). Each request is granted only up to the substrate
 * availability at that cell. Whatever cannot be granted is reported as
 * `totalUngranted`. Pair ledger verifies source-out equals destination-input.
 *
 * Used by triggerNoise so that noise injection cannot exceed substrate
 * availability — internal activity bounded by the energy actually on hand.
 */
export function applyInternalToBufferInjectionRequest(
    substrate: LocalConservationSubstrateState,
    currentBuffer: ArrayLike<number>,
    request: InternalToBufferInjectionRequest,
    width: number,
    height: number,
    tolerance = 1e-6,
): InternalToBufferInjectionResult {
    const expectedSize = width * height;
    if (substrate.width !== width || substrate.height !== height) {
        throw new Error('substrate size mismatch');
    }
    if (currentBuffer.length !== expectedSize) {
        throw new Error('currentBuffer size mismatch');
    }
    if (request.requestedPerCell.length !== expectedSize) {
        throw new Error('requestedPerCell size mismatch');
    }

    const nextSubstrateStorage = new Float64Array(substrate.storageField);
    const nextBuffer = new Float64Array(currentBuffer);
    const granted = new Float64Array(expectedSize);

    let totalRequested = 0;
    let totalGranted = 0;
    let totalUngranted = 0;

    for (let i = 0; i < expectedSize; i++) {
        const want = finiteNonNegative(request.requestedPerCell[i], 0);
        if (want === 0) continue;
        const available = finiteNonNegative(nextSubstrateStorage[i], 0);
        const give = Math.min(want, available);
        const miss = want - give;
        nextSubstrateStorage[i] = available - give;
        nextBuffer[i] += give;
        granted[i] = give;
        totalRequested += want;
        totalGranted += give;
        totalUngranted += miss;
    }

    const nextSubstrate: LocalConservationSubstrateState = {
        ...substrate,
        storageField: nextSubstrateStorage,
        dissipationField: new Float64Array(substrate.dissipationField),
        residueField: new Float64Array(substrate.residueField),
        outflowField: new Float64Array(substrate.outflowField),
        tick: substrate.tick + 1,
    };

    const pairLedger = deriveInternalToBufferPairLedger(totalGranted, totalGranted, tolerance);
    const warnings = [...pairLedger.warnings];
    if (totalUngranted > 0) {
        warnings.push(
            `Internal activity bounded by available energy: ${totalUngranted.toFixed(6)} units of requested injection could not be granted because substrate was empty at those cells.`,
        );
    }

    const report: InternalToBufferInjectionReport = {
        tick: nextSubstrate.tick,
        totalRequested,
        totalGranted,
        totalUngranted,
        pairLedger,
        warnings,
    };

    return {
        substrateState: nextSubstrate,
        currentBuffer: nextBuffer,
        grantedPerCell: granted,
        report,
    };
}
