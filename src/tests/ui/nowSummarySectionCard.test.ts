/**
 * nowSummarySectionCard.test.ts
 * AETERNA-NATURAL v2.7 — Tests for renderNowSummarySectionCardHTML
 *
 * Verifies:
 * - Section title is shown
 * - Severity is shown
 * - Cautions are shown
 */

import { describe, it, expect } from 'vitest';
import { renderNowSummarySectionCardHTML } from '../../ui/observation/NowSummarySectionCard.tsx';
import type { NowSummarySection } from '../../types/nowSummary.ts';

const makeSection = (overrides: Partial<NowSummarySection> = {}): NowSummarySection => ({
    id: 'vitalStem',
    titleJa: '生命幹',
    oneLineJa: '生命幹は安定した活動状態にあります。',
    detailsJa: ['エネルギー: 0.7000', '安定性: 0.8000'],
    severity: 'calm',
    confidence: 'high',
    sourceMetricIds: ['energy', 'stability'],
    cautionsJa: ['生命幹サマリーは生命の証明ではありません。持続・反応・回復・状態依存性の観測です。'],
    ...overrides,
});

describe('renderNowSummarySectionCardHTML', () => {
    it('renders without error', () => {
        const html = renderNowSummarySectionCardHTML({ section: makeSection() });
        expect(html).toBeTruthy();
    });

    it('shows section title (titleJa)', () => {
        const section = makeSection({ titleJa: '生命幹テスト' });
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).toContain('生命幹テスト');
    });

    it('shows severity badge', () => {
        const section = makeSection({ severity: 'strained' });
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).toContain('過負荷');
        expect(html).toContain('now-summary-section-card__severity--strained');
    });

    it('shows oneLineJa', () => {
        const section = makeSection();
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).toContain('生命幹は安定した活動状態にあります。');
    });

    it('shows cautions always', () => {
        const section = makeSection();
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).toContain('生命幹サマリーは生命の証明ではありません');
    });

    it('shows details when showDetails=true', () => {
        const section = makeSection();
        const html = renderNowSummarySectionCardHTML({ section, showDetails: true });
        expect(html).toContain('エネルギー: 0.7000');
        expect(html).toContain('安定性: 0.8000');
    });

    it('does NOT show details by default', () => {
        const section = makeSection();
        const html = renderNowSummarySectionCardHTML({ section });
        // detailsJa should not appear when showDetails is false (default)
        expect(html).not.toContain('エネルギー: 0.7000');
    });

    it('shows source metrics when showSourceMetrics=true', () => {
        const section = makeSection();
        const html = renderNowSummarySectionCardHTML({ section, showSourceMetrics: true });
        expect(html).toContain('energy');
        expect(html).toContain('stability');
    });

    it('does NOT show source metrics by default', () => {
        const section = makeSection();
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).not.toContain('ソース指標');
    });

    it('shows confidence label', () => {
        const section = makeSection({ confidence: 'medium' });
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).toContain('信頼度: 中');
    });

    it('handles unstable severity', () => {
        const section = makeSection({ severity: 'unstable' });
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).toContain('不安定');
        expect(html).toContain('now-summary-section-card__severity--unstable');
    });

    it('handles insufficient confidence', () => {
        const section = makeSection({ confidence: 'insufficient' });
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).toContain('不足');
    });

    it('is XSS-safe', () => {
        const section = makeSection({ titleJa: '<b>XSS test</b>' });
        const html = renderNowSummarySectionCardHTML({ section });
        expect(html).not.toContain('<b>XSS test</b>');
        expect(html).toContain('&lt;b&gt;XSS test&lt;/b&gt;');
    });
});
