/**
 * weakPlasticityLayer.test.ts
 * N5: Weak Plasticity Channel — UI layer / source integrity tests
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
    FIELD_LAYER_REGISTRY,
    getFieldLayerDefinition,
} from '../../ui/render/fieldLayerRegistry.js';
import { FIELD_LAYER_OVERLAY_RULES } from '../../ui/render/fieldLayerOverlayRules.js';

const ROOT = resolve(__dirname, '../..');

const registrySrc    = readFileSync(resolve(ROOT, 'ui/render/fieldLayerRegistry.ts'), 'utf-8');
const overlaySrc     = readFileSync(resolve(ROOT, 'ui/render/fieldLayerOverlayRules.ts'), 'utf-8');
const timelineSrc    = readFileSync(resolve(ROOT, 'ui/timeline/deriveAeternaEvents.ts'), 'utf-8');
const summarySrc     = readFileSync(resolve(ROOT, 'ui/summary/deriveNowSummary.ts'), 'utf-8');
const guideSrc       = readFileSync(resolve(ROOT, 'ui/guide/deriveGuideExplanation.ts'), 'utf-8');
const plasticityCoreSrc = readFileSync(resolve(ROOT, 'plasticity/weakPlasticity.ts'), 'utf-8');
const configSrc      = readFileSync(resolve(ROOT, 'config/weakPlasticityConfig.ts'), 'utf-8');
const observerSrc    = readFileSync(resolve(ROOT, 'observer/deriveWeakPlasticityObservation.ts'), 'utf-8');

// ── Registry tests ─────────────────────────────────────────────────────────────

describe('weakPlasticityTrace field layer registration', () => {
    it('is registered in FIELD_LAYER_REGISTRY', () => {
        expect(FIELD_LAYER_REGISTRY.weakPlasticityTrace).toBeDefined();
    });

    it('has correct label', () => {
        expect(getFieldLayerDefinition('weakPlasticityTrace')?.label).toBe('Weak Plasticity Trace');
    });

    it('has valueKind=proxy', () => {
        expect(getFieldLayerDefinition('weakPlasticityTrace')?.valueKind).toBe('proxy');
    });

    it('is NOT visible by default', () => {
        expect(getFieldLayerDefinition('weakPlasticityTrace')?.defaultVisible).toBe(false);
    });

    it('is allowed only in overlay and diagnostic modes', () => {
        const def = getFieldLayerDefinition('weakPlasticityTrace');
        expect(def?.allowedModes).toContain('overlay');
        expect(def?.allowedModes).toContain('diagnostic');
        expect(def?.allowedModes).not.toContain('raw');
        expect(def?.allowedModes).not.toContain('smooth');
    });

    it('has a disclaimer that references NOT semantic memory', () => {
        const def = getFieldLayerDefinition('weakPlasticityTrace');
        expect(def?.disclaimer).toContain('NOT');
        expect(def?.disclaimer).toMatch(/semantic memory|learning indicator|NOT/i);
    });

    it('has the correct overlay rule', () => {
        expect(FIELD_LAYER_OVERLAY_RULES.weakPlasticityTrace).toBeDefined();
        expect(FIELD_LAYER_OVERLAY_RULES.weakPlasticityTrace.maxOpacity).toBeLessThanOrEqual(0.35);
        expect(FIELD_LAYER_OVERLAY_RULES.weakPlasticityTrace.defaultBlendMode).toBe('multiply');
    });
});

// ── Language integrity checks ──────────────────────────────────────────────────

describe('weakPlasticityTrace: no semantic / consciousness / emotion claims', () => {
    const allSources = [registrySrc, overlaySrc, timelineSrc, summarySrc, guideSrc,
                        plasticityCoreSrc, configSrc, observerSrc];

    it('does not claim AETERNA learned', () => {
        for (const src of allSources) {
            expect(src).not.toMatch(/AETERNA learned/i);
        }
    });

    it('does not claim AETERNA remembered', () => {
        for (const src of allSources) {
            expect(src).not.toMatch(/AETERNA remembered/i);
        }
    });

    it('does not claim AETERNA formed memory', () => {
        for (const src of allSources) {
            expect(src).not.toMatch(/AETERNA formed memory/i);
        }
    });

    it('does not claim AETERNA adapted intentionally', () => {
        for (const src of allSources) {
            expect(src).not.toMatch(/AETERNA adapted intentionally/i);
        }
    });

    it('does not create semantic nodes', () => {
        for (const src of [plasticityCoreSrc, observerSrc]) {
            expect(src).not.toMatch(/semanticNode|semantic_node|SemanticNode/);
        }
    });

    it('does not create runtime graph edges', () => {
        for (const src of [plasticityCoreSrc, observerSrc]) {
            expect(src).not.toMatch(/createEdge|addEdge|runtimeEdge|graphEdge/);
        }
    });

    it('does not reference Node-AI-Z or Node Mother', () => {
        for (const src of [plasticityCoreSrc, observerSrc]) {
            expect(src).not.toMatch(/Node-AI-Z|NodeAIZ|Node Mother|NodeMother/);
        }
    });

    it('does not claim consciousness or emotion', () => {
        // We check for positive claims, not for the words appearing in "NOT a ..." disclaimers
        for (const src of [registrySrc, plasticityCoreSrc, observerSrc]) {
            expect(src).not.toMatch(/is (conscious|self-aware|emotional)/i);
            expect(src).not.toMatch(/AETERNA (felt|feels|wanted|desires|is aware)/i);
            // Positive emotion/consciousness claims (not disclaimer-style "NOT" text)
            expect(src).not.toMatch(/shows? (emotion|consciousness|awareness)/i);
        }
    });
});

// ── Config safety checks ────────────────────────────────────────────────────────

describe('weakPlasticityConfig: safety defaults', () => {
    it('default config is disabled', () => {
        expect(configSrc).toContain('enabled: false');
    });

    it('default config has ablation enabled', () => {
        expect(configSrc).toContain('ablationEnabled: true');
    });

    it('default config is observeOnly', () => {
        expect(configSrc).toContain("mode: 'observeOnly'");
    });

    it('learningRate is 10^-4 or below', () => {
        expect(configSrc).toContain('learningRate: 0.0001');
    });

    it('maxDeltaPerTick is 10^-4 or below', () => {
        expect(configSrc).toContain('maxDeltaPerTick: 0.0001');
    });
});

// ── Core plasticity logic checks ─────────────────────────────────────────────

describe('weakPlasticity.ts: structural checks', () => {
    it('exports createWeakPlasticityState', () => {
        expect(plasticityCoreSrc).toContain('export function createWeakPlasticityState');
    });

    it('exports updateWeakPlasticityState', () => {
        expect(plasticityCoreSrc).toContain('export function updateWeakPlasticityState');
    });

    it('exports getResistanceScale', () => {
        expect(plasticityCoreSrc).toContain('export function getResistanceScale');
    });

    it('includes decay logic', () => {
        expect(plasticityCoreSrc).toContain('decayFactor');
        expect(plasticityCoreSrc).toContain('accumulationDecayRate');
    });

    it('includes NaN guard', () => {
        expect(plasticityCoreSrc).toContain('isFinite');
        expect(plasticityCoreSrc).toContain('nanCount');
    });

    it('includes clamp function', () => {
        expect(plasticityCoreSrc).toContain('function clamp');
    });

    it('includes ablation gate in getResistanceScale', () => {
        expect(plasticityCoreSrc).toContain('ablationEnabled');
        expect(plasticityCoreSrc).toContain('resistanceOnly');
    });

    it('does not create proto-network runtime connections', () => {
        expect(plasticityCoreSrc).not.toMatch(/protoNetwork.*runtime|runtime.*protoNetwork/);
    });
});

// ── Timeline / Summary / Guide integration ─────────────────────────────────────

describe('weakPlasticityTrace: timeline / summary / guide integration', () => {
    it('deriveAeternaEvents imports WeakPlasticityObservationState', () => {
        expect(timelineSrc).toContain('WeakPlasticityObservationState');
    });

    it('deriveNowSummary imports WeakPlasticityObservationState', () => {
        expect(summarySrc).toContain('WeakPlasticityObservationState');
    });

    it('timeline does not claim AETERNA learned or remembered', () => {
        expect(timelineSrc).not.toMatch(/AETERNA learned|AETERNA remembered/i);
    });

    it('summary does not claim "learned" or "remembered"', () => {
        expect(summarySrc).not.toMatch(/plasticity.*learn|plasticity.*remem/i);
    });

    it('summary uses neutral resistance/trace terminology', () => {
        // Should mention "plasticity" and "trace" or "resistance"
        expect(summarySrc).toMatch(/plasticity.*trace|weak plasticity|resistance.*history/i);
    });

    it('guide includes plasticity-layer toggle suggestion', () => {
        expect(guideSrc).toContain('weakPlasticityTrace');
    });
});
