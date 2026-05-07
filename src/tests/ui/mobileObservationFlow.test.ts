/**
 * mobileObservationFlow.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — ObservationMobileTabs tests
 */

import { describe, it, expect } from 'vitest';
import { renderObservationMobileTabsHTML } from '../../ui/observation/ObservationMobileTabs.js';

describe('ObservationMobileTabs: all 6 tabs', () => {
    it('renders all 6 tab IDs', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('data-tab="field"');
        expect(html).toContain('data-tab="inspector"');
        expect(html).toContain('data-tab="lens"');
        expect(html).toContain('data-tab="replay"');
        expect(html).toContain('data-tab="trace"');
        expect(html).toContain('data-tab="guide"');
    });
});

describe('ObservationMobileTabs: tab icons', () => {
    it('renders field icon 🌐', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('🌐');
    });

    it('renders inspector icon 🔍', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('🔍');
    });

    it('renders lens icon 🔭', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('🔭');
    });

    it('renders replay icon ⏮', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('⏮');
    });

    it('renders trace icon 🔗', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('🔗');
    });

    it('renders guide icon 💬', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('💬');
    });
});

describe('ObservationMobileTabs: tab labels', () => {
    it('renders all expected Japanese tab labels', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('見る');
        expect(html).toContain('調べる');
        expect(html).toContain('レンズ');
        expect(html).toContain('時間');
        expect(html).toContain('関連');
        expect(html).toContain('聞く');
    });

    it('retains English aria-labels for accessibility', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('aria-label="Field"');
        expect(html).toContain('aria-label="Inspector"');
        expect(html).toContain('aria-label="Lens"');
        expect(html).toContain('aria-label="Replay"');
        expect(html).toContain('aria-label="Trace"');
        expect(html).toContain('aria-label="Guide"');
    });
});

describe('ObservationMobileTabs: active tab', () => {
    it('active tab has observation-mobile-tabs__tab--active class', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'inspector' });
        // The active button should have the --active modifier
        expect(html).toContain('observation-mobile-tabs__tab--active');
    });

    it('non-active tabs do not have --active class for their specific tab entry', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        // Only one active class should appear
        const activeMatches = (html.match(/observation-mobile-tabs__tab--active/g) ?? []).length;
        expect(activeMatches).toBe(1);
    });
});

describe('ObservationMobileTabs: ARIA and role', () => {
    it('role="tablist" is present on nav', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('role="tablist"');
    });

    it('role="tab" is present on tab buttons', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('role="tab"');
    });

    it('aria-selected="true" is on the active tab', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'replay' });
        expect(html).toContain('aria-selected="true"');
    });
});

describe('ObservationMobileTabs: event dispatch', () => {
    it('each tab dispatches observation:tabChange event', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        expect(html).toContain('observation:tabChange');
    });
});

describe('ObservationMobileTabs: touchable buttons', () => {
    it('tab buttons have minimum touch size set', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' });
        // Check that min-height:44px is set (accessibility requirement)
        expect(html).toContain('min-height:44px');
    });
});

describe('ObservationMobileTabs: no forbidden claims', () => {
    const forbiddenPhrases = [
        'consciousness proved',
        'aeterna feels',
        'aeterna wants',
        'soul',
    ];

    it('contains no forbidden claims', () => {
        const html = renderObservationMobileTabsHTML({ activeTab: 'field' }).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
