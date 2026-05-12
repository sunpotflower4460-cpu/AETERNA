import type { ActuationPulse } from '../types/actuationPulse.ts';
import type {
    BufferToActuationPairLedgerState,
    BufferToActuationTransferConfig,
    BufferToActuationTransferPositiveReport,
    BufferToActuationTransferPositiveResult,
    BufferToActuationTransferZeroReport,
    BufferToActuationTransferZeroResult,
} from '../types/bufferToActuationTransfer.ts';

function finiteNonNegative(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function bufferTotal(field: ArrayLike<number>): number {
    let sum = 0;
    for (let i = 0; i < field.length; i++) {
        const v = field[i];
        if (Number.isFinite(v)) sum += Math.max(0, v);
    }
    return sum;
}

/**
 * Compute the pulse "energy footprint" used by the pair ledger.
 *
 * intensity * outputReadiness * coherence is the natural product:
 *  - intensity is the magnitude of the actuation
 *  - outputReadiness gates whether the body is ready to release energy
 *  - coherence reflects how concentrated the release is
 *
 * Channel-specific scaling can be added in a later phase if needed; for now
 * the product is channel-agnostic.
 */
export function deriveActuationPulseFootprintEnergy(pulse: ActuationPulse | null): number {
    if (!pulse) return 0;
    const i = finiteNonNegative(pulse.intensity, 0);
    const o = finiteNonNegative(pulse.outputReadiness, 0);
    const c = finiteNonNegative(pulse.coherence, 0);
    return i * o * c;
}

export function deriveBufferToActuationPairLedger(
    sourceOutEnergy: number,
    destinationInputEnergy: number,
    toleranceInput = 1e-6,
): BufferToActuationPairLedgerState {
    const tolerance = finiteNonNegative(toleranceInput, 1e-6);
    const signedResidual = sourceOutEnergy - destinationInputEnergy;
    const residual = Math.abs(signedResidual);
    const status = residual <= tolerance ? 'closed' : 'open';
    const warnings: string[] = [];

    if (status !== 'closed') {
        warnings.push(
            'Buffer-to-actuation pair ledger is open. Buffer draw does not match pulse footprint.',
        );
    }

    return {
        source: 'CurrentBuffer',
        destination: 'ActuationPulse',
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

function normalizeConfig(config: BufferToActuationTransferConfig): BufferToActuationTransferConfig {
    return {
        transferCoefficient: finiteNonNegative(config.transferCoefficient, 0),
        dt: finiteNonNegative(config.dt, 1),
        tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
        cellMapping: config.cellMapping ?? 'aggregate',
    };
}

/**
 * updateBufferToActuationTransferZero
 *
 * Structure step. Pair ledger exists; no energy is moved. Rejects non-zero
 * transferCoefficient. The pulse passes through unchanged so callers can
 * still observe the pulse without taking the energetic side-effect.
 */
export function updateBufferToActuationTransferZero(
    currentBuffer: ArrayLike<number>,
    pulse: ActuationPulse | null,
    tick: number,
    configInput: BufferToActuationTransferConfig,
): BufferToActuationTransferZeroResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const bufferEnergyBefore = bufferTotal(currentBuffer);
    const pulseFootprintEnergy = deriveActuationPulseFootprintEnergy(pulse);

    const acceptedTransferCoefficient = 0;
    const attemptedTransferCoefficient = config.transferCoefficient;
    const rejectedTransferCoefficient = attemptedTransferCoefficient;
    const transferEnergy = 0;

    const nextBuffer = new Float64Array(currentBuffer);
    const bufferEnergyAfter = bufferTotal(nextBuffer);

    const pairLedger = deriveBufferToActuationPairLedger(transferEnergy, 0, config.tolerance);
    const warnings = [...pairLedger.warnings];
    if (rejectedTransferCoefficient > 0) {
        warnings.push('Non-zero transferCoefficient was rejected in the zero step.');
    }

    const report: BufferToActuationTransferZeroReport = {
        tick: tick + 1,
        acceptedTransferCoefficient,
        attemptedTransferCoefficient,
        rejectedTransferCoefficient,
        transferEnergy,
        bufferEnergyBefore,
        bufferEnergyAfter,
        pulseFootprintEnergy,
        pairLedger,
        warnings,
    };

    return {
        currentBuffer: nextBuffer,
        pulse,
        report,
    };
}

/**
 * updateBufferToActuationTransferPositive
 *
 * Drive step. The pulse's footprint energy is debited from the buffer
 * (proportionally per-cell, so a cell contributes in proportion to its
 * share of the total buffer energy). Bounded by buffer availability:
 * if the buffer has less energy than the footprint demands, the granted
 * draw is capped and the rejected portion is reported.
 *
 * The pulse itself is NOT modified — this transfer expresses the energetic
 * cost of the pulse, not its content.
 */
export function updateBufferToActuationTransferPositive(
    currentBuffer: ArrayLike<number>,
    pulse: ActuationPulse | null,
    tick: number,
    configInput: BufferToActuationTransferConfig,
): BufferToActuationTransferPositiveResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const transferRate = Math.min(1, config.transferCoefficient * config.dt);
    const pulseFootprintEnergy = deriveActuationPulseFootprintEnergy(pulse);

    const bufferEnergyBefore = bufferTotal(currentBuffer);
    const requested = pulseFootprintEnergy * transferRate;
    const granted = Math.min(requested, bufferEnergyBefore);

    const nextBuffer = new Float64Array(currentBuffer);
    if (granted > 0 && bufferEnergyBefore > 0) {
        const fraction = granted / bufferEnergyBefore;
        for (let i = 0; i < nextBuffer.length; i++) {
            const v = nextBuffer[i];
            if (Number.isFinite(v) && v > 0) {
                nextBuffer[i] = v * (1 - fraction);
            }
        }
    }
    const bufferEnergyAfter = bufferTotal(nextBuffer);

    const sourceOut = bufferEnergyBefore - bufferEnergyAfter;
    const destinationIn = granted;
    const pairLedger = deriveBufferToActuationPairLedger(sourceOut, destinationIn, config.tolerance);

    const warnings = [...pairLedger.warnings];
    if (pulseFootprintEnergy > 0 && requested > bufferEnergyBefore) {
        warnings.push(
            `Internal activity bounded by available energy: requested actuation footprint ${requested.toFixed(6)} exceeded buffer energy ${bufferEnergyBefore.toFixed(6)}; granted ${granted.toFixed(6)}.`,
        );
    }

    const report: BufferToActuationTransferPositiveReport = {
        tick: tick + 1,
        acceptedTransferCoefficient: config.transferCoefficient,
        attemptedTransferCoefficient: config.transferCoefficient,
        rejectedTransferCoefficient: 0,
        transferRate,
        transferEnergy: granted,
        bufferEnergyBefore,
        bufferEnergyAfter,
        bufferEnergyDelta: bufferEnergyAfter - bufferEnergyBefore,
        pulseFootprintEnergy,
        pairLedger,
        warnings,
    };

    return {
        currentBuffer: nextBuffer,
        pulse,
        report,
    };
}
