/**
 * consciousnessCandidateConditions.test.ts
 * AETERNA-NATURAL v2.7 — Tests for ConsciousnessCandidateCondition
 *
 * Verifies:
 * - Status values are valid
 * - Always includes caution
 * - No proof claims
 */

import { describe, it, expect } from 'vitest';
import { deriveNowSummaryPanel } from '../../observer/deriveNowSummary.ts';
import { renderConsciousnessCandidateConditionsPanelHTML } from '../../ui/observation/ConsciousnessCandidateConditionsPanel.tsx';
import type { ConsciousnessCandidateCondition } from '../../types/nowSummary.ts';

const VALID_STATUSES = ['observed', 'weak', 'notObserved', 'insufficient'] as const;

describe('ConsciousnessCandidateCondition', () => {
    it('produces 10 conditions from deriveNowSummaryPanel', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const consSection = result.sections.find((s) => s.id === 'consciousnessCandidateConditions');
        expect(consSection).toBeDefined();
        // 10 detail lines (one per condition)
        expect(consSection!.detailsJa).toHaveLength(10);
    });

    it('renders valid HTML with disclaimer', () => {
        const conditions: ConsciousnessCandidateCondition[] = [
            {
                id: 'persistence',
                labelJa: '持続性',
                status: 'observed',
                reasonJa: 'エネルギー: 0.7',
                sourceMetricIds: ['energy'],
                cautionJa: 'これは意識の証明ではありません。観測可能な前提条件候補の一部です。',
            },
            {
                id: 'boundary',
                labelJa: '境界性',
                status: 'insufficient',
                reasonJa: '観測値なし',
                sourceMetricIds: ['membraneDeformation'],
                cautionJa: 'これは意識の証明ではありません。観測可能な前提条件候補の一部です。',
            },
        ];

        const html = renderConsciousnessCandidateConditionsPanelHTML({ conditions });
        expect(html).toContain('これは意識の証明ではありません');
        expect(html).toContain('意識が宿るかもしれない前提条件');
        expect(html).toContain('持続性');
        expect(html).toContain('境界性');
    });

    it('all condition statuses are valid', () => {
        const result = deriveNowSummaryPanel({
            timestamp: 0,
            energy: 0.5,
            stability: 0.6,
            traceStrength: 0.4,
            membraneDeformation: 0.3,
            closureStability: 0.5,
            phaseCoherence: 0.5,
            orientingDrive: 0.3,
            predictionSensitivity: 0.3,
            modeState: 'active',
            touchActive: true,
        });
        const consSection = result.sections.find((s) => s.id === 'consciousnessCandidateConditions')!;
        // Each detail line should include a valid status label
        for (const detail of consSection.detailsJa) {
            const hasValidStatus =
                detail.includes('観測') ||
                detail.includes('弱観測') ||
                detail.includes('非観測') ||
                detail.includes('不足');
            expect(hasValidStatus).toBe(true);
        }
    });

    it('panel HTML does not contain proof claims', () => {
        const conditions: ConsciousnessCandidateCondition[] = VALID_STATUSES.map((status, i) => ({
            id: `cond${i}`,
            labelJa: `条件${i}`,
            status,
            reasonJa: 'テスト',
            sourceMetricIds: [],
            cautionJa: 'これは意識の証明ではありません。観測可能な前提条件候補の一部です。',
        }));
        const html = renderConsciousnessCandidateConditionsPanelHTML({ conditions });
        expect(html).not.toContain('AETERNAは意識がある');
        expect(html).not.toContain('AETERNA is conscious');
        // Should NOT say "意識の証明である" or "意識の証明です" (affirmative)
        expect(html).not.toMatch(/意識の証明(?:である|です|だ)/);
        // The disclaimer should say it is NOT proof
        expect(html).toContain('証明ではありません');
    });

    it('insufficient status is reported when values are missing', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const consSection = result.sections.find((s) => s.id === 'consciousnessCandidateConditions')!;
        const hasInsufficient = consSection.detailsJa.some((d) => d.includes('不足'));
        expect(hasInsufficient).toBe(true);
    });

    it('cautionsJa always present and includes consciousness disclaimer', () => {
        const result = deriveNowSummaryPanel({ timestamp: 0 });
        const consSection = result.sections.find((s) => s.id === 'consciousnessCandidateConditions')!;
        expect(consSection.cautionsJa.length).toBeGreaterThan(0);
        expect(consSection.cautionsJa.some((c) => c.includes('意識の証明ではありません'))).toBe(true);
    });
});
