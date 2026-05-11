import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    applyInternalToBufferInjectionRequest,
    deriveInternalToBufferPairLedger,
    updateInternalToBufferTransferPositive,
    updateInternalToBufferTransferZero,
} from '../../core/internalToBufferTransfer.ts';
import { createLocalConservationSubstrate } from '../../substrate/localConservationSubstrate.ts';
import type { InternalToBufferTransferConfig } from '../../types/internalToBufferTransfer.ts';

const baseConfig: InternalToBufferTransferConfig = {
    width: 2,
    height: 2,
    boundaryMode: 'torus',
    cellMapping: 'same-index',
    transferCoefficient: 0,
    dt: 1,
    tolerance: 1e-9,
};

describe('internalToBuffer zero transfer', () => {
    it('produces closed pair ledger when both sides match', () => {
        const ledger = deriveInternalToBufferPairLedger(0, 0, 1e-9);
        expect(ledger.source).toBe('LocalConservationSubstrate.storageField');
        expect(ledger.destination).toBe('CurrentBuffer');
        expect(ledger.status).toBe('closed');
    });

    it('detects open ledger when source-out does not match destination-input', () => {
        const ledger = deriveInternalToBufferPairLedger(1, 0.5, 1e-9);
        expect(ledger.status).toBe('open');
        expect(ledger.warnings.join('|')).toContain('Internal-to-buffer pair ledger is open');
    });

    it('keeps fields unchanged when transferCoefficient is zero', () => {
        const substrate = createLocalConservationSubstrate(
            { width: 2, height: 2, boundaryMode: 'torus' },
            [1, 1, 1, 1],
        );
        const buffer = new Float64Array([0.5, 0.5, 0.5, 0.5]);
        const result = updateInternalToBufferTransferZero(substrate, buffer, baseConfig);
        expect(result.report.transferEnergy).toBe(0);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(Array.from(result.substrateState.storageField)).toEqual([1, 1, 1, 1]);
        expect(Array.from(result.currentBuffer)).toEqual([0.5, 0.5, 0.5, 0.5]);
    });

    it('rejects non-zero transferCoefficient at the zero step', () => {
        const substrate = createLocalConservationSubstrate(
            { width: 2, height: 2, boundaryMode: 'torus' },
            [1, 1, 1, 1],
        );
        const buffer = new Float64Array([0, 0, 0, 0]);
        const result = updateInternalToBufferTransferZero(substrate, buffer, {
            ...baseConfig,
            transferCoefficient: 0.5,
        });
        expect(result.report.acceptedTransferCoefficient).toBe(0);
        expect(result.report.rejectedTransferCoefficient).toBe(0.5);
        expect(result.report.transferEnergy).toBe(0);
        expect(result.report.warnings.join('|')).toContain('Non-zero transferCoefficient was rejected');
    });
});

describe('internalToBuffer positive transfer', () => {
    it('moves a bounded amount from substrate.storageField to currentBuffer with closed pair ledger', () => {
        const substrate = createLocalConservationSubstrate(
            { width: 2, height: 2, boundaryMode: 'torus' },
            [4, 4, 4, 4],
        );
        const buffer = new Float64Array([0, 0, 0, 0]);
        const result = updateInternalToBufferTransferPositive(substrate, buffer, {
            ...baseConfig,
            transferCoefficient: 0.25,
        });

        expect(result.report.transferRate).toBe(0.25);
        expect(result.report.transferEnergy).toBeCloseTo(4, 12); // 4 cells * 4 * 0.25
        expect(result.report.pairLedger.status).toBe('closed');
        expect(Array.from(result.substrateState.storageField)).toEqual([3, 3, 3, 3]);
        expect(Array.from(result.currentBuffer)).toEqual([1, 1, 1, 1]);
    });

    it('caps transferRate at 1 so it never exceeds substrate availability', () => {
        const substrate = createLocalConservationSubstrate(
            { width: 2, height: 2, boundaryMode: 'torus' },
            [2, 1, 0, 3],
        );
        const buffer = new Float64Array([10, 10, 10, 10]);
        const result = updateInternalToBufferTransferPositive(substrate, buffer, {
            ...baseConfig,
            transferCoefficient: 5,
        });
        expect(result.report.transferRate).toBe(1);
        expect(Array.from(result.substrateState.storageField)).toEqual([0, 0, 0, 0]);
        expect(Array.from(result.currentBuffer)).toEqual([12, 11, 10, 13]);
        expect(result.report.pairLedger.status).toBe('closed');
    });
});

describe('internalToBuffer per-cell injection request', () => {
    it('grants requested amounts up to per-cell substrate availability and reports the shortfall', () => {
        const substrate = createLocalConservationSubstrate(
            { width: 2, height: 2, boundaryMode: 'torus' },
            [0.5, 1.0, 0.0, 2.0],
        );
        const buffer = new Float64Array([0, 0, 0, 0]);
        const request = { requestedPerCell: new Float64Array([1.0, 0.8, 1.0, 0.5]) };
        const result = applyInternalToBufferInjectionRequest(substrate, buffer, request, 2, 2);

        // Cell 0: want 1.0, have 0.5 -> grant 0.5, miss 0.5.
        // Cell 1: want 0.8, have 1.0 -> grant 0.8, miss 0.
        // Cell 2: want 1.0, have 0.0 -> grant 0, miss 1.0.
        // Cell 3: want 0.5, have 2.0 -> grant 0.5, miss 0.
        const granted = Array.from(result.grantedPerCell);
        const stored = Array.from(result.substrateState.storageField);
        const buf = Array.from(result.currentBuffer);
        expect(granted[0]).toBeCloseTo(0.5, 12);
        expect(granted[1]).toBeCloseTo(0.8, 12);
        expect(granted[2]).toBe(0);
        expect(granted[3]).toBeCloseTo(0.5, 12);
        expect(stored[0]).toBeCloseTo(0, 12);
        expect(stored[1]).toBeCloseTo(0.2, 12);
        expect(stored[2]).toBe(0);
        expect(stored[3]).toBeCloseTo(1.5, 12);
        expect(buf[0]).toBeCloseTo(0.5, 12);
        expect(buf[1]).toBeCloseTo(0.8, 12);
        expect(buf[2]).toBe(0);
        expect(buf[3]).toBeCloseTo(0.5, 12);
        expect(result.report.totalRequested).toBeCloseTo(3.3, 12);
        expect(result.report.totalGranted).toBeCloseTo(1.8, 12);
        expect(result.report.totalUngranted).toBeCloseTo(1.5, 12);
        expect(result.report.pairLedger.status).toBe('closed');
        expect(result.report.warnings.some((w) => w.includes('Internal activity bounded by available energy'))).toBe(true);
    });

    it('grants nothing when substrate is fully empty (no decay rule needed, no injection occurs)', () => {
        const substrate = createLocalConservationSubstrate(
            { width: 2, height: 2, boundaryMode: 'torus' },
            [0, 0, 0, 0],
        );
        const buffer = new Float64Array([5, 5, 5, 5]);
        const request = { requestedPerCell: new Float64Array([1, 1, 1, 1]) };
        const result = applyInternalToBufferInjectionRequest(substrate, buffer, request, 2, 2);
        expect(result.report.totalGranted).toBe(0);
        expect(result.report.totalUngranted).toBe(4);
        expect(Array.from(result.currentBuffer)).toEqual([5, 5, 5, 5]);
    });

    it('zero request leaves substrate and buffer unchanged', () => {
        const substrate = createLocalConservationSubstrate(
            { width: 2, height: 2, boundaryMode: 'torus' },
            [1, 1, 1, 1],
        );
        const buffer = new Float64Array([2, 2, 2, 2]);
        const result = applyInternalToBufferInjectionRequest(
            substrate,
            buffer,
            { requestedPerCell: new Float64Array([0, 0, 0, 0]) },
            2,
            2,
        );
        expect(Array.from(result.substrateState.storageField)).toEqual([1, 1, 1, 1]);
        expect(Array.from(result.currentBuffer)).toEqual([2, 2, 2, 2]);
        expect(result.report.totalRequested).toBe(0);
        expect(result.report.totalGranted).toBe(0);
    });
});

describe('source guardrails', () => {
    it('does not include life metaphor or energy-flow proof terms in source', () => {
        const source = readFileSync('src/core/internalToBufferTransfer.ts', 'utf8');
        const forbidden = ['vital', 'breath', 'heartbeat', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        for (const term of forbidden) {
            expect(source.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
