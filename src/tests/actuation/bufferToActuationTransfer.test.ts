import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    deriveActuationPulseFootprintEnergy,
    deriveBufferToActuationPairLedger,
    updateBufferToActuationTransferPositive,
    updateBufferToActuationTransferZero,
} from '../../actuation/bufferToActuationTransfer.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { BufferToActuationTransferConfig } from '../../types/bufferToActuationTransfer.ts';

const baseConfig: BufferToActuationTransferConfig = {
    transferCoefficient: 0,
    dt: 1,
    tolerance: 1e-9,
    cellMapping: 'aggregate',
};

const stubPulse: ActuationPulse = {
    timestamp: 1,
    channel: 'visual',
    intensity: 0.5,
    coherence: 0.8,
    rhythm: 0.3,
    locality: 0.4,
    recoveryLinked: 0.0,
    boundaryLinked: 0.0,
    traceLinked: 0.0,
    outputReadiness: 0.5,
};

describe('deriveActuationPulseFootprintEnergy', () => {
    it('returns 0 for null pulse', () => {
        expect(deriveActuationPulseFootprintEnergy(null)).toBe(0);
    });

    it('returns intensity * outputReadiness * coherence for a normal pulse', () => {
        // 0.5 * 0.5 * 0.8 = 0.2
        expect(deriveActuationPulseFootprintEnergy(stubPulse)).toBeCloseTo(0.2, 12);
    });

    it('treats non-finite components as zero', () => {
        const badPulse: ActuationPulse = { ...stubPulse, intensity: Number.NaN };
        expect(deriveActuationPulseFootprintEnergy(badPulse)).toBe(0);
    });
});

describe('deriveBufferToActuationPairLedger', () => {
    it('produces closed ledger when source and destination match', () => {
        const ledger = deriveBufferToActuationPairLedger(0, 0, 1e-9);
        expect(ledger.source).toBe('CurrentBuffer');
        expect(ledger.destination).toBe('ActuationPulse');
        expect(ledger.status).toBe('closed');
    });

    it('detects open ledger when source-out and destination-input differ', () => {
        const ledger = deriveBufferToActuationPairLedger(0.5, 0.2, 1e-9);
        expect(ledger.status).toBe('open');
        expect(ledger.residual).toBeCloseTo(0.3, 12);
        expect(ledger.warnings.join('|')).toContain('Buffer-to-actuation pair ledger is open');
    });
});

describe('updateBufferToActuationTransferZero', () => {
    it('keeps buffer unchanged and returns a closed ledger', () => {
        const buffer = new Float64Array([0.4, 0.6, 0.0, 0.2]);
        const result = updateBufferToActuationTransferZero(buffer, stubPulse, 0, baseConfig);
        expect(result.report.transferEnergy).toBe(0);
        expect(result.report.pulseFootprintEnergy).toBeCloseTo(0.2, 12);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(Array.from(result.currentBuffer)).toEqual([0.4, 0.6, 0.0, 0.2]);
    });

    it('rejects non-zero transferCoefficient', () => {
        const buffer = new Float64Array([1, 1, 1, 1]);
        const result = updateBufferToActuationTransferZero(buffer, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 0.5,
        });
        expect(result.report.acceptedTransferCoefficient).toBe(0);
        expect(result.report.rejectedTransferCoefficient).toBe(0.5);
        expect(result.report.warnings.join('|')).toContain('Non-zero transferCoefficient was rejected');
    });

    it('handles null pulse with closed ledger and zero footprint', () => {
        const buffer = new Float64Array([1, 1]);
        const result = updateBufferToActuationTransferZero(buffer, null, 0, baseConfig);
        expect(result.report.pulseFootprintEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
    });
});

describe('updateBufferToActuationTransferPositive', () => {
    it('draws pulse footprint from buffer proportionally and closes the ledger', () => {
        // Footprint = 0.2. With transferRate = 1, request = 0.2.
        // Buffer total = 0.4 + 0.6 + 0.0 + 0.2 = 1.2. Granted = 0.2.
        // Fraction = 0.2 / 1.2 ≈ 0.1666. Each cell scaled by 1 - fraction.
        const buffer = new Float64Array([0.4, 0.6, 0.0, 0.2]);
        const result = updateBufferToActuationTransferPositive(buffer, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 1,
        });
        expect(result.report.transferRate).toBe(1);
        expect(result.report.pulseFootprintEnergy).toBeCloseTo(0.2, 12);
        expect(result.report.transferEnergy).toBeCloseTo(0.2, 12);
        expect(result.report.pairLedger.status).toBe('closed');

        const bufferAfter = Array.from(result.currentBuffer);
        const sumAfter = bufferAfter.reduce((a, v) => a + v, 0);
        expect(sumAfter).toBeCloseTo(1.0, 9); // 1.2 - 0.2 = 1.0
    });

    it('caps granted amount when buffer is shallower than requested footprint', () => {
        const buffer = new Float64Array([0.05, 0.05]); // total 0.1
        const result = updateBufferToActuationTransferPositive(buffer, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 1,
        });
        expect(result.report.pulseFootprintEnergy).toBeCloseTo(0.2, 12);
        // Granted is capped to buffer total 0.1
        expect(result.report.transferEnergy).toBeCloseTo(0.1, 12);
        const sumAfter = Array.from(result.currentBuffer).reduce((a, v) => a + v, 0);
        expect(sumAfter).toBeCloseTo(0, 9);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(result.report.warnings.some((w) => w.includes('Internal activity bounded by available energy'))).toBe(true);
    });

    it('null pulse yields zero transfer with closed ledger and buffer unchanged', () => {
        const buffer = new Float64Array([0.5, 0.5]);
        const result = updateBufferToActuationTransferPositive(buffer, null, 0, {
            ...baseConfig,
            transferCoefficient: 1,
        });
        expect(result.report.pulseFootprintEnergy).toBe(0);
        expect(result.report.transferEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(Array.from(result.currentBuffer)).toEqual([0.5, 0.5]);
    });

    it('transferRate clamps at 1 so it never moves more than the full footprint', () => {
        const buffer = new Float64Array([1, 1, 1, 1]); // total 4
        const result = updateBufferToActuationTransferPositive(buffer, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 5, // would imply rate 5
        });
        expect(result.report.transferRate).toBe(1);
        expect(result.report.transferEnergy).toBeCloseTo(0.2, 12);
    });

    it('pulse object itself passes through unchanged (transfer accounts cost, not content)', () => {
        const buffer = new Float64Array([1, 1]);
        const result = updateBufferToActuationTransferPositive(buffer, stubPulse, 0, {
            ...baseConfig,
            transferCoefficient: 1,
        });
        expect(result.pulse).toBe(stubPulse);
        expect(result.pulse?.intensity).toBe(0.5);
    });
});

describe('source guardrails', () => {
    it('does not include life metaphor terms in source', () => {
        const source = readFileSync('src/actuation/bufferToActuationTransfer.ts', 'utf8');
        const forbidden = ['vital', 'breath', 'heartbeat', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        for (const term of forbidden) {
            expect(source.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
