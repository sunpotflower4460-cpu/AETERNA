/**
 * ObservationRouteGuide.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — "見る順番" Observation Route Guide
 *
 * Provides a step-by-step "recommended observation route" navigation hint.
 * Each step corresponds to a UI action the user can take.
 *
 * Design principles:
 * - Japanese-first labels.
 * - Steps advance dynamically based on current observation state.
 * - Pure HTML string rendering — no React JSX.
 * - All content is XSS-safe via _esc().
 * - No consciousness/life/intelligence proof claims.
 *
 * Reference: docs/japanese-first-ui.md §4
 */

// ── ObservationRouteStep ──────────────────────────────────────────────────────

export interface ObservationRouteStep {
    id: string;
    label: string;
    description: string;
    /** CustomEvent name to dispatch when this step's action button is clicked */
    actionEvent?: string;
    actionEventDetail?: Record<string, unknown>;
    actionLabel?: string;
}

// ── OBSERVATION_ROUTE_STEPS ───────────────────────────────────────────────────

/**
 * The canonical observation route — 8 steps.
 */
export const OBSERVATION_ROUTE_STEPS: ObservationRouteStep[] = [
    {
        id: 'view-field',
        label: '1. 場全体を見る',
        description: 'トーラス場全体の流れや色のパターンを観察します。',
        actionLabel: '場を見る',
    },
    {
        id: 'tap-cell',
        label: '2. 気になる場所をタップする',
        description: '気になるセルをタップするとセル観測が開きます。',
        actionLabel: 'セルを選ぶ',
    },
    {
        id: 'inspect-cell',
        label: '3. セルの値を見る',
        description: '選択したセルの観測値（振幅・位相・渦候補など）を確認します。',
        actionLabel: 'セル観測を開く',
        actionEvent: 'observation:tabChange',
        actionEventDetail: { tab: 'inspector' },
    },
    {
        id: 'activate-lens',
        label: '4. レンズで可視化する',
        description: '観測値の行をクリックしてレンズを起動します。場の変化を色で見られます。',
        actionLabel: 'レンズを開く',
        actionEvent: 'observation:tabChange',
        actionEventDetail: { tab: 'lens' },
    },
    {
        id: 'use-replay',
        label: '5. 時間を戻して変化を見る',
        description: '再生スライダーで過去のスナップショットを表示します。変化の過程を確認します。',
        actionLabel: '時間を開く',
        actionEvent: 'observation:tabChange',
        actionEventDetail: { tab: 'replay' },
    },
    {
        id: 'view-trace',
        label: '6. 関連候補を見る',
        description: '関連候補パネルで、複数の観測値がどう関連しているかを確認します。',
        actionLabel: '関連を開く',
        actionEvent: 'observation:tabChange',
        actionEventDetail: { tab: 'trace' },
    },
    {
        id: 'ask-guide',
        label: '7. 観測ガイドに聞く',
        description: '「これなに？」「どう仮説できる？」など、観測ガイドに質問できます。',
        actionLabel: 'ガイドを開く',
        actionEvent: 'observation:tabChange',
        actionEventDetail: { tab: 'guide' },
    },
    {
        id: 'export',
        label: '8. 結果を書き出す',
        description: '観測結果をエクスポートして記録に残します。',
        actionLabel: '書き出す',
    },
];

// ── ObservationRouteGuideProps ────────────────────────────────────────────────

export interface ObservationRouteGuideProps {
    /** Index of the recommended next step (0-based). null = show full list */
    currentStepIndex?: number | null;
    /** Whether to show only the "next recommended" step (compact mode) */
    compact?: boolean;
}

// ── buildNextStepHint ─────────────────────────────────────────────────────────

/**
 * Return the "next recommended" hint string based on current step index.
 */
export function buildNextStepHint(currentStepIndex: number): string {
    const next = OBSERVATION_ROUTE_STEPS[currentStepIndex + 1];
    if (!next) return 'すべてのステップを完了しました。';
    return `次におすすめ：${next.label}`;
}

// ── renderObservationRouteGuideHTML ───────────────────────────────────────────

/**
 * Render the observation route guide as an HTML string.
 *
 * @param props - ObservationRouteGuideProps
 * @returns HTML string
 */
export function renderObservationRouteGuideHTML(props: ObservationRouteGuideProps = {}): string {
    const { currentStepIndex = null, compact = false } = props;

    if (compact && currentStepIndex !== null) {
        const current = OBSERVATION_ROUTE_STEPS[currentStepIndex];
        if (!current) {
            return `<div class="observation-route-guide observation-route-guide--compact">
  <span class="observation-route-guide__done">観測ルートを完了しました。</span>
</div>`;
        }
        const nextHint = buildNextStepHint(currentStepIndex);
        return `<div class="observation-route-guide observation-route-guide--compact">
  <span class="observation-route-guide__current-step">${_esc(current.label)}</span>
  <span class="observation-route-guide__description">${_esc(current.description)}</span>
  <span class="observation-route-guide__next-hint">${_esc(nextHint)}</span>
</div>`;
    }

    const stepsHtml = OBSERVATION_ROUTE_STEPS.map((step, idx) => {
        const isCurrent = idx === currentStepIndex;
        const activeClass = isCurrent ? ' observation-route-guide__step--active' : '';
        const actionBtn = step.actionEvent
            ? `<button class="observation-route-guide__step-action"
        onclick="window.dispatchEvent(new CustomEvent('${_esc(step.actionEvent)}',{detail:${JSON.stringify(step.actionEventDetail ?? {})}}))">
        ${_esc(step.actionLabel ?? step.label)}
      </button>`
            : '';
        return `<div class="observation-route-guide__step${activeClass}" data-step-id="${_esc(step.id)}">
    <span class="observation-route-guide__step-label">${_esc(step.label)}</span>
    <span class="observation-route-guide__step-desc">${_esc(step.description)}</span>
    ${actionBtn}
  </div>`;
    }).join('\n  ');

    return `<div class="observation-route-guide" aria-label="おすすめ観測ルート">
  <div class="observation-route-guide__header">
    <span class="observation-route-guide__title">おすすめ観測ルート</span>
  </div>
  <div class="observation-route-guide__steps">
    ${stepsHtml}
  </div>
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
