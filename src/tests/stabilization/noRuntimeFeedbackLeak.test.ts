/**
 * noRuntimeFeedbackLeak.test.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Verifies that observer-side data is never used as runtime feedback:
 * - observedRatios is not imported in dynamicCore
 * - referenceRatios is not imported in dynamicCore
 * - No preset has a config field that wires observedRatio feedback to runtime
 * - The long-run comparison result is not fed back to dynamicCore
 * - Plasticity observation is not directly wired to dynamicCore
 *
 * These tests work by checking that the AeternaNaturalRuntimeConfig interface
 * does not expose feedback fields, and by inspecting preset configs.
 * The actual import checks are documented in the integration review.
 */

import { describe, it, expect } from 'vitest';

import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import { AETERNA_NATURAL_PRESETS } from '../../config/aeternaNaturalPresets.js';
import { LONG_RUN_COMPARISON_VARIANTS } from '../../comparison/longRunComparisonVariants.js';

// ── observedRatio feedback guard ───────────────────────────────────────────────

describe('observedRatio runtime feedback guard', () => {
    it('AeternaNaturalRuntimeConfig has no observedRatioFeedback field', () => {
        const keys = Object.keys(defaultAeternaNaturalRuntimeConfig);
        const feedbackKeys = keys.filter(k =>
            k.toLowerCase().includes('observedratiosfeedback')
            || k.toLowerCase().includes('ratiofeedback')
            || k.toLowerCase().includes('ratiotoruntime'),
        );
        expect(feedbackKeys).toHaveLength(0);
    });

    it('no preset config has an observedRatio feedback field', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            const keys = Object.keys(preset.config);
            const feedbackKeys = keys.filter(k =>
                k.toLowerCase().includes('ratiofeedback')
                || k.toLowerCase().includes('observedfeedback'),
            );
            expect(feedbackKeys).toHaveLength(0);
        }
    });

    it('observedRatiosEnabled only enables observer-side computation', () => {
        // The field name 'observedRatiosEnabled' must not be 'observedRatiosFeedback'.
        const keys = Object.keys(defaultAeternaNaturalRuntimeConfig);
        expect(keys).toContain('observedRatiosEnabled');
        expect(keys).not.toContain('observedRatiosFeedback');
        expect(keys).not.toContain('observedRatiosRuntimeFeedback');
    });
});

// ── emergentResonance feedback guard ──────────────────────────────────────────

describe('emergentResonance runtime feedback guard', () => {
    it('AeternaNaturalRuntimeConfig has no emergentResonanceFeedback field', () => {
        const keys = Object.keys(defaultAeternaNaturalRuntimeConfig);
        expect(keys.some(k => k.toLowerCase().includes('resonancefeedback'))).toBe(false);
    });
});

// ── Long-run comparison feedback guard ────────────────────────────────────────

describe('long-run comparison feedback guard', () => {
    it('longRunComparisonEnabled=false by default (results never auto-fed back)', () => {
        expect(defaultAeternaNaturalRuntimeConfig.longRunComparisonEnabled).toBe(false);
    });

    it('LongRunComparisonVariant has no runtimeFeedback field', () => {
        for (const variant of LONG_RUN_COMPARISON_VARIANTS) {
            const keys = Object.keys(variant);
            expect(keys.some(k => k.toLowerCase().includes('feedback'))).toBe(false);
        }
    });
});

// ── Plasticity observer → runtime guard ───────────────────────────────────────

describe('plasticity observer feedback guard', () => {
    it('weakPlasticityAblationEnabled=true by default', () => {
        // Even when plasticity is switched on, the ablation gate blocks feedback.
        expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityAblationEnabled).toBe(true);
    });

    it('no preset has weakPlasticityEnabled=true AND ablationEnabled=false as default', () => {
        // resistanceOnly + ablation disabled is only allowed in experimental presets
        // and must be explicitly set.
        const dangerous = AETERNA_NATURAL_PRESETS.filter(
            p =>
                p.config.weakPlasticityEnabled === true
                && p.config.weakPlasticityAblationEnabled === false,
        );
        // Only fullNaturalExperimental may have this combination.
        for (const preset of dangerous) {
            expect(preset.id).toBe('fullNaturalExperimental');
            expect(preset.config.safetyMode).toBe('experimental');
        }
    });
});

// ── semanticLeakCount guard ────────────────────────────────────────────────────

describe('semanticLeakCount in long-run variants', () => {
    it('all LongRunComparisonVariants have no semantic fields in their config', () => {
        for (const variant of LONG_RUN_COMPARISON_VARIANTS) {
            const keys = Object.keys(variant);
            expect(keys.some(k => k.toLowerCase().includes('semantic'))).toBe(false);
        }
    });
});
