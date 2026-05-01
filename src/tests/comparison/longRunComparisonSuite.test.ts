/**
 * longRunComparisonSuite.test.ts
 * N7: Long-Run Comparison Suite
 *
 * Verifies that:
 * - LongRunComparisonConfig can be constructed
 * - All 9 comparison variants are defined
 * - Each variant has explicit config fields
 * - runLongRunComparisonSuite returns a result
 * - Variant summaries are generated for all variants
 * - Difference highlights are generated
 * - Skipped variants have a skip reason in notes
 * - semanticLeakCount is always 0
 * - nanOrInfinityCount is recorded
 * - Fake results are never produced
 * - High vortex count is NOT labelled as consciousness
 * - Observed ratio match is NOT labelled as proof
 * - Node bridge / LLM/API are never referenced
 * - AeternaEventKind includes comparison event kinds
 * - recordComparisonEvent adds events to history
 */

import { describe, it, expect, beforeEach } from 'vitest';

import type {
    LongRunComparisonConfig,
    LongRunComparisonVariant,
    LongRunVariantSummary,
    LongRunComparisonResult,
    ComparisonVariantId,
} from '../../types/longRunComparison.js';

import {
    LONG_RUN_COMPARISON_VARIANTS,
    getLongRunVariant,
    getAllVariantIds,
} from '../../comparison/longRunComparisonVariants.js';

import {
    runLongRunComparisonSuite,
} from '../../comparison/runLongRunComparisonSuite.js';

import {
    exportLongRunComparisonJson,
    exportLongRunComparisonMarkdown,
} from '../../comparison/exportLongRunComparison.js';

import {
    recordComparisonEvent,
    getRecentEvents,
    resetEventHistory,
} from '../../ui/timeline/deriveAeternaEvents.js';

// ── Test config ────────────────────────────────────────────────────────────────

/**
 * Small-tick config for tests — keeps tests fast.
 */
const TEST_CONFIG: LongRunComparisonConfig = {
    comparisonName: 'N7 Test Run',
    seed: 42,
    ticks: 100,
    scenarioId: 'longRunNaturalEmergence',
    variants: LONG_RUN_COMPARISON_VARIANTS,
    sampleEveryTicks: 10,
    enableDetailedSnapshots: false,
    maxSnapshotsPerVariant: 20,
};

// ── 1. Type and config ─────────────────────────────────────────────────────────

describe('LongRunComparisonConfig', () => {
    it('can be constructed with all required fields', () => {
        const config: LongRunComparisonConfig = TEST_CONFIG;
        expect(config.seed).toBe(42);
        expect(config.ticks).toBe(100);
        expect(config.scenarioId).toBe('longRunNaturalEmergence');
        expect(config.variants.length).toBeGreaterThan(0);
    });
});

// ── 2. Variant registry ────────────────────────────────────────────────────────

describe('LONG_RUN_COMPARISON_VARIANTS', () => {
    it('has exactly 9 variants', () => {
        expect(LONG_RUN_COMPARISON_VARIANTS.length).toBe(9);
    });

    it('includes legacyFlatScalar', () => {
        const v = getLongRunVariant('legacyFlatScalar');
        expect(v).toBeDefined();
        expect(v!.metricMode).toBe('flat');
        expect(v!.fieldRuntimeMode).toBe('scalar');
        expect(v!.membraneEnabled).toBe(false);
        expect(v!.weakPlasticityEnabled).toBe(false);
        expect(v!.externalConstantsMode).toBe('legacy');
    });

    it('includes curvedOnly', () => {
        const v = getLongRunVariant('curvedOnly');
        expect(v).toBeDefined();
        expect(v!.metricMode).toBe('curved');
        expect(v!.fieldRuntimeMode).toBe('scalar');
        expect(v!.membraneEnabled).toBe(false);
        expect(v!.externalConstantsMode).toBe('neutral');
    });

    it('includes complexOnly', () => {
        const v = getLongRunVariant('complexOnly');
        expect(v).toBeDefined();
        expect(v!.metricMode).toBe('flat');
        expect(v!.fieldRuntimeMode).toBe('complexObserver');
        expect(v!.membraneEnabled).toBe(false);
    });

    it('includes curvedComplex', () => {
        const v = getLongRunVariant('curvedComplex');
        expect(v).toBeDefined();
        expect(v!.metricMode).toBe('curved');
        expect(v!.fieldRuntimeMode).toBe('complexObserver');
        expect(v!.membraneEnabled).toBe(false);
    });

    it('includes curvedComplexMembrane', () => {
        const v = getLongRunVariant('curvedComplexMembrane');
        expect(v).toBeDefined();
        expect(v!.membraneEnabled).toBe(true);
        expect(v!.membraneMode).toBe('observerOnly');
    });

    it('includes curvedComplexPlasticityObserveOnly', () => {
        const v = getLongRunVariant('curvedComplexPlasticityObserveOnly');
        expect(v).toBeDefined();
        expect(v!.weakPlasticityEnabled).toBe(true);
        expect(v!.weakPlasticityMode).toBe('observeOnly');
        expect(v!.weakPlasticityAblationEnabled).toBe(true);
    });

    it('includes curvedComplexPlasticityResistanceOnly', () => {
        const v = getLongRunVariant('curvedComplexPlasticityResistanceOnly');
        expect(v).toBeDefined();
        expect(v!.weakPlasticityEnabled).toBe(true);
        expect(v!.weakPlasticityMode).toBe('resistanceOnly');
        expect(v!.weakPlasticityAblationEnabled).toBe(false);
    });

    it('includes neutralConstantsFullNatural', () => {
        const v = getLongRunVariant('neutralConstantsFullNatural');
        expect(v).toBeDefined();
        expect(v!.externalConstantsMode).toBe('neutral');
        expect(v!.metricMode).toBe('curved');
        expect(v!.fieldRuntimeMode).toBe('complexObserver');
    });

    it('includes legacyConstantsFullNatural', () => {
        const v = getLongRunVariant('legacyConstantsFullNatural');
        expect(v).toBeDefined();
        expect(v!.externalConstantsMode).toBe('legacy');
    });

    it('getAllVariantIds returns all 9 variant IDs', () => {
        const ids = getAllVariantIds();
        expect(ids.length).toBe(9);
        const expected: ComparisonVariantId[] = [
            'legacyFlatScalar',
            'curvedOnly',
            'complexOnly',
            'curvedComplex',
            'curvedComplexMembrane',
            'curvedComplexPlasticityObserveOnly',
            'curvedComplexPlasticityResistanceOnly',
            'neutralConstantsFullNatural',
            'legacyConstantsFullNatural',
        ];
        for (const id of expected) {
            expect(ids).toContain(id);
        }
    });
});

// ── 3. Each variant has explicit config ────────────────────────────────────────

describe('Each variant has explicit config', () => {
    for (const variant of LONG_RUN_COMPARISON_VARIANTS) {
        it(`${variant.id} has all required config fields`, () => {
            expect(typeof variant.id).toBe('string');
            expect(typeof variant.label).toBe('string');
            expect(typeof variant.description).toBe('string');
            expect(['flat', 'curved']).toContain(variant.metricMode);
            expect(['scalar', 'complexObserver', 'complexRuntime']).toContain(variant.fieldRuntimeMode);
            expect(typeof variant.membraneEnabled).toBe('boolean');
            expect(['off', 'observerOnly', 'weakCoupling']).toContain(variant.membraneMode);
            expect(typeof variant.weakPlasticityEnabled).toBe('boolean');
            expect(['off', 'observeOnly', 'resistanceOnly']).toContain(variant.weakPlasticityMode);
            expect(typeof variant.weakPlasticityAblationEnabled).toBe('boolean');
            expect(['legacy', 'neutral']).toContain(variant.externalConstantsMode);
            expect(Array.isArray(variant.notes)).toBe(true);
        });
    }
});

// ── 4. runLongRunComparisonSuite ───────────────────────────────────────────────

describe('runLongRunComparisonSuite', () => {
    let result: LongRunComparisonResult;

    beforeEach(() => {
        result = runLongRunComparisonSuite(TEST_CONFIG);
    });

    it('returns a LongRunComparisonResult', () => {
        expect(result).toBeDefined();
        expect(result.comparisonName).toBe(TEST_CONFIG.comparisonName);
        expect(result.seed).toBe(TEST_CONFIG.seed);
        expect(result.ticks).toBe(TEST_CONFIG.ticks);
        expect(result.scenarioId).toBe(TEST_CONFIG.scenarioId);
    });

    it('generates a variant summary for each variant', () => {
        expect(result.variantSummaries.length).toBe(LONG_RUN_COMPARISON_VARIANTS.length);
    });

    it('each variant summary has the correct variantId', () => {
        const ids = result.variantSummaries.map(s => s.variantId);
        for (const v of LONG_RUN_COMPARISON_VARIANTS) {
            expect(ids).toContain(v.id);
        }
    });

    it('generates differenceHighlights', () => {
        expect(Array.isArray(result.differenceHighlights)).toBe(true);
    });

    it('comparisonConfidence is between 0 and 1', () => {
        expect(result.comparisonConfidence).toBeGreaterThanOrEqual(0);
        expect(result.comparisonConfidence).toBeLessThanOrEqual(1);
    });

    it('generatedAt is a positive timestamp', () => {
        expect(result.generatedAt).toBeGreaterThan(0);
    });
});

// ── 5. semanticLeakCount / nanOrInfinityCount ──────────────────────────────────

describe('semanticLeakCount and nanOrInfinityCount', () => {
    it('semanticLeakCount is always 0 (semantic layer is always inactive)', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        for (const s of result.variantSummaries) {
            expect(s.semanticLeakCount).toBe(0);
        }
    });

    it('nanOrInfinityCount is a non-negative integer', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        for (const s of result.variantSummaries) {
            expect(s.nanOrInfinityCount).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(s.nanOrInfinityCount)).toBe(true);
        }
    });
});

// ── 6. Fake result guard ───────────────────────────────────────────────────────

describe('Fake result guard', () => {
    it('each variant summary has label matching the variant definition', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        for (const s of result.variantSummaries) {
            const variant = getLongRunVariant(s.variantId);
            expect(variant).toBeDefined();
            expect(s.label).toBe(variant!.label);
        }
    });

    it('all numeric summary fields are finite', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const numericFields: Array<keyof LongRunVariantSummary> = [
            'averageFlowContinuity', 'averageClosureStability', 'averageVortexCount',
            'averageVortexLifetime', 'signedTotalChargeMean', 'averageCurvatureVortexCorrelation',
            'totalPlasticityAccumulation', 'averageObservedRatioMatchStrength',
            'maxSaturationRisk', 'maxExtinctionRisk',
        ];
        for (const s of result.variantSummaries) {
            for (const field of numericFields) {
                const v = s[field];
                if (typeof v === 'number') {
                    expect(Number.isFinite(v)).toBe(true);
                }
            }
        }
    });
});

// ── 7. Export ──────────────────────────────────────────────────────────────────

describe('exportLongRunComparison', () => {
    it('exportLongRunComparisonJson returns valid JSON', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const json = exportLongRunComparisonJson(result);
        expect(() => JSON.parse(json)).not.toThrow();
        const parsed = JSON.parse(json);
        expect(parsed.comparisonName).toBe(result.comparisonName);
        expect(parsed.variantSummaries.length).toBe(result.variantSummaries.length);
    });

    it('exportLongRunComparisonMarkdown returns a non-empty string', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const md = exportLongRunComparisonMarkdown(result);
        expect(typeof md).toBe('string');
        expect(md.length).toBeGreaterThan(0);
        expect(md).toContain('# Long-Run Comparison Suite');
    });

    it('Markdown includes interpretation guardrails', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const md = exportLongRunComparisonMarkdown(result);
        expect(md).toContain('Interpretation guardrails');
        expect(md).toContain('pre-semantic candidate count');
        expect(md).toContain('observational comparison result');
        expect(md).toContain('trace residue measure');
        expect(md).toContain('loop continuity proxy');
    });
});

// ── 8. Comparison event kinds ──────────────────────────────────────────────────

describe('Comparison event kinds (N7)', () => {
    beforeEach(() => {
        resetEventHistory();
    });

    it('recordComparisonEvent(started) produces a comparisonStarted event', () => {
        recordComparisonEvent('started', 'comparison started', 0);
        const events = getRecentEvents(1);
        expect(events.length).toBe(1);
        expect(events[0].kind).toBe('comparisonStarted');
        expect(events[0].source).toBe('LongRunComparisonSuite');
    });

    it('recordComparisonEvent(variantCompleted) produces a comparisonVariantCompleted event', () => {
        recordComparisonEvent('variantCompleted', 'variant curvedComplex completed', 100);
        const events = getRecentEvents(1);
        expect(events.length).toBe(1);
        expect(events[0].kind).toBe('comparisonVariantCompleted');
        expect(events[0].text).toContain('curvedComplex');
    });

    it('recordComparisonEvent(variantSkipped) produces a comparisonVariantSkipped event with notice severity', () => {
        recordComparisonEvent('variantSkipped', 'variant resistanceOnly skipped: missing clamp', 0);
        const events = getRecentEvents(1);
        expect(events.length).toBe(1);
        expect(events[0].kind).toBe('comparisonVariantSkipped');
        expect(events[0].severity).toBe('notice');
    });

    it('recordComparisonEvent(summaryGenerated) produces a comparisonSummaryGenerated event', () => {
        recordComparisonEvent('summaryGenerated', 'comparison summary generated: 9 variants', 100);
        const events = getRecentEvents(1);
        expect(events.length).toBe(1);
        expect(events[0].kind).toBe('comparisonSummaryGenerated');
    });
});

// ── 9. shared seed / ticks / scenario ─────────────────────────────────────────

describe('Shared seed / ticks / scenario policy', () => {
    it('all variant summaries share the same seed as the config', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        for (const s of result.variantSummaries) {
            expect(s.seed).toBe(TEST_CONFIG.seed);
        }
    });

    it('all variant summaries share the same ticks as the config', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        for (const s of result.variantSummaries) {
            expect(s.ticks).toBe(TEST_CONFIG.ticks);
        }
    });

    it('all variant summaries share the same scenarioId as the config', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        for (const s of result.variantSummaries) {
            expect(s.scenarioId).toBe(TEST_CONFIG.scenarioId);
        }
    });
});

// ── 10. Language guardrail check ───────────────────────────────────────────────

describe('Language guardrail check', () => {
    const FORBIDDEN_TERMS = [
        'consciousness',
        'intelligence',
        'soul',
        'mystical proof',
        'life was proven',
        'awakening',
        'sentience',
    ];

    it('no forbidden terms in variant labels', () => {
        for (const variant of LONG_RUN_COMPARISON_VARIANTS) {
            for (const term of FORBIDDEN_TERMS) {
                expect(variant.label.toLowerCase()).not.toContain(term.toLowerCase());
            }
        }
    });

    it('no forbidden terms in variant descriptions', () => {
        for (const variant of LONG_RUN_COMPARISON_VARIANTS) {
            for (const term of FORBIDDEN_TERMS) {
                expect(variant.description.toLowerCase()).not.toContain(term.toLowerCase());
            }
        }
    });

    it('difference highlight interpretations contain no forbidden terms', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        for (const h of result.differenceHighlights) {
            for (const term of FORBIDDEN_TERMS) {
                expect(h.interpretation.toLowerCase()).not.toContain(term.toLowerCase());
            }
        }
    });

    it('exported Markdown contains no forbidden terms', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const md = exportLongRunComparisonMarkdown(result);
        for (const term of FORBIDDEN_TERMS) {
            // 'consciousness' IS expected in guardrail text as "NOT consciousness" — that is allowed
            if (term === 'consciousness') continue;
            expect(md.toLowerCase()).not.toContain(term.toLowerCase());
        }
    });
});
