import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { deriveNowSummary } from '../../ui/summary/deriveNowSummary.js';
import { deriveGuideExplanation } from '../../ui/guide/deriveGuideExplanation.js';
import { FIELD_LAYER_REGISTRY } from '../../ui/render/fieldLayerRegistry.js';
import { SCENARIO_PRESET_REGISTRY } from '../../scenario/scenarioPresetRegistry.js';
import { FULL_GLOSSARY, INTEGRITY_NOTES } from '../../ui/guide/guideCopy.js';
import { getForbiddenTerms, hasForbiddenClaim } from '../../ui/guide/guideClaimGuard.js';
import { buildExplainableSnapshot } from '../../ui/explain/explainableObservationSnapshot.js';

const ROOT = resolve(__dirname, '../../..');
const html = readFileSync(resolve(ROOT, 'index.html'), 'utf-8');

const EXTRA_FORBIDDEN_EN = [
    'emotion',
    'desire',
    'intention',
    'learned meaning',
    'memory formed',
] as const;

const EXTRA_FORBIDDEN_JA = [
    '意図',
    '意味を学習',
    '記憶しました',
] as const;

function assertNoForbiddenTerms(text: string): void {
    expect(hasForbiddenClaim(text)).toBe(false);
    const lower = text.toLowerCase();
    for (const term of EXTRA_FORBIDDEN_EN) {
        expect(lower).not.toContain(term);
    }
    for (const term of EXTRA_FORBIDDEN_JA) {
        expect(text).not.toContain(term);
    }
}

function makeOverview() {
    return {
        timestamp: 1000,
        metrics: [
            { id: 'flowContinuity', label: 'Flow Continuity', value: 0.52, status: 'moderate', valueKind: 'derived', source: 'viability' },
            { id: 'energyThroughput', label: 'Energy Throughput', value: 0.41, status: 'moderate', valueKind: 'derived', source: 'viability' },
            { id: 'boundaryExchange', label: 'Boundary Exchange', value: 0.4, status: 'moderate', valueKind: 'derived', source: 'viability' },
            { id: 'returnStrength', label: 'Return Strength', value: 0.33, status: 'moderate', valueKind: 'derived', source: 'closure' },
            { id: 'echoPersistence', label: 'Echo Persistence', value: 0.29, status: 'low', valueKind: 'derived', source: 'closure' },
            { id: 'closureStability', label: 'Closure Stability', value: 0.44, status: 'moderate', valueKind: 'proxy', source: 'closure' },
            { id: 'saturationRisk', label: 'Saturation Risk', value: 0.11, status: 'low', valueKind: 'proxy', source: 'viability' },
            { id: 'extinctionRisk', label: 'Extinction Risk', value: 0.08, status: 'low', valueKind: 'proxy', source: 'viability' },
            { id: 'semanticLeak', label: 'Semantic Leak', value: 0, status: 'clear', valueKind: 'check', source: 'integrity' },
            { id: 'nanOrInfinity', label: 'NaN / Infinity', value: 0, status: 'clear', valueKind: 'check', source: 'diagnostic' },
            { id: 'llmTeacher', label: 'LLM Teacher', value: 'inactive', status: 'clear', valueKind: 'check', source: 'integrity' },
            { id: 'nodeBridge', label: 'Node Bridge', value: 'inactive', status: 'clear', valueKind: 'check', source: 'integrity' },
        ],
        overallStatus: 'active',
        confidence: 0.8,
    } as const;
}

describe('U8 language / claim QA', () => {
    it('guide claim guard forbidden term list includes U8 additions', () => {
        const { en, ja } = getForbiddenTerms();
        expect(en).toContain('thinking');
        expect(en).toContain('emotion');
        expect(en).toContain('intention');
        expect(en).toContain('learned meaning');
        expect(en).toContain('memory formed');
        expect(ja).toContain('考えています');
        expect(ja).toContain('意図');
        expect(ja).toContain('意味を学習');
        expect(ja).toContain('記憶しました');
    });

    it('guide integrity notes and glossary remain observation-based', () => {
        const allText = [
            ...INTEGRITY_NOTES,
            ...FULL_GLOSSARY.flatMap((entry) => [entry.term, entry.shortDefinition]),
        ].join(' ');
        assertNoForbiddenTerms(allText);
    });

    it('field layer labels, descriptions, and disclaimers avoid claim language', () => {
        const allText = Object.values(FIELD_LAYER_REGISTRY)
            .flatMap((layer) => [layer.label, layer.description, layer.disclaimer])
            .join(' ');
        assertNoForbiddenTerms(allText);
    });

    it('scenario preset copy avoids forbidden terms and keeps expectedSignals observational', () => {
        const allText = SCENARIO_PRESET_REGISTRY.flatMap((preset) => [
            preset.title,
            preset.shortDescription,
            preset.observationGoal,
            preset.safetyNote ?? '',
            ...preset.expectedSignals,
        ]).join(' ');
        assertNoForbiddenTerms(allText);

        for (const preset of SCENARIO_PRESET_REGISTRY) {
            expect(preset.expectedSignals.length).toBeGreaterThan(0);
            preset.expectedSignals.forEach((signal) => {
                expect(signal).not.toContain(' ');
            });
        }
    });

    it('deriveNowSummary output avoids forbidden terms', () => {
        const summary = deriveNowSummary({
            viability: {
                flowContinuity: 0.54,
                energyThroughput: 0.38,
                saturationRisk: 0.12,
                extinctionRisk: 0.09,
            } as never,
            closure: {
                returnStrength: 0.36,
                closureStability: 0.44,
                returnMismatch: 0.18,
                roundTripDelay: 0.25,
            } as never,
            timestamp: 1000,
        });

        summary.lines.forEach((line) => assertNoForbiddenTerms(line.text));
    });

    it('deriveGuideExplanation output avoids forbidden terms', () => {
        const snapshot = buildExplainableSnapshot(makeOverview(), {
            timestamp: 1000,
            lines: [
                { id: 'line-1', priority: 1, text: 'Flow continuity is moderate and return is delayed.', source: 'summary', valueKind: 'derived' },
                { id: 'line-2', priority: 2, text: 'Trace residue is fading across inactive regions.', source: 'summary', valueKind: 'derived' },
            ],
            confidence: 0.8,
        }, []);

        const guide = deriveGuideExplanation({
            snapshot,
            timestamp: 1000,
            renderMode: 'raw',
            viewMode: 'view',
        });

        [
            ...guide.currentExplanation,
            ...guide.whatToLookAt.map((item) => `${item.label} ${item.reason}`),
            ...guide.tryNext.map((item) => `${item.label} ${item.reason}`),
            ...guide.glossaryHints.map((item) => `${item.term} ${item.shortDefinition}`),
            ...guide.integrityNotes,
        ].forEach(assertNoForbiddenTerms);
    });

    it('overview integrity labels in index.html avoid forbidden claim words', () => {
        const integritySection = html.slice(html.indexOf('id="ov-integrity-section"'), html.indexOf('id="ov-event-timeline-section"'));
        assertNoForbiddenTerms(integritySection);
        expect(integritySection).toContain('Claim Guard');
        expect(integritySection).toContain('always 0');
    });
});
