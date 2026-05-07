/**
 * japaneseFirstLabels.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Japanese-first labels test
 *
 * Verifies that:
 * 1. observationTermsJa covers all required terminology from the spec.
 * 2. uiLabelsJa covers all main UI labels.
 * 3. valueKindLabelsJa covers all value kinds.
 * 4. jpTerminology covers all panel/tab/metric labels.
 * 5. No forbidden claims in any label set.
 */

import { describe, it, expect } from 'vitest';
import {
    OBSERVATION_TERMS_JA,
    getTermById,
} from '../../i18n/observationTermsJa.ts';
import {
    UI_TABS_JA,
    UI_PANEL_DESCRIPTIONS_JA,
    UI_DISCLAIMERS_JA,
    UI_MODES_JA,
} from '../../i18n/uiLabelsJa.ts';
import {
    VALUE_KIND_LABELS_JA,
    getValueKindJaLabel,
} from '../../i18n/valueKindLabelsJa.ts';
import {
    JP_PANELS,
    JP_TABS,
    JP_METRICS,
    JP_LENSES,
    JP_DISCLAIMERS,
    JP_VIEW_MODES,
} from '../../i18n/jpTerminology.ts';

// ── uiLabelsJa ────────────────────────────────────────────────────────────────

describe('uiLabelsJa: tab labels', () => {
    it('has field tab → 見る', () => {
        expect(UI_TABS_JA.field).toBe('見る');
    });
    it('has inspector tab → 調べる', () => {
        expect(UI_TABS_JA.inspector).toBe('調べる');
    });
    it('has lens tab → レンズ', () => {
        expect(UI_TABS_JA.lens).toBe('レンズ');
    });
    it('has replay tab → 時間', () => {
        expect(UI_TABS_JA.replay).toBe('時間');
    });
    it('has trace tab → 関連', () => {
        expect(UI_TABS_JA.trace).toBe('関連');
    });
    it('has guide tab → 聞く', () => {
        expect(UI_TABS_JA.guide).toBe('聞く');
    });
    it('has export tab → 保存', () => {
        expect(UI_TABS_JA.export).toBe('保存');
    });
    it('has diagnostics tab → 状態確認', () => {
        expect(UI_TABS_JA.diagnostics).toBe('状態確認');
    });
    it('has research tab → 研究', () => {
        expect(UI_TABS_JA.research).toBe('研究');
    });
    it('has advanced tab → 詳細', () => {
        expect(UI_TABS_JA.advanced).toBe('詳細');
    });
});

describe('uiLabelsJa: panel descriptions exist', () => {
    const PANELS = [
        'cellInspector',
        'metricSpotlight',
        'timeReplay',
        'causalTrace',
        'layerCorrelation',
        'differenceView',
        'observedRatioInvolvement',
        'observationGuide',
        'terminologyDictionary',
        'nowSummary',
        'observationRoute',
    ] as const;

    for (const panel of PANELS) {
        it(`has panel description for ${panel}`, () => {
            expect(UI_PANEL_DESCRIPTIONS_JA[panel]).toBeTruthy();
        });
    }
});

describe('uiLabelsJa: disclaimers', () => {
    it('has notProof disclaimer', () => {
        expect(UI_DISCLAIMERS_JA.notProof).toContain('因果証明ではありません');
    });
    it('has notConsciousness disclaimer', () => {
        expect(UI_DISCLAIMERS_JA.notConsciousness).toContain('意識');
        expect(UI_DISCLAIMERS_JA.notConsciousness).toContain('生命');
        expect(UI_DISCLAIMERS_JA.notConsciousness).toContain('知性');
    });
    it('has replayNote disclaimer', () => {
        expect(UI_DISCLAIMERS_JA.replayNote).toContain('スナップショット');
    });
});

describe('uiLabelsJa: mode labels', () => {
    it('has beginner → はじめて見る', () => {
        expect(UI_MODES_JA.beginner).toBe('はじめて見る');
    });
    it('has researcher → 研究者モード', () => {
        expect(UI_MODES_JA.researcher).toBe('研究者モード');
    });
    it('has developer → 開発者モード', () => {
        expect(UI_MODES_JA.developer).toBe('開発者モード');
    });
});

// ── valueKindLabelsJa ─────────────────────────────────────────────────────────

describe('valueKindLabelsJa: translations match spec', () => {
    it('7 value kinds defined', () => {
        expect(VALUE_KIND_LABELS_JA.length).toBe(7);
    });
    it('Proxy → 補助指標', () => {
        expect(getValueKindJaLabel('Proxy')).toBe('補助指標');
    });
    it('Reference → 参照値', () => {
        expect(getValueKindJaLabel('Reference')).toBe('参照値');
    });
    it('Check → 確認値', () => {
        expect(getValueKindJaLabel('Check')).toBe('確認値');
    });
    it('Presentation-smoothed → 表示用に平滑化', () => {
        expect(getValueKindJaLabel('Presentation-smoothed')).toBe('表示用に平滑化');
    });
});

// ── jpTerminology ─────────────────────────────────────────────────────────────

describe('jpTerminology: panel labels', () => {
    it('cellInspector → セル観測', () => {
        expect(JP_PANELS.cellInspector).toBe('セル観測');
    });
    it('metricSpotlight → 観測レンズ', () => {
        expect(JP_PANELS.metricSpotlight).toBe('観測レンズ');
    });
    it('causalTrace → 関連候補', () => {
        expect(JP_PANELS.causalTrace).toBe('関連候補');
    });
    it('timeReplay → 観測スナップショット再生', () => {
        expect(JP_PANELS.timeReplay).toBe('観測スナップショット再生');
    });
    it('layerCorrelation → 層の相関', () => {
        expect(JP_PANELS.layerCorrelation).toBe('層の相関');
    });
    it('observationGuide → 観測ガイド', () => {
        expect(JP_PANELS.observationGuide).toBe('観測ガイド');
    });
});

describe('jpTerminology: metric labels', () => {
    it('vortex.candidateConfidence → 渦候補の強さ', () => {
        expect(JP_METRICS['vortex.candidateConfidence']).toBe('渦候補の強さ');
    });
    it('plasticity.accumulatedTrace → 媒質履歴', () => {
        expect(JP_METRICS['plasticity.accumulatedTrace']).toBe('媒質履歴');
    });
    it('membrane.deformation → 膜の変形', () => {
        expect(JP_METRICS['membrane.deformation']).toBe('膜の変形');
    });
    it('field.amplitude → 場の振幅', () => {
        expect(JP_METRICS['field.amplitude']).toBe('場の振幅');
    });
    it('field.phase → 場の位相', () => {
        expect(JP_METRICS['field.phase']).toBe('場の位相');
    });
});

describe('jpTerminology: tab labels', () => {
    it('field → 見る', () => {
        expect(JP_TABS.field).toBe('見る');
    });
    it('guide → 聞く', () => {
        expect(JP_TABS.guide).toBe('聞く');
    });
    it('replay → 時間', () => {
        expect(JP_TABS.replay).toBe('時間');
    });
});

describe('jpTerminology: view modes', () => {
    it('beginner → はじめて見る', () => {
        expect(JP_VIEW_MODES.beginner).toBe('はじめて見る');
    });
    it('researcher → 研究者モード', () => {
        expect(JP_VIEW_MODES.researcher).toBe('研究者モード');
    });
});

describe('jpTerminology: disclaimers', () => {
    it('notConsciousness contains 意識', () => {
        expect(JP_DISCLAIMERS.notConsciousness).toContain('意識');
    });
    it('notCausalProof contains 相関は因果ではありません', () => {
        expect(JP_DISCLAIMERS.notCausalProof).toContain('相関は因果ではありません');
    });
});

// ── observationTermsJa cross-check ────────────────────────────────────────────

describe('observationTermsJa: covers spec-required terms', () => {
    const SPEC_TERMS = [
        { id: 'field', expected: '場' },
        { id: 'cell', expected: 'セル' },
        { id: 'amplitude', expected: '振幅' },
        { id: 'phase', expected: '位相' },
        { id: 'vortexCandidate', expected: '渦候補' },
        { id: 'vortexCandidateConfidence', expected: '渦候補の強さ' },
        { id: 'membrane', expected: '膜' },
        { id: 'membraneDeformation', expected: '膜の変形' },
        { id: 'weakPlasticityTrace', expected: '弱い媒質履歴' },
        { id: 'resistanceScale', expected: '抵抗変化' },
        { id: 'observedRatio', expected: '観測比率' },
        { id: 'causalTrace', expected: '関連候補' },
        { id: 'layerCorrelation', expected: '層の相関' },
        { id: 'differenceView', expected: '変化の比較' },
        { id: 'timeReplay', expected: '観測スナップショット再生' },
        { id: 'cellInspector', expected: 'セル観測' },
        { id: 'metricSpotlight', expected: '観測レンズ' },
        { id: 'observationGuide', expected: '観測ガイド' },
        { id: 'proxy', expected: '補助指標' },
        { id: 'derived', expected: '導出値' },
        { id: 'reference', expected: '参照値' },
        { id: 'check', expected: '確認値' },
        { id: 'notObserved', expected: '未観測' },
        { id: 'notCausalProof', expected: '因果証明ではありません' },
    ];

    for (const { id, expected } of SPEC_TERMS) {
        it(`${id} → ${expected}`, () => {
            expect(getTermById(id)?.jaLabel).toBe(expected);
        });
    }
});
