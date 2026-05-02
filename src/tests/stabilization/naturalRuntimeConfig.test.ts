/**
 * naturalRuntimeConfig.test.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Verifies:
 * - defaultAeternaNaturalRuntimeConfig is safe
 * - All required fields are present
 * - weakPlasticity is default off
 * - complexRuntime is not the default
 * - externalConstantsMode is default neutral
 * - longRunComparisonEnabled is default false
 * - safetyMode is default safe
 * - All 7 presets exist
 * - fullNaturalExperimental is safetyMode=experimental
 * - legacyComparison has externalConstantsMode=legacy
 * - Neither fullNaturalExperimental nor legacyComparison is the default
 */

import { describe, it, expect } from 'vitest';

import {
    defaultAeternaNaturalRuntimeConfig,
} from '../../config/aeternaNaturalRuntimeConfig.js';

import {
    AETERNA_NATURAL_PRESETS,
    getAeternaNaturalPreset,
    getAllPresetIds,
} from '../../config/aeternaNaturalPresets.js';

// ── Default config safety ──────────────────────────────────────────────────────

describe('defaultAeternaNaturalRuntimeConfig', () => {
    it('has metricMode=flat', () => {
        expect(defaultAeternaNaturalRuntimeConfig.metricMode).toBe('flat');
    });

    it('has fieldRuntimeMode=scalar (not complexRuntime)', () => {
        expect(defaultAeternaNaturalRuntimeConfig.fieldRuntimeMode).toBe('scalar');
        expect(defaultAeternaNaturalRuntimeConfig.fieldRuntimeMode).not.toBe('complexRuntime');
    });

    it('has membraneMode=observerOnly', () => {
        expect(defaultAeternaNaturalRuntimeConfig.membraneMode).toBe('observerOnly');
    });

    it('has weakPlasticityMode=off', () => {
        expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityMode).toBe('off');
    });

    it('has weakPlasticityEnabled=false', () => {
        expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityEnabled).toBe(false);
    });

    it('has weakPlasticityAblationEnabled=true (safety gate even if enabled is flipped)', () => {
        expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityAblationEnabled).toBe(true);
    });

    it('has externalConstantsMode=neutral (not legacy)', () => {
        expect(defaultAeternaNaturalRuntimeConfig.externalConstantsMode).toBe('neutral');
        expect(defaultAeternaNaturalRuntimeConfig.externalConstantsMode).not.toBe('legacy');
    });

    it('has observedRatiosEnabled=true (observer-side is always safe)', () => {
        expect(defaultAeternaNaturalRuntimeConfig.observedRatiosEnabled).toBe(true);
    });

    it('has longRunComparisonEnabled=false', () => {
        expect(defaultAeternaNaturalRuntimeConfig.longRunComparisonEnabled).toBe(false);
    });

    it('has safetyMode=safe', () => {
        expect(defaultAeternaNaturalRuntimeConfig.safetyMode).toBe('safe');
    });

    it('does not contain any forbidden claim fields', () => {
        const keys = Object.keys(defaultAeternaNaturalRuntimeConfig);
        const forbidden = [
            'consciousness', 'intelligence', 'life', 'emotion', 'soul',
            'semantic', 'llm', 'api', 'nodeBridge',
        ];
        for (const key of keys) {
            for (const f of forbidden) {
                expect(key.toLowerCase()).not.toContain(f);
            }
        }
    });
});

// ── Presets ────────────────────────────────────────────────────────────────────

describe('AETERNA_NATURAL_PRESETS', () => {
    it('has exactly 7 presets', () => {
        expect(AETERNA_NATURAL_PRESETS).toHaveLength(7);
    });

    it('contains all required preset IDs', () => {
        const ids = getAllPresetIds();
        expect(ids).toContain('safeBaseline');
        expect(ids).toContain('geometryPreview');
        expect(ids).toContain('complexObserverPreview');
        expect(ids).toContain('naturalObserverSuite');
        expect(ids).toContain('plasticityObserveOnly');
        expect(ids).toContain('fullNaturalExperimental');
        expect(ids).toContain('legacyComparison');
    });

    it('safeBaseline has safetyMode=safe', () => {
        const preset = getAeternaNaturalPreset('safeBaseline');
        expect(preset).toBeDefined();
        expect(preset!.config.safetyMode).toBe('safe');
    });

    it('safeBaseline has no complexRuntime', () => {
        const preset = getAeternaNaturalPreset('safeBaseline');
        expect(preset!.config.fieldRuntimeMode).not.toBe('complexRuntime');
    });

    it('safeBaseline has no legacy constants', () => {
        const preset = getAeternaNaturalPreset('safeBaseline');
        expect(preset!.config.externalConstantsMode).toBe('neutral');
    });

    it('fullNaturalExperimental has safetyMode=experimental', () => {
        const preset = getAeternaNaturalPreset('fullNaturalExperimental');
        expect(preset).toBeDefined();
        expect(preset!.config.safetyMode).toBe('experimental');
    });

    it('fullNaturalExperimental has a uiWarning', () => {
        const preset = getAeternaNaturalPreset('fullNaturalExperimental');
        expect(preset!.uiWarning).toBeTruthy();
        expect(preset!.uiWarning).toContain('EXPERIMENTAL');
    });

    it('legacyComparison has externalConstantsMode=legacy', () => {
        const preset = getAeternaNaturalPreset('legacyComparison');
        expect(preset).toBeDefined();
        expect(preset!.config.externalConstantsMode).toBe('legacy');
    });

    it('legacyComparison has a uiWarning mentioning LEGACY COMPARISON', () => {
        const preset = getAeternaNaturalPreset('legacyComparison');
        expect(preset!.uiWarning).toContain('LEGACY COMPARISON');
    });

    it('no preset other than fullNaturalExperimental has safetyMode=experimental', () => {
        const experimental = AETERNA_NATURAL_PRESETS.filter(
            p => p.config.safetyMode === 'experimental',
        );
        expect(experimental).toHaveLength(1);
        expect(experimental[0].id).toBe('fullNaturalExperimental');
    });

    it('no preset other than legacyComparison has externalConstantsMode=legacy', () => {
        const legacy = AETERNA_NATURAL_PRESETS.filter(
            p => p.config.externalConstantsMode === 'legacy',
        );
        expect(legacy).toHaveLength(1);
        expect(legacy[0].id).toBe('legacyComparison');
    });

    it('complexRuntime is only in fullNaturalExperimental', () => {
        const complexRuntime = AETERNA_NATURAL_PRESETS.filter(
            p => p.config.fieldRuntimeMode === 'complexRuntime',
        );
        expect(complexRuntime).toHaveLength(1);
        expect(complexRuntime[0].id).toBe('fullNaturalExperimental');
    });

    it('resistanceOnly is only in fullNaturalExperimental', () => {
        const resistance = AETERNA_NATURAL_PRESETS.filter(
            p => p.config.weakPlasticityMode === 'resistanceOnly',
        );
        expect(resistance).toHaveLength(1);
        expect(resistance[0].id).toBe('fullNaturalExperimental');
    });

    it('every preset has required config fields', () => {
        for (const preset of AETERNA_NATURAL_PRESETS) {
            expect(preset.config.metricMode).toBeDefined();
            expect(preset.config.fieldRuntimeMode).toBeDefined();
            expect(preset.config.membraneMode).toBeDefined();
            expect(preset.config.weakPlasticityMode).toBeDefined();
            expect(typeof preset.config.weakPlasticityEnabled).toBe('boolean');
            expect(typeof preset.config.weakPlasticityAblationEnabled).toBe('boolean');
            expect(preset.config.externalConstantsMode).toBeDefined();
            expect(typeof preset.config.observedRatiosEnabled).toBe('boolean');
            expect(typeof preset.config.longRunComparisonEnabled).toBe('boolean');
            expect(preset.config.safetyMode).toBeDefined();
        }
    });
});
