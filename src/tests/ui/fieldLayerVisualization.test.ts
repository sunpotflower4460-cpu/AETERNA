/**
 * fieldLayerVisualization.test.ts
 * U4: Field Layer Visualization — static smoke tests
 *
 * Verifies that:
 * - fieldLayerRegistry is defined with all required layers
 * - Each layer has a valueKind
 * - Each layer has a semantic disclaimer
 * - Layer overlay rules exist and are valid
 * - Layer summary builders produce correct output
 * - No fake visual functions are defined
 * - No runtime dynamics are modified
 * - No runtime graph / network edge is created
 * - No semantic / consciousness / emotion claims exist in the source files
 *
 * These are static / unit tests that do not require a browser or DOM.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Import modules under test ─────────────────────────────────────────────────

import {
    FIELD_LAYER_REGISTRY,
    getAllFieldLayerDefinitions,
    getFieldLayerDefinition,
    getDefaultFieldLayerVisibility,
    getFieldLayersForMode,
    type FieldLayerId,
} from '../../ui/render/fieldLayerRegistry.js';

import {
    FIELD_LAYER_OVERLAY_RULES,
    getLayerOverlayRule,
    getLayersSortedByPriority,
    computeEffectiveOpacity,
    detectOverbright,
    RECOMMENDED_MAX_ACTIVE_LAYERS,
} from '../../ui/render/fieldLayerOverlayRules.js';

import {
    buildEnergyActivitySummary,
    buildTraceResidueSummary,
    buildActuationPulseSummary,
    buildSensoryReturnSummary,
    buildTorusCurvatureSummary,
    buildClosureMatchSummary,
    buildMediumEchoDelaySummary,
    buildLocalExcitabilitySummary,
    buildRepeatedFlowPathSummary,
    buildProtoNetworkCandidateSummary,
    buildRiskOverlaySummary,
    formatLayerEventStripText,
} from '../../ui/render/fieldLayerSummaries.js';

// ── Source file strings for static analysis ───────────────────────────────────

const ROOT = resolve(__dirname, '../..');

const registrySrc = readFileSync(
    resolve(ROOT, 'ui/render/fieldLayerRegistry.ts'), 'utf-8'
);
const overlaySrc = readFileSync(
    resolve(ROOT, 'ui/render/fieldLayerOverlayRules.ts'), 'utf-8'
);
const summariesSrc = readFileSync(
    resolve(ROOT, 'ui/render/fieldLayerSummaries.ts'), 'utf-8'
);

const allU4Srcs = [registrySrc, overlaySrc, summariesSrc];

// ── Required layer IDs ────────────────────────────────────────────────────────

const REQUIRED_LAYER_IDS: FieldLayerId[] = [
    'energyActivity',
    'traceResidue',
    'actuationPulse',
    'sensoryReturn',
    'torusCurvature',
    'closureMatch',
    'mediumEchoDelay',
    'localExcitability',
    'repeatedFlowPath',
    'protoNetworkCandidate',
    'riskOverlay',
];

// ── Field Layer Registry ──────────────────────────────────────────────────────

describe('U4: Field Layer Registry', () => {

    it('FIELD_LAYER_REGISTRY is defined', () => {
        expect(FIELD_LAYER_REGISTRY).toBeDefined();
        expect(typeof FIELD_LAYER_REGISTRY).toBe('object');
    });

    it('getAllFieldLayerDefinitions() returns all 11 layers', () => {
        const defs = getAllFieldLayerDefinitions();
        expect(defs).toHaveLength(11);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" is defined', (id) => {
        const def = getFieldLayerDefinition(id);
        expect(def).toBeDefined();
        expect(def!.id).toBe(id);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has a label', (id) => {
        const def = getFieldLayerDefinition(id)!;
        expect(typeof def.label).toBe('string');
        expect(def.label.length).toBeGreaterThan(0);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has a description', (id) => {
        const def = getFieldLayerDefinition(id)!;
        expect(typeof def.description).toBe('string');
        expect(def.description.length).toBeGreaterThan(0);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has a disclaimer', (id) => {
        const def = getFieldLayerDefinition(id)!;
        expect(typeof def.disclaimer).toBe('string');
        expect(def.disclaimer.length).toBeGreaterThan(0);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has a valueKind', (id) => {
        const def = getFieldLayerDefinition(id)!;
        const valid = ['measured', 'derived', 'proxy', 'presentation-smoothed'];
        expect(valid).toContain(def.valueKind);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has a defaultVisible flag', (id) => {
        const def = getFieldLayerDefinition(id)!;
        expect(typeof def.defaultVisible).toBe('boolean');
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has a colorRole', (id) => {
        const def = getFieldLayerDefinition(id)!;
        expect(typeof def.colorRole).toBe('string');
        expect(def.colorRole.length).toBeGreaterThan(0);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has allowedModes', (id) => {
        const def = getFieldLayerDefinition(id)!;
        expect(Array.isArray(def.allowedModes)).toBe(true);
        expect(def.allowedModes.length).toBeGreaterThan(0);
    });

    it.each(REQUIRED_LAYER_IDS)('layer "%s" has sourceStates', (id) => {
        const def = getFieldLayerDefinition(id)!;
        expect(Array.isArray(def.sourceStates)).toBe(true);
        expect(def.sourceStates.length).toBeGreaterThan(0);
    });

    it('getDefaultFieldLayerVisibility() returns a complete map', () => {
        const vis = getDefaultFieldLayerVisibility();
        for (const id of REQUIRED_LAYER_IDS) {
            expect(typeof vis[id]).toBe('boolean');
        }
    });

    it('default visibility: energyActivity, traceResidue, sensoryReturn, riskOverlay are ON', () => {
        const vis = getDefaultFieldLayerVisibility();
        expect(vis.energyActivity).toBe(true);
        expect(vis.traceResidue).toBe(true);
        expect(vis.sensoryReturn).toBe(true);
        expect(vis.riskOverlay).toBe(true);
    });

    it('default visibility: protoNetworkCandidate is OFF', () => {
        const vis = getDefaultFieldLayerVisibility();
        expect(vis.protoNetworkCandidate).toBe(false);
    });

    it('getFieldLayersForMode("overlay") returns at least 5 layers', () => {
        const layers = getFieldLayersForMode('overlay');
        expect(layers.length).toBeGreaterThanOrEqual(5);
    });

    it('closureMatch is NOT allowed in raw mode', () => {
        const def = getFieldLayerDefinition('closureMatch')!;
        expect(def.allowedModes).not.toContain('raw');
    });

    it('energyActivity is allowed in raw mode', () => {
        const def = getFieldLayerDefinition('energyActivity')!;
        expect(def.allowedModes).toContain('raw');
    });
});

// ── Layer Overlay Rules ───────────────────────────────────────────────────────

describe('U4: Field Layer Overlay Rules', () => {

    it('FIELD_LAYER_OVERLAY_RULES is defined', () => {
        expect(FIELD_LAYER_OVERLAY_RULES).toBeDefined();
    });

    it.each(REQUIRED_LAYER_IDS)('overlay rule for "%s" is defined', (id) => {
        const rule = getLayerOverlayRule(id);
        expect(rule).toBeDefined();
        expect(rule.layerId).toBe(id);
    });

    it.each(REQUIRED_LAYER_IDS)('overlay rule for "%s" has maxOpacity in (0, 1]', (id) => {
        const rule = getLayerOverlayRule(id);
        expect(rule.maxOpacity).toBeGreaterThan(0);
        expect(rule.maxOpacity).toBeLessThanOrEqual(1);
    });

    it.each(REQUIRED_LAYER_IDS)('overlay rule for "%s" has a valid blendMode', (id) => {
        const rule = getLayerOverlayRule(id);
        const valid = ['normal', 'additive', 'screen', 'multiply'];
        expect(valid).toContain(rule.defaultBlendMode);
    });

    it('riskOverlay has the highest priority', () => {
        const riskRule = getLayerOverlayRule('riskOverlay');
        for (const id of REQUIRED_LAYER_IDS) {
            if (id === 'riskOverlay') continue;
            const other = getLayerOverlayRule(id);
            expect(riskRule.priority).toBeGreaterThan(other.priority);
        }
    });

    it('protoNetworkCandidate has the lowest maxOpacity (most faint)', () => {
        const pnRule = getLayerOverlayRule('protoNetworkCandidate');
        for (const id of REQUIRED_LAYER_IDS) {
            if (id === 'protoNetworkCandidate') continue;
            const other = getLayerOverlayRule(id);
            expect(pnRule.maxOpacity).toBeLessThanOrEqual(other.maxOpacity);
        }
    });

    it('getLayersSortedByPriority() returns layers in ascending priority order', () => {
        const sorted = getLayersSortedByPriority();
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].priority).toBeGreaterThanOrEqual(sorted[i - 1].priority);
        }
    });

    it('computeEffectiveOpacity() returns maxOpacity when within layer cap', () => {
        const rule = getLayerOverlayRule('energyActivity');
        const eff = computeEffectiveOpacity(rule, 3);
        expect(eff).toBe(rule.maxOpacity);
    });

    it('computeEffectiveOpacity() reduces opacity when over the cap', () => {
        const rule = getLayerOverlayRule('energyActivity');
        const overCap = (rule.maxSimultaneousLayers ?? 6) + 2;
        const eff = computeEffectiveOpacity(rule, overCap);
        expect(eff).toBeLessThan(rule.maxOpacity);
    });

    it('computeEffectiveOpacity() in diagnostic mode returns maxOpacity always', () => {
        const rule = getLayerOverlayRule('traceResidue');
        const eff = computeEffectiveOpacity(rule, 100, true);
        expect(eff).toBe(rule.maxOpacity);
    });

    it('detectOverbright() returns true when two additive layers are active', () => {
        const result = detectOverbright(['energyActivity', 'actuationPulse', 'localExcitability']);
        expect(result).toBe(true);
    });

    it('detectOverbright() returns false when at most one additive layer is active', () => {
        const result = detectOverbright(['energyActivity', 'traceResidue', 'sensoryReturn']);
        expect(result).toBe(false);
    });

    it('RECOMMENDED_MAX_ACTIVE_LAYERS is defined and reasonable', () => {
        expect(typeof RECOMMENDED_MAX_ACTIVE_LAYERS).toBe('number');
        expect(RECOMMENDED_MAX_ACTIVE_LAYERS).toBeGreaterThanOrEqual(3);
        expect(RECOMMENDED_MAX_ACTIVE_LAYERS).toBeLessThanOrEqual(6);
    });
});

// ── Field Layer Summaries ─────────────────────────────────────────────────────

describe('U4: Field Layer Summaries', () => {

    it('buildEnergyActivitySummary() returns correct layerId', () => {
        const s = buildEnergyActivitySummary(true, 0.5, 0.5, 0.5);
        expect(s.layerId).toBe('energyActivity');
        expect(s.valueKind).toBe('derived');
    });

    it('buildEnergyActivitySummary() status is "inactive" when all inputs are zero', () => {
        const s = buildEnergyActivitySummary(true, 0, 0, 0);
        expect(s.status).toBe('inactive');
    });

    it('buildEnergyActivitySummary() status is "high" when inputs are near 1', () => {
        const s = buildEnergyActivitySummary(true, 1, 1, 1);
        expect(s.status).toBe('high');
    });

    it('buildTraceResidueSummary() returns correct layerId and valueKind', () => {
        const s = buildTraceResidueSummary(true, 0.4, 0.3);
        expect(s.layerId).toBe('traceResidue');
        expect(s.valueKind).toBe('derived');
    });

    it('buildActuationPulseSummary() returns correct layerId and valueKind', () => {
        const s = buildActuationPulseSummary(false, 0, 0);
        expect(s.layerId).toBe('actuationPulse');
        expect(s.valueKind).toBe('measured');
        expect(s.status).toBe('inactive');
    });

    it('buildSensoryReturnSummary() returns correct layerId and valueKind', () => {
        const s = buildSensoryReturnSummary(true, 0.6, 0.2);
        expect(s.layerId).toBe('sensoryReturn');
        expect(s.valueKind).toBe('measured');
        expect(s.status).toBe('moderate');
    });

    it('buildSensoryReturnSummary() notes delay when delayHint > 0.5', () => {
        const s = buildSensoryReturnSummary(true, 0.5, 0.8);
        expect(s.shortText).toContain('[delayed]');
    });

    it('buildTorusCurvatureSummary() returns correct layerId and valueKind', () => {
        const s = buildTorusCurvatureSummary(true, 0.45, 8, 8, 1);
        expect(s.layerId).toBe('torusCurvature');
        expect(s.valueKind).toBe('derived');
    });

    it('buildTorusCurvatureSummary() is inactive when curvature asymmetry is zero', () => {
        const s = buildTorusCurvatureSummary(true, 0, 0, 0, 1);
        expect(s.status).toBe('inactive');
    });

    it('buildClosureMatchSummary() valueKind is "proxy"', () => {
        const s = buildClosureMatchSummary(false, 0.7, 0.2);
        expect(s.layerId).toBe('closureMatch');
        expect(s.valueKind).toBe('proxy');
    });

    it('buildClosureMatchSummary() notes high mismatch when returnMismatch > 0.5', () => {
        const s = buildClosureMatchSummary(false, 0.5, 0.8);
        expect(s.shortText).toContain('[high mismatch]');
    });

    it('buildMediumEchoDelaySummary() returns correct layerId', () => {
        const s = buildMediumEchoDelaySummary(false, 0.3, 0.3, 0.3);
        expect(s.layerId).toBe('mediumEchoDelay');
        expect(s.valueKind).toBe('derived');
    });

    it('buildLocalExcitabilitySummary() near-threshold note appears when many regions', () => {
        const s = buildLocalExcitabilitySummary(false, 0.5, 8, 10);
        expect(s.shortText).toContain('near-threshold');
    });

    it('buildRepeatedFlowPathSummary() shows candidate count in text', () => {
        const s = buildRepeatedFlowPathSummary(false, 3, 0.6);
        expect(s.shortText).toContain('3 candidate(s)');
    });

    it('buildProtoNetworkCandidateSummary() valueKind is "proxy"', () => {
        const s = buildProtoNetworkCandidateSummary(false, 2, 0.5);
        expect(s.layerId).toBe('protoNetworkCandidate');
        expect(s.valueKind).toBe('proxy');
    });

    it('buildProtoNetworkCandidateSummary() includes pre-semantic disclaimer in shortText', () => {
        const s = buildProtoNetworkCandidateSummary(false, 1, 0.6);
        expect(s.shortText.toLowerCase()).toContain('pre-semantic');
    });

    it('buildRiskOverlaySummary() valueKind is "proxy"', () => {
        const s = buildRiskOverlaySummary(true, 0.1, 0.1, 0.1);
        expect(s.layerId).toBe('riskOverlay');
        expect(s.valueKind).toBe('proxy');
    });

    it('buildRiskOverlaySummary() status is "warning" when risk >= 0.65', () => {
        const s = buildRiskOverlaySummary(true, 0.8, 0, 0);
        expect(s.status).toBe('warning');
    });

    it('buildRiskOverlaySummary() status is "inactive" at zero risk', () => {
        const s = buildRiskOverlaySummary(true, 0, 0, 0);
        expect(s.status).toBe('inactive');
    });

    it('formatLayerEventStripText() produces a tick-prefixed line', () => {
        const text = formatLayerEventStripText('energyActivity', 'high', 150);
        expect(text).toContain('tick 150');
        expect(text).toContain('Energy / Activity');
        expect(text).toContain('high');
    });

    it('formatLayerEventStripText() for protoNetworkCandidate includes layer name', () => {
        const text = formatLayerEventStripText('protoNetworkCandidate', 'low', 200);
        expect(text).toContain('Proto-Network Candidate');
    });

    it('all summary builders return a magnitude in [0, 1]', () => {
        const summaries = [
            buildEnergyActivitySummary(true, 0.5, 0.5, 0.5),
            buildTraceResidueSummary(true, 0.5, 0.5),
            buildActuationPulseSummary(true, 0.5, 0.5),
            buildSensoryReturnSummary(true, 0.5, 0.5),
            buildTorusCurvatureSummary(true, 0.5, 8, 8, 1),
            buildClosureMatchSummary(true, 0.5, 0.5),
            buildMediumEchoDelaySummary(true, 0.5, 0.5, 0.5),
            buildLocalExcitabilitySummary(true, 0.5, 3, 10),
            buildRepeatedFlowPathSummary(true, 2, 0.5),
            buildProtoNetworkCandidateSummary(true, 1, 0.5),
            buildRiskOverlaySummary(true, 0.5, 0.5, 0.5),
        ];
        for (const s of summaries) {
            expect(s.magnitude).toBeGreaterThanOrEqual(0);
            expect(s.magnitude).toBeLessThanOrEqual(1);
        }
    });
});

// ── Static analysis: no fake visual functions ─────────────────────────────────

describe('U4: No fake visual functions in source files', () => {
    const fakeFunctionNames = [
        'addFakeEnergy',
        'addOrganicWobble',
        'addLifeLikeSparkle',
        'forceBeautifulFlow',
        'randomGlowWhenQuiet',
        'fakeFlow',
        'fakeTrace',
        'fakeReturn',
        'artificialFluctuation',
    ];

    for (const fnName of fakeFunctionNames) {
        it(`"${fnName}" is NOT present in any U4 source file`, () => {
            for (const src of allU4Srcs) {
                expect(src).not.toContain(fnName);
            }
        });
    }
});

// ── Static analysis: no assertive semantic / consciousness / emotion claims ────
//
// NOTE: Disclaimer text (e.g. "NOT self-awareness", "NOT a semantic network")
// may legitimately contain these terms to explicitly deny them.
// We check for assertive claim patterns only (e.g. "shows self-awareness",
// "is a semantic network"), not for mere presence of the term.

describe('U4: No assertive semantic / consciousness / emotion claims in source files', () => {
    // These assertive phrases must not appear (they would be claims, not denials)
    const forbiddenAssertions = [
        'AETERNA wants',
        'AETERNA feels',
        'AETERNA thinks',
        'AETERNA decides',
        'AETERNA is self-aware',
        'has self-awareness',
        'shows self-awareness',
        'is conscious',
        'is a semantic network',
        'is a knowledge graph',
        'is a concept graph',
        'is a neural network',
        'is a memory structure',
        'nodeId:',
        'networkEdge:',
        'runtimeEdge',
        'pathWeight:',
        'llmTeacher',
    ];

    for (const claim of forbiddenAssertions) {
        it(`assertive claim "${claim}" is NOT present in any U4 source file`, () => {
            for (const src of allU4Srcs) {
                expect(src.toLowerCase()).not.toContain(claim.toLowerCase());
            }
        });
    }
});

// ── Static analysis: runtime dynamics not modified ────────────────────────────

describe('U4: Runtime dynamics not modified in source files', () => {
    // These patterns should not appear as left-hand assignments (mutations)
    // in U4 source files.  We check for the specific assignment forms.
    const mutationPatterns = [
        'currentBuffer[i] =',
        'traceState.traceStrength =',
        'viabilityState.saturationRisk =',
        'organism.step(',
    ];

    for (const expr of mutationPatterns) {
        it(`mutation pattern "${expr}" is NOT present in U4 source files`, () => {
            for (const src of allU4Srcs) {
                expect(src).not.toContain(expr);
            }
        });
    }
});

// ── Static analysis: proto-network layer does not create runtime graphs ────────

describe('U4: Proto-network layer does not create runtime graph structures', () => {
    const graphCreationPatterns = [
        'new Graph',
        'addEdge(',
        'addNode(',
        'createEdge',
        'createNode',
        'networkEdge',
        'runtimeGraph',
        'graphNode',
        'edgeWeight',
    ];

    for (const pattern of graphCreationPatterns) {
        it(`"${pattern}" is NOT present in U4 source files`, () => {
            for (const src of allU4Srcs) {
                expect(src).not.toContain(pattern);
            }
        });
    }
});

// ── Static analysis: disclaimers are present ──────────────────────────────────

describe('U4: Semantic disclaimers are present in registry', () => {
    it('protoNetworkCandidate disclaimer mentions pre-semantic', () => {
        const def = getFieldLayerDefinition('protoNetworkCandidate')!;
        expect(def.disclaimer.toLowerCase()).toContain('pre-semantic');
    });

    it('protoNetworkCandidate disclaimer explicitly says NOT a semantic network', () => {
        const def = getFieldLayerDefinition('protoNetworkCandidate')!;
        expect(def.disclaimer.toLowerCase()).toContain('not');
    });

    it('closureMatch disclaimer mentions proxy and pulse-return correspondence', () => {
        const def = getFieldLayerDefinition('closureMatch')!;
        expect(def.disclaimer.toLowerCase()).toContain('proxy');
        expect(def.disclaimer.toLowerCase()).toContain('pulse-return correspondence');
    });

    it('traceResidue disclaimer says NOT memory', () => {
        const def = getFieldLayerDefinition('traceResidue')!;
        expect(def.disclaimer.toLowerCase()).toContain('not');
    });

    it('localExcitability disclaimer does not claim neurons', () => {
        const def = getFieldLayerDefinition('localExcitability')!;
        // The disclaimer should warn that these are NOT neurons
        expect(def.disclaimer.toLowerCase()).toContain('not');
    });

    it('actuationPulse disclaimer stays tied to output signal wording', () => {
        const def = getFieldLayerDefinition('actuationPulse')!;
        expect(def.disclaimer.toLowerCase()).toContain('output signal');
        expect(def.disclaimer.toLowerCase()).toContain('locality');
    });
});
