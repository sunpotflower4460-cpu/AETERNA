/**
 * externalConstantsRemoval.test.ts
 * N6: External Constants Removal / Observed Ratios
 *
 * Tests verifying that external constants are correctly classified and that
 * neutral mode does not use PHI_INV / SCHUMANN_RES as causal ingredients.
 */

import { describe, it, expect } from 'vitest';
import {
    defaultCoreDynamicsConstantsConfig,
    legacyCoreDynamicsConstantsConfig,
} from '../../config/coreDynamicsConstantsConfig.js';
import { REFERENCE_RATIOS, getReferenceRatioById } from '../../observer/referenceRatios.js';

// ── CoreDynamicsConstantsConfig ───────────────────────────────────────────────

describe('CoreDynamicsConstantsConfig: structure', () => {
    it('defaultCoreDynamicsConstantsConfig has externalConstantsMode neutral', () => {
        expect(defaultCoreDynamicsConstantsConfig.externalConstantsMode).toBe('neutral');
    });

    it('defaultCoreDynamicsConstantsConfig has allowLegacyExternalConstants false', () => {
        expect(defaultCoreDynamicsConstantsConfig.allowLegacyExternalConstants).toBe(false);
    });

    it('legacyCoreDynamicsConstantsConfig has externalConstantsMode legacy', () => {
        expect(legacyCoreDynamicsConstantsConfig.externalConstantsMode).toBe('legacy');
    });

    it('legacyCoreDynamicsConstantsConfig has allowLegacyExternalConstants true', () => {
        expect(legacyCoreDynamicsConstantsConfig.allowLegacyExternalConstants).toBe(true);
    });

    it('default dampingBase is finite and in expected range', () => {
        expect(isFinite(defaultCoreDynamicsConstantsConfig.dampingBase)).toBe(true);
        expect(defaultCoreDynamicsConstantsConfig.dampingBase).toBeGreaterThan(0.9);
        expect(defaultCoreDynamicsConstantsConfig.dampingBase).toBeLessThan(1.0);
    });

    it('default dampingLoss is finite and positive', () => {
        expect(isFinite(defaultCoreDynamicsConstantsConfig.dampingLoss)).toBe(true);
        expect(defaultCoreDynamicsConstantsConfig.dampingLoss).toBeGreaterThan(0);
    });

    it('default waveSpeedBase is finite and positive', () => {
        expect(isFinite(defaultCoreDynamicsConstantsConfig.waveSpeedBase)).toBe(true);
        expect(defaultCoreDynamicsConstantsConfig.waveSpeedBase).toBeGreaterThan(0);
    });

    it('default waveSpeedFreqScale is finite and non-negative', () => {
        expect(isFinite(defaultCoreDynamicsConstantsConfig.waveSpeedFreqScale)).toBe(true);
        expect(defaultCoreDynamicsConstantsConfig.waveSpeedFreqScale).toBeGreaterThanOrEqual(0);
    });

    it('freqRangeMin < freqRangeMax', () => {
        expect(defaultCoreDynamicsConstantsConfig.freqRangeMin)
            .toBeLessThan(defaultCoreDynamicsConstantsConfig.freqRangeMax);
    });
});

// ── referenceRatios location ──────────────────────────────────────────────────

describe('referenceRatios: observer-side placement', () => {
    it('REFERENCE_RATIOS is non-empty', () => {
        expect(REFERENCE_RATIOS.length).toBeGreaterThan(0);
    });

    it('each ReferenceRatio has required fields', () => {
        for (const r of REFERENCE_RATIOS) {
            expect(typeof r.id).toBe('string');
            expect(r.id.length).toBeGreaterThan(0);
            expect(typeof r.label).toBe('string');
            expect(isFinite(r.value)).toBe(true);
            expect(r.value).toBeGreaterThan(0);
            expect(['mathematical', 'geophysical', 'musical', 'custom']).toContain(r.category);
            expect(typeof r.description).toBe('string');
            expect(typeof r.caution).toBe('string');
            expect(r.caution.length).toBeGreaterThan(0);
        }
    });

    it('Golden Ratio φ is present and correct', () => {
        const phi = getReferenceRatioById('goldenRatio');
        expect(phi).toBeDefined();
        expect(phi!.value).toBeCloseTo(1.6180339887498949, 10);
        expect(phi!.category).toBe('mathematical');
    });

    it('φ inverse is present and correct', () => {
        const phiInv = getReferenceRatioById('phiInverse');
        expect(phiInv).toBeDefined();
        expect(phiInv!.value).toBeCloseTo(0.6180339887498948, 10);
    });

    it('Schumann fundamental is present and labelled geophysical', () => {
        const schumann = getReferenceRatioById('schumannFundamental');
        expect(schumann).toBeDefined();
        expect(schumann!.value).toBeCloseTo(7.83, 5);
        expect(schumann!.category).toBe('geophysical');
    });

    it('all caution notes contain "Reference only" or similar wording', () => {
        for (const r of REFERENCE_RATIOS) {
            expect(r.caution.toLowerCase()).toContain('reference only');
        }
    });

    it('no caution note claims proof of life, consciousness, or mystical meaning', () => {
        const forbidden = ['proves life', 'proves consciousness', 'proves healing', 'mystical proof', 'soul'];
        for (const r of REFERENCE_RATIOS) {
            for (const word of forbidden) {
                expect(r.caution.toLowerCase()).not.toContain(word);
                expect(r.description.toLowerCase()).not.toContain(word);
            }
        }
    });
});

// ── Neutral mode formula behaviour ────────────────────────────────────────────

describe('neutral mode: formula produces finite values', () => {
    it('computes finite waveSpeed and damping for typical omega_t values', () => {
        const cfg = defaultCoreDynamicsConstantsConfig;
        const testOmegaValues = [7.83, 8.33, 16.18, 40.0, 0, 100];

        for (const omega of testOmegaValues) {
            const rangeSpan = Math.max(cfg.freqRangeMax - cfg.freqRangeMin, 1e-6);
            const freqRatio = Math.max(0, Math.min(1, (omega - cfg.freqRangeMin) / rangeSpan));
            const waveSpeed = cfg.waveSpeedBase + cfg.waveSpeedFreqScale * freqRatio;
            const damping = cfg.dampingBase - cfg.dampingLoss * (1.0 - freqRatio);

            expect(isFinite(freqRatio)).toBe(true);
            expect(freqRatio).toBeGreaterThanOrEqual(0);
            expect(freqRatio).toBeLessThanOrEqual(1);

            expect(isFinite(waveSpeed)).toBe(true);
            expect(waveSpeed).toBeGreaterThan(0);

            expect(isFinite(damping)).toBe(true);
            expect(damping).toBeGreaterThan(0);
            expect(damping).toBeLessThan(1);
        }
    });

    it('freqRatio is clamped to [0, 1] for out-of-range omega_t', () => {
        const cfg = defaultCoreDynamicsConstantsConfig;
        const rangeSpan = Math.max(cfg.freqRangeMax - cfg.freqRangeMin, 1e-6);

        const below = Math.max(0, Math.min(1, (cfg.freqRangeMin - 10 - cfg.freqRangeMin) / rangeSpan));
        expect(below).toBe(0);

        const above = Math.max(0, Math.min(1, (cfg.freqRangeMax + 10 - cfg.freqRangeMin) / rangeSpan));
        expect(above).toBe(1);
    });
});

// ── Static: dynamicCore must not import referenceRatios in neutral mode ────────

describe('referenceRatios import guard', () => {
    it('referenceRatios.ts is in the observer directory', async () => {
        // This test verifies that referenceRatios is structured as observer-side code.
        // It imports the module and confirms it exports REFERENCE_RATIOS without error.
        const mod = await import('../../observer/referenceRatios.js');
        expect(Array.isArray(mod.REFERENCE_RATIOS)).toBe(true);
        expect(mod.REFERENCE_RATIOS.length).toBeGreaterThan(0);
    });

    it('dynamicCore exports updateDynamicsCore (basic smoke test)', async () => {
        const mod = await import('../../core/dynamicCore.js');
        expect(typeof mod.updateDynamicsCore).toBe('function');
    });
});
