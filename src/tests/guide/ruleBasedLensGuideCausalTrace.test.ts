/**
 * ruleBasedLensGuideCausalTrace.test.ts
 * v1.8: Causal Trace / Layer Correlation — ruleBasedLensGuide causal trace tests
 *
 * Verifies:
 * - With causalTraceAvailable=true, returns causalTraceLines
 * - causalTraceLines contains "not causal proof"
 * - Without causalTraceAvailable, causalTraceLines is null
 * - No forbidden consciousness/intelligence/life claims
 */

import { describe, it, expect } from 'vitest';
import { deriveRuleBasedLensGuide } from '../../guide/ruleBasedLensGuide.js';
import type { LensGuideContext } from '../../guide/ruleBasedLensGuide.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<LensGuideContext> = {}): LensGuideContext {
    return {
        activeLensId: null,
        selectedMetricId: null,
        replayMode: 'live',
        replayTick: null,
        liveTick: 100,
        snapshotAvailable: false,
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('deriveRuleBasedLensGuide: no causal trace', () => {
    it('causalTraceLines is null when causalTraceAvailable is not set', () => {
        const result = deriveRuleBasedLensGuide(makeCtx());
        expect(result.causalTraceLines).toBeNull();
    });

    it('causalTraceLines is null when causalTraceAvailable is false', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({ causalTraceAvailable: false }));
        expect(result.causalTraceLines).toBeNull();
    });
});

describe('deriveRuleBasedLensGuide: with causal trace available', () => {
    it('returns causalTraceLines when causalTraceAvailable=true and summary provided', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({
            causalTraceAvailable: true,
            causalTraceSummary: ['1 signal found.'],
        }));
        expect(result.causalTraceLines).not.toBeNull();
        expect(result.causalTraceLines!.length).toBeGreaterThan(0);
    });

    it('causalTraceLines contains "not causal proof"', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({
            causalTraceAvailable: true,
            causalTraceSummary: ['1 signal found.'],
        }));
        const allText = result.causalTraceLines!.join(' ').toLowerCase();
        expect(allText).toContain('not causal proof');
    });

    it('causalTraceLines includes summary lines', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({
            causalTraceAvailable: true,
            causalTraceSummary: ['1 signal found at tick 42.'],
        }));
        const allText = result.causalTraceLines!.join(' ');
        expect(allText).toContain('1 signal found at tick 42.');
    });

    it('returns causalTraceLines even when summary is empty (trace available but no signals)', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({
            causalTraceAvailable: true,
            causalTraceSummary: [],
        }));
        expect(result.causalTraceLines).not.toBeNull();
        const allText = result.causalTraceLines!.join(' ').toLowerCase();
        expect(allText).toContain('not causal proof');
    });

    it('includes caution lines when causalTraceCautions provided', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({
            causalTraceAvailable: true,
            causalTraceSummary: ['1 signal.'],
            causalTraceCautions: ['No consciousness claim.'],
        }));
        const allText = result.causalTraceLines!.join(' ');
        expect(allText).toContain('No consciousness claim.');
    });
});

describe('deriveRuleBasedLensGuide: standard fields still work', () => {
    it('lines field is populated normally', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({ activeLensId: 'gaussianCurvature' }));
        expect(result.lines.length).toBeGreaterThan(0);
    });

    it('epistemicNote is present', () => {
        const result = deriveRuleBasedLensGuide(makeCtx());
        expect(result.epistemicNote.length).toBeGreaterThan(0);
    });
});

describe('deriveRuleBasedLensGuide: no forbidden claims', () => {
    const forbidden = [
        'proves consciousness',
        'is conscious',
        'intelligence emerged',
        'life proof',
        'soul resonance',
        'aeterna feels',
        'aeterna remembers',
    ];

    it('causalTraceLines contains no forbidden claims', () => {
        const result = deriveRuleBasedLensGuide(makeCtx({
            causalTraceAvailable: true,
            causalTraceSummary: ['3 signals found.'],
        }));
        const allText = result.causalTraceLines!.join(' ').toLowerCase();
        for (const phrase of forbidden) {
            expect(allText, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
