/**
 * valueKindLabelsJa.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — valueKindLabelsJa tests
 *
 * Verifies that:
 * 1. All value kinds are present.
 * 2. Each kind has a jaLabel and tooltipJa.
 * 3. Lookup helpers work.
 */

import { describe, it, expect } from 'vitest';
import {
    VALUE_KIND_LABELS_JA,
    ALL_VALUE_KINDS,
    getValueKindLabel,
    getValueKindJaLabel,
    getValueKindTooltip,
    type ValueKind,
} from '../../i18n/valueKindLabelsJa.ts';

describe('valueKindLabelsJa: all kinds present', () => {
    const EXPECTED_KINDS: ValueKind[] = [
        'Raw',
        'Measured',
        'Derived',
        'Proxy',
        'Check',
        'Reference',
        'Presentation-smoothed',
    ];

    for (const kind of EXPECTED_KINDS) {
        it(`has kind: ${kind}`, () => {
            const label = getValueKindLabel(kind);
            expect(label).toBeDefined();
        });
    }
});

describe('valueKindLabelsJa: each kind has required fields', () => {
    it('every kind has jaLabel', () => {
        for (const label of VALUE_KIND_LABELS_JA) {
            expect(label.jaLabel, `${label.kind} missing jaLabel`).toBeTruthy();
        }
    });

    it('every kind has tooltipJa', () => {
        for (const label of VALUE_KIND_LABELS_JA) {
            expect(label.tooltipJa, `${label.kind} missing tooltipJa`).toBeTruthy();
        }
    });

    it('every kind has enLabel', () => {
        for (const label of VALUE_KIND_LABELS_JA) {
            expect(label.enLabel, `${label.kind} missing enLabel`).toBeTruthy();
        }
    });
});

describe('valueKindLabelsJa: correct Japanese translations', () => {
    it('Raw → 生値', () => {
        expect(getValueKindJaLabel('Raw')).toBe('生値');
    });
    it('Measured → 測定値', () => {
        expect(getValueKindJaLabel('Measured')).toBe('測定値');
    });
    it('Derived → 導出値', () => {
        expect(getValueKindJaLabel('Derived')).toBe('導出値');
    });
    it('Proxy → 補助指標', () => {
        expect(getValueKindJaLabel('Proxy')).toBe('補助指標');
    });
    it('Check → 確認値', () => {
        expect(getValueKindJaLabel('Check')).toBe('確認値');
    });
    it('Reference → 参照値', () => {
        expect(getValueKindJaLabel('Reference')).toBe('参照値');
    });
    it('Presentation-smoothed → 表示用に平滑化', () => {
        expect(getValueKindJaLabel('Presentation-smoothed')).toBe('表示用に平滑化');
    });
});

describe('valueKindLabelsJa: lookup helpers', () => {
    it('getValueKindLabel returns correct item', () => {
        const item = getValueKindLabel('Proxy');
        expect(item?.kind).toBe('Proxy');
        expect(item?.jaLabel).toBe('補助指標');
    });

    it('getValueKindLabel returns undefined for unknown kind', () => {
        // @ts-expect-error intentional
        expect(getValueKindLabel('__unknown__')).toBeUndefined();
    });

    it('getValueKindTooltip returns non-empty for Proxy', () => {
        const tooltip = getValueKindTooltip('Proxy');
        expect(tooltip.length).toBeGreaterThan(0);
        expect(tooltip).toContain('因果証明ではありません');
    });

    it('getValueKindTooltip returns non-empty for Reference', () => {
        const tooltip = getValueKindTooltip('Reference');
        expect(tooltip.length).toBeGreaterThan(0);
    });
});

describe('valueKindLabelsJa: ALL_VALUE_KINDS contains all kinds', () => {
    it('has 7 kinds', () => {
        expect(ALL_VALUE_KINDS.length).toBe(7);
    });

    it('includes Presentation-smoothed', () => {
        expect(ALL_VALUE_KINDS).toContain('Presentation-smoothed');
    });
});
