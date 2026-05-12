import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    deriveActuationToWorldPairLedger,
    updateActuationToWorldTransferPositive,
    updateActuationToWorldTransferZero,
    worldStateDeltaMagnitude,
} from '../../world/actuationToWorldTransfer.ts';
import { initializeWorldMediumState } from '../../world/initializeWorldMediumState.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { ActuationToWorldTransferConfig } from '../../types/actuationToWorldTransfer.ts';

const baseConfig: ActuationToWorldTransferConfig = {
    transferCoefficient: 0,
    dt: 1 / 60,
    tolerance: 1e-9,
    cellMapping: 'aggregate',
};

const stubPulse: ActuationPulse = {
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

describe('worldStateDeltaMagnitude', () => {
    it('returns 0 when the two states are identical', () => {
        const w = initializeWorldMediumState();
        expect(worldStateDeltaMagnitude(w, w)).toBe(0);
    });

    it('returns a positive value when fields differ', () => {
        const w1 = initializeWorldMediumState();
        const w2 = { ...w1, ambientLight: w1.ambientLight + 0.1 };
        expect(worldStateDeltaMagnitude(w2, w1)).toBeCloseTo(0.1, 12);
    });
});

describe('deriveActuationToWorldPairLedger', () => {
    it('closes when source and destination match', () => {
        const ledger = deriveActuationToWorldPairLedger(0, 0, 1e-9);
        expect(ledger.source).toBe('ActuationPulse');
        expect(ledger.destination).toBe('WorldMediumState');
        expect(ledger.status).toBe('closed');
    });

    it('opens with warning when mismatched', () => {
        const ledger = deriveActuationToWorldPairLedger(0.5, 0.2, 1e-9);
        expect(ledger.status).toBe('open');
        expect(ledger.warnings.join('|')).toContain('Actuation-to-world pair ledger is open');
    });
});

describe('updateActuationToWorldTransferZero', () => {
    it('does not apply the pulse to the world (natural decay/drift only)', () => {
        const w = initializeWorldMediumState();
        const wNoPulseRef = initializeWorldMediumState();
        // Mirror what updateWorldMedium does naturally — call with null pulse
        // gives the reference natural-decay state. Our zero step should
        // produce the same world transition.
        const result = updateActuationToWorldTransferZero(w, stubPulse, 0, baseConfig);
        // pulseFootprintEnergy is observed but not applied.
        expect(result.report.pulseFootprintEnergy).toBeCloseTo(0.7 * 0.6 * 0.8, 12);
        expect(result.report.transferEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(result.report.energyLedger.actuationOutputEnergy).toBe(0);
        // The world state must not include pulse-induced fields:
        // lastPulseImpact should not have been boosted.
        expect(result.worldState.lastPulseImpact).toBeLessThanOrEqual(wNoPulseRef.lastPulseImpact + 1e-12);
    });

    it('rejects non-zero transferCoefficient', () => {
        const w = initializeWorldMediumState();
        const result = updateActuationToWorldTransferZero(w, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 0.5,
        });
        expect(result.report.acceptedTransferCoefficient).toBe(0);
        expect(result.report.rejectedTransferCoefficient).toBe(0.5);
        expect(result.report.transferEnergy).toBe(0);
        expect(result.report.warnings.join('|')).toContain('Non-zero transferCoefficient was rejected');
    });

    it('null pulse → zero footprint, closed ledger', () => {
        const w = initializeWorldMediumState();
        const result = updateActuationToWorldTransferZero(w, null, 0, baseConfig);
        expect(result.report.pulseFootprintEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
    });
});

describe('updateActuationToWorldTransferPositive', () => {
    it('applies the pulse, closes the pair ledger, populates actuationOutputEnergy', () => {
        const w = initializeWorldMediumState();
        const result = updateActuationToWorldTransferPositive(w, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 60, // with dt=1/60 → rate=1
        });
        const expectedFootprint = 0.7 * 0.6 * 0.8;
        expect(result.report.transferRate).toBe(1);
        expect(result.report.pulseFootprintEnergy).toBeCloseTo(expectedFootprint, 12);
        expect(result.report.transferEnergy).toBeCloseTo(expectedFootprint, 12);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(result.report.energyLedger.actuationOutputEnergy).toBeCloseTo(expectedFootprint, 12);
        // The pulse should have produced an observable world delta.
        expect(result.report.observedWorldDeltaMagnitude).toBeGreaterThan(0);
        // Specifically, lastPulseImpact should have been boosted.
        expect(result.worldState.lastPulseImpact).toBeGreaterThan(w.lastPulseImpact);
    });

    it('partial transferRate scales the pulse intensity applied to the world', () => {
        const w = initializeWorldMediumState();
        const fullResult = updateActuationToWorldTransferPositive(w, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 60, // rate=1
        });
        const halfResult = updateActuationToWorldTransferPositive(w, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 30, // rate=0.5
        });
        // Half-rate transfer should grant half the footprint.
        expect(halfResult.report.transferEnergy).toBeCloseTo(fullResult.report.transferEnergy / 2, 12);
        expect(halfResult.report.pairLedger.status).toBe('closed');
        // World delta at half rate should be less than at full rate.
        expect(halfResult.report.observedWorldDeltaMagnitude).toBeLessThan(fullResult.report.observedWorldDeltaMagnitude);
    });

    it('null pulse → zero transfer with closed ledger and natural-only world delta', () => {
        const w = initializeWorldMediumState();
        const result = updateActuationToWorldTransferPositive(w, null, 0, {
            ...baseConfig,
            transferCoefficient: 60,
        });
        expect(result.report.pulseFootprintEnergy).toBe(0);
        expect(result.report.transferEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(result.report.energyLedger.actuationOutputEnergy).toBe(0);
    });

    it('transferRate clamps at 1 so transferEnergy never exceeds the pulse footprint', () => {
        const w = initializeWorldMediumState();
        const result = updateActuationToWorldTransferPositive(w, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 600, // way more than 60 → rate clamps at 1
        });
        expect(result.report.transferRate).toBe(1);
        expect(result.report.transferEnergy).toBeCloseTo(0.7 * 0.6 * 0.8, 12);
    });
});

describe('source guardrails', () => {
    it('does not include life metaphor terms in source', () => {
        const source = readFileSync('src/world/actuationToWorldTransfer.ts', 'utf8');
        const forbidden = ['vital', 'breath', 'heartbeat', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        for (const term of forbidden) {
            expect(source.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
