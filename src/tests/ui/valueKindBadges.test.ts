import { describe, expect, it } from 'vitest';

import {
    VALUE_KIND_DEFINITIONS,
    NATURAL_VALUE_KIND_ROW_MAP,
} from '../../ui/natural/ValueKindBadge.js';

describe('value kind badges', () => {
    it('defines all observation value kinds', () => {
        expect(Object.keys(VALUE_KIND_DEFINITIONS)).toEqual([
            'raw',
            'measured',
            'derived',
            'proxy',
            'check',
            'presentation-smoothed',
            'reference',
        ]);
    });

    it('uses the required explanatory tooltips', () => {
        expect(VALUE_KIND_DEFINITIONS.raw.tooltip).toContain('ほぼ加工前');
        expect(VALUE_KIND_DEFINITIONS.derived.tooltip).toContain('導出値');
        expect(VALUE_KIND_DEFINITIONS.proxy.tooltip).toContain('補助指標');
        expect(VALUE_KIND_DEFINITIONS.check.tooltip).toContain('検査値');
        expect(VALUE_KIND_DEFINITIONS.reference.tooltip).toContain('因果成分ではありません');
    });

    it('marks signed total charge as a check and vortex count as a proxy', () => {
        expect(NATURAL_VALUE_KIND_ROW_MAP['row-complex-total-charge']?.kind).toBe('check');
        expect(NATURAL_VALUE_KIND_ROW_MAP['row-complex-vortex-count']?.kind).toBe('proxy');
    });
});
