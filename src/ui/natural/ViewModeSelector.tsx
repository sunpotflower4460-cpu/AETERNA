/**
 * ViewModeSelector.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — View Mode Selector
 *
 * Renders a mode selector for the four view modes:
 * はじめて見る / 通常観測 / 研究者モード / 開発者モード
 *
 * Design principles:
 * - Japanese-first labels.
 * - Mode changes dispatch 'observation:viewModeChange' CustomEvent.
 * - Pure HTML string rendering — no React JSX.
 * - All content is XSS-safe via _esc().
 * - No consciousness/life/intelligence proof claims.
 *
 * Reference: docs/japanese-first-ui.md §2
 */

// ── ViewMode ──────────────────────────────────────────────────────────────────

export type ViewMode = 'beginner' | 'normal' | 'researcher' | 'developer';

// ── VIEW_MODE_DEFINITIONS ─────────────────────────────────────────────────────

export interface ViewModeDefinition {
    id: ViewMode;
    label: string;
    description: string;
    /** What features are visible in this mode */
    features: string[];
}

export const VIEW_MODE_DEFINITIONS: ViewModeDefinition[] = [
    {
        id: 'beginner',
        label: 'はじめて見る',
        description: '最初に見る方向けの最小表示。場・セル・ガイドの基本だけを表示します。',
        features: [
            '今起きていること（要約パネル）',
            'トーラス場の表示',
            'セルをタップして観測',
            '観測ガイドに質問',
            '見る順番のナビ',
        ],
    },
    {
        id: 'normal',
        label: '通常観測',
        description: 'セル・レンズ・再生・ガイドを使った標準的な観測モード。',
        features: [
            'すべての「はじめて見る」機能',
            'セル観測パネル',
            '観測レンズ',
            '観測スナップショット再生',
            '観測ガイド',
        ],
    },
    {
        id: 'researcher',
        label: '研究者モード',
        description: '相関・差分・比率・エクスポート・詳細診断まで使える研究モード。',
        features: [
            'すべての「通常観測」機能',
            '層の相関',
            '関連候補',
            '差分表示',
            '観測比率',
            '研究エクスポート',
        ],
    },
    {
        id: 'developer',
        label: '開発者モード',
        description: '生ログ・設定・デバッグ・トレースに近いローレベル表示。',
        features: [
            'すべての「研究者モード」機能',
            '生ログ（raw log）',
            '設定（config）',
            'デバッグ表示',
            'トレース詳細',
        ],
    },
];

// ── ViewModeSelectorProps ─────────────────────────────────────────────────────

export interface ViewModeSelectorProps {
    /** Currently active view mode */
    activeMode: ViewMode;
    /** Whether to show mode descriptions */
    showDescriptions?: boolean;
}

// ── renderViewModeSelectorHTML ────────────────────────────────────────────────

/**
 * Render the view mode selector as an HTML string.
 *
 * @param props - ViewModeSelectorProps
 * @returns HTML string
 */
export function renderViewModeSelectorHTML(props: ViewModeSelectorProps): string {
    const { activeMode, showDescriptions = false } = props;

    const buttons = VIEW_MODE_DEFINITIONS.map((mode) => {
        const isActive = mode.id === activeMode;
        const activeClass = isActive ? ' view-mode-selector__btn--active' : '';
        const descHtml = showDescriptions && isActive
            ? `<div class="view-mode-selector__desc">${_esc(mode.description)}</div>`
            : '';
        return `<button
    class="view-mode-selector__btn${activeClass}"
    role="radio"
    aria-checked="${isActive}"
    data-mode="${_esc(mode.id)}"
    onclick="window.dispatchEvent(new CustomEvent('observation:viewModeChange',{detail:{mode:'${_esc(mode.id)}'}}))">
    <span class="view-mode-selector__btn-label">${_esc(mode.label)}</span>
    ${descHtml}
  </button>`;
    }).join('\n  ');

    const activeDefinition = VIEW_MODE_DEFINITIONS.find((m) => m.id === activeMode);
    const featureListHtml = activeDefinition
        ? `<div class="view-mode-selector__features">
    <span class="view-mode-selector__features-label">このモードで表示されるもの:</span>
    <ul class="view-mode-selector__feature-list">
      ${activeDefinition.features.map((f) => `<li>${_esc(f)}</li>`).join('\n      ')}
    </ul>
  </div>`
        : '';

    return `<div class="view-mode-selector" role="radiogroup" aria-label="表示モード">
  <div class="view-mode-selector__buttons">
    ${buttons}
  </div>
  ${featureListHtml}
</div>`;
}

// ── getViewModeDefinition ─────────────────────────────────────────────────────

/**
 * Return the definition for a given view mode ID.
 */
export function getViewModeDefinition(mode: ViewMode): ViewModeDefinition | null {
    return VIEW_MODE_DEFINITIONS.find((m) => m.id === mode) ?? null;
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
