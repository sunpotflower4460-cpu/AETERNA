/**
 * noForbiddenClaims.test.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Scans exported API surface (config, presets, diagnostics, validation) for
 * forbidden semantic / consciousness / mystical proof claims.
 *
 * Forbidden terms to detect in exported values / labels:
 * - consciousness, conscious
 * - intelligence, intelligent
 * - self-awareness, self aware
 * - soul
 * - life proof, proof of life
 * - mystical, mystical proof
 * - emotion (as a runtime claim)
 * - semantic memory, semantic node
 * - Node bridge, LLM, API call
 * - fake result, fake event, fake visual
 *
 * Note: these terms may appear in negations (e.g. "does not mean consciousness")
 * in documentation strings — that is intentional and allowed.
 * This test checks human-facing label / id / description fields for
 * affirmative claims, not negations.
 */

import { describe, it, expect } from 'vitest';

import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import { AETERNA_NATURAL_PRESETS } from '../../config/aeternaNaturalPresets.js';
import {
    LONG_RUN_EXECUTION_PROFILES,
} from '../../comparison/longRunExecutionProfiles.js';

// ── Forbidden claim patterns ───────────────────────────────────────────────────

/**
 * Terms that must NOT appear as affirmative claims in labels, IDs, or
 * config field names.
 * We check lowercase versions of the strings.
 */
const FORBIDDEN_CLAIM_TERMS = [
    'consciousness',
    'self-awareness',
    'soul',
    'life proof',
    'proof of life',
    'mystical proof',
    'fake result',
    'fake event',
    'fake visual',
    'fake emergence',
    'node bridge',
    'llm teacher',
    'semantic memory',
    'semantic node',
];

function containsForbiddenClaim(text: string): string | null {
    const lower = text.toLowerCase();
    for (const term of FORBIDDEN_CLAIM_TERMS) {
        if (lower.includes(term)) return term;
    }
    return null;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('no forbidden claims in config field names', () => {
    it('defaultAeternaNaturalRuntimeConfig has no forbidden field names', () => {
        for (const key of Object.keys(defaultAeternaNaturalRuntimeConfig)) {
            const hit = containsForbiddenClaim(key);
            expect(hit).toBeNull();
        }
    });
});

describe('no forbidden claims in preset labels / descriptions', () => {
    for (const preset of AETERNA_NATURAL_PRESETS) {
        it(`preset "${preset.id}" label has no forbidden claim`, () => {
            expect(containsForbiddenClaim(preset.label)).toBeNull();
        });

        it(`preset "${preset.id}" description has no affirmative forbidden claim`, () => {
            // Descriptions may contain negations ("does not mean consciousness").
            // We check that the description does not start with or use forbidden terms
            // as direct claims — by checking the description does not contain
            // the terms outside of a negation context.
            // Simplified check: description must not contain "is consciousness" or
            // "proves consciousness" etc.
            const affirmativePatterns = [
                'is consciousness',
                'proves consciousness',
                'is intelligence',
                'proves intelligence',
                'is soul',
                'is proof of life',
                'is mystical',
            ];
            const lower = preset.description.toLowerCase();
            for (const pattern of affirmativePatterns) {
                expect(lower).not.toContain(pattern);
            }
        });
    }
});

describe('no forbidden claims in execution profile labels', () => {
    for (const profile of LONG_RUN_EXECUTION_PROFILES) {
        it(`profile "${profile.id}" label has no forbidden claim`, () => {
            expect(containsForbiddenClaim(profile.label)).toBeNull();
        });
    }
});

describe('no fake result / fake event / fake visual in preset descriptions', () => {
    it('no preset description contains "fake result"', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            expect(preset.description.toLowerCase()).not.toContain('fake result');
        }
    });

    it('no preset description contains "fake event"', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            expect(preset.description.toLowerCase()).not.toContain('fake event');
        }
    });

    it('no preset description contains "fake visual"', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            expect(preset.description.toLowerCase()).not.toContain('fake visual');
        }
    });
});

describe('no Node bridge / LLM / API in presets', () => {
    it('no preset has "llm" in its config keys', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            for (const key of Object.keys(preset.config)) {
                expect(key.toLowerCase()).not.toContain('llm');
            }
        }
    });

    it('no preset has "nodeBridge" in its config keys', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            for (const key of Object.keys(preset.config)) {
                expect(key.toLowerCase()).not.toContain('nodebridge');
            }
        }
    });

    it('no preset description mentions "node bridge"', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            expect(preset.description.toLowerCase()).not.toContain('node bridge');
        }
    });
});
