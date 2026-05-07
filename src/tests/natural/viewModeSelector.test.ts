/**
 * viewModeSelector.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — ViewModeSelector tests
 */

import { describe, it, expect } from 'vitest';
import {
    renderViewModeSelectorHTML,
    getViewModeDefinition,
    VIEW_MODE_DEFINITIONS,
    type ViewMode,
} from '../../ui/natural/ViewModeSelector.tsx';

// ── VIEW_MODE_DEFINITIONS ─────────────────────────────────────────────────────

describe('VIEW_MODE_DEFINITIONS: structure', () => {
    it('has exactly 4 modes', () => {
        expect(VIEW_MODE_DEFINITIONS).toHaveLength(4);
    });

    it('mode IDs are beginner, normal, researcher, developer', () => {
        const ids = VIEW_MODE_DEFINITIONS.map((m) => m.id);
        expect(ids).toContain('beginner');
        expect(ids).toContain('normal');
        expect(ids).toContain('researcher');
        expect(ids).toContain('developer');
    });

    it('beginner mode label is "はじめて見る"', () => {
        const m = VIEW_MODE_DEFINITIONS.find((m) => m.id === 'beginner');
        expect(m?.label).toBe('はじめて見る');
    });

    it('normal mode label is "通常観測"', () => {
        const m = VIEW_MODE_DEFINITIONS.find((m) => m.id === 'normal');
        expect(m?.label).toBe('通常観測');
    });

    it('researcher mode label is "研究者モード"', () => {
        const m = VIEW_MODE_DEFINITIONS.find((m) => m.id === 'researcher');
        expect(m?.label).toBe('研究者モード');
    });

    it('developer mode label is "開発者モード"', () => {
        const m = VIEW_MODE_DEFINITIONS.find((m) => m.id === 'developer');
        expect(m?.label).toBe('開発者モード');
    });

    it('every mode has features list with at least one item', () => {
        for (const mode of VIEW_MODE_DEFINITIONS) {
            expect(mode.features.length, `${mode.id}: should have features`).toBeGreaterThan(0);
        }
    });
});

// ── getViewModeDefinition ─────────────────────────────────────────────────────

describe('getViewModeDefinition', () => {
    it('returns definition for "beginner"', () => {
        const def = getViewModeDefinition('beginner');
        expect(def?.label).toBe('はじめて見る');
    });

    it('returns null for invalid mode', () => {
        // @ts-expect-error intentionally invalid
        const def = getViewModeDefinition('invalid-mode-xyz');
        expect(def).toBeNull();
    });
});

// ── renderViewModeSelectorHTML ────────────────────────────────────────────────

describe('renderViewModeSelectorHTML: buttons', () => {
    it('renders all 4 mode buttons', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'normal' });
        for (const mode of VIEW_MODE_DEFINITIONS) {
            expect(html).toContain(`data-mode="${mode.id}"`);
        }
    });

    it('active mode button has --active class', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'researcher' });
        expect(html).toContain('view-mode-selector__btn--active');
    });

    it('exactly one button has --active class', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'beginner' });
        const matches = (html.match(/view-mode-selector__btn--active/g) ?? []).length;
        expect(matches).toBe(1);
    });
});

describe('renderViewModeSelectorHTML: labels', () => {
    it('shows "はじめて見る" label', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'beginner' });
        expect(html).toContain('はじめて見る');
    });

    it('shows "通常観測" label', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'normal' });
        expect(html).toContain('通常観測');
    });

    it('shows "研究者モード" label', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'researcher' });
        expect(html).toContain('研究者モード');
    });

    it('shows "開発者モード" label', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'developer' });
        expect(html).toContain('開発者モード');
    });
});

describe('renderViewModeSelectorHTML: features', () => {
    it('shows features list for active mode', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'researcher' });
        expect(html).toContain('view-mode-selector__feature-list');
    });
});

describe('renderViewModeSelectorHTML: event dispatch', () => {
    it('dispatches observation:viewModeChange event on click', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'normal' });
        expect(html).toContain('observation:viewModeChange');
    });
});

describe('renderViewModeSelectorHTML: ARIA', () => {
    it('has role="radiogroup" on the container', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'normal' });
        expect(html).toContain('role="radiogroup"');
    });

    it('active button has aria-checked="true"', () => {
        const html = renderViewModeSelectorHTML({ activeMode: 'developer' });
        expect(html).toContain('aria-checked="true"');
    });
});

describe('renderViewModeSelectorHTML: no forbidden claims', () => {
    const forbidden = [
        'consciousness proved',
        'aeterna feels',
        'soul',
        'life proof',
        'intelligence emerged',
    ];

    const modes: ViewMode[] = ['beginner', 'normal', 'researcher', 'developer'];

    it('no mode renders forbidden claims', () => {
        for (const mode of modes) {
            const html = renderViewModeSelectorHTML({
                activeMode: mode,
                showDescriptions: true,
            }).toLowerCase();
            for (const phrase of forbidden) {
                expect(html, `${mode}: should not contain "${phrase}"`).not.toContain(phrase);
            }
        }
    });
});
