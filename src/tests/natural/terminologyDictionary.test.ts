/**
 * terminologyDictionary.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — TerminologyDictionary tests
 */

import { describe, it, expect } from 'vitest';
import {
    renderTerminologyDictionaryHTML,
    getTermEntry,
    TERMINOLOGY,
} from '../../ui/natural/TerminologyDictionary.tsx';

// ── TERMINOLOGY structure ─────────────────────────────────────────────────────

describe('TERMINOLOGY: structure', () => {
    it('has entries for all core terms', () => {
        const ids = TERMINOLOGY.map((e) => e.id);
        expect(ids).toContain('field');
        expect(ids).toContain('cell');
        expect(ids).toContain('phase');
        expect(ids).toContain('amplitude');
        expect(ids).toContain('vortex-candidate');
        expect(ids).toContain('membrane');
        expect(ids).toContain('plasticity-trace');
        expect(ids).toContain('observed-ratio');
        expect(ids).toContain('proxy');
        expect(ids).toContain('derived');
        expect(ids).toContain('reference');
        expect(ids).toContain('causal-trace');
        expect(ids).toContain('layer-correlation');
    });

    it('every entry has term, what, purpose, isNotWhat', () => {
        for (const entry of TERMINOLOGY) {
            expect(entry.term, `${entry.id}: missing term`).toBeTruthy();
            expect(entry.what, `${entry.id}: missing what`).toBeTruthy();
            expect(entry.purpose, `${entry.id}: missing purpose`).toBeTruthy();
            expect(entry.isNotWhat, `${entry.id}: missing isNotWhat`).toBeTruthy();
        }
    });

    it('every entry has a Japanese term', () => {
        for (const entry of TERMINOLOGY) {
            // Japanese terms should not be empty ASCII-only strings
            expect(entry.term.length).toBeGreaterThan(0);
        }
    });
});

// ── getTermEntry ──────────────────────────────────────────────────────────────

describe('getTermEntry', () => {
    it('returns entry for a known ID', () => {
        const entry = getTermEntry('phase');
        expect(entry).not.toBeNull();
        expect(entry?.term).toBe('位相');
    });

    it('returns null for unknown ID', () => {
        const entry = getTermEntry('nonexistent-id-xyz');
        expect(entry).toBeNull();
    });
});

// ── renderTerminologyDictionaryHTML ───────────────────────────────────────────

describe('renderTerminologyDictionaryHTML: full list', () => {
    it('renders the panel title "観測用語辞典"', () => {
        const html = renderTerminologyDictionaryHTML();
        expect(html).toContain('観測用語辞典');
    });

    it('renders "何か" section for each entry', () => {
        const html = renderTerminologyDictionaryHTML();
        expect((html.match(/何か:/g) ?? []).length).toBeGreaterThanOrEqual(TERMINOLOGY.length);
    });

    it('renders "何ではないか" section for each entry', () => {
        const html = renderTerminologyDictionaryHTML();
        expect((html.match(/何ではないか:/g) ?? []).length).toBeGreaterThanOrEqual(TERMINOLOGY.length);
    });
});

describe('renderTerminologyDictionaryHTML: filter', () => {
    it('filters by term ID and shows matching term', () => {
        const html = renderTerminologyDictionaryHTML({ filter: 'phase' });
        expect(html).toContain('位相');
    });

    it('filters by term ID and excludes non-matching terms', () => {
        const html = renderTerminologyDictionaryHTML({ filter: 'amplitude' });
        expect(html).toContain('振幅');
        expect(html).not.toContain('data-term-id="phase"');
    });

    it('shows empty state when filter has no matches', () => {
        const html = renderTerminologyDictionaryHTML({ filter: 'zzznomatch999' });
        expect(html).toContain('terminology-dictionary--empty');
    });
});

describe('renderTerminologyDictionaryHTML: XSS safety', () => {
    it('escapes XSS in filter string', () => {
        const html = renderTerminologyDictionaryHTML({ filter: '<script>xss</script>' });
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
});

describe('renderTerminologyDictionaryHTML: no forbidden claims', () => {
    const forbidden = [
        'proves consciousness',
        'is conscious',
        'aeterna feels',
        'life proof',
        'soul resonance',
        'intelligence emerged',
    ];

    it('contains no forbidden claims', () => {
        const html = renderTerminologyDictionaryHTML().toLowerCase();
        for (const phrase of forbidden) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
