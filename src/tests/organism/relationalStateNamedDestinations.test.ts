import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    createInitialRelationalState,
    updateRelationalState,
} from '../../organism/relationalState.ts';
import { decayPlainArrayWithSink } from '../../core/dynamicCoreNamedDestinations.ts';

/**
 * E phase verification: every multiplicative decay in relationalState.ts now
 * routes through a named-destination helper. The numeric trajectory of each
 * decayed variable is preserved bit-for-bit (the helper performs `value *
 * multiplier` exactly).
 */

describe('relationalState named-destination decay (E phase)', () => {
    it('partnerTraceStrength decay accumulates into partnerTraceStrengthDecayAccumulator', () => {
        const rs = createInitialRelationalState();
        rs.partnerTraceStrength = 0.5;
        const network: Record<string, unknown> = {};
        updateRelationalState(rs, network, { hasPartnerInteraction: false });
        // 0.5 * 0.9998 = 0.4999. Loss = 0.0001.
        expect(rs.partnerTraceStrength).toBeCloseTo(0.4999, 12);
        expect(network.partnerTraceStrengthDecayAccumulator).toBeCloseTo(0.0001, 12);
    });

    it('partnerFamiliarity decay accumulates into partnerFamiliarityDecayAccumulator', () => {
        const rs = createInitialRelationalState();
        rs.partnerFamiliarity = 0.6;
        const network: Record<string, unknown> = {};
        updateRelationalState(rs, network, { hasPartnerInteraction: false });
        // 0.6 * 0.9995 = 0.5997. Loss = 0.0003.
        expect(rs.partnerFamiliarity).toBeCloseTo(0.5997, 12);
        expect(network.partnerFamiliarityDecayAccumulator).toBeCloseTo(0.0003, 12);
    });

    it('partnerContinuityConfidence decay accumulates into partnerContinuityConfidenceDecayAccumulator', () => {
        const rs = createInitialRelationalState();
        rs.partnerContinuityConfidence = 0.5;
        const network: Record<string, unknown> = {};
        updateRelationalState(rs, network, { hasPartnerInteraction: false });
        // 0.5 * 0.998 = 0.499. Loss = 0.001.
        expect(rs.partnerContinuityConfidence).toBeCloseTo(0.499, 12);
        expect(network.partnerContinuityConfidenceDecayAccumulator).toBeCloseTo(0.001, 12);
    });

    it('partnerTouchStyleSignature decay accumulates into partnerTouchStyleSignatureDecayAccumulator', () => {
        const rs = createInitialRelationalState();
        const sig = rs.partnerTouchStyleSignature;
        for (let i = 0; i < sig.length; i++) sig[i] = 0.1;
        const network: Record<string, unknown> = {};
        updateRelationalState(rs, network, { hasPartnerInteraction: false });
        // Each cell: 0.1 * 0.999 = 0.0999. Loss per cell: 0.0001.
        // Total loss across all cells: 0.0001 * length.
        const expectedLoss = 0.0001 * sig.length;
        expect(network.partnerTouchStyleSignatureDecayAccumulator).toBeCloseTo(expectedLoss, 9);
        for (let i = 0; i < sig.length; i++) {
            expect(sig[i]).toBeCloseTo(0.0999, 12);
        }
    });

    it('decayPlainArrayWithSink helper: NaN entries are skipped without polluting the sink', () => {
        const arr = [1.0, Number.NaN, 0.5];
        const net: Record<string, unknown> = {};
        decayPlainArrayWithSink(arr, 0.9, net, 'testSink');
        // 1.0 → 0.9 (loss 0.1); NaN unchanged; 0.5 → 0.45 (loss 0.05). Total = 0.15.
        expect(arr[0]).toBeCloseTo(0.9, 12);
        expect(Number.isNaN(arr[1])).toBe(true);
        expect(arr[2]).toBeCloseTo(0.45, 12);
        expect(net.testSink).toBeCloseTo(0.15, 12);
    });

    it('decayPlainArrayWithSink is a no-op on non-array input', () => {
        const net: Record<string, unknown> = { sink: 7 };
        decayPlainArrayWithSink(null as unknown as number[], 0.9, net, 'sink');
        expect(net.sink).toBe(7);
    });
});

describe('relationalState lint guard (E phase)', () => {
    it('contains no bare `*= 0.<digit>` literal', () => {
        const src = readFileSync('src/organism/relationalState.ts', 'utf8');
        const matches = src.match(/\*=\s*0\.[0-9]/g);
        expect(matches).toBeNull();
    });

    it('contains no bare `*=` operator anywhere (every multiplicative mutation goes through a helper)', () => {
        const src = readFileSync('src/organism/relationalState.ts', 'utf8');
        const matches = src.match(/\*=/g);
        expect(matches).toBeNull();
    });
});
