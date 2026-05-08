/**
 * nowSummaryGuideIntegration.test.ts
 * AETERNA-NATURAL v2.7 — Tests for guide integration
 *
 * Verifies:
 * - New shortcuts exist in LensGuideQuestionInput
 * - New shortcuts exist in LensAwareGuidePanel
 * - ruleBasedLensGuide handles "生命幹は安定してる？"
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { answerLensGuideRequest } from '../../guide/ruleBasedLensGuide.ts';
import type { LensGuideRequest } from '../../guide/lensGuideTypes.ts';
import type { LensContextPacket } from '../../ui/lens/lensContextPacket.ts';

const ROOT = resolve(__dirname, '../..');

function readSrc(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const srcLensGuideInput = readSrc('ui/guide/LensGuideQuestionInput.tsx');
const srcLensAwareGuide = readSrc('ui/guide/LensAwareGuidePanel.tsx');

function makeMockRequest(userQuestion: string, mode: LensGuideRequest['mode'] = 'explain'): LensGuideRequest {
    const lensContext = {
        timestamp: 0,
        cellObservation: null as unknown as LensContextPacket['cellObservation'],
        activeLens: null,
        contextSummary: 'Test context',
        epistemicNote: 'Observer-side measurement.',
    } as LensContextPacket;
    return { mode, userQuestion, lensContext };
}

describe('Guide integration — LensGuideQuestionInput shortcuts', () => {
    it('has 生命幹は安定してる？ shortcut', () => {
        expect(srcLensGuideInput).toContain('生命幹は安定してる？');
    });

    it('has 閉ループはある？ shortcut', () => {
        expect(srcLensGuideInput).toContain('閉ループはある？');
    });

    it('has 意識候補条件は？ shortcut', () => {
        expect(srcLensGuideInput).toContain('意識候補条件は？');
    });

    it('意識候補条件は？ shortcut uses caution mode', () => {
        expect(srcLensGuideInput).toContain("mode: 'caution'");
    });
});

describe('Guide integration — LensAwareGuidePanel shortcuts', () => {
    it('has 今何が起きてる？ button', () => {
        expect(srcLensAwareGuide).toContain('今何が起きてる？');
    });

    it('has 生命幹は安定してる？ button', () => {
        expect(srcLensAwareGuide).toContain('生命幹は安定してる？');
    });

    it('has 閉ループはある？ button', () => {
        expect(srcLensAwareGuide).toContain('閉ループはある？');
    });

    it('has 反応してる？ button', () => {
        expect(srcLensAwareGuide).toContain('反応してる？');
    });

    it('has 意識候補条件は？ button', () => {
        expect(srcLensAwareGuide).toContain('意識候補条件は？');
    });

    it('has 次にどこを見る？ or 次どこを見る？ button', () => {
        // Either the new "次にどこを見る？" or the pre-existing "次どこを見る？" satisfies this requirement
        const hasNextObs = srcLensAwareGuide.includes('次にどこを見る？') || srcLensAwareGuide.includes('次どこを見る？');
        expect(hasNextObs).toBe(true);
    });
});

describe('ruleBasedLensGuide — question routing', () => {
    it('handles 生命幹は安定してる？', () => {
        const response = answerLensGuideRequest(makeMockRequest('生命幹は安定してる？'));
        expect(response.answer).toBeTruthy();
        expect(response.answer).toContain('生命幹');
        expect(response.cautionNotes.some((c) => c.includes('生命の証明ではありません'))).toBe(true);
    });

    it('handles 閉ループはある？', () => {
        const response = answerLensGuideRequest(makeMockRequest('閉ループはある？'));
        expect(response.answer).toBeTruthy();
        expect(response.answer).toContain('閉ループ');
        expect(response.cautionNotes.some((c) => c.includes('因果証明ではありません'))).toBe(true);
    });

    it('handles 意識候補条件は？', () => {
        const response = answerLensGuideRequest(makeMockRequest('意識候補条件は？', 'caution'));
        expect(response.answer).toBeTruthy();
        expect(response.cautionNotes.some((c) => c.includes('意識の証明ではありません'))).toBe(true);
        expect(response.mode).toBe('caution');
    });

    it('handles 今何が起きてる？', () => {
        const response = answerLensGuideRequest(makeMockRequest('今何が起きてる？'));
        expect(response.answer).toBeTruthy();
        expect(response.answer).toContain('今起きていること');
        expect(response.suggestedNextPanels.some((p) => p.includes('今'))).toBe(true);
    });

    it('生命幹 answer does not make life proof claims', () => {
        const response = answerLensGuideRequest(makeMockRequest('生命幹は安定してる？'));
        expect(response.answer).not.toContain('生きている証明');
        expect(response.answer).not.toContain('is alive');
    });

    it('意識候補 answer has heavy caution disclaimers', () => {
        const response = answerLensGuideRequest(makeMockRequest('意識候補条件は？', 'caution'));
        expect(response.cautionNotes.length).toBeGreaterThan(1);
        expect(response.cautionNotes.some((c) => c.includes('No claims about consciousness'))).toBe(true);
    });
});
