import { describe, expect, it } from 'vitest';

import { buildExplainableSnapshot } from '../../ui/explain/explainableObservationSnapshot.js';
import { deriveGuideExplanation } from '../../ui/guide/deriveGuideExplanation.js';
import { FULL_GLOSSARY, INTEGRITY_NOTES } from '../../ui/guide/guideCopy.js';

describe('natural guide copy', () => {
    it('adds glossary and integrity language for observation-only N-series reading', () => {
        const glossaryText = FULL_GLOSSARY.map((entry) => `${entry.term} ${entry.shortDefinition}`).join(' ');
        const notesText = INTEGRITY_NOTES.join(' ');

        expect(glossaryText).toContain('Vortex Candidate');
        expect(glossaryText).toContain('Reference Ratio');
        expect(notesText).toContain('Phase is mathematical phase');
        expect(notesText).toContain('comparison result only');
    });

    it('guides observed ratios, weak plasticity, and comparison results without proof language', () => {
        const snapshot = buildExplainableSnapshot({
            timestamp: 1000,
            metrics: [],
            overallStatus: 'active',
            confidence: 0.9,
        }, {
            timestamp: 1000,
            confidence: 0.9,
            lines: [],
        }, [
            {
                id: 'weakPlasticityTrace-1',
                tick: 1,
                timestamp: 1000,
                kind: 'weakPlasticityTrace',
                severity: 'info',
                text: 'trace',
                source: 'weakPlasticity',
                valueKind: 'proxy',
            },
            {
                id: 'observedRatioMatch-1',
                tick: 1,
                timestamp: 1000,
                kind: 'observedRatioMatch',
                severity: 'info',
                text: 'ratio',
                source: 'observedRatios',
                valueKind: 'proxy',
            },
            {
                id: 'comparisonSummaryGenerated-1',
                tick: 1,
                timestamp: 1000,
                kind: 'comparisonSummaryGenerated',
                severity: 'notice',
                text: 'comparison',
                source: 'comparison',
                valueKind: 'check',
            },
        ]);

        const guide = deriveGuideExplanation({
            snapshot,
            timestamp: 1000,
            renderMode: 'diagnostic',
            viewMode: 'view',
        });

        const text = guide.currentExplanation.join(' ');
        expect(text).toContain('observe-only');
        expect(text).toContain('comparison result, not a causal proof');
        expect(text).toContain('saturation risk checks');
        expect(text).not.toContain('proof of life');
    });
});
