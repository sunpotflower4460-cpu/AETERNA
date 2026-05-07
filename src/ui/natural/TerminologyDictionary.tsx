/**
 * TerminologyDictionary.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — 観測用語辞典
 *
 * Built-in terminology dictionary for AETERNA observation terms.
 * Each entry includes: 何か / 何を見るための値か / 何ではないか /
 * 値が高い時 / 値が低い時.
 *
 * Design principles:
 * - Japanese-first explanations.
 * - No consciousness/life/intelligence proof claims.
 * - Pure HTML string rendering — no React JSX.
 * - All content is XSS-safe via _esc().
 *
 * Reference: docs/japanese-first-ui.md §6
 */

// ── TermEntry ─────────────────────────────────────────────────────────────────

export interface TermEntry {
    id: string;
    /** Japanese term name */
    term: string;
    /** English term name (for reference) */
    termEn?: string;
    /** 何か — what this term refers to */
    what: string;
    /** 何を見るための値か — what observable it measures */
    purpose: string;
    /** 何ではないか — what it explicitly is NOT */
    isNotWhat: string;
    /** 値が高い時に見ること (optional) */
    whenHigh?: string;
    /** 値が低い時に見ること (optional) */
    whenLow?: string;
}

// ── TERMINOLOGY ───────────────────────────────────────────────────────────────

export const TERMINOLOGY: TermEntry[] = [
    {
        id: 'field',
        term: '場',
        termEn: 'Field',
        what: 'トーラス上に広がる複素スカラー場。各セルに複素数値（振幅・位相）を持ちます。',
        purpose: '場全体の流れ・変化・パターンを観測するための基盤です。',
        isNotWhat: '意識・知性・生命の場ではありません。数学的な場の観測です。',
    },
    {
        id: 'cell',
        term: 'セル',
        termEn: 'Cell',
        what: 'トーラス場をグリッド分割した最小単位。各セルに観測値が格納されています。',
        purpose: '特定の位置での観測値を詳しく見るための単位です。',
        isNotWhat: '生物細胞ではありません。グリッドの格子点です。',
    },
    {
        id: 'phase',
        term: '位相',
        termEn: 'Phase',
        what: '複素スカラー場の複素数値の角度（−π〜+π）。',
        purpose: '場の波の「向き」を観測します。位相の回り込みは渦候補の手がかりになります。',
        isNotWhat: '感情・意識・時間ではありません。数学的な複素位相です。',
        whenHigh: '位相が +π 方向に近い。',
        whenLow: '位相が −π 方向に近い。',
    },
    {
        id: 'amplitude',
        term: '振幅',
        termEn: 'Amplitude',
        what: '複素スカラー場の大きさ（絶対値）。',
        purpose: '場の強度・エネルギー分布を観測します。',
        isNotWhat: '活性度・覚醒度・感情ではありません。場の値の大きさです。',
        whenHigh: '場の強度が高い状態。',
        whenLow: '場が静止に近い状態。',
    },
    {
        id: 'vortex-candidate',
        term: '渦候補',
        termEn: 'Vortex Candidate',
        what: '位相の巻き込み（位相欠陥）の候補。位相が一周巻き込む点の近傍に現れます。',
        purpose: '位相の位相欠陥候補を観測し、その信頼度を補助指標として示します。',
        isNotWhat: '意識の中心でも、生命のしるしでもありません。位相の数学的な特性です。',
        whenHigh: '渦候補の信頼度が高い。位相欠陥の可能性があります。',
        whenLow: '渦候補の信頼度が低い。',
    },
    {
        id: 'membrane',
        term: '膜',
        termEn: 'Membrane',
        what: '観測側が設定する境界層。actuation（外向き）と return imprint（内向き）の重なりを追跡します。',
        purpose: '場の境界特性（変形・張力・透過性）を観測します。',
        isNotWhat: '生物細胞の膜ではありません。観測側の抽象的な境界モデルです。',
    },
    {
        id: 'plasticity-trace',
        term: '媒質履歴',
        termEn: 'Weak Plasticity Trace',
        what: '流れが繰り返し通った場所に残る弱い痕跡の累積値。',
        purpose: '場のどこに繰り返し流れが通ったかという「通り道の履歴候補」を観測します。',
        isNotWhat: '学習・記憶・シナプス荷重ではありません。場の通り道の観測履歴候補です。',
        whenHigh: 'この場所は繰り返し流れが通っています。',
        whenLow: 'この場所への流れは少ない状態です。',
    },
    {
        id: 'observed-ratio',
        term: '観測比率',
        termEn: 'Observed Ratio',
        what: '観測値から導出した比率を、参照値と比較したもの。',
        purpose: '場の比率的なパターンを観測します。',
        isNotWhat: '共鳴・意味・生命の共鳴比率ではありません。観測側の比率比較です。',
        whenHigh: '参照比率との一致度が高い状態。',
        whenLow: '参照比率との一致度が低い状態。',
    },
    {
        id: 'proxy',
        term: '補助指標',
        termEn: 'Proxy',
        what: '直接測定できない量を間接的に推定するための指標。',
        purpose: '観測量の推定値を提供します。',
        isNotWhat: '直接測定値ではありません。間接的な推定値です。証明ではありません。',
    },
    {
        id: 'derived',
        term: '導出値',
        termEn: 'Derived',
        what: '複数の生の観測値から計算した値。',
        purpose: '生の値から意味のある複合指標を導出します。',
        isNotWhat: '直接測定値ではありません。計算で得られた値です。',
    },
    {
        id: 'reference',
        term: '参照値',
        termEn: 'Reference',
        what: '比較の基準として用いる値。実験設定やベースラインから取得します。',
        purpose: '現在の観測値を基準値と比較するために使います。',
        isNotWhat: '絶対的な正解値ではありません。比較基準としての参照値です。',
    },
    {
        id: 'causal-trace',
        term: '関連候補',
        termEn: 'Causal Trace',
        what: '複数の観測指標の間で見られる統計的な関連のパターン。',
        purpose: '観測値がどのように変化しているかの関連候補を確認します。',
        isNotWhat: '因果の証明ではありません。相関パターンの観測です。',
    },
    {
        id: 'layer-correlation',
        term: '層の相関',
        termEn: 'Layer Correlation',
        what: '複数の観測層（field, vortex, membrane など）間のピアソン相関係数。',
        purpose: '複数の観測指標の統計的な関係パターンを確認します。',
        isNotWhat: '因果の証明ではありません。統計的なパターン観測です。',
        whenHigh: '2つの指標が同じ方向に変化する傾向があります。',
        whenLow: '2つの指標の変化に統計的な関連が少ない状態です。',
    },
];

// ── TerminologyDictionaryProps ────────────────────────────────────────────────

export interface TerminologyDictionaryProps {
    /** Filter to show only entries matching a term ID or term string */
    filter?: string;
}

// ── renderTerminologyDictionaryHTML ───────────────────────────────────────────

/**
 * Render the terminology dictionary as an HTML string.
 *
 * @param props - TerminologyDictionaryProps
 * @returns HTML string
 */
export function renderTerminologyDictionaryHTML(props: TerminologyDictionaryProps = {}): string {
    const { filter } = props;

    const entries = filter
        ? TERMINOLOGY.filter(
            (e) =>
                e.id.includes(filter.toLowerCase()) ||
                e.term.includes(filter) ||
                (e.termEn ?? '').toLowerCase().includes(filter.toLowerCase()),
        )
        : TERMINOLOGY;

    if (entries.length === 0) {
        return `<div class="terminology-dictionary terminology-dictionary--empty">
  <p class="terminology-dictionary__empty-msg">「${_esc(filter ?? '')}」に一致する用語が見つかりませんでした。</p>
</div>`;
    }

    const entriesHtml = entries.map((entry) => {
        const whenHighHtml = entry.whenHigh
            ? `<div class="terminology-dictionary__when-high">
      <span class="terminology-dictionary__when-label">値が高い時:</span>
      <span>${_esc(entry.whenHigh)}</span>
    </div>`
            : '';
        const whenLowHtml = entry.whenLow
            ? `<div class="terminology-dictionary__when-low">
      <span class="terminology-dictionary__when-label">値が低い時:</span>
      <span>${_esc(entry.whenLow)}</span>
    </div>`
            : '';
        const termEnHtml = entry.termEn
            ? `<span class="terminology-dictionary__term-en">(${_esc(entry.termEn)})</span>`
            : '';

        return `<div class="terminology-dictionary__entry" data-term-id="${_esc(entry.id)}">
  <div class="terminology-dictionary__term-header">
    <span class="terminology-dictionary__term">${_esc(entry.term)}</span>
    ${termEnHtml}
  </div>
  <div class="terminology-dictionary__what">
    <span class="terminology-dictionary__section-label">何か:</span>
    <span>${_esc(entry.what)}</span>
  </div>
  <div class="terminology-dictionary__purpose">
    <span class="terminology-dictionary__section-label">何を見るための値か:</span>
    <span>${_esc(entry.purpose)}</span>
  </div>
  <div class="terminology-dictionary__is-not-what">
    <span class="terminology-dictionary__section-label">何ではないか:</span>
    <span>${_esc(entry.isNotWhat)}</span>
  </div>
  ${whenHighHtml}
  ${whenLowHtml}
</div>`;
    }).join('\n');

    return `<div class="terminology-dictionary" aria-label="観測用語辞典">
  <div class="terminology-dictionary__header">
    <span class="terminology-dictionary__title">観測用語辞典</span>
    <small class="terminology-dictionary__note">${_esc(entries.length)} 件</small>
  </div>
  <div class="terminology-dictionary__entries">
    ${entriesHtml}
  </div>
</div>`;
}

// ── getTermEntry ──────────────────────────────────────────────────────────────

/**
 * Return a single term entry by ID, or null if not found.
 */
export function getTermEntry(id: string): TermEntry | null {
    return TERMINOLOGY.find((e) => e.id === id) ?? null;
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
