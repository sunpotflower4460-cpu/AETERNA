import { deriveSensoryReturn } from './deriveSensoryReturn.ts';
import { worldStateDeltaMagnitude } from '../world/actuationToWorldTransfer.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';
import type {
    WorldToSensoryPairLedgerState,
    WorldToSensoryTransferConfig,
    WorldToSensoryTransferPositiveResult,
    WorldToSensoryTransferReport,
    WorldToSensoryTransferZeroResult,
} from '../types/worldToSensoryTransfer.ts';

function finiteNonNegative(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

/**
 * Sum the intensity field across a packet array. Used as the AETERNA-side
 * "sensory inflow" magnitude for pair-ledger accounting.
 */
export function sumPacketIntensity(packets: SensoryReturnPacket[]): number {
    let sum = 0;
    for (const p of packets) {
        if (Number.isFinite(p.intensity)) sum += Math.max(0, p.intensity);
    }
    return sum;
}

/**
 * Build the pair-ledger sticker for World→Sensory.
 *
 * The accounting equation is:
 *   sourceOut (world delta) === destinationIn (packet sum + worldRetainedEnergy)
 *
 * The world's delta either becomes (a) a packet handed to AETERNA, or (b)
 * energy retained inside the world (residue / turbulence / future-tick
 * inertia). Naming the residual via worldRetainedEnergy is the outflow-side
 * application of principle 2 ("lost energy must have a named destination").
 *
 * When packets exceed world delta (rare; happens if deriveSensoryReturn
 * amplifies), the pair-ledger reports 'open' with a sensoryOversupplyEnergy
 * warning rather than silently absorbing it.
 */
export function deriveWorldToSensoryPairLedger(
    worldDelta: number,
    packetIntensitySum: number,
    worldRetainedEnergy: number,
    sensoryOversupplyEnergy: number,
    toleranceInput = 1e-6,
): WorldToSensoryPairLedgerState {
    const tolerance = finiteNonNegative(toleranceInput, 1e-6);
    const sourceOut = Math.max(0, worldDelta);
    const destinationIn = packetIntensitySum + worldRetainedEnergy;
    const signedResidual = sourceOut - destinationIn;
    const residual = Math.abs(signedResidual);
    const warnings: string[] = [];

    let status: WorldToSensoryPairLedgerStatus;
    if (sensoryOversupplyEnergy > tolerance) {
        status = 'open';
        warnings.push(
            `World-to-sensory pair ledger is open. Sensory packet sum exceeds world delta by ${sensoryOversupplyEnergy.toFixed(6)} (sensoryOversupplyEnergy).`,
        );
    } else if (residual <= tolerance) {
        status = 'closed';
    } else {
        status = 'open';
        warnings.push(
            'World-to-sensory pair ledger is open. World delta does not match packet sum + worldRetainedEnergy.',
        );
    }

    return {
        source: 'WorldMediumState.delta',
        destination: 'SensoryReturnPackets + worldRetainedEnergy',
        sourceOutEnergy: sourceOut,
        destinationInputEnergy: destinationIn,
        signedResidual,
        residual,
        tolerance,
        status,
        matched: status === 'closed',
        warnings,
    };
}

type WorldToSensoryPairLedgerStatus = 'closed' | 'open' | 'insufficient';

function normalizeConfig(config: WorldToSensoryTransferConfig): WorldToSensoryTransferConfig {
    return {
        transferCoefficient: finiteNonNegative(config.transferCoefficient, 0),
        dt: finiteNonNegative(config.dt, 1),
        tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
        cellMapping: config.cellMapping ?? 'aggregate',
    };
}

/**
 * updateWorldToSensoryTransferZero
 *
 * Structure step. Pair ledger exists; deriveSensoryReturn is NOT invoked
 * (no packets generated). World delta is still observed and named into
 * worldRetainedEnergy. Rejects non-zero transferCoefficient.
 */
export function updateWorldToSensoryTransferZero(
    currentWorld: WorldMediumState,
    previousWorld: WorldMediumState | null,
    tick: number,
    configInput: WorldToSensoryTransferConfig,
): WorldToSensoryTransferZeroResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const acceptedTransferCoefficient = 0;
    const attemptedTransferCoefficient = config.transferCoefficient;
    const rejectedTransferCoefficient = attemptedTransferCoefficient;

    const worldDeltaMagnitude = previousWorld
        ? worldStateDeltaMagnitude(currentWorld, previousWorld)
        : 0;

    // Zero step: no packets are produced. All world delta is retained.
    const packets: SensoryReturnPacket[] = [];
    const totalPacketIntensity = 0;
    const worldRetainedEnergy = worldDeltaMagnitude;
    const sensoryOversupplyEnergy = 0;

    const pairLedger = deriveWorldToSensoryPairLedger(
        worldDeltaMagnitude,
        totalPacketIntensity,
        worldRetainedEnergy,
        sensoryOversupplyEnergy,
        config.tolerance,
    );

    const warnings = [...pairLedger.warnings];
    if (rejectedTransferCoefficient > 0) {
        warnings.push('Non-zero transferCoefficient was rejected in the zero step.');
    }

    const report: WorldToSensoryTransferReport = {
        tick: tick + 1,
        acceptedTransferCoefficient,
        attemptedTransferCoefficient,
        rejectedTransferCoefficient,
        transferRate: 0,
        worldDeltaMagnitude,
        totalPacketIntensity,
        worldRetainedEnergy,
        sensoryOversupplyEnergy,
        pairLedger,
        warnings,
    };

    return { packets, report };
}

/**
 * updateWorldToSensoryTransferPositive
 *
 * Drive step. Wraps `deriveSensoryReturn` to produce packets and accounts
 * the world's delta into (a) packet sum + (b) worldRetainedEnergy. When
 * packet sum exceeds the observed world delta (rare; deriveSensoryReturn
 * may amplify when turbulence is high), the gap is reported as
 * sensoryOversupplyEnergy and the pair-ledger opens.
 *
 * transferRate scales the packet intensities so partial drive observes a
 * partial sensory inflow; the world's "true" delta is unchanged because
 * deriveSensoryReturn is a pure observer of world state.
 */
export function updateWorldToSensoryTransferPositive(
    currentWorld: WorldMediumState,
    previousWorld: WorldMediumState | null,
    tick: number,
    configInput: WorldToSensoryTransferConfig,
): WorldToSensoryTransferPositiveResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const transferRate = Math.min(1, config.transferCoefficient * config.dt);
    const worldDeltaMagnitude = previousWorld
        ? worldStateDeltaMagnitude(currentWorld, previousWorld)
        : 0;

    // Always run deriveSensoryReturn; transferRate scales the destination
    // amount AETERNA actually "receives".
    const rawPackets = deriveSensoryReturn(currentWorld, previousWorld, config.dt);
    let packets: SensoryReturnPacket[];
    if (transferRate >= 1) {
        packets = rawPackets;
    } else if (transferRate <= 0) {
        packets = [];
    } else {
        packets = rawPackets.map((p) => ({
            ...p,
            intensity: p.intensity * transferRate,
        }));
    }
    const totalPacketIntensity = sumPacketIntensity(packets);

    let worldRetainedEnergy = 0;
    let sensoryOversupplyEnergy = 0;
    if (worldDeltaMagnitude >= totalPacketIntensity) {
        worldRetainedEnergy = worldDeltaMagnitude - totalPacketIntensity;
    } else {
        sensoryOversupplyEnergy = totalPacketIntensity - worldDeltaMagnitude;
    }

    const pairLedger = deriveWorldToSensoryPairLedger(
        worldDeltaMagnitude,
        totalPacketIntensity,
        worldRetainedEnergy,
        sensoryOversupplyEnergy,
        config.tolerance,
    );

    const warnings = [...pairLedger.warnings];

    const report: WorldToSensoryTransferReport = {
        tick: tick + 1,
        acceptedTransferCoefficient: config.transferCoefficient,
        attemptedTransferCoefficient: config.transferCoefficient,
        rejectedTransferCoefficient: 0,
        transferRate,
        worldDeltaMagnitude,
        totalPacketIntensity,
        worldRetainedEnergy,
        sensoryOversupplyEnergy,
        pairLedger,
        warnings,
    };

    return { packets, report };
}
