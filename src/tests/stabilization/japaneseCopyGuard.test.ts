/**
 * japaneseCopyGuard.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Japanese Copy Guard tests
 *
 * Verifies that no forbidden Japanese claims appear in:
 * 1. observationTermsJa labels and descriptions.
 * 2. uiLabelsJa panel descriptions and disclaimers.
 * 3. jpTerminology labels, disclaimers, guide buttons.
 * 4. valueKindLabelsJa tooltips.
 *
 * Forbidden Japanese expressions (per spec §13):
 * - 意識が証明
 * - 生命が証明
 * - 知性が証明
 * - AETERNAは生きている
 * - AETERNAが感じている
 * - AETERNAが欲している
 * - AETERNAが理解した
 * - 魂
 * - 神秘の証明
 * - 癒しの証明
 * - 渦は心
 * - 可塑性は記憶
 * - 比率が真理を証明
 *
 * Forbidden English expressions:
 * - consciousness proved
 * - life proved
 * - intelligence proved
 * - AETERNA is alive
 * - AETERNA feels
 * - AETERNA wants
 * - soul
 * - mystical proof
 * - healing proof
 * - vortex is mind
 * - plasticity is memory
 * - ratio proves truth
 * - fake result
 * - fake visual
 * - fake event
 */

import { describe, it, expect } from 'vitest';
import { OBSERVATION_TERMS_JA } from '../../i18n/observationTermsJa.ts';
import {
    UI_PANEL_DESCRIPTIONS_JA,
    UI_DISCLAIMERS_JA,
    UI_ACTIONS_JA,
    UI_STATUS_JA,
    UI_MODES_JA,
    UI_TABS_JA,
} from '../../i18n/uiLabelsJa.ts';
import {
    JP_PANELS,
    JP_TABS,
    JP_METRICS,
    JP_LENSES,
    JP_GUIDE_BUTTONS,
    JP_DISCLAIMERS,
    JP_HEADER,
    JP_VIEW_MODES,
    JP_VALUE_KINDS,
} from '../../i18n/jpTerminology.ts';
import { VALUE_KIND_LABELS_JA } from '../../i18n/valueKindLabelsJa.ts';

// ── Forbidden expressions ─────────────────────────────────────────────────────

const FORBIDDEN_JA = [
    '意識が証明',
    '生命が証明',
    '知性が証明',
    'AETERNAは生きている',
    'AETERNAが感じている',
    'AETERNAが欲している',
    'AETERNAが理解した',
    '神秘の証明',
    '癒しの証明',
    '渦は心',
    '可塑性は記憶',
    '比率が真理を証明',
];

const FORBIDDEN_EN = [
    'consciousness proved',
    'life proved',
    'intelligence proved',
    'AETERNA is alive',
    'AETERNA feels',
    'AETERNA wants',
    'mystical proof',
    'healing proof',
    'vortex is mind',
    'plasticity is memory',
    'ratio proves truth',
    'fake result',
    'fake visual',
    'fake event',
    'fake cause',
    'fake relation',
];

// ── Helper ─────────────────────────────────────────────────────────────────────

function assertNoForbidden(
    content: string,
    label: string,
    forbidden: string[],
): void {
    for (const expr of forbidden) {
        expect(
            content.toLowerCase(),
            `"${label}" contains forbidden: "${expr}"`,
        ).not.toContain(expr.toLowerCase());
    }
}

// ── observationTermsJa copy guard ─────────────────────────────────────────────

describe('japaneseCopyGuard: observationTermsJa', () => {
    const fields = [
        'jaLabel',
        'shortDescriptionJa',
        'longDescriptionJa',
        'whatItShowsJa',
        'whatItIsNotJa',
        'cautionJa',
    ] as const;

    for (const field of fields) {
        it(`no forbidden JA in ${field}`, () => {
            for (const term of OBSERVATION_TERMS_JA) {
                const value = term[field] ?? '';
                assertNoForbidden(
                    value,
                    `observationTermsJa[${term.id}].${field}`,
                    FORBIDDEN_JA,
                );
            }
        });

        it(`no forbidden EN in ${field}`, () => {
            for (const term of OBSERVATION_TERMS_JA) {
                const value = term[field] ?? '';
                assertNoForbidden(
                    value,
                    `observationTermsJa[${term.id}].${field}`,
                    FORBIDDEN_EN,
                );
            }
        });
    }
});

// ── uiLabelsJa copy guard ─────────────────────────────────────────────────────

describe('japaneseCopyGuard: uiLabelsJa', () => {
    const allPanelDescriptions = Object.entries(UI_PANEL_DESCRIPTIONS_JA);
    const allDisclaimers = Object.entries(UI_DISCLAIMERS_JA);
    const allActions = Object.entries(UI_ACTIONS_JA);
    const allStatus = Object.entries(UI_STATUS_JA);
    const allModes = Object.entries(UI_MODES_JA);
    const allTabs = Object.entries(UI_TABS_JA);

    it('no forbidden JA in panel descriptions', () => {
        for (const [key, val] of allPanelDescriptions) {
            assertNoForbidden(val, `UI_PANEL_DESCRIPTIONS_JA.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden EN in panel descriptions', () => {
        for (const [key, val] of allPanelDescriptions) {
            assertNoForbidden(val, `UI_PANEL_DESCRIPTIONS_JA.${key}`, FORBIDDEN_EN);
        }
    });

    it('no forbidden JA in disclaimers', () => {
        for (const [key, val] of allDisclaimers) {
            assertNoForbidden(val, `UI_DISCLAIMERS_JA.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden in action labels', () => {
        for (const [key, val] of allActions) {
            assertNoForbidden(val, `UI_ACTIONS_JA.${key}`, FORBIDDEN_JA);
            assertNoForbidden(val, `UI_ACTIONS_JA.${key}`, FORBIDDEN_EN);
        }
    });

    it('no forbidden in status labels', () => {
        for (const [key, val] of allStatus) {
            assertNoForbidden(val, `UI_STATUS_JA.${key}`, FORBIDDEN_JA);
            assertNoForbidden(val, `UI_STATUS_JA.${key}`, FORBIDDEN_EN);
        }
    });

    it('no forbidden in mode labels', () => {
        for (const [key, val] of allModes) {
            assertNoForbidden(val, `UI_MODES_JA.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden in tab labels', () => {
        for (const [key, val] of allTabs) {
            assertNoForbidden(val, `UI_TABS_JA.${key}`, FORBIDDEN_JA);
        }
    });
});

// ── jpTerminology copy guard ──────────────────────────────────────────────────

describe('japaneseCopyGuard: jpTerminology', () => {
    it('no forbidden JA in panel labels', () => {
        for (const [key, val] of Object.entries(JP_PANELS)) {
            assertNoForbidden(val, `JP_PANELS.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in metric labels', () => {
        for (const [key, val] of Object.entries(JP_METRICS)) {
            assertNoForbidden(val, `JP_METRICS.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in disclaimer strings', () => {
        for (const [key, val] of Object.entries(JP_DISCLAIMERS)) {
            assertNoForbidden(val, `JP_DISCLAIMERS.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden EN in disclaimer strings', () => {
        for (const [key, val] of Object.entries(JP_DISCLAIMERS)) {
            assertNoForbidden(val, `JP_DISCLAIMERS.${key}`, FORBIDDEN_EN);
        }
    });

    it('no forbidden JA in guide button labels', () => {
        for (const [key, val] of Object.entries(JP_GUIDE_BUTTONS)) {
            assertNoForbidden(val, `JP_GUIDE_BUTTONS.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in header labels', () => {
        for (const [key, val] of Object.entries(JP_HEADER)) {
            assertNoForbidden(val, `JP_HEADER.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in lens labels', () => {
        for (const [key, val] of Object.entries(JP_LENSES)) {
            assertNoForbidden(val, `JP_LENSES.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in value kind labels', () => {
        for (const [key, val] of Object.entries(JP_VALUE_KINDS)) {
            assertNoForbidden(val, `JP_VALUE_KINDS.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in view mode labels', () => {
        for (const [key, val] of Object.entries(JP_VIEW_MODES)) {
            assertNoForbidden(val, `JP_VIEW_MODES.${key}`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in tab labels', () => {
        for (const [key, val] of Object.entries(JP_TABS)) {
            assertNoForbidden(val, `JP_TABS.${key}`, FORBIDDEN_JA);
        }
    });
});

// ── valueKindLabelsJa copy guard ──────────────────────────────────────────────

describe('japaneseCopyGuard: valueKindLabelsJa', () => {
    it('no forbidden JA in jaLabel', () => {
        for (const item of VALUE_KIND_LABELS_JA) {
            assertNoForbidden(item.jaLabel, `valueKindLabelsJa[${item.kind}].jaLabel`, FORBIDDEN_JA);
        }
    });

    it('no forbidden JA in tooltipJa', () => {
        for (const item of VALUE_KIND_LABELS_JA) {
            assertNoForbidden(
                item.tooltipJa,
                `valueKindLabelsJa[${item.kind}].tooltipJa`,
                FORBIDDEN_JA,
            );
        }
    });

    it('no forbidden EN in tooltipJa', () => {
        for (const item of VALUE_KIND_LABELS_JA) {
            assertNoForbidden(
                item.tooltipJa,
                `valueKindLabelsJa[${item.kind}].tooltipJa`,
                FORBIDDEN_EN,
            );
        }
    });
});
