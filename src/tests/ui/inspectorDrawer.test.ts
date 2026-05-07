/**
 * inspectorDrawer.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — InspectorDrawer tests
 */

import { describe, it, expect } from 'vitest';
import { renderInspectorDrawerHTML } from '../../ui/observation/InspectorDrawer.js';

describe('InspectorDrawer: tab bar', () => {
    it('renders tab bar with Cell, Metric, Events, Warnings tabs', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('Cell');
        expect(html).toContain('Metric');
        expect(html).toContain('Events');
        expect(html).toContain('Warnings');
    });

    it('renders role=tablist on tab bar', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('role="tablist"');
    });

    it('each tab dispatches inspector:tabChange events', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('inspector:tabChange');
    });
});

describe('InspectorDrawer: cell tab with null observation', () => {
    it('shows Japanese "セルが選択されていません" message (v2.4)', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('セルが選択されていません');
    });
});

describe('InspectorDrawer: metric tab with null observation', () => {
    it('shows Japanese empty message when no observation', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'metric',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('観測データがありません');
    });
});

describe('InspectorDrawer: events tab empty', () => {
    it('shows Japanese "最近の履歴はありません" when events are empty (v2.4)', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'events',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
            recentEvents: [],
        });
        expect(html).toContain('最近の履歴はありません');
    });
});

describe('InspectorDrawer: warnings tab empty', () => {
    it('shows Japanese "警告はありません" when warnings array is empty (v2.4)', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'warnings',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
            warnings: [],
        });
        expect(html).toContain('警告はありません');
    });
});

describe('InspectorDrawer: inspector-drawer class', () => {
    it('renders inspector-drawer container', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('inspector-drawer');
    });
});

describe('InspectorDrawer: no forbidden claims', () => {
    const forbiddenPhrases = [
        'consciousness proved',
        'life proved',
        'aeterna feels',
        'aeterna wants',
        'soul resonance',
    ];

    it('contains no forbidden claims', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'warnings',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
            warnings: [{ severity: 'warning', text: 'Test warning' }],
        }).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
