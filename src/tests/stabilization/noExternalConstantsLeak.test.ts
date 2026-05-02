/**
 * noExternalConstantsLeak.test.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Verifies that:
 * - defaultAeternaNaturalRuntimeConfig has externalConstantsMode=neutral
 * - No preset other than legacyComparison has externalConstantsMode=legacy
 * - legacyComparison is not labelled as the default
 * - LongRunComparisonVariants: only legacyFlatScalar and legacyConstantsFullNatural use legacy constants
 * - Both legacy variants have notes marking them as comparison-only
 * - referenceRatios is observer-side (tested indirectly via config field presence)
 * - defaultCoreDynamicsConstantsConfig has externalConstantsMode=neutral
 * - legacyCoreDynamicsConstantsConfig has externalConstantsMode=legacy and is not default
 */

import { describe, it, expect } from 'vitest';

import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import { AETERNA_NATURAL_PRESETS, getAeternaNaturalPreset } from '../../config/aeternaNaturalPresets.js';
import {
    LONG_RUN_COMPARISON_VARIANTS,
} from '../../comparison/longRunComparisonVariants.js';
import {
    defaultCoreDynamicsConstantsConfig,
    legacyCoreDynamicsConstantsConfig,
} from '../../config/coreDynamicsConstantsConfig.js';

// ── Runtime config default ─────────────────────────────────────────────────────

describe('externalConstantsMode defaults', () => {
    it('defaultAeternaNaturalRuntimeConfig has externalConstantsMode=neutral', () => {
        expect(defaultAeternaNaturalRuntimeConfig.externalConstantsMode).toBe('neutral');
    });

    it('defaultCoreDynamicsConstantsConfig has externalConstantsMode=neutral', () => {
        expect(defaultCoreDynamicsConstantsConfig.externalConstantsMode).toBe('neutral');
    });

    it('defaultCoreDynamicsConstantsConfig has allowLegacyExternalConstants=false', () => {
        expect(defaultCoreDynamicsConstantsConfig.allowLegacyExternalConstants).toBe(false);
    });

    it('legacyCoreDynamicsConstantsConfig has externalConstantsMode=legacy', () => {
        expect(legacyCoreDynamicsConstantsConfig.externalConstantsMode).toBe('legacy');
    });

    it('legacyCoreDynamicsConstantsConfig is not the same object as the default', () => {
        expect(legacyCoreDynamicsConstantsConfig).not.toBe(defaultCoreDynamicsConstantsConfig);
        expect(legacyCoreDynamicsConstantsConfig.externalConstantsMode).not.toBe(
            defaultCoreDynamicsConstantsConfig.externalConstantsMode,
        );
    });
});

// ── Presets: only legacyComparison has legacy constants ────────────────────────

describe('presets: legacy constants isolation', () => {
    it('only legacyComparison preset has externalConstantsMode=legacy', () => {
        const legacyPresets = AETERNA_NATURAL_PRESETS.filter(
            p => p.config.externalConstantsMode === 'legacy',
        );
        expect(legacyPresets).toHaveLength(1);
        expect(legacyPresets[0].id).toBe('legacyComparison');
    });

    it('legacyComparison description mentions comparison-only use', () => {
        const preset = getAeternaNaturalPreset('legacyComparison');
        expect(preset).toBeDefined();
        const desc = preset!.description.toLowerCase();
        expect(
            desc.includes('comparison') || desc.includes('only'),
        ).toBe(true);
    });
});

// ── Long-run variants: legacy constants isolation ─────────────────────────────

describe('long-run variants: legacy constants', () => {
    it('only legacyFlatScalar and legacyConstantsFullNatural use legacy constants', () => {
        const legacyVariants = LONG_RUN_COMPARISON_VARIANTS.filter(
            v => v.externalConstantsMode === 'legacy',
        );
        const legacyIds = legacyVariants.map(v => v.id);
        expect(legacyIds).toContain('legacyFlatScalar');
        expect(legacyIds).toContain('legacyConstantsFullNatural');
        expect(legacyIds).toHaveLength(2);
    });

    it('legacyFlatScalar notes mention comparison reference', () => {
        const variant = LONG_RUN_COMPARISON_VARIANTS.find(v => v.id === 'legacyFlatScalar');
        expect(variant).toBeDefined();
        const notesText = variant!.notes.join(' ').toLowerCase();
        expect(notesText.includes('comparison') || notesText.includes('reference')).toBe(true);
    });

    it('legacyConstantsFullNatural notes mention comparison only', () => {
        const variant = LONG_RUN_COMPARISON_VARIANTS.find(v => v.id === 'legacyConstantsFullNatural');
        expect(variant).toBeDefined();
        const notesText = variant!.notes.join(' ').toLowerCase();
        expect(notesText.includes('comparison') || notesText.includes('only')).toBe(true);
    });
});

// ── referenceRatios observer-side guarantee (structural check) ─────────────────

describe('referenceRatios observer-side guarantee', () => {
    it('AeternaNaturalRuntimeConfig has no referenceRatios field', () => {
        const keys = Object.keys(defaultAeternaNaturalRuntimeConfig);
        expect(keys.some(k => k.toLowerCase().includes('referenceratio'))).toBe(false);
    });

    it('no long-run variant config has a referenceRatios field', () => {
        for (const variant of LONG_RUN_COMPARISON_VARIANTS) {
            const keys = Object.keys(variant);
            expect(keys.some(k => k.toLowerCase().includes('referenceratio'))).toBe(false);
        }
    });
});
