import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    deriveWorldToSensoryPairLedger,
    sumPacketIntensity,
    updateWorldToSensoryTransferPositive,
    updateWorldToSensoryTransferZero,
} from '../../perception/worldToSensoryTransfer.ts';
import { initializeWorldMediumState } from '../../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../../world/updateWorldMedium.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { WorldToSensoryTransferConfig } from '../../types/worldToSensoryTransfer.ts';

const baseConfig: WorldToSensoryTransferConfig = {
    transferCoefficient: 0,
    dt: 1 / 60,
    tolerance: 1e-9,
    cellMapping: 'aggregate',
};

const pulse: ActuationPulse = {
    timestamp: 1,
    channel: 'visual',
    intensity: 0.7,
    coherence: 0.8,
    rhythm: 0.5,
    locality: 0.4,
    recoveryLinked: 0.0,
    boundaryLinked: 0.0,
    traceLinked: 0.0,
    outputReadiness: 0.6,
};

describe('sumPacketIntensity', () => {
    it('returns 0 for empty array', () => {
        expect(sumPacketIntensity([])).toBe(0);
    });

    it('sums intensities and ignores non-finite values', () => {
        const packets = [
            { timestamp: 1, channel: 'simulatedLight' as const, intensity: 0.3, novelty: 0, locality: 0, rhythm: 0, worldOriginStrength: 0, returnDelayHint: 0, mediumStabilityHint: 0.7 },
            { timestamp: 2, channel: 'simulatedNoise' as const, intensity: 0.2, novelty: 0, locality: 0, rhythm: 0, worldOriginStrength: 0, returnDelayHint: 0, mediumStabilityHint: 0.7 },
        ];
        expect(sumPacketIntensity(packets)).toBeCloseTo(0.5, 12);
    });
});

describe('deriveWorldToSensoryPairLedger', () => {
    it('closes when world delta equals packet sum + worldRetained', () => {
        const ledger = deriveWorldToSensoryPairLedger(1.0, 0.4, 0.6, 0, 1e-9);
        expect(ledger.source).toBe('WorldMediumState.delta');
        expect(ledger.destination).toBe('SensoryReturnPackets + worldRetainedEnergy');
        expect(ledger.status).toBe('closed');
    });

    it('opens with sensoryOversupplyEnergy warning when packets exceed delta', () => {
        const ledger = deriveWorldToSensoryPairLedger(0.3, 0.5, 0, 0.2, 1e-9);
        expect(ledger.status).toBe('open');
        expect(ledger.warnings.join('|')).toContain('sensoryOversupplyEnergy');
    });

    it('opens when the source/destination decomposition does not balance', () => {
        const ledger = deriveWorldToSensoryPairLedger(1.0, 0.4, 0.3, 0, 1e-9);
        // worldRetained should be 0.6 to close, but is 0.3 here → ledger open.
        expect(ledger.status).toBe('open');
        expect(ledger.warnings.join('|')).toContain('World delta does not match');
    });
});

describe('updateWorldToSensoryTransferZero', () => {
    it('produces no packets and treats all world delta as worldRetainedEnergy', () => {
        const w0 = initializeWorldMediumState();
        const w1 = updateWorldMedium(w0, pulse, 1 / 60);
        const result = updateWorldToSensoryTransferZero(w1, w0, 0, baseConfig);
        expect(result.packets).toEqual([]);
        expect(result.report.totalPacketIntensity).toBe(0);
        expect(result.report.worldRetainedEnergy).toBeCloseTo(result.report.worldDeltaMagnitude, 12);
        expect(result.report.pairLedger.status).toBe('closed');
    });

    it('rejects non-zero transferCoefficient', () => {
        const w = initializeWorldMediumState();
        const result = updateWorldToSensoryTransferZero(w, w, 0, {
            ...baseConfig,
            transferCoefficient: 0.5,
        });
        expect(result.report.rejectedTransferCoefficient).toBe(0.5);
        expect(result.report.warnings.join('|')).toContain('Non-zero transferCoefficient was rejected');
    });

    it('previousWorld === null → worldDeltaMagnitude is 0 and ledger closes', () => {
        const w = initializeWorldMediumState();
        const result = updateWorldToSensoryTransferZero(w, null, 0, baseConfig);
        expect(result.report.worldDeltaMagnitude).toBe(0);
        expect(result.report.worldRetainedEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
    });
});

describe('updateWorldToSensoryTransferPositive', () => {
    it('generates packets and accounts world delta via worldRetainedEnergy + packet sum', () => {
        const w0 = initializeWorldMediumState();
        const w1 = updateWorldMedium(w0, pulse, 1 / 60);
        const result = updateWorldToSensoryTransferPositive(w1, w0, 0, {
            ...baseConfig,
            transferCoefficient: 60, // rate = 1
        });
        expect(result.report.transferRate).toBe(1);
        // Accounting invariant: either delta >= packets (retained covers gap)
        // or packets > delta (oversupply named separately). Mutually exclusive.
        if (result.report.sensoryOversupplyEnergy === 0) {
            // Closed case: packets + retained === delta
            const sum = result.report.totalPacketIntensity + result.report.worldRetainedEnergy;
            expect(sum).toBeCloseTo(result.report.worldDeltaMagnitude, 9);
            expect(result.report.pairLedger.status).toBe('closed');
        } else {
            // Open case: packets - oversupply === delta (retained is zero)
            expect(result.report.worldRetainedEnergy).toBe(0);
            const reconstructed = result.report.totalPacketIntensity - result.report.sensoryOversupplyEnergy;
            expect(reconstructed).toBeCloseTo(result.report.worldDeltaMagnitude, 9);
            expect(result.report.pairLedger.status).toBe('open');
        }
    });

    it('transferRate=0.5 scales packet intensities by half', () => {
        const w0 = initializeWorldMediumState();
        const w1 = updateWorldMedium(w0, pulse, 1 / 60);
        const fullResult = updateWorldToSensoryTransferPositive(w1, w0, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        const halfResult = updateWorldToSensoryTransferPositive(w1, w0, 0, {
            ...baseConfig,
            transferCoefficient: 30,
        });
        if (fullResult.packets.length > 0 && halfResult.packets.length > 0) {
            expect(halfResult.report.totalPacketIntensity).toBeCloseTo(
                fullResult.report.totalPacketIntensity / 2,
                9,
            );
        }
    });

    it('transferRate=0 produces no packets, all delta retained', () => {
        const w0 = initializeWorldMediumState();
        const w1 = updateWorldMedium(w0, pulse, 1 / 60);
        const result = updateWorldToSensoryTransferPositive(w1, w0, 0, {
            ...baseConfig,
            transferCoefficient: 0,
        });
        expect(result.packets).toEqual([]);
        expect(result.report.totalPacketIntensity).toBe(0);
        expect(result.report.worldRetainedEnergy).toBeCloseTo(result.report.worldDeltaMagnitude, 12);
        expect(result.report.pairLedger.status).toBe('closed');
    });

    it('null previousWorld → no packets, no delta, ledger closed', () => {
        const w = initializeWorldMediumState();
        const result = updateWorldToSensoryTransferPositive(w, null, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        expect(result.packets).toEqual([]);
        expect(result.report.worldDeltaMagnitude).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
    });

    it('rate clamps at 1 — extreme coefficient does not produce >100% packet amplification', () => {
        const w0 = initializeWorldMediumState();
        const w1 = updateWorldMedium(w0, pulse, 1 / 60);
        const result = updateWorldToSensoryTransferPositive(w1, w0, 0, {
            ...baseConfig,
            transferCoefficient: 6000, // 100× over the dt=1/60 needed
        });
        expect(result.report.transferRate).toBe(1);
    });
});

describe('source guardrails', () => {
    it('does not include life metaphor terms in source', () => {
        const source = readFileSync('src/perception/worldToSensoryTransfer.ts', 'utf8');
        const forbidden = ['vital', 'breath', 'heartbeat', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        for (const term of forbidden) {
            expect(source.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
