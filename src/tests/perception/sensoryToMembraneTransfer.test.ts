import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    DEFAULT_PERTURBATION_WEAK_SCALE,
    deriveSensoryToMembranePairLedger,
    updateSensoryToMembraneTransferPositive,
    updateSensoryToMembraneTransferZero,
} from '../../perception/sensoryToMembraneTransfer.ts';
import type { MembraneCell, MembraneState } from '../../types/membraneState.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { SensoryToMembraneTransferConfig } from '../../types/sensoryToMembraneTransfer.ts';

const baseConfig: SensoryToMembraneTransferConfig = {
    transferCoefficient: 0,
    dt: 1 / 60,
    tolerance: 1e-9,
    cellMapping: 'aggregate',
};

function makeCell(index: number, permeability: number): MembraneCell {
    return {
        regionId: `u0-v${index}`,
        index,
        permeability,
        tension: 0.5,
        deformation: 0,
        recovery: 1,
        actuationImprint: 0,
        returnImprint: 0,
        twoSidedness: 0,
        localResistance: 0.5,
        localAttenuation: 0.1,
        confidence: 1,
    };
}

function makeMembrane(permeabilities: number[]): MembraneState {
    const cells = permeabilities.map((p, i) => makeCell(i, p));
    const avg = permeabilities.length > 0
        ? permeabilities.reduce((a, v) => a + v, 0) / permeabilities.length
        : 0;
    return {
        timestamp: 0,
        segments: Math.sqrt(permeabilities.length) | 0 || 1,
        cells,
        averagePermeability: avg,
        averageTension: 0.5,
        averageDeformation: 0,
        averageRecovery: 1,
        averageActuationImprint: 0,
        averageReturnImprint: 0,
        averageTwoSidedness: 0,
        maxDeformation: 0,
        deformationVariance: 0,
        membraneIntegrity: 1,
        membraneConfidence: 1,
        nanOrInfinityCount: 0,
    };
}

function packet(channel: SensoryReturnPacket['channel'], intensity: number): SensoryReturnPacket {
    return {
        timestamp: 1,
        channel,
        intensity,
        novelty: 0.5,
        locality: 0.5,
        rhythm: 0.5,
        worldOriginStrength: 0.8,
        returnDelayHint: 0.1,
        mediumStabilityHint: 0.7,
    };
}

describe('DEFAULT_PERTURBATION_WEAK_SCALE', () => {
    it('matches the legacy weakScale = 0.3', () => {
        expect(DEFAULT_PERTURBATION_WEAK_SCALE).toBe(0.3);
    });
});

describe('deriveSensoryToMembranePairLedger', () => {
    it('closes when source and destination match', () => {
        const ledger = deriveSensoryToMembranePairLedger(0, 0, 1e-9);
        expect(ledger.source).toBe('SensoryReturnPackets');
        expect(ledger.destination).toBe('PerturbationEvents + boundaryDissipationEnergy');
        expect(ledger.status).toBe('closed');
    });

    it('opens with warning when mismatched', () => {
        const ledger = deriveSensoryToMembranePairLedger(0.5, 0.2, 1e-9);
        expect(ledger.status).toBe('open');
        expect(ledger.warnings.join('|')).toContain('Sensory-to-membrane pair ledger is open');
    });
});

describe('updateSensoryToMembraneTransferZero', () => {
    it('produces no perturbations and leaves membrane unchanged', () => {
        const membrane = makeMembrane([0.5, 0.5, 0.5, 0.5]);
        const packets = [packet('simulatedLight', 0.4), packet('simulatedNoise', 0.6)];
        const result = updateSensoryToMembraneTransferZero(packets, membrane, 0, baseConfig);
        expect(result.perturbationEvents).toEqual([]);
        expect(result.report.totalPacketIntensity).toBeCloseTo(1.0, 12);
        expect(result.report.perturbationEnergy).toBe(0);
        expect(result.report.boundaryDissipationEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(result.membraneState).toBe(membrane); // unchanged ref
    });

    it('rejects non-zero transferCoefficient', () => {
        const membrane = makeMembrane([0.5]);
        const result = updateSensoryToMembraneTransferZero([], membrane, 0, {
            ...baseConfig,
            transferCoefficient: 0.5,
        });
        expect(result.report.rejectedTransferCoefficient).toBe(0.5);
        expect(result.report.warnings.join('|')).toContain('Non-zero transferCoefficient was rejected');
    });

    it('empty packet array → zero everything, ledger closed', () => {
        const membrane = makeMembrane([0.5, 0.5]);
        const result = updateSensoryToMembraneTransferZero([], membrane, 0, baseConfig);
        expect(result.report.totalPacketIntensity).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
    });
});

describe('updateSensoryToMembraneTransferPositive', () => {
    it('decomposes packet energy into perturbation (30%) + boundary dissipation (70%) at rate=1', () => {
        const membrane = makeMembrane([0.5, 0.5, 0.5, 0.5]);
        const packets = [packet('simulatedLight', 1.0)];
        const result = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 60, // rate = 1
        });
        expect(result.report.transferRate).toBe(1);
        expect(result.report.totalPacketIntensity).toBeCloseTo(1.0, 12);
        expect(result.report.perturbationEnergy).toBeCloseTo(0.3, 12);
        expect(result.report.boundaryDissipationEnergy).toBeCloseTo(0.7, 12);
        expect(result.report.pairLedger.status).toBe('closed');
        // Pair-ledger accounting equation:
        const total = result.report.perturbationEnergy + result.report.boundaryDissipationEnergy;
        expect(total).toBeCloseTo(result.report.totalPacketIntensity, 9);
    });

    it('distributes perturbation across membrane cells weighted by permeability', () => {
        // Two cells: one permeable (1.0), one impermeable (0.0).
        const membrane = makeMembrane([1.0, 0.0]);
        const packets = [packet('simulatedLight', 1.0)];
        const result = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        const field = result.membraneState.receivedSensoryField!;
        expect(field[0]).toBeCloseTo(0.3, 12); // all perturbation lands at cell 0
        expect(field[1]).toBe(0);
    });

    it('all-zero permeability → perturbation energy folds into boundaryDissipation', () => {
        const membrane = makeMembrane([0, 0, 0]);
        const packets = [packet('simulatedLight', 1.0)];
        const result = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        expect(result.report.perturbationEnergy).toBe(0);
        // The full packet intensity becomes boundary dissipation.
        expect(result.report.boundaryDissipationEnergy).toBeCloseTo(1.0, 12);
        expect(result.report.pairLedger.status).toBe('closed');
    });

    it('transferRate=0.5 halves both perturbation and boundary dissipation', () => {
        const membrane = makeMembrane([0.5, 0.5]);
        const packets = [packet('simulatedLight', 1.0)];
        const result = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 30, // rate = 0.5
        });
        expect(result.report.transferRate).toBe(0.5);
        expect(result.report.perturbationEnergy).toBeCloseTo(0.15, 12); // 0.5*0.3
        expect(result.report.boundaryDissipationEnergy).toBeCloseTo(0.35, 12); // 0.5*0.7
        expect(result.report.pairLedger.status).toBe('closed');
    });

    it('transferRate=0 produces no perturbation events and full boundary dissipation = 0', () => {
        const membrane = makeMembrane([0.5]);
        const packets = [packet('simulatedLight', 1.0)];
        const result = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 0,
        });
        expect(result.report.transferRate).toBe(0);
        expect(result.perturbationEvents).toEqual([]);
        expect(result.report.perturbationEnergy).toBe(0);
        expect(result.report.boundaryDissipationEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
    });

    it('empty packet array → zero everywhere, ledger closed', () => {
        const membrane = makeMembrane([0.5, 0.5]);
        const result = updateSensoryToMembraneTransferPositive([], membrane, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        expect(result.perturbationEvents).toEqual([]);
        expect(result.report.totalPacketIntensity).toBe(0);
        expect(result.report.perturbationEnergy).toBe(0);
        expect(result.report.boundaryDissipationEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
    });

    it('custom perturbationWeakScale honored', () => {
        const membrane = makeMembrane([0.5, 0.5]);
        const packets = [packet('simulatedLight', 1.0)];
        const result = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 60,
            perturbationWeakScale: 0.5,
        });
        expect(result.report.perturbationEnergy).toBeCloseTo(0.5, 12);
        expect(result.report.boundaryDissipationEnergy).toBeCloseTo(0.5, 12);
    });

    it('receivedSensoryField is created when membrane has none, preserved between calls', () => {
        const membrane = makeMembrane([0.5, 0.5]);
        expect(membrane.receivedSensoryField).toBeUndefined();
        const packets = [packet('simulatedLight', 1.0)];
        const r1 = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        expect(r1.membraneState.receivedSensoryField).toBeDefined();
        const field1 = r1.membraneState.receivedSensoryField!;
        expect(field1[0] + field1[1]).toBeCloseTo(0.3, 12);

        // Second call should accumulate, not reset.
        const r2 = updateSensoryToMembraneTransferPositive(packets, r1.membraneState, 1, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        const field2 = r2.membraneState.receivedSensoryField!;
        expect(field2[0] + field2[1]).toBeCloseTo(0.6, 12); // accumulated
    });

    it('perturbation events are generated when rate > 0', () => {
        const membrane = makeMembrane([0.5, 0.5]);
        const packets = [packet('simulatedLight', 0.8), packet('simulatedNoise', 0.4)];
        const result = updateSensoryToMembraneTransferPositive(packets, membrane, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        expect(result.perturbationEvents).toHaveLength(2);
        // First event is light, second noise (mapped to internal sources).
        expect(result.perturbationEvents[0].source).toBe('light');
        expect(result.perturbationEvents[1].source).toBe('sound');
    });
});

describe('source guardrails', () => {
    it('does not include life metaphor terms in source', () => {
        const source = readFileSync('src/perception/sensoryToMembraneTransfer.ts', 'utf8');
        const forbidden = ['vital', 'breath', 'heartbeat', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        for (const term of forbidden) {
            expect(source.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
