/**
 * researchScenarios.test.ts
 * AETERNA-NATURAL v1.3 Research Scenarios / Preset Experiments
 *
 * Verifies that:
 * - ResearchScenario type has all required fields
 * - ResearchScenarioId includes all 10 scenario IDs
 * - RESEARCH_SCENARIO_REGISTRY has exactly 10 scenarios
 * - All scenarios have non-empty required fields
 * - expectedObservationKinds are non-empty observation targets
 * - nonGuaranteedNotes clarify what is not guaranteed
 * - All scenario texts contain no forbidden terms
 * - getResearchScenario lookup works correctly
 * - getAllResearchScenarioIds returns all 10 IDs
 * - PresetExperiment type has all required fields
 * - PRESET_EXPERIMENT_REGISTRY has the expected number of experiments
 * - All experiments link to valid scenario IDs
 * - All experiments have valid safetyLevel values
 * - getPresetExperiment and getExperimentsForScenario lookups work
 * - No fake hardcoded results or forbidden claims appear
 * - Every research scenario has at least one preset experiment
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Modules under test ────────────────────────────────────────────────────────

import {
    RESEARCH_SCENARIO_REGISTRY,
    getResearchScenario,
    getAllResearchScenarioIds,
} from '../../scenario/researchScenarioRegistry.js';

import {
    PRESET_EXPERIMENT_REGISTRY,
    getPresetExperiment,
    getExperimentsForScenario,
    getAllPresetExperimentIds,
} from '../../scenario/presetExperimentRegistry.js';

// ── Source files for static analysis ─────────────────────────────────────────

const ROOT = resolve(__dirname, '../..');

function readSrc(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const srcResearchScenarioType       = readSrc('types/researchScenario.ts');
const srcResearchScenarioRegistry   = readSrc('scenario/researchScenarioRegistry.ts');
const srcPresetExperimentType       = readSrc('types/presetExperiment.ts');
const srcPresetExperimentRegistry   = readSrc('scenario/presetExperimentRegistry.ts');

// ── Forbidden terms ───────────────────────────────────────────────────────────

const FORBIDDEN_TERMS = [
    'conscious', 'feels', 'wants', 'learned meaning', 'understands',
    'memory formed', 'intelligence emerged', 'life was proven',
    'mystical', 'soul', 'emotion', 'healing proof',
    '意識', '感じています', '欲しがっています',
    '意味を学習', '理解しました', '記憶しました',
];

// ── All 10 research scenario IDs ──────────────────────────────────────────────

const ALL_SCENARIO_IDS = [
    'quietBaseline',
    'singlePulseReturn',
    'repeatedGentlePulse',
    'phaseVortexEmergence',
    'curvatureBiasObservation',
    'membraneOverlapObservation',
    'plasticityTraceObservation',
    'neutralVsLegacyConstants',
    'observedRatioSurvey',
    'longRunNaturalComparison',
] as const;

const VALID_SAFETY_LEVELS = ['safe', 'research', 'experimental'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. ResearchScenario type
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 ResearchScenario type', () => {
    it('ResearchScenario type is defined in types/researchScenario.ts', () => {
        expect(srcResearchScenarioType).toContain('ResearchScenario');
        expect(srcResearchScenarioType).toContain('ResearchScenarioId');
    });

    it('ResearchScenario has all required fields', () => {
        expect(srcResearchScenarioType).toContain('id:');
        expect(srcResearchScenarioType).toContain('title:');
        expect(srcResearchScenarioType).toContain('shortDescription:');
        expect(srcResearchScenarioType).toContain('researchQuestion:');
        expect(srcResearchScenarioType).toContain('observationGoal:');
        expect(srcResearchScenarioType).toContain('defaultSeed:');
        expect(srcResearchScenarioType).toContain('defaultTicks:');
        expect(srcResearchScenarioType).toContain('sampleEveryTicks:');
        expect(srcResearchScenarioType).toContain('recommendedPresetId:');
        expect(srcResearchScenarioType).toContain('compatiblePresetIds:');
        expect(srcResearchScenarioType).toContain('recommendedLayers:');
        expect(srcResearchScenarioType).toContain('recommendedPanels:');
        expect(srcResearchScenarioType).toContain('expectedObservationKinds:');
        expect(srcResearchScenarioType).toContain('nonGuaranteedNotes:');
        expect(srcResearchScenarioType).toContain('safetyLevel:');
        expect(srcResearchScenarioType).toContain('exportTags:');
    });

    it('ResearchScenarioId includes all 10 scenario IDs', () => {
        for (const id of ALL_SCENARIO_IDS) {
            expect(srcResearchScenarioType).toContain(id);
        }
    });

    it('safetyLevel union is safe | research | experimental', () => {
        expect(srcResearchScenarioType).toContain("'safe'");
        expect(srcResearchScenarioType).toContain("'research'");
        expect(srcResearchScenarioType).toContain("'experimental'");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RESEARCH_SCENARIO_REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 RESEARCH_SCENARIO_REGISTRY', () => {
    it('has exactly 10 scenarios', () => {
        expect(RESEARCH_SCENARIO_REGISTRY).toHaveLength(10);
    });

    it('all scenario IDs are unique', () => {
        const ids = RESEARCH_SCENARIO_REGISTRY.map(s => s.id);
        expect(new Set(ids).size).toBe(10);
    });

    it('all 10 expected IDs are present', () => {
        const ids = RESEARCH_SCENARIO_REGISTRY.map(s => s.id);
        for (const id of ALL_SCENARIO_IDS) {
            expect(ids).toContain(id);
        }
    });

    it('all scenarios have non-empty title, shortDescription, researchQuestion, observationGoal', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.title.length).toBeGreaterThan(0);
            expect(s.shortDescription.length).toBeGreaterThan(0);
            expect(s.researchQuestion.length).toBeGreaterThan(0);
            expect(s.observationGoal.length).toBeGreaterThan(0);
        }
    });

    it('all scenarios have a positive defaultSeed', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.defaultSeed).toBeGreaterThan(0);
        }
    });

    it('all scenarios have positive defaultTicks and sampleEveryTicks', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.defaultTicks).toBeGreaterThan(0);
            expect(s.sampleEveryTicks).toBeGreaterThan(0);
            expect(s.sampleEveryTicks).toBeLessThanOrEqual(s.defaultTicks);
        }
    });

    it('all scenarios have a non-empty recommendedPresetId', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.recommendedPresetId.length).toBeGreaterThan(0);
        }
    });

    it('all scenarios have non-empty recommendedLayers', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.recommendedLayers.length).toBeGreaterThan(0);
        }
    });

    it('all scenarios have non-empty recommendedPanels', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.recommendedPanels.length).toBeGreaterThan(0);
        }
    });

    it('all scenarios have non-empty expectedObservationKinds', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.expectedObservationKinds.length).toBeGreaterThan(0);
        }
    });

    it('all scenarios have non-empty nonGuaranteedNotes', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.nonGuaranteedNotes.length).toBeGreaterThan(0);
        }
    });

    it('all scenarios have a valid safetyLevel', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(VALID_SAFETY_LEVELS).toContain(s.safetyLevel);
        }
    });

    it('all scenarios have non-empty exportTags', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            expect(s.exportTags.length).toBeGreaterThan(0);
        }
    });

    it('all scenario texts contain no forbidden terms', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            const allText = [
                s.title,
                s.shortDescription,
                s.researchQuestion,
                s.observationGoal,
                ...s.expectedObservationKinds,
                ...s.nonGuaranteedNotes,
                ...s.exportTags,
            ].join(' ').toLowerCase();

            for (const term of FORBIDDEN_TERMS) {
                expect(allText, `Scenario ${s.id} contains forbidden term: "${term}"`)
                    .not.toContain(term.toLowerCase());
            }
        }
    });

    it('registry source contains no forbidden terms', () => {
        const src = srcResearchScenarioRegistry.toLowerCase();
        for (const term of FORBIDDEN_TERMS) {
            expect(src, `Registry source contains forbidden term: "${term}"`)
                .not.toContain(term.toLowerCase());
        }
    });

    it('nonGuaranteedNotes include "valid" or similar language for each scenario', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            const notes = s.nonGuaranteedNotes.join(' ').toLowerCase();
            const hasValidLanguage = notes.includes('valid') || notes.includes('not guaranteed');
            expect(hasValidLanguage, `Scenario ${s.id} nonGuaranteedNotes should include "valid" or "not guaranteed"`)
                .toBe(true);
        }
    });

    it('no scenario has safetyLevel experimental (none should be experimental by default)', () => {
        const experimental = RESEARCH_SCENARIO_REGISTRY.filter(s => s.safetyLevel === 'experimental');
        expect(experimental).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. getResearchScenario lookup
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 getResearchScenario', () => {
    it('returns the correct scenario for a known ID', () => {
        const scenario = getResearchScenario('quietBaseline');
        expect(scenario).toBeDefined();
        expect(scenario?.id).toBe('quietBaseline');
        expect(scenario?.title).toBe('Quiet Baseline');
    });

    it('returns undefined for an unknown ID', () => {
        // @ts-expect-error - testing unknown ID
        const scenario = getResearchScenario('nonExistentId');
        expect(scenario).toBeUndefined();
    });

    it('all 10 scenario IDs resolve via getResearchScenario', () => {
        for (const id of ALL_SCENARIO_IDS) {
            const scenario = getResearchScenario(id);
            expect(scenario).toBeDefined();
            expect(scenario?.id).toBe(id);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. getAllResearchScenarioIds
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 getAllResearchScenarioIds', () => {
    it('returns all 10 IDs', () => {
        const ids = getAllResearchScenarioIds();
        expect(ids).toHaveLength(10);
    });

    it('contains all expected IDs', () => {
        const ids = getAllResearchScenarioIds();
        for (const id of ALL_SCENARIO_IDS) {
            expect(ids).toContain(id);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PresetExperiment type
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 PresetExperiment type', () => {
    it('PresetExperiment type is defined in types/presetExperiment.ts', () => {
        expect(srcPresetExperimentType).toContain('PresetExperiment');
    });

    it('PresetExperiment has all required fields', () => {
        expect(srcPresetExperimentType).toContain('id:');
        expect(srcPresetExperimentType).toContain('title:');
        expect(srcPresetExperimentType).toContain('description:');
        expect(srcPresetExperimentType).toContain('scenarioId:');
        expect(srcPresetExperimentType).toContain('seed:');
        expect(srcPresetExperimentType).toContain('ticks:');
        expect(srcPresetExperimentType).toContain('sampleEveryTicks:');
        expect(srcPresetExperimentType).toContain('runtimePresetId:');
        expect(srcPresetExperimentType).toContain('expectedObservationKinds:');
        expect(srcPresetExperimentType).toContain('safetyLevel:');
        expect(srcPresetExperimentType).toContain('exportTags:');
    });

    it('runtimeConfigOverrides is optional', () => {
        expect(srcPresetExperimentType).toContain('runtimeConfigOverrides?:');
    });

    it('notes is optional', () => {
        expect(srcPresetExperimentType).toContain('notes?:');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PRESET_EXPERIMENT_REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 PRESET_EXPERIMENT_REGISTRY', () => {
    it('has at least 10 experiments', () => {
        expect(PRESET_EXPERIMENT_REGISTRY.length).toBeGreaterThanOrEqual(10);
    });

    it('all experiment IDs are unique', () => {
        const ids = PRESET_EXPERIMENT_REGISTRY.map(e => e.id);
        expect(new Set(ids).size).toBe(PRESET_EXPERIMENT_REGISTRY.length);
    });

    it('all experiments have non-empty id, title, description, runtimePresetId', () => {
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            expect(e.id.length).toBeGreaterThan(0);
            expect(e.title.length).toBeGreaterThan(0);
            expect(e.description.length).toBeGreaterThan(0);
            expect(e.runtimePresetId.length).toBeGreaterThan(0);
        }
    });

    it('all experiments reference a valid scenarioId', () => {
        const validIds = new Set(ALL_SCENARIO_IDS as readonly string[]);
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            expect(validIds.has(e.scenarioId), `Experiment ${e.id} has unknown scenarioId: ${e.scenarioId}`)
                .toBe(true);
        }
    });

    it('all experiments have positive seed, ticks, sampleEveryTicks', () => {
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            expect(e.seed).toBeGreaterThan(0);
            expect(e.ticks).toBeGreaterThan(0);
            expect(e.sampleEveryTicks).toBeGreaterThan(0);
            expect(e.sampleEveryTicks).toBeLessThanOrEqual(e.ticks);
        }
    });

    it('all experiments have non-empty expectedObservationKinds', () => {
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            expect(e.expectedObservationKinds.length).toBeGreaterThan(0);
        }
    });

    it('all experiments have a valid safetyLevel', () => {
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            expect(VALID_SAFETY_LEVELS).toContain(e.safetyLevel);
        }
    });

    it('all experiments have non-empty exportTags', () => {
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            expect(e.exportTags.length).toBeGreaterThan(0);
        }
    });

    it('all experiment texts contain no forbidden terms', () => {
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            const allText = [
                e.title,
                e.description,
                ...(e.notes ?? []),
                ...e.exportTags,
            ].join(' ').toLowerCase();

            for (const term of FORBIDDEN_TERMS) {
                expect(allText, `Experiment ${e.id} contains forbidden term: "${term}"`)
                    .not.toContain(term.toLowerCase());
            }
        }
    });

    it('experiment registry source contains no forbidden terms', () => {
        const src = srcPresetExperimentRegistry.toLowerCase();
        for (const term of FORBIDDEN_TERMS) {
            expect(src, `Registry source contains forbidden term: "${term}"`)
                .not.toContain(term.toLowerCase());
        }
    });

    it('no experiment has safetyLevel experimental', () => {
        const experimental = PRESET_EXPERIMENT_REGISTRY.filter(e => e.safetyLevel === 'experimental');
        expect(experimental).toHaveLength(0);
    });

    it('every research scenario has at least one preset experiment', () => {
        for (const id of ALL_SCENARIO_IDS) {
            const experiments = getExperimentsForScenario(id);
            expect(experiments.length, `Scenario ${id} has no preset experiments`).toBeGreaterThan(0);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. getPresetExperiment lookup
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 getPresetExperiment', () => {
    it('returns the correct experiment for a known ID', () => {
        const e = getPresetExperiment('E01_quietBaselineSafe');
        expect(e).toBeDefined();
        expect(e?.id).toBe('E01_quietBaselineSafe');
        expect(e?.scenarioId).toBe('quietBaseline');
        expect(e?.runtimePresetId).toBe('safeBaseline');
    });

    it('returns undefined for an unknown ID', () => {
        const e = getPresetExperiment('nonExistentId');
        expect(e).toBeUndefined();
    });

    it('all experiment IDs resolve via getPresetExperiment', () => {
        for (const id of getAllPresetExperimentIds()) {
            const e = getPresetExperiment(id);
            expect(e).toBeDefined();
            expect(e?.id).toBe(id);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. getExperimentsForScenario
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 getExperimentsForScenario', () => {
    it('returns experiments for quietBaseline', () => {
        const exps = getExperimentsForScenario('quietBaseline');
        expect(exps.length).toBeGreaterThanOrEqual(1);
        for (const e of exps) {
            expect(e.scenarioId).toBe('quietBaseline');
        }
    });

    it('returns an empty array for an unknown scenarioId', () => {
        const exps = getExperimentsForScenario('nonExistentScenario');
        expect(exps).toHaveLength(0);
    });

    it('neutralVsLegacyConstants has at least 2 experiments (neutral and legacy)', () => {
        const exps = getExperimentsForScenario('neutralVsLegacyConstants');
        expect(exps.length).toBeGreaterThanOrEqual(2);
        const presetIds = exps.map(e => e.runtimePresetId);
        expect(presetIds).toContain('naturalObserverSuite');
        expect(presetIds).toContain('legacyComparison');
    });

    it('all experiments returned have the correct scenarioId', () => {
        for (const id of ALL_SCENARIO_IDS) {
            const exps = getExperimentsForScenario(id);
            for (const e of exps) {
                expect(e.scenarioId).toBe(id);
            }
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. getAllPresetExperimentIds
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 getAllPresetExperimentIds', () => {
    it('returns at least 10 IDs', () => {
        const ids = getAllPresetExperimentIds();
        expect(ids.length).toBeGreaterThanOrEqual(10);
    });

    it('all returned IDs are unique', () => {
        const ids = getAllPresetExperimentIds();
        expect(new Set(ids).size).toBe(ids.length);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Cross-file integrity checks
// ─────────────────────────────────────────────────────────────────────────────

describe('v1.3 cross-file integrity', () => {
    it('researchScenarioRegistry does not import runtime dynamics files', () => {
        const src = srcResearchScenarioRegistry;
        const RUNTIME_DYNAMICS = [
            'updateWorldMedium',
            'applyWorldMediumFeedback',
            'deriveActuationPulse',
            'applyActuationFeedback',
            'initializeWorldMediumState',
        ];
        for (const pattern of RUNTIME_DYNAMICS) {
            expect(src).not.toContain(pattern);
        }
    });

    it('presetExperimentRegistry does not import runtime dynamics files', () => {
        const src = srcPresetExperimentRegistry;
        const RUNTIME_DYNAMICS = [
            'updateWorldMedium',
            'applyWorldMediumFeedback',
            'deriveActuationPulse',
            'applyActuationFeedback',
        ];
        for (const pattern of RUNTIME_DYNAMICS) {
            expect(src).not.toContain(pattern);
        }
    });

    it('scenario IDs in experiments match ids in scenario registry', () => {
        const registryIds = new Set(RESEARCH_SCENARIO_REGISTRY.map(s => s.id));
        for (const e of PRESET_EXPERIMENT_REGISTRY) {
            expect(registryIds.has(e.scenarioId)).toBe(true);
        }
    });

    it('all experiments use a seed consistent with their scenario defaultSeed', () => {
        for (const s of RESEARCH_SCENARIO_REGISTRY) {
            const exps = getExperimentsForScenario(s.id);
            for (const e of exps) {
                // Every experiment for a scenario uses the scenario's defaultSeed
                // to ensure reproducible cross-experiment comparison within the same scenario.
                expect(e.seed, `Experiment ${e.id} seed should match scenario ${s.id} defaultSeed`)
                    .toBe(s.defaultSeed);
            }
        }
    });
});
