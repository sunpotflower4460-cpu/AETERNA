import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const html = readFileSync(resolve(__dirname, '../../../index.html'), 'utf-8');

describe('mobile observation UX polish', () => {
    it('keeps runtime mode badges available on mobile', () => {
        expect(html).toContain('#natural-mode-hud { gap: 4px; max-width: calc(100vw - 28px); }');
        expect(html).not.toContain('@media (max-width:768px) {\n            #natural-mode-hud { display: none; }');
    });

    it('renders the observation dashboard container', () => {
        expect(html).toContain('id="observation-dashboard-sections"');
        expect(html).toContain('Observation Dashboard');
    });

    it('switches the guide panel to a bottom-sheet style on mobile', () => {
        expect(html).toContain('border-radius: 16px 16px 0 0;');
        expect(html).toContain('max-height: min(62vh, 520px);');
    });
});
