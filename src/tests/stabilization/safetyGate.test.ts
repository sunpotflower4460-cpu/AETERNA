/**
 * safetyGate.test.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Verifies that validateAeternaNaturalConfig correctly:
 * - Blocks complexRuntime in safe / research mode
 * - Blocks resistanceOnly in safe / research mode
 * - Blocks weakCoupling in safe / research mode
 * - Normalizes dangerous settings in safe mode
 * - Issues warnings for legacy constants
 * - Allows all modes in experimental mode with warnings
 * - Issues warning for resistanceOnly + ablation disabled in experimental mode
 */

import { describe, it, expect } from 'vitest';

import type { AeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import {
    defaultAeternaNaturalRuntimeConfig,
} from '../../config/aeternaNaturalRuntimeConfig.js';

import {
    validateAeternaNaturalConfig,
    normalizeAeternaNaturalConfig,
} from '../../runtime/validateAeternaNaturalConfig.js';

// ── Helper ─────────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<AeternaNaturalRuntimeConfig>): AeternaNaturalRuntimeConfig {
    return { ...defaultAeternaNaturalRuntimeConfig, ...overrides };
}

// ── Safe mode ──────────────────────────────────────────────────────────────────

describe('validateAeternaNaturalConfig / safe mode', () => {
    it('passes the default config', () => {
        const result = validateAeternaNaturalConfig(defaultAeternaNaturalRuntimeConfig);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('normalizes complexRuntime → complexObserver in safe mode', () => {
        const config = makeConfig({ safetyMode: 'safe', fieldRuntimeMode: 'complexRuntime' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.normalizedConfig.fieldRuntimeMode).toBe('complexObserver');
    });

    it('normalizes resistanceOnly → observeOnly in safe mode', () => {
        const config = makeConfig({ safetyMode: 'safe', weakPlasticityMode: 'resistanceOnly' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(false);
        expect(result.normalizedConfig.weakPlasticityMode).toBe('observeOnly');
    });

    it('normalizes weakCoupling → observerOnly in safe mode', () => {
        const config = makeConfig({ safetyMode: 'safe', membraneMode: 'weakCoupling' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(false);
        expect(result.normalizedConfig.membraneMode).toBe('observerOnly');
    });

    it('emits warning for legacy constants in safe mode but does not change it', () => {
        const config = makeConfig({ safetyMode: 'safe', externalConstantsMode: 'legacy' });
        const result = validateAeternaNaturalConfig(config);
        // Warning is emitted but externalConstantsMode is not forcibly changed
        expect(result.warnings.some(w => w.includes('legacy'))).toBe(true);
    });
});

// ── Research mode ──────────────────────────────────────────────────────────────

describe('validateAeternaNaturalConfig / research mode', () => {
    it('blocks complexRuntime with an error', () => {
        const config = makeConfig({ safetyMode: 'research', fieldRuntimeMode: 'complexRuntime' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('complexRuntime'))).toBe(true);
        expect(result.normalizedConfig.fieldRuntimeMode).toBe('complexObserver');
    });

    it('blocks resistanceOnly with an error', () => {
        const config = makeConfig({ safetyMode: 'research', weakPlasticityMode: 'resistanceOnly' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(false);
        expect(result.normalizedConfig.weakPlasticityMode).toBe('observeOnly');
    });

    it('blocks weakCoupling membrane with an error', () => {
        const config = makeConfig({ safetyMode: 'research', membraneMode: 'weakCoupling' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(false);
        expect(result.normalizedConfig.membraneMode).toBe('observerOnly');
    });

    it('allows curved metric and complexObserver in research mode', () => {
        const config = makeConfig({
            safetyMode: 'research',
            metricMode: 'curved',
            fieldRuntimeMode: 'complexObserver',
        });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(true);
        expect(result.normalizedConfig.metricMode).toBe('curved');
        expect(result.normalizedConfig.fieldRuntimeMode).toBe('complexObserver');
    });
});

// ── Experimental mode ──────────────────────────────────────────────────────────

describe('validateAeternaNaturalConfig / experimental mode', () => {
    it('allows complexRuntime in experimental mode with a warning', () => {
        const config = makeConfig({ safetyMode: 'experimental', fieldRuntimeMode: 'complexRuntime' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(true);
        expect(result.normalizedConfig.fieldRuntimeMode).toBe('complexRuntime');
        expect(result.warnings.some(w => w.includes('complexRuntime'))).toBe(true);
    });

    it('allows resistanceOnly in experimental mode with a warning', () => {
        const config = makeConfig({
            safetyMode: 'experimental',
            weakPlasticityMode: 'resistanceOnly',
            weakPlasticityEnabled: true,
            weakPlasticityAblationEnabled: true,
        });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(true);
        expect(result.normalizedConfig.weakPlasticityMode).toBe('resistanceOnly');
        expect(result.warnings.some(w => w.includes('resistanceOnly'))).toBe(true);
    });

    it('allows weakCoupling membrane in experimental mode with a warning', () => {
        const config = makeConfig({ safetyMode: 'experimental', membraneMode: 'weakCoupling' });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(true);
        expect(result.normalizedConfig.membraneMode).toBe('weakCoupling');
    });

    it('emits a warning for resistanceOnly + ablation disabled in experimental mode', () => {
        const config = makeConfig({
            safetyMode: 'experimental',
            weakPlasticityMode: 'resistanceOnly',
            weakPlasticityEnabled: true,
            weakPlasticityAblationEnabled: false,
        });
        const result = validateAeternaNaturalConfig(config);
        expect(result.valid).toBe(true);
        expect(
            result.warnings.some(w => w.includes('ablation disabled')),
        ).toBe(true);
    });

    it('normalizes resistanceOnly + ablation disabled in research mode (not experimental)', () => {
        const config = makeConfig({
            safetyMode: 'research',
            weakPlasticityMode: 'resistanceOnly',
            weakPlasticityEnabled: true,
            weakPlasticityAblationEnabled: false,
        });
        const result = validateAeternaNaturalConfig(config);
        // resistanceOnly is blocked in research; normalized to observeOnly
        expect(result.normalizedConfig.weakPlasticityMode).toBe('observeOnly');
    });
});

// ── normalizeAeternaNaturalConfig ──────────────────────────────────────────────

describe('normalizeAeternaNaturalConfig', () => {
    it('returns a safe config from a dangerous safe-mode config', () => {
        const dangerous = makeConfig({
            safetyMode: 'safe',
            fieldRuntimeMode: 'complexRuntime',
            membraneMode: 'weakCoupling',
            weakPlasticityMode: 'resistanceOnly',
        });
        const normalized = normalizeAeternaNaturalConfig(dangerous);
        expect(normalized.fieldRuntimeMode).toBe('complexObserver');
        expect(normalized.membraneMode).toBe('observerOnly');
        expect(normalized.weakPlasticityMode).toBe('observeOnly');
    });

    it('does not mutate the input config', () => {
        const input = makeConfig({ safetyMode: 'safe', fieldRuntimeMode: 'complexRuntime' });
        const inputMode = input.fieldRuntimeMode;
        normalizeAeternaNaturalConfig(input);
        expect(input.fieldRuntimeMode).toBe(inputMode);
    });
});
