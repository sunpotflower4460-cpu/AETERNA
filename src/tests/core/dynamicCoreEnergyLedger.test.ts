import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
    aggregateDynamicCoreShadowLedger,
    deriveAdditiveInjectionShadow,
    deriveMultiplicativeDecayShadow,
    deriveOverwriteShadow,
    deriveScalarMultiplicativeDecayShadow,
} from '../../core/dynamicCoreEnergyLedger.ts';

const TOL = 1e-9;

function arr(values: number[]): Float64Array {
    return Float64Array.from(values);
}

describe('deriveMultiplicativeDecayShadow', () => {
    it('captures spikeTrace *= 0.9 as a closed entry with sink amount = 10% of before', () => {
        const before = arr([1.0, 0.5, 0.2, 0.0]);
        const after = arr([0.9, 0.45, 0.18, 0.0]);
        const entry = deriveMultiplicativeDecayShadow(
            'spikeTrace.idleDecay',
            before,
            after,
            0.9,
            'spikeDecaySink',
            TOL,
        );
        expect(entry.ruleKind).toBe('multiplicative-decay');
        expect(entry.inferredSinkName).toBe('spikeDecaySink');
        expect(entry.inferredSourceName).toBeNull();
        expect(entry.ruleObeyed).toBe(true);
        expect(entry.residual).toBeLessThan(TOL);
        // Inferred sink amount should equal sum(before) * 0.1 = 1.7 * 0.1 = 0.17
        expect(entry.inferredAmount).toBeCloseTo(0.17, 12);
    });

    it('detects a violation when after does not equal before * k', () => {
        const before = arr([1.0, 1.0]);
        const after = arr([0.5, 0.5]); // would imply k=0.5, not 0.9
        const entry = deriveMultiplicativeDecayShadow(
            'spikeTrace.idleDecay',
            before,
            after,
            0.9,
            'spikeDecaySink',
            TOL,
        );
        expect(entry.ruleObeyed).toBe(false);
        expect(entry.residual).toBeGreaterThan(TOL);
    });

    it('captures w_* *= 0.99995 as a tiny sink amount', () => {
        const w = arr([1.0, 1.0, 1.0, 1.0]);
        const wAfter = arr([0.99995, 0.99995, 0.99995, 0.99995]);
        const entry = deriveMultiplicativeDecayShadow(
            'w_up.passiveDecay',
            w,
            wAfter,
            0.99995,
            'weightDecaySink',
            TOL,
        );
        expect(entry.ruleObeyed).toBe(true);
        // 4 cells * 1.0 * 0.00005 = 0.0002
        expect(entry.inferredAmount).toBeCloseTo(0.0002, 12);
    });

    it('returns insufficient when before/after lengths mismatch', () => {
        const before = arr([1, 2, 3]);
        const after = arr([1, 2]);
        const entry = deriveMultiplicativeDecayShadow(
            'mismatch',
            before,
            after,
            0.9,
            'sink',
            TOL,
        );
        expect(entry.ruleObeyed).toBe(false);
        expect(entry.residual).toBe(Number.POSITIVE_INFINITY);
    });

    it('returns insufficient when NaN present', () => {
        const before = arr([1.0, NaN]);
        const after = arr([0.9, 0.9]);
        const entry = deriveMultiplicativeDecayShadow(
            'nan-test',
            before,
            after,
            0.9,
            'sink',
            TOL,
        );
        expect(entry.ruleObeyed).toBe(false);
    });
});

describe('deriveScalarMultiplicativeDecayShadow', () => {
    it('captures partnerAbsenceDrift *= 0.95 (scalar)', () => {
        const entry = deriveScalarMultiplicativeDecayShadow(
            'partnerAbsenceDrift.decay',
            1.0,
            0.95,
            0.95,
            'relationalDriftSink',
            TOL,
        );
        expect(entry.ruleKind).toBe('multiplicative-decay');
        expect(entry.ruleObeyed).toBe(true);
        expect(entry.inferredAmount).toBeCloseTo(0.05, 12);
        expect(entry.residual).toBeLessThan(TOL);
    });

    it('detects scalar mismatch', () => {
        const entry = deriveScalarMultiplicativeDecayShadow(
            'scalar-mismatch',
            1.0,
            0.5,
            0.95,
            'sink',
            TOL,
        );
        expect(entry.ruleObeyed).toBe(false);
        expect(entry.residual).toBeGreaterThan(0.4);
    });
});

describe('deriveAdditiveInjectionShadow', () => {
    it('captures currentBuffer += injection without prediction', () => {
        const before = arr([0.0, 0.5, 0.0]);
        const after = arr([1.0, 0.5, 2.0]);
        const entry = deriveAdditiveInjectionShadow(
            'currentBuffer.noiseInjection',
            before,
            after,
            'noiseInjectionBudget',
        );
        expect(entry.ruleKind).toBe('additive-injection');
        expect(entry.inferredSourceName).toBe('noiseInjectionBudget');
        expect(entry.inferredSinkName).toBeNull();
        // Total injection = 1.0 + 0 + 2.0 = 3.0
        expect(entry.inferredAmount).toBeCloseTo(3.0, 12);
        expect(entry.ruleObeyed).toBe(true);
        expect(entry.residual).toBe(0);
    });

    it('verifies against expected per-cell injection', () => {
        const before = arr([0.0, 0.5]);
        const after = arr([1.0, 0.7]);
        const expected = arr([1.0, 0.2]);
        const entry = deriveAdditiveInjectionShadow(
            'currentBuffer.touchInjection',
            before,
            after,
            'touchInjectionBudget',
            { expectedInjectionPerCell: expected, tolerance: TOL },
        );
        expect(entry.ruleObeyed).toBe(true);
        expect(entry.residual).toBeLessThan(TOL);
    });

    it('detects deviation from expected injection', () => {
        const before = arr([0.0, 0.0]);
        const after = arr([1.0, 1.0]);
        const expected = arr([1.0, 0.5]); // claim was 0.5 but actually got 1.0
        const entry = deriveAdditiveInjectionShadow(
            'mismatch',
            before,
            after,
            'src',
            { expectedInjectionPerCell: expected, tolerance: TOL },
        );
        expect(entry.ruleObeyed).toBe(false);
        expect(entry.residual).toBeCloseTo(0.5, 9);
    });
});

describe('deriveOverwriteShadow', () => {
    it('captures baselineActivity = sin(...) overwrite as full external generator input', () => {
        const before = arr([0.1, -0.1, 0.05]);
        const after = arr([0.2, 0.0, -0.2]);
        const entry = deriveOverwriteShadow(
            'baselineActivity.sinDriven',
            before,
            after,
            'externalBaselineGenerator',
            'baselineActivity.previous',
            TOL,
        );
        expect(entry.ruleKind).toBe('overwrite');
        expect(entry.inferredSourceName).toBe('externalBaselineGenerator');
        expect(entry.inferredSinkName).toBe('baselineActivity.previous');
        // Source amount = sum |after| = 0.4
        expect(entry.inferredAmount).toBeCloseTo(0.4, 12);
        expect(entry.ruleObeyed).toBe(true);
    });
});

describe('aggregateDynamicCoreShadowLedger', () => {
    it('combines closed entries into a closed ledger', () => {
        const entries = [
            deriveMultiplicativeDecayShadow(
                'spikeTrace',
                arr([1, 1]),
                arr([0.9, 0.9]),
                0.9,
                'spikeDecaySink',
                TOL,
            ),
            deriveAdditiveInjectionShadow(
                'currentBuffer.noise',
                arr([0, 0]),
                arr([1, 2]),
                'noiseInjectionBudget',
            ),
        ];
        const led = aggregateDynamicCoreShadowLedger(0, entries, TOL);
        expect(led.status).toBe('closed');
        expect(led.totalInferredSinkAmount).toBeCloseTo(0.2, 12); // 2 cells * 1 * 0.1
        expect(led.totalInferredSourceAmount).toBeCloseTo(3.0, 12);
        expect(led.totalResidual).toBeLessThan(TOL);
    });

    it('flips to open when any entry residual exceeds tolerance', () => {
        const entries = [
            deriveMultiplicativeDecayShadow(
                'spikeTrace',
                arr([1, 1]),
                arr([0.5, 0.5]), // violates k=0.9
                0.9,
                'spikeDecaySink',
                TOL,
            ),
        ];
        const led = aggregateDynamicCoreShadowLedger(0, entries, TOL);
        expect(led.status).toBe('open');
        expect(led.warnings.join('|')).toContain('Shadow ledger is open');
    });

    it('flips to insufficient when an entry could not be verified', () => {
        const entries = [
            deriveMultiplicativeDecayShadow(
                'mismatch',
                arr([1, 2, 3]),
                arr([0.9, 1.8]), // length mismatch
                0.9,
                'sink',
                TOL,
            ),
        ];
        const led = aggregateDynamicCoreShadowLedger(0, entries, TOL);
        expect(led.status).toBe('insufficient');
        expect(led.unverifiedRuleNames).toContain('mismatch');
        expect(led.warnings.join('|')).toContain('insufficient');
    });

    it('warns about overwrite-shaped rules implicitly discarding previous state', () => {
        const entries = [
            deriveOverwriteShadow(
                'baselineActivity.sinDriven',
                arr([0.1, 0.2]),
                arr([0.3, 0.4]),
                'externalBaselineGenerator',
                'baselineActivity.previous',
                TOL,
            ),
        ];
        const led = aggregateDynamicCoreShadowLedger(0, entries, TOL);
        expect(led.status).toBe('closed');
        expect(led.warnings.some((w) => w.includes('overwrite-shaped'))).toBe(true);
    });

    it('captures the full set of dynamicCore patterns in one ledger', () => {
        // Mimic one tick of dynamicCore for 2 cells.
        const spikeBefore = arr([1.0, 0.4]);
        const spikeAfter = arr([0.9, 0.36]); // *= 0.9
        const wBefore = arr([1.0, 1.0]);
        const wAfter = arr([0.99995, 0.99995]); // *= 0.99995
        const bufBefore = arr([0.0, 0.0]);
        const bufAfter = arr([0.5, 0.7]); // += injection
        const baselineBefore = arr([0.0, 0.0]);
        const baselineAfter = arr([0.003, -0.003]); // = sin(...)
        const residueBefore = arr([0.5, 0.5]);
        const residueAfter = arr([0.485, 0.485]); // *= 0.97

        const entries = [
            deriveMultiplicativeDecayShadow('spikeTrace.idleDecay', spikeBefore, spikeAfter, 0.9, 'spikeDecaySink', TOL),
            deriveMultiplicativeDecayShadow('w_up.passiveDecay', wBefore, wAfter, 0.99995, 'weightDecaySink', TOL),
            deriveAdditiveInjectionShadow('currentBuffer.combinedInjection', bufBefore, bufAfter, 'noiseAndTouchBudget'),
            deriveOverwriteShadow('baselineActivity.sinDriven', baselineBefore, baselineAfter, 'externalBaselineGenerator', 'baselineActivity.previous', TOL),
            deriveMultiplicativeDecayShadow('activityResidue.decay', residueBefore, residueAfter, 0.97, 'residueDecaySink', TOL),
            deriveScalarMultiplicativeDecayShadow('partnerAbsenceDrift.decay', 1.0, 0.95, 0.95, 'relationalDriftSink', TOL),
        ];

        const led = aggregateDynamicCoreShadowLedger(123, entries, TOL);
        expect(led.timestamp).toBe(123);
        expect(led.status).toBe('closed');
        expect(led.entries).toHaveLength(6);
        expect(led.totalInferredSinkAmount).toBeGreaterThan(0);
        expect(led.totalInferredSourceAmount).toBeGreaterThan(0);
    });
});

describe('source guardrails', () => {
    it('does not include life metaphor or energy-flow proof terms in source', () => {
        const source = readFileSync('src/core/dynamicCoreEnergyLedger.ts', 'utf8');
        const forbidden = ['vital', 'breath', 'heartbeat', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];
        for (const term of forbidden) {
            expect(source.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
