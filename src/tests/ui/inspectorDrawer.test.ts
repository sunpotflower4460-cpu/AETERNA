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
    it('shows "No cell selected" message', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'cell',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('No cell selected');
    });
});

describe('InspectorDrawer: metric tab with null observation', () => {
    it('shows empty message when no observation', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'metric',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
        });
        expect(html).toContain('No observation available');
    });
});

describe('InspectorDrawer: events tab empty', () => {
    it('shows "No recent events" when events are empty', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'events',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
            recentEvents: [],
        });
        expect(html).toContain('No recent events');
    });
});

describe('InspectorDrawer: warnings tab empty', () => {
    it('shows "No warnings" when warnings array is empty', () => {
        const html = renderInspectorDrawerHTML({
            activeTab: 'warnings',
            observation: null,
            activeLensId: null,
            selectedMetricId: null,
            warnings: [],
        });
        expect(html).toContain('No warnings');
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
