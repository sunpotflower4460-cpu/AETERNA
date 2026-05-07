/**
 * LensDescriptionPanel.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — Lens Description Panel
 *
 * Renders a per-lens "何を見るレンズか" description panel in Japanese.
 * Shown when a lens is activated, before the detailed value display.
 *
 * Design principles:
 * - Japanese-first description.
 * - Each lens has: 概要 / 何を見るか / 何ではないか.
 * - No consciousness/life/intelligence proof claims.
 * - Pure HTML string rendering — no React JSX.
 * - All content is XSS-safe via _esc().
 *
 * Reference: docs/japanese-first-ui.md §5
 */

import type { MetricLensId } from '../lens/metricLensRegistry.ts';

// ── LensDescription ───────────────────────────────────────────────────────────

export interface LensDescription {
    lensId: MetricLensId;
    /** Japanese lens name */
    nameJp: string;
    /** What this lens observes — Japanese, 1-2 sentences */
    whatItSees: string;
    /** What this lens is NOT — Japanese, 1-2 sentences */
    whatItIsNot: string;
    /** High value observation hint */
    highValueNote?: string;
    /** Low value observation hint */
    lowValueNote?: string;
}

// ── LENS_DESCRIPTIONS ─────────────────────────────────────────────────────────

export const LENS_DESCRIPTIONS: Record<MetricLensId, LensDescription> = {
    gaussianCurvature: {
        lensId: 'gaussianCurvature',
        nameJp: 'ガウス曲率レンズ',
        whatItSees: 'このレンズは、トーラス面の各セルでの幾何学的な曲がり具合を色で示します。外側（正）と内側（負）で符号が変わります。',
        whatItIsNot: '活動量や意識・エネルギーの指標ではありません。純粋な幾何学量です。',
        highValueNote: '外側リムに近い場所を示しています。',
        lowValueNote: '内側リムに近い場所を示しています。',
    },
    areaElement: {
        lensId: 'areaElement',
        nameJp: '面積要素レンズ',
        whatItSees: 'このレンズは、各グリッドセルが占める局所的な面積（外側ほど大きい）を色で示します。',
        whatItIsNot: 'フローや活動量の指標ではありません。幾何学的な面積のみです。',
        highValueNote: '外側リムで面積が大きくなっています。',
        lowValueNote: '内側リムで面積が小さくなっています。',
    },
    innerOuterBias: {
        lensId: 'innerOuterBias',
        nameJp: '内外バイアスレンズ',
        whatItSees: 'このレンズは、各セルがトーラスの外側（+1）か内側（−1）かを色で示します。',
        whatItIsNot: '意味的・機能的な優劣を示すものではありません。位置の幾何学的指標です。',
        highValueNote: '外側リム付近のセルです。',
        lowValueNote: '内側リム付近のセルです。',
    },
    fieldAmplitude: {
        lensId: 'fieldAmplitude',
        nameJp: '場の振幅レンズ',
        whatItSees: 'このレンズは、複素スカラー場の振幅を色で示します。値が大きい場所では場の強度が高い状態です。',
        whatItIsNot: '生物学的な活性度や意識の指標ではありません。場の値そのものです。',
        highValueNote: '場の強度が高い状態です。',
        lowValueNote: '場の強度が低い、静止に近い状態です。',
    },
    fieldPhase: {
        lensId: 'fieldPhase',
        nameJp: '位相レンズ',
        whatItSees: 'このレンズは、複素スカラー場の位相（−π〜π）を色で見ます。色の回り込みがある場所では渦候補が出ることがあります。',
        whatItIsNot: '感情や意味ではありません。数学的な位相の観測です。',
        highValueNote: '位相が +π 方向に近い状態です。',
        lowValueNote: '位相が −π 方向に近い状態です。',
    },
    phaseCoherence: {
        lensId: 'phaseCoherence',
        nameJp: '局所位相コヒーレンスレンズ',
        whatItSees: 'このレンズは、隣接セルとの位相の一致度（0〜1）を見ます。値が高い場所では位相が揃っています。',
        whatItIsNot: '高コヒーレンスは意識・同期・秩序の証明ではありません。位相類似度の導出値です。',
        highValueNote: '周囲と位相が揃っている状態です。',
        lowValueNote: '周囲と位相が乱れている状態です。',
    },
    flowContinuity: {
        lensId: 'flowContinuity',
        nameJp: '局所流れ連続性レンズ',
        whatItSees: 'このレンズは、振幅の勾配がどれだけ滑らかか（局所連続性）を示します。高い場所では振幅が緩やかに変化しています。',
        whatItIsNot: '生物学的・意識的な流れではありません。振幅の勾配的な滑らかさです。',
        highValueNote: '振幅が滑らかに変化しています。',
        lowValueNote: '振幅が急激に変化しています。',
    },
    energyThroughput: {
        lensId: 'energyThroughput',
        nameJp: '局所エネルギー通量レンズ',
        whatItSees: 'このレンズは、振幅 × 流れ連続性の積（導出値）を示します。振幅が高く流れが滑らかな場所で値が大きくなります。',
        whatItIsNot: '生物学的・意識的なエネルギーではありません。導出補助指標です。',
        highValueNote: '振幅が高く流れが滑らかな状態です。',
        lowValueNote: '振幅が低いか流れが不連続な状態です。',
    },
    vortexConfidence: {
        lensId: 'vortexConfidence',
        nameJp: '渦候補レンズ',
        whatItSees: 'このレンズは、位相の欠陥（渦候補）がこのセル付近に存在する観測側の信頼度（0〜1）を示します。',
        whatItIsNot: '渦候補は意識の中心でも生命のしるしでもありません。補助指標（proxy）です。',
        highValueNote: '渦候補の信頼度が高い状態です。近くに位相欠陥の可能性があります。',
        lowValueNote: '渦候補の信頼度が低い状態です。',
    },
    topologicalCharge: {
        lensId: 'topologicalCharge',
        nameJp: 'トポロジカル電荷レンズ',
        whatItSees: 'このレンズは、位相巻き数から導出したトポロジカル電荷（+1, 0, −1）を示します。',
        whatItIsNot: '電気的・意味的な電荷ではありません。位相のトポロジカルな特性です。',
        highValueNote: '+1 の渦（正位相巻き）候補です。',
        lowValueNote: '−1 の渦（負位相巻き）候補です。',
    },
    membraneDeformation: {
        lensId: 'membraneDeformation',
        nameJp: '膜変形レンズ',
        whatItSees: 'このレンズは、観測側の膜変形量（0〜1）を示します。',
        whatItIsNot: '生物学的な細胞膜の変形ではありません。観測側の状態値です。',
        highValueNote: '膜変形が大きい状態です。',
        lowValueNote: '膜変形が小さい（安定した）状態です。',
    },
    membraneTension: {
        lensId: 'membraneTension',
        nameJp: '膜張力レンズ',
        whatItSees: 'このレンズは、観測側の膜の張力（0〜1）を示します。',
        whatItIsNot: '物理的な張力ではありません。観測側の状態値です。',
        highValueNote: '膜張力が高い状態です。',
        lowValueNote: '膜張力が低い（弛緩した）状態です。',
    },
    membranePermeability: {
        lensId: 'membranePermeability',
        nameJp: '膜透過性レンズ',
        whatItSees: 'このレンズは、観測側の膜の透過性（0〜1）を示します。',
        whatItIsNot: '生物学的な透過性ではありません。観測側の状態値です。',
        highValueNote: '透過性が高い状態です。',
        lowValueNote: '透過性が低い（閉じた）状態です。',
    },
    twoSidedness: {
        lensId: 'twoSidedness',
        nameJp: '二面性レンズ',
        whatItSees: 'このレンズは、膜の actuations（外向き）と return imprints（内向き）の重なりを示します。',
        whatItIsNot: '生物学的な細胞膜の特性ではありません。観測側の導出値です。',
        highValueNote: '外向き・内向きの重なりが大きい状態です。',
        lowValueNote: '外向き・内向きの重なりが小さい状態です。',
    },
    plasticityTrace: {
        lensId: 'plasticityTrace',
        nameJp: '媒質履歴レンズ',
        whatItSees: 'このレンズは、流れが繰り返し通った場所に残る弱い痕跡（累積値）を見ます。これは意味記憶ではありません。場の通り道の履歴候補です。',
        whatItIsNot: '学習・記憶・シナプス荷重ではありません。観測側のトレース累積値です。',
        highValueNote: 'この場所は繰り返し流れが通っています。',
        lowValueNote: 'この場所への流れは少ない状態です。',
    },
    resistanceScale: {
        lensId: 'resistanceScale',
        nameJp: '抵抗スケールレンズ',
        whatItSees: 'このレンズは、セルの乗算的抵抗スケール係数（1.0 = 中立）を示します。',
        whatItIsNot: '物理的な抵抗や記憶荷重ではありません。導出スケール因子です。',
        highValueNote: '抵抗が高い（流れにくい）状態です。',
        lowValueNote: '抵抗が低い（流れやすい）状態です。',
    },
    observedRatioMatch: {
        lensId: 'observedRatioMatch',
        nameJp: '観測比率レンズ',
        whatItSees: 'このレンズは、参照比率との最強一致強度（0〜1）を示します。',
        whatItIsNot: '共鳴・生命・意識の証明ではありません。類似度の補助指標です。',
        highValueNote: '参照比率との一致度が高い状態です。',
        lowValueNote: '参照比率との一致度が低い状態です。',
    },
};

// ── LensDescriptionPanelProps ─────────────────────────────────────────────────

export interface LensDescriptionPanelProps {
    /** The active lens ID */
    lensId: MetricLensId | null;
}

// ── renderLensDescriptionPanelHTML ────────────────────────────────────────────

/**
 * Render the lens description panel ("何を見るレンズか") as an HTML string.
 *
 * @param props - LensDescriptionPanelProps
 * @returns HTML string
 */
export function renderLensDescriptionPanelHTML(props: LensDescriptionPanelProps): string {
    const { lensId } = props;

    if (!lensId) {
        return `<div class="lens-description-panel lens-description-panel--empty">
  <p class="lens-description-panel__empty-msg">レンズが選択されていません。</p>
</div>`;
    }

    const desc = LENS_DESCRIPTIONS[lensId];
    if (!desc) {
        return `<div class="lens-description-panel lens-description-panel--unknown">
  <p class="lens-description-panel__unknown-msg">レンズ「${_esc(lensId)}」の説明が見つかりません。</p>
</div>`;
    }

    const highNote = desc.highValueNote
        ? `<div class="lens-description-panel__hint lens-description-panel__hint--high">
    <span class="lens-description-panel__hint-label">値が高いとき:</span>
    <span>${_esc(desc.highValueNote)}</span>
  </div>`
        : '';

    const lowNote = desc.lowValueNote
        ? `<div class="lens-description-panel__hint lens-description-panel__hint--low">
    <span class="lens-description-panel__hint-label">値が低いとき:</span>
    <span>${_esc(desc.lowValueNote)}</span>
  </div>`
        : '';

    return `<div class="lens-description-panel" data-lens-id="${_esc(lensId)}">
  <div class="lens-description-panel__header">
    <span class="lens-description-panel__name">${_esc(desc.nameJp)}</span>
  </div>
  <div class="lens-description-panel__what-it-sees">
    <span class="lens-description-panel__section-label">何を見るか</span>
    <p>${_esc(desc.whatItSees)}</p>
  </div>
  <div class="lens-description-panel__what-it-is-not">
    <span class="lens-description-panel__section-label">何ではないか</span>
    <p>${_esc(desc.whatItIsNot)}</p>
  </div>
  ${highNote}
  ${lowNote}
</div>`;
}

// ── _esc ──────────────────────────────────────────────────────────────────────

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
