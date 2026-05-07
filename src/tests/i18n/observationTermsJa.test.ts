/**
 * observationTermsJa.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — observationTermsJa tests
 *
 * Verifies that:
 * 1. All required terms are present in OBSERVATION_TERMS_JA.
 * 2. Each term has jaLabel, shortDescriptionJa, whatItShowsJa, whatItIsNotJa.
 * 3. Lookup helpers work correctly.
 * 4. No forbidden claims in any term definition.
 * 5. Value kinds are valid types.
 */

import { describe, it, expect } from 'vitest';
import {
    OBSERVATION_TERMS_JA,
    getTermById,
    getBeginnerTerms,
    getResearcherTerms,
    getAllTermIds,
} from '../../i18n/observationTermsJa.ts';

// ── Required terms ────────────────────────────────────────────────────────────

const REQUIRED_IDS = [
    'field', 'cell', 'cellIndex', 'uAngle', 'vAngle',
    'innerRim', 'outerRim', 'areaElement', 'gaussianCurvature', 'meanCurvature',
    'amplitude', 'phase', 'phaseCoherence',
    'vortexCandidate', 'vortexCandidateConfidence', 'topologicalCharge',
    'membrane', 'membraneDeformation', 'actuationImprint', 'returnImprint',
    'weakPlasticityTrace', 'plasticityTrace', 'resistanceScale',
    'observedRatio', 'observedRatioInvolvement', 'referenceRatio',
    'causalTrace', 'possibleContributingSignals', 'layerCorrelation',
    'differenceView', 'timeReplay', 'replaySnapshot',
    'lensContext', 'metricSpotlight', 'cellInspector',
    'visualLens', 'observationGuide',
    'proxy', 'derived', 'reference', 'check',
    'notObserved', 'notCausalProof',
];

describe('observationTermsJa: required terms present', () => {
    for (const id of REQUIRED_IDS) {
        it(`has term: ${id}`, () => {
            const term = getTermById(id);
            expect(term).toBeDefined();
        });
    }
});

describe('observationTermsJa: each term has required fields', () => {
    it('every term has jaLabel', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            expect(term.jaLabel, `${term.id} missing jaLabel`).toBeTruthy();
        }
    });

    it('every term has shortDescriptionJa', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            expect(term.shortDescriptionJa, `${term.id} missing shortDescriptionJa`).toBeTruthy();
        }
    });

    it('every term has whatItShowsJa', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            expect(term.whatItShowsJa, `${term.id} missing whatItShowsJa`).toBeTruthy();
        }
    });

    it('every term has whatItIsNotJa', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            expect(term.whatItIsNotJa, `${term.id} missing whatItIsNotJa`).toBeTruthy();
        }
    });

    it('every term has cautionJa', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            expect(term.cautionJa, `${term.id} missing cautionJa`).toBeTruthy();
        }
    });

    it('every term has beginnerVisible boolean', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            expect(typeof term.beginnerVisible, `${term.id} beginnerVisible`).toBe('boolean');
        }
    });

    it('every term has researcherVisible boolean', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            expect(typeof term.researcherVisible, `${term.id} researcherVisible`).toBe('boolean');
        }
    });
});

describe('observationTermsJa: lookup helpers', () => {
    it('getTermById returns correct term', () => {
        const t = getTermById('vortexCandidateConfidence');
        expect(t?.jaLabel).toBe('渦候補の強さ');
        expect(t?.internalId).toBe('vortexCandidateConfidence');
    });

    it('getTermById returns undefined for unknown id', () => {
        expect(getTermById('__nonexistent__')).toBeUndefined();
    });

    it('getBeginnerTerms returns only beginnerVisible=true', () => {
        const terms = getBeginnerTerms();
        for (const t of terms) {
            expect(t.beginnerVisible).toBe(true);
        }
    });

    it('getResearcherTerms returns only researcherVisible=true', () => {
        const terms = getResearcherTerms();
        for (const t of terms) {
            expect(t.researcherVisible).toBe(true);
        }
    });

    it('getAllTermIds returns all IDs', () => {
        const ids = getAllTermIds();
        expect(ids.length).toBe(OBSERVATION_TERMS_JA.length);
        for (const id of REQUIRED_IDS) {
            expect(ids).toContain(id);
        }
    });
});

describe('observationTermsJa: no forbidden claims', () => {
    const FORBIDDEN = [
        '意識が証明',
        '生命が証明',
        '知性が証明',
        'AETERNAは生きている',
        'AETERNAが感じている',
        '魂',
        '神秘の証明',
        '癒しの証明',
        '渦は心',
        '可塑性は記憶',
        'consciousness proved',
        'life proved',
        'intelligence proved',
        'AETERNA is alive',
        'AETERNA feels',
        'soul',
        'mystical proof',
        'fake result',
        'fake visual',
        'fake event',
    ];

    it('jaLabel contains no forbidden claims', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            for (const forbidden of FORBIDDEN) {
                expect(
                    term.jaLabel.toLowerCase(),
                    `${term.id}.jaLabel contains forbidden: "${forbidden}"`,
                ).not.toContain(forbidden.toLowerCase());
            }
        }
    });

    it('shortDescriptionJa contains no forbidden claims', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            for (const forbidden of FORBIDDEN) {
                expect(
                    term.shortDescriptionJa.toLowerCase(),
                    `${term.id}.shortDescriptionJa contains forbidden: "${forbidden}"`,
                ).not.toContain(forbidden.toLowerCase());
            }
        }
    });
});

describe('observationTermsJa: value kind validity', () => {
    const VALID_KINDS = [
        'Raw', 'Measured', 'Derived', 'Proxy', 'Check', 'Reference', 'Presentation-smoothed',
    ];

    it('all valueKind values are valid', () => {
        for (const term of OBSERVATION_TERMS_JA) {
            if (term.valueKind !== undefined) {
                expect(
                    VALID_KINDS,
                    `${term.id} has invalid valueKind: ${term.valueKind}`,
                ).toContain(term.valueKind);
            }
        }
    });
});

describe('observationTermsJa: specific key term labels', () => {
    it('vortexCandidate → 渦候補', () => {
        expect(getTermById('vortexCandidate')?.jaLabel).toBe('渦候補');
    });
    it('weakPlasticityTrace → 弱い媒質履歴', () => {
        expect(getTermById('weakPlasticityTrace')?.jaLabel).toBe('弱い媒質履歴');
    });
    it('causalTrace → 関連候補', () => {
        expect(getTermById('causalTrace')?.jaLabel).toBe('関連候補');
    });
    it('timeReplay → 観測スナップショット再生', () => {
        expect(getTermById('timeReplay')?.jaLabel).toBe('観測スナップショット再生');
    });
    it('resistanceScale → 抵抗変化', () => {
        expect(getTermById('resistanceScale')?.jaLabel).toBe('抵抗変化');
    });
    it('metricSpotlight → 観測レンズ', () => {
        expect(getTermById('metricSpotlight')?.jaLabel).toBe('観測レンズ');
    });
    it('cellInspector → セル観測', () => {
        expect(getTermById('cellInspector')?.jaLabel).toBe('セル観測');
    });
    it('observedRatio → 観測比率', () => {
        expect(getTermById('observedRatio')?.jaLabel).toBe('観測比率');
    });
    it('membrane → 膜', () => {
        expect(getTermById('membrane')?.jaLabel).toBe('膜');
    });
    it('phase → 位相', () => {
        expect(getTermById('phase')?.jaLabel).toBe('位相');
    });
    it('amplitude → 振幅', () => {
        expect(getTermById('amplitude')?.jaLabel).toBe('振幅');
    });
});
