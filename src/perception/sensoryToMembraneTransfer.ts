import { sensoryReturnToPerturbation } from './sensoryReturnToPerturbation.ts';
import { sumPacketIntensity } from './worldToSensoryTransfer.ts';
import type { MembraneState } from '../types/membraneState.ts';
import type { PerturbationEvent } from '../types/perturbationEvent.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type {
    SensoryToMembranePairLedgerState,
    SensoryToMembraneTransferConfig,
    SensoryToMembraneTransferPositiveResult,
    SensoryToMembraneTransferReport,
    SensoryToMembraneTransferZeroResult,
} from '../types/sensoryToMembraneTransfer.ts';

/**
 * Default weak-coupling scale matching the legacy
 * sensoryReturnToPerturbation behaviour (`weakScale = 0.3`). Exposed so
 * tests and consumers can reference the canonical value.
 */
export const DEFAULT_PERTURBATION_WEAK_SCALE = 0.3;

function finiteNonNegative(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function clampedScale(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

export function deriveSensoryToMembranePairLedger(
    sourceOutEnergy: number,
    destinationInputEnergy: number,
    toleranceInput = 1e-6,
): SensoryToMembranePairLedgerState {
    const tolerance = finiteNonNegative(toleranceInput, 1e-6);
    const signedResidual = sourceOutEnergy - destinationInputEnergy;
    const residual = Math.abs(signedResidual);
    const status = residual <= tolerance ? 'closed' : 'open';
    const warnings: string[] = [];

    if (status !== 'closed') {
        warnings.push(
            'Sensory-to-membrane pair ledger is open. Packet intensity does not match perturbation + boundary dissipation.',
        );
    }

    return {
        source: 'SensoryReturnPackets',
        destination: 'PerturbationEvents + boundaryDissipationEnergy',
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

function normalizeConfig(config: SensoryToMembraneTransferConfig): SensoryToMembraneTransferConfig {
    return {
        transferCoefficient: finiteNonNegative(config.transferCoefficient, 0),
        dt: finiteNonNegative(config.dt, 1),
        tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
        cellMapping: config.cellMapping ?? 'aggregate',
        perturbationWeakScale: clampedScale(config.perturbationWeakScale, DEFAULT_PERTURBATION_WEAK_SCALE),
    };
}

function ensureMembraneSensoryField(membrane: MembraneState): {
    next: MembraneState;
    field: Float64Array;
} {
    const N = membrane.cells.length;
    const existing = membrane.receivedSensoryField;
    if (existing instanceof Float64Array && existing.length === N) {
        // Clone for immutability.
        const cloned = new Float64Array(existing);
        return {
            next: { ...membrane, receivedSensoryField: cloned },
            field: cloned,
        };
    }
    const created = new Float64Array(N);
    return {
        next: { ...membrane, receivedSensoryField: created },
        field: created,
    };
}

/**
 * Distribute a scalar amount across membrane cells, weighted by per-cell
 * permeability. Returns the actual sum distributed (should equal the input
 * within float tolerance unless every cell has zero permeability, in which
 * case nothing is distributed and the caller should treat the difference as
 * dissipation).
 */
function distributeByPermeability(
    field: Float64Array,
    membrane: MembraneState,
    totalAmount: number,
): number {
    if (totalAmount <= 0 || membrane.cells.length === 0) return 0;
    let weightSum = 0;
    for (const c of membrane.cells) {
        const p = Number.isFinite(c.permeability) ? Math.max(0, c.permeability) : 0;
        weightSum += p;
    }
    if (weightSum <= 0) return 0;
    let actuallyDistributed = 0;
    for (let i = 0; i < membrane.cells.length; i++) {
        const p = Number.isFinite(membrane.cells[i].permeability)
            ? Math.max(0, membrane.cells[i].permeability)
            : 0;
        const share = totalAmount * (p / weightSum);
        field[i] += share;
        actuallyDistributed += share;
    }
    return actuallyDistributed;
}

/**
 * updateSensoryToMembraneTransferZero
 *
 * Structure step. Pair ledger exists; no perturbation events are produced;
 * the membrane's receivedSensoryField is left as-is. Rejects non-zero coef.
 */
export function updateSensoryToMembraneTransferZero(
    packets: SensoryReturnPacket[],
    membrane: MembraneState,
    tick: number,
    configInput: SensoryToMembraneTransferConfig,
): SensoryToMembraneTransferZeroResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const acceptedTransferCoefficient = 0;
    const attemptedTransferCoefficient = config.transferCoefficient;
    const rejectedTransferCoefficient = attemptedTransferCoefficient;

    const totalPacketIntensity = sumPacketIntensity(packets);

    // Zero step: no transfer occurs. Source-side packets are observed only.
    const perturbationEvents: PerturbationEvent[] = [];
    const perturbationEnergy = 0;
    const boundaryDissipationEnergy = 0;

    const pairLedger = deriveSensoryToMembranePairLedger(0, 0, config.tolerance);
    const warnings = [...pairLedger.warnings];
    if (rejectedTransferCoefficient > 0) {
        warnings.push('Non-zero transferCoefficient was rejected in the zero step.');
    }

    const report: SensoryToMembraneTransferReport = {
        tick: tick + 1,
        acceptedTransferCoefficient,
        attemptedTransferCoefficient,
        rejectedTransferCoefficient,
        transferRate: 0,
        totalPacketIntensity,
        perturbationEnergy,
        boundaryDissipationEnergy,
        perturbationEvents,
        pairLedger,
        warnings,
    };

    return { membraneState: membrane, perturbationEvents, report };
}

/**
 * updateSensoryToMembraneTransferPositive
 *
 * Drive step. Wraps `sensoryReturnToPerturbation` (per packet) so the
 * existing weak-coupling logic is preserved exactly, then names the
 * implicit residual:
 *   packetEnergy = perturbationEnergy (weakScale fraction) +
 *                  boundaryDissipationEnergy (1 - weakScale fraction)
 *
 * The membrane's receivedSensoryField (per-cell) accumulates the
 * perturbationEnergy, weighted by per-cell permeability. This makes the
 * sensory inflow observable at the body boundary.
 *
 * This phase closes the outflow chain: Buffer → Actuation → World →
 * Sensory → Membrane. From the membrane, v3.x's inflow chain continues
 * (Membrane → Internal → Buffer), completing the loop.
 */
export function updateSensoryToMembraneTransferPositive(
    packets: SensoryReturnPacket[],
    membrane: MembraneState,
    tick: number,
    configInput: SensoryToMembraneTransferConfig,
): SensoryToMembraneTransferPositiveResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const transferRate = Math.min(1, config.transferCoefficient * config.dt);
    const weakScale = config.perturbationWeakScale ?? DEFAULT_PERTURBATION_WEAK_SCALE;

    const totalPacketIntensity = sumPacketIntensity(packets);
    const grantedSourceEnergy = totalPacketIntensity * transferRate;

    const perturbationEvents: PerturbationEvent[] = [];
    for (const p of packets) {
        if (!Number.isFinite(p.intensity) || p.intensity <= 0) continue;
        const event = sensoryReturnToPerturbation(p);
        if (transferRate >= 1) {
            perturbationEvents.push(event);
        } else if (transferRate > 0) {
            perturbationEvents.push({
                ...event,
                magnitude: event.magnitude * transferRate,
            });
        }
        // If transferRate is 0, no events flow.
    }

    const perturbationEnergy = grantedSourceEnergy * weakScale;
    const boundaryDissipationEnergy = grantedSourceEnergy * (1 - weakScale);

    // Distribute the perturbation energy across membrane cells, weighted by
    // permeability. Anything that cannot be placed (no permeability anywhere)
    // is folded into boundary dissipation.
    const { next: nextMembrane, field } = ensureMembraneSensoryField(membrane);
    let distributed = 0;
    if (perturbationEnergy > 0) {
        distributed = distributeByPermeability(field, membrane, perturbationEnergy);
    }
    const undistributed = perturbationEnergy - distributed;
    const finalBoundaryDissipation = boundaryDissipationEnergy + Math.max(0, undistributed);

    const destinationIn = distributed + finalBoundaryDissipation;
    const pairLedger = deriveSensoryToMembranePairLedger(
        grantedSourceEnergy,
        destinationIn,
        config.tolerance,
    );

    const warnings = [...pairLedger.warnings];
    if (undistributed > config.tolerance!) {
        warnings.push(
            `Membrane had no permeability available for ${undistributed.toFixed(6)} of perturbation energy; that amount was added to boundaryDissipationEnergy.`,
        );
    }

    const report: SensoryToMembraneTransferReport = {
        tick: tick + 1,
        acceptedTransferCoefficient: config.transferCoefficient,
        attemptedTransferCoefficient: config.transferCoefficient,
        rejectedTransferCoefficient: 0,
        transferRate,
        totalPacketIntensity,
        perturbationEnergy: distributed,
        boundaryDissipationEnergy: finalBoundaryDissipation,
        perturbationEvents,
        pairLedger,
        warnings,
    };

    return { membraneState: nextMembrane, perturbationEvents, report };
}
