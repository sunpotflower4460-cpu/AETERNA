/**
 * metricRowUx.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — CellMetricRow tests
 */

import { describe, it, expect } from 'vitest';
import {
    renderCellMetricRowHTML,
    formatMetricValue,
    VALUE_KIND_COLORS,
} from '../../ui/observation/CellMetricRow.js';
import type { CellMetricRowData } from '../../ui/observation/CellMetricRow.js';

function makeRow(overrides: Partial<CellMetricRowData> = {}): CellMetricRowData {
    return {
        metricId: 'field.amplitude',
        label: 'Field Amplitude',
        value: 0.5,
        unit: 'a.u.',
        valueKind: 'measured',
        lensId: null,
        ...overrides,
    };
}

describe('formatMetricValue: undefined/null/non-finite', () => {
    it('renders "(not observed)" for undefined value', () => {
        expect(formatMetricValue(undefined, 'a.u.')).toBe('(not observed)');
    });

    it('renders "(not observed)" for null value', () => {
        expect(formatMetricValue(null, 'a.u.')).toBe('(not observed)');
    });

    it('renders "(non-finite)" for non-finite value', () => {
        expect(formatMetricValue(Infinity, 'a.u.')).toBe('(non-finite)');
        expect(formatMetricValue(-Infinity, 'a.u.')).toBe('(non-finite)');
        expect(formatMetricValue(NaN, 'a.u.')).toBe('(non-finite)');
    });

    it('never renders "0" for undefined value', () => {
        expect(formatMetricValue(undefined, '')).not.toBe('0');
    });

    it('never renders "0" for null value', () => {
        expect(formatMetricValue(null, '')).not.toBe('0');
    });
});

describe('renderCellMetricRowHTML: undefined value', () => {
    it('renders "(not observed)" for undefined value', () => {
        const html = renderCellMetricRowHTML(makeRow({ value: undefined }));
        expect(html).toContain('(not observed)');
    });

    it('never renders just "0" for undefined value', () => {
        const html = renderCellMetricRowHTML(makeRow({ value: undefined }));
        expect(html).not.toContain('>0<');
    });
});

describe('renderCellMetricRowHTML: value kind badges', () => {
    it('shows [measured] badge', () => {
        const html = renderCellMetricRowHTML(makeRow({ valueKind: 'measured' }));
        expect(html).toContain('[measured]');
    });

    it('shows [derived] badge', () => {
        const html = renderCellMetricRowHTML(makeRow({ valueKind: 'derived' }));
        expect(html).toContain('[derived]');
    });

    it('shows [proxy] badge', () => {
        const html = renderCellMetricRowHTML(makeRow({ valueKind: 'proxy' }));
        expect(html).toContain('[proxy]');
    });

    it('shows [unavailable] badge', () => {
        const html = renderCellMetricRowHTML(makeRow({ valueKind: 'unavailable', value: undefined }));
        expect(html).toContain('[unavailable]');
    });

    it('badge has title (tooltip) attribute', () => {
        const html = renderCellMetricRowHTML(makeRow({ valueKind: 'measured' }));
        expect(html).toContain('title=');
    });
});

describe('renderCellMetricRowHTML: confidence', () => {
    it('renders confidence when provided', () => {
        const html = renderCellMetricRowHTML(makeRow({ confidence: 0.8 }));
        expect(html).toContain('conf:');
        expect(html).toContain('0.80');
    });

    it('does not render confidence section when not provided', () => {
        const html = renderCellMetricRowHTML(makeRow({ confidence: undefined }));
        expect(html).not.toContain('conf:');
    });
});

describe('renderCellMetricRowHTML: lens shortcut', () => {
    it('renders lens shortcut when lensId is set', () => {
        const html = renderCellMetricRowHTML(makeRow({ lensId: 'fieldAmplitude' }));
        expect(html).toContain('→ Lens');
    });

    it('does not render lens shortcut when lensId is null', () => {
        const html = renderCellMetricRowHTML(makeRow({ lensId: null }));
        expect(html).not.toContain('→ Lens');
    });
});

describe('renderCellMetricRowHTML: active class', () => {
    it('has cell-metric-row--active class when active=true', () => {
        const html = renderCellMetricRowHTML(makeRow({ active: true }));
        expect(html).toContain('cell-metric-row--active');
    });

    it('does not have active class when active=false', () => {
        const html = renderCellMetricRowHTML(makeRow({ active: false }));
        expect(html).not.toContain('cell-metric-row--active');
    });
});

describe('VALUE_KIND_COLORS', () => {
    it('has entries for all expected value kinds', () => {
        expect(VALUE_KIND_COLORS).toHaveProperty('measured');
        expect(VALUE_KIND_COLORS).toHaveProperty('derived');
        expect(VALUE_KIND_COLORS).toHaveProperty('proxy');
        expect(VALUE_KIND_COLORS).toHaveProperty('unavailable');
        expect(VALUE_KIND_COLORS).toHaveProperty('check');
        expect(VALUE_KIND_COLORS).toHaveProperty('reference');
        expect(VALUE_KIND_COLORS).toHaveProperty('raw');
    });
});

describe('renderCellMetricRowHTML: no forbidden claims', () => {
    const forbiddenPhrases = [
        'proves consciousness',
        'aeterna feels',
        'aeterna wants',
        'soul',
    ];

    it('rendered output contains no forbidden claims', () => {
        const html = renderCellMetricRowHTML(makeRow({ lensId: 'fieldAmplitude', confidence: 0.9 })).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
