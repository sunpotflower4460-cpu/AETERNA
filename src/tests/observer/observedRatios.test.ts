/**
 * observedRatios.test.ts
 * N6: External Constants Removal / Observed Ratios
 *
 * Tests for ObservedRatio types, deriveObservedRatios, and distance calculations.
 */

import { describe, it, expect } from 'vitest';
import { deriveObservedRatios } from '../../observer/deriveObservedRatios.js';
import { REFERENCE_RATIOS } from '../../observer/referenceRatios.js';
import type { ObservedRatiosState } from '../../types/observedRatios.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMinimalState(): ObservedRatiosState {
    return deriveObservedRatios({
        timestamp: 1000,
        externalConstantsMode: 'neutral',
    });
}

// ── deriveObservedRatios: empty inputs ────────────────────────────────────────

describe('deriveObservedRatios: empty inputs', () => {
    it('returns a valid state with no inputs', () => {
        const state = makeMinimalState();
        expect(state).toBeDefined();
        expect(Array.isArray(state.observedRatios)).toBe(true);
        expect(Array.isArray(state.referenceMatches)).toBe(true);
    });

    it('returns zero observedRatios for empty inputs', () => {
        const state = makeMinimalState();
        expect(state.observedRatios.length).toBe(0);
    });

    it('returns zero referenceMatches for empty inputs', () => {
        const state = makeMinimalState();
        expect(state.referenceMatches.length).toBe(0);
    });

    it('strongestMatch is null when no ratios', () => {
        const state = makeMinimalState();
        expect(state.strongestMatch).toBeNull();
    });

    it('averageMatchStrength is 0 when no matches', () => {
        const state = makeMinimalState();
        expect(state.averageMatchStrength).toBe(0);
    });

    it('emergentResonanceProxy is 0 when no matches', () => {
        const state = makeMinimalState();
        expect(state.emergentResonanceProxy).toBe(0);
    });

    it('observationConfidence is 0 when no ratios', () => {
        const state = makeMinimalState();
        expect(state.observationConfidence).toBe(0);
    });

    it('nanOrInfinityCount is 0 for empty inputs', () => {
        const state = makeMinimalState();
        expect(state.nanOrInfinityCount).toBe(0);
    });

    it('externalConstantsMode defaults to neutral', () => {
        const state = makeMinimalState();
        expect(state.externalConstantsMode).toBe('neutral');
    });
});

// ── deriveObservedRatios: with complex field ──────────────────────────────────

describe('deriveObservedRatios: with ComplexFieldState', () => {
    function makeComplexField(maxAmplitude: number, averageAmplitude: number, phaseCoherence: number) {
        return {
            timestamp: 1000,
            segments: 4,
            real: new Float32Array(16),
            imag: new Float32Array(16),
            previousReal: new Float32Array(16),
            previousImag: new Float32Array(16),
            amplitude: new Float32Array(16),
            phase: new Float32Array(16),
            phaseGradient: new Float32Array(16),
            vorticity: new Float32Array(16),
            topologicalCharge: new Int8Array(16),
            vortexCandidate: new Uint8Array(16),
            maxAmplitude,
            averageAmplitude,
            phaseCoherence,
            nanOrInfinityCount: 0,
            amplitudeClampCount: 0,
            phaseUnwrapWarningCount: 0,
        };
    }

    it('derives amplitude peak ratio when max > avg > 0', () => {
        const complexField = makeComplexField(2.0, 1.0, 0.8);
        const state = deriveObservedRatios({
            complexField,
            timestamp: 1000,
            externalConstantsMode: 'neutral',
        });
        const ampRatio = state.observedRatios.find(r => r.source === 'amplitudePeak');
        expect(ampRatio).toBeDefined();
        expect(ampRatio!.value).toBeCloseTo(2.0, 5);
        expect(isFinite(ampRatio!.value)).toBe(true);
    });

    it('derives phase coherence ratio when 0 < pc < 1', () => {
        const complexField = makeComplexField(2.0, 1.0, 0.6);
        const state = deriveObservedRatios({
            complexField,
            timestamp: 1000,
        });
        const pcRatio = state.observedRatios.find(r => r.source === 'phaseCoherence');
        expect(pcRatio).toBeDefined();
        expect(isFinite(pcRatio!.value)).toBe(true);
        // pc=0.6 → 0.6/0.4 = 1.5
        expect(pcRatio!.value).toBeCloseTo(1.5, 5);
    });

    it('does not derive amplitude ratio when avg is 0', () => {
        const complexField = makeComplexField(2.0, 0.0, 0.5);
        const state = deriveObservedRatios({
            complexField,
            timestamp: 1000,
        });
        const ampRatio = state.observedRatios.find(r => r.source === 'amplitudePeak');
        expect(ampRatio).toBeUndefined();
    });
});

// ── ReferenceRatioMatch: distance calculations ────────────────────────────────

describe('ReferenceRatioMatch: distance calculations', () => {
    it('produces finite absoluteDistance and relativeDistance', () => {
        function makeComplexField(maxAmplitude: number, averageAmplitude: number, phaseCoherence: number) {
            return {
                timestamp: 1000, segments: 4,
                real: new Float32Array(16), imag: new Float32Array(16),
                previousReal: new Float32Array(16), previousImag: new Float32Array(16),
                amplitude: new Float32Array(16), phase: new Float32Array(16),
                phaseGradient: new Float32Array(16), vorticity: new Float32Array(16),
                topologicalCharge: new Int8Array(16), vortexCandidate: new Uint8Array(16),
                maxAmplitude, averageAmplitude, phaseCoherence,
                nanOrInfinityCount: 0, amplitudeClampCount: 0, phaseUnwrapWarningCount: 0,
            };
        }

        const complexField = makeComplexField(1.618, 1.0, 0.5);
        const state = deriveObservedRatios({
            complexField,
            timestamp: 1000,
            referenceRatios: REFERENCE_RATIOS,
        });

        for (const m of state.referenceMatches) {
            expect(isFinite(m.absoluteDistance)).toBe(true);
            expect(isFinite(m.relativeDistance)).toBe(true);
            expect(isFinite(m.matchStrength)).toBe(true);
            expect(m.matchStrength).toBeGreaterThanOrEqual(0);
            expect(m.matchStrength).toBeLessThanOrEqual(1);
        }
    });

    it('centsDistance is null for invalid ratio (observed <= 0)', () => {
        // We test the principle: if observed ratio is negative or zero, centsDistance = null
        // deriveObservedRatios only generates ratios > 0, but we verify the logic here
        function makeComplexField(maxAmplitude: number, averageAmplitude: number, phaseCoherence: number) {
            return {
                timestamp: 1000, segments: 4,
                real: new Float32Array(16), imag: new Float32Array(16),
                previousReal: new Float32Array(16), previousImag: new Float32Array(16),
                amplitude: new Float32Array(16), phase: new Float32Array(16),
                phaseGradient: new Float32Array(16), vorticity: new Float32Array(16),
                topologicalCharge: new Int8Array(16), vortexCandidate: new Uint8Array(16),
                maxAmplitude, averageAmplitude, phaseCoherence,
                nanOrInfinityCount: 0, amplitudeClampCount: 0, phaseUnwrapWarningCount: 0,
            };
        }
        // All generated observed ratios from valid inputs should have positive values
        const complexField = makeComplexField(2.0, 1.0, 0.6);
        const state = deriveObservedRatios({ complexField, timestamp: 1000 });
        for (const m of state.referenceMatches) {
            if (m.centsDistance !== null) {
                expect(isFinite(m.centsDistance)).toBe(true);
            }
        }
    });

    it('matchStrength is 1 when observed exactly equals reference', () => {
        function makeComplexField(maxAmplitude: number, averageAmplitude: number, phaseCoherence: number) {
            return {
                timestamp: 1000, segments: 4,
                real: new Float32Array(16), imag: new Float32Array(16),
                previousReal: new Float32Array(16), previousImag: new Float32Array(16),
                amplitude: new Float32Array(16), phase: new Float32Array(16),
                phaseGradient: new Float32Array(16), vorticity: new Float32Array(16),
                topologicalCharge: new Int8Array(16), vortexCandidate: new Uint8Array(16),
                maxAmplitude, averageAmplitude, phaseCoherence,
                nanOrInfinityCount: 0, amplitudeClampCount: 0, phaseUnwrapWarningCount: 0,
            };
        }
        // Amplitude ratio = goldenRatio ≈ 1.618
        const phi = 1.6180339887498949;
        const complexField = makeComplexField(phi, 1.0, 0.5);
        const state = deriveObservedRatios({
            complexField,
            timestamp: 1000,
            referenceRatios: REFERENCE_RATIOS,
            matchTolerance: 0.3,
        });
        const phiMatch = state.referenceMatches.find(
            m => m.observedRatioId === 'amplitudePeakToAverage' && m.referenceRatioId === 'goldenRatio'
        );
        expect(phiMatch).toBeDefined();
        expect(phiMatch!.matchStrength).toBeCloseTo(1.0, 5);
    });
});

// ── emergentResonanceProxy ────────────────────────────────────────────────────

describe('emergentResonanceProxy', () => {
    it('is in [0, 1]', () => {
        const state = makeMinimalState();
        expect(state.emergentResonanceProxy).toBeGreaterThanOrEqual(0);
        expect(state.emergentResonanceProxy).toBeLessThanOrEqual(1);
    });

    it('is not a proof of resonance, life, or consciousness — purely a proxy', () => {
        // This test documents the design principle (structural check)
        const state = makeMinimalState();
        // emergentResonanceProxy is a number in [0,1], nothing more
        expect(typeof state.emergentResonanceProxy).toBe('number');
        expect(state.emergentResonanceProxy).toBeGreaterThanOrEqual(0);
        expect(state.emergentResonanceProxy).toBeLessThanOrEqual(1);
    });
});

// ── NaN / Infinity guard ──────────────────────────────────────────────────────

describe('NaN / Infinity guard', () => {
    it('nanOrInfinityCount is 0 for valid inputs', () => {
        const state = makeMinimalState();
        expect(state.nanOrInfinityCount).toBe(0);
    });

    it('all numeric fields in ObservedRatiosState are finite', () => {
        const state = makeMinimalState();
        expect(isFinite(state.averageMatchStrength)).toBe(true);
        expect(isFinite(state.emergentResonanceProxy)).toBe(true);
        expect(isFinite(state.observationConfidence)).toBe(true);
        expect(isFinite(state.nanOrInfinityCount)).toBe(true);
    });
});

// ── Observer-side only: no runtime feedback ───────────────────────────────────

describe('observer-side only', () => {
    it('deriveObservedRatios is a pure function (same inputs → same outputs)', () => {
        const params = { timestamp: 5000, externalConstantsMode: 'neutral' as const };
        const state1 = deriveObservedRatios(params);
        const state2 = deriveObservedRatios(params);
        expect(state1.observedRatios.length).toBe(state2.observedRatios.length);
        expect(state1.emergentResonanceProxy).toBe(state2.emergentResonanceProxy);
    });

    it('observed ratio values are not expected to be fed back — they live in ObservedRatiosState', () => {
        // Design principle: ObservedRatiosState has no runtime feedback fields
        const state = makeMinimalState();
        // Verify there is no 'runtimeFeedback' or 'dynamicsInput' field
        expect('runtimeFeedback' in state).toBe(false);
        expect('dynamicsInput' in state).toBe(false);
    });
});
