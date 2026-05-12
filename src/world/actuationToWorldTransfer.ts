import { deriveActuationPulseFootprintEnergy } from '../actuation/bufferToActuationTransfer.ts';
import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import { updateWorldMedium } from './updateWorldMedium.ts';
import type { ActuationPulse } from '../types/actuationPulse.ts';
import type {
    ActuationToWorldPairLedgerState,
    ActuationToWorldTransferConfig,
    ActuationToWorldTransferPositiveResult,
    ActuationToWorldTransferReport,
    ActuationToWorldTransferZeroResult,
} from '../types/actuationToWorldTransfer.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

function finiteNonNegative(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function safeNum(value: number | undefined, fallback = 0): number {
    return Number.isFinite(value) ? (value as number) : fallback;
}

/**
 * Sum |a_field - b_field| across the comparable scalar fields of two
 * WorldMediumState snapshots. Used to report the observed world-side
 * response magnitude (NOT used to gate ledger closure).
 */
export function worldStateDeltaMagnitude(
    after: WorldMediumState,
    before: WorldMediumState,
): number {
    let mag = 0;
    mag += Math.abs(after.ambientLight - before.ambientLight);
    mag += Math.abs(after.ambientNoise - before.ambientNoise);
    mag += Math.abs(after.surfaceResistance - before.surfaceResistance);
    mag += Math.abs(after.echoLevel - before.echoLevel);
    mag += Math.abs(after.motionDrift - before.motionDrift);
    mag += Math.abs(after.fieldTemperature - before.fieldTemperature);
    mag += Math.abs(after.feedbackDelay - before.feedbackDelay);
    mag += Math.abs(after.lastPulseImpact - before.lastPulseImpact);
    mag += Math.abs(after.mediumStability - before.mediumStability);
    mag += Math.abs(safeNum(after.visualResidue) - safeNum(before.visualResidue));
    mag += Math.abs(safeNum(after.forceResidue) - safeNum(before.forceResidue));
    mag += Math.abs(safeNum(after.worldTurbulence) - safeNum(before.worldTurbulence));
    mag += Math.abs(safeNum(after.returnReadiness) - safeNum(before.returnReadiness));
    return mag;
}

export function deriveActuationToWorldPairLedger(
    sourceOutEnergy: number,
    destinationInputEnergy: number,
    toleranceInput = 1e-6,
): ActuationToWorldPairLedgerState {
    const tolerance = finiteNonNegative(toleranceInput, 1e-6);
    const signedResidual = sourceOutEnergy - destinationInputEnergy;
    const residual = Math.abs(signedResidual);
    const status = residual <= tolerance ? 'closed' : 'open';
    const warnings: string[] = [];

    if (status !== 'closed') {
        warnings.push(
            'Actuation-to-world pair ledger is open. Pulse footprint does not match accounted world input.',
        );
    }

    return {
        source: 'ActuationPulse',
        destination: 'WorldMediumState',
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

function normalizeConfig(config: ActuationToWorldTransferConfig): ActuationToWorldTransferConfig {
    return {
        transferCoefficient: finiteNonNegative(config.transferCoefficient, 0),
        dt: finiteNonNegative(config.dt, 1),
        tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
        cellMapping: config.cellMapping ?? 'aggregate',
    };
}

/**
 * updateActuationToWorldTransferZero
 *
 * Structure step. Pair ledger exists; the world is updated with the
 * natural decay/drift path of `updateWorldMedium(world, null, dt)` but
 * the pulse is NOT applied (transferCoefficient must be zero). Rejects
 * non-zero coefficients. EnergyLedger reports
 * `actuationOutputEnergy = 0` so v4.0 observers see "no outflow yet".
 */
export function updateActuationToWorldTransferZero(
    world: WorldMediumState,
    pulse: ActuationPulse | null,
    tick: number,
    configInput: ActuationToWorldTransferConfig,
): ActuationToWorldTransferZeroResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const pulseFootprintEnergy = deriveActuationPulseFootprintEnergy(pulse);
    const acceptedTransferCoefficient = 0;
    const attemptedTransferCoefficient = config.transferCoefficient;
    const rejectedTransferCoefficient = attemptedTransferCoefficient;

    // Natural decay/drift only — no pulse applied in the structure step.
    const nextWorld = updateWorldMedium(world, null, config.dt);
    const observedWorldDeltaMagnitude = worldStateDeltaMagnitude(nextWorld, world);

    const transferEnergy = 0;
    const pairLedger = deriveActuationToWorldPairLedger(transferEnergy, 0, config.tolerance);
    const warnings = [...pairLedger.warnings];
    if (rejectedTransferCoefficient > 0) {
        warnings.push('Non-zero transferCoefficient was rejected in the zero step.');
    }

    const energyLedger = deriveEnergyLedger({
        timestamp: tick + 1,
        source: 'actuation-to-world-transfer-zero',
        tolerance: config.tolerance,
        inputEnergy: 0,
        actuationOutputEnergy: 0,
    });

    const report: ActuationToWorldTransferReport = {
        tick: tick + 1,
        acceptedTransferCoefficient,
        attemptedTransferCoefficient,
        rejectedTransferCoefficient,
        transferRate: 0,
        transferEnergy,
        pulseFootprintEnergy,
        observedWorldDeltaMagnitude,
        pairLedger,
        energyLedger,
        warnings,
    };

    return { worldState: nextWorld, report };
}

/**
 * updateActuationToWorldTransferPositive
 *
 * Drive step. Wraps `updateWorldMedium(world, pulse, dt)` so the pulse's
 * energetic footprint enters the world.
 *
 * Pair ledger accounting: the granted transfer is `pulseFootprint *
 * transferRate`. Both the source-out and the destination-in record this
 * granted value (the pair-ledger does NOT gate on the observed world-state
 * delta — the world's internal redistribution is a separate concern from
 * the boundary transfer accounting, matching the v3.x pair-ledger contract).
 *
 * The `energyLedger.actuationOutputEnergy` field receives the granted
 * amount, making the v4.0 Now Summary "保存則チェーン" surface this
 * outflow once D3 wires it in.
 */
export function updateActuationToWorldTransferPositive(
    world: WorldMediumState,
    pulse: ActuationPulse | null,
    tick: number,
    configInput: ActuationToWorldTransferConfig,
): ActuationToWorldTransferPositiveResult {
    const config = normalizeConfig(configInput);
    if (config.cellMapping !== 'aggregate') {
        throw new Error('Only aggregate cell mapping is currently supported.');
    }

    const transferRate = Math.min(1, config.transferCoefficient * config.dt);
    const pulseFootprintEnergy = deriveActuationPulseFootprintEnergy(pulse);
    const granted = pulseFootprintEnergy * transferRate;

    // Apply the pulse to the world. If transferRate is below 1, scale the
    // pulse's amplitude so the world receives proportional impact.
    let effectivePulse: ActuationPulse | null = pulse;
    if (pulse && transferRate < 1 && transferRate > 0) {
        effectivePulse = {
            ...pulse,
            intensity: pulse.intensity * transferRate,
        };
    } else if (transferRate === 0) {
        effectivePulse = null;
    }

    const nextWorld = updateWorldMedium(world, effectivePulse, config.dt);
    const observedWorldDeltaMagnitude = worldStateDeltaMagnitude(nextWorld, world);

    const pairLedger = deriveActuationToWorldPairLedger(granted, granted, config.tolerance);
    const warnings = [...pairLedger.warnings];

    const energyLedger = deriveEnergyLedger({
        timestamp: tick + 1,
        source: 'actuation-to-world-transfer-positive',
        tolerance: config.tolerance,
        inputEnergy: 0,
        actuationOutputEnergy: granted,
    });

    const report: ActuationToWorldTransferReport = {
        tick: tick + 1,
        acceptedTransferCoefficient: config.transferCoefficient,
        attemptedTransferCoefficient: config.transferCoefficient,
        rejectedTransferCoefficient: 0,
        transferRate,
        transferEnergy: granted,
        pulseFootprintEnergy,
        observedWorldDeltaMagnitude,
        pairLedger,
        energyLedger,
        warnings,
    };

    return { worldState: nextWorld, report };
}
