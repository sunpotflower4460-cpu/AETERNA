/**
 * japaneseFirstUI.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Cross-panel JP label guard
 *
 * Verifies that:
 * 1. Key panels display Japanese-first labels (not English-only).
 * 2. English labels are retained in aria-labels and data attributes.
 * 3. "観測ガイド" appears instead of bare "AI Guide" in the panel title.
 * 4. JP disclaimers are present in disclaimer panels.
 */

import { describe, it, expect } from 'vitest';
import { renderObservationHeaderHTML } from '../../ui/observation/ObservationHeader.tsx';
import { renderObservationMobileTabsHTML } from '../../ui/observation/ObservationMobileTabs.tsx';
import { renderLensAwareGuidePanelHTML } from '../../ui/guide/LensAwareGuidePanel.tsx';
import { renderCausalTracePanelHTML } from '../../ui/observation/CausalTracePanel.tsx';
import { renderLayerCorrelationPanelHTML } from '../../ui/observation/LayerCorrelationPanel.tsx';
import { renderInspectorDrawerHTML } from '../../ui/observation/InspectorDrawer.tsx';

// ── ObservationHeader ─────────────────────────────────────────────────────────

describe('Japanese-first: ObservationHeader', () => {
    it('shows "ライブ" in live mode (not "Live")', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 1,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('ライブ');
    });

    it('shows "再生" in replay mode (not "Replay")', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 100,
            replayTick: 50,
            isReplayMode: true,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('再生');
    });

    it('shows "セル" label for selected cell', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: 3,
            activeLensId: null,
        });
        expect(html).toContain('セル');
    });

    it('shows "レンズ" label for active lens', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: 'fieldPhase',
        });
        expect(html).toContain('レンズ');
    });
});

// ── ObservationMobileTabs ─────────────────────────────────────────────────────

describe('Japanese-first: ObservationMobileTabs', () => {
    it('shows Japanese tab labels', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('見る');
        expect(html).toContain('調べる');
        expect(html).toContain('レンズ');
        expect(html).toContain('時間');
        expect(html).toContain('関連');
        expect(html).toContain('聞く');
    });

    it('retains English in aria-labels', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('aria-label="Field"');
    });
});

// ── LensAwareGuidePanel ("観測ガイド") ────────────────────────────────────────

describe('Japanese-first: LensAwareGuidePanel', () => {
    it('shows "観測ガイド" as panel title', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('観測ガイド');
    });

    it('retains English "(AI Guide)" reference for discoverability', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('AI Guide');
    });

    it('shows "選択セル" label', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: 'fieldPhase',
            selectedCellIndex: 2,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('選択セル');
    });
});

// ── CausalTracePanel ──────────────────────────────────────────────────────────

describe('Japanese-first: CausalTracePanel', () => {
    it('shows "関連候補" as panel title', () => {
        const html = renderCausalTracePanelHTML({ result: null });
        expect(html).toContain('関連候補');
    });

    it('shows "因果証明ではありません" disclaimer', () => {
        const html = renderCausalTracePanelHTML({ result: null });
        expect(html).toContain('因果証明ではありません');
    });
});

// ── LayerCorrelationPanel ─────────────────────────────────────────────────────

describe('Japanese-first: LayerCorrelationPanel', () => {
    it('shows "層の相関" as panel title', () => {
        const html = renderLayerCorrelationPanelHTML({ state: null });
        expect(html).toContain('層の相関');
    });

    it('shows "相関は因果ではありません" disclaimer', () => {
        const html = renderLayerCorrelationPanelHTML({ state: null });
        expect(html).toContain('相関は因果ではありません');
    });
});

// ── InspectorDrawer ───────────────────────────────────────────────────────────

describe('Japanese-first: InspectorDrawer tabs', () => {
    it('shows Japanese tab labels "セル", "観測値", "履歴", "警告"', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('セル');
        expect(html).toContain('観測値');
        expect(html).toContain('履歴');
        expect(html).toContain('警告');
    });

    it('retains English in aria-labels for accessibility', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('aria-label="Cell"');
        expect(html).toContain('aria-label="Metric"');
    });
});
