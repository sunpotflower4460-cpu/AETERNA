/**
 * BeginnerHomePanel.tsx
 * AETERNA-NATURAL v2.5 — Beginner Home Panel
 *
 * Headless HTML-string renderer for the beginner home panel.
 * No JSX — pure template literal rendering.
 */

import type { OnboardingProgressState } from '../../state/onboardingProgressState.js';

export interface BeginnerHomePanelProps {
  onboardingState?: OnboardingProgressState;
}

export function renderBeginnerHomePanelHTML(props: BeginnerHomePanelProps): string {
  const { onboardingState } = props;

  const progressNote = onboardingState
    ? `<p class="beginner-home-panel__progress-note">進捗: ${_esc(onboardingState.completedStepIds.length)} / 10 ステップ完了</p>`
    : '';

  return `<div class="beginner-home-panel" role="region" aria-label="はじめに">
  <h2 class="beginner-home-panel__title">はじめに</h2>
  ${progressNote}

  <section class="beginner-home-panel__section">
    <h3>AETERNA-NATURALとは</h3>
    <p>トーラス場の変化を観測する研究装置です。</p>
  </section>

  <section class="beginner-home-panel__section">
    <h3>まずやること</h3>
    <ul class="beginner-home-panel__list">
      <li>Safe Baseline を始める</li>
      <li>気になるセルをタップする</li>
      <li>観測ガイドに聞く</li>
    </ul>
  </section>

  <section class="beginner-home-panel__section">
    <h3>おすすめ観測ルート</h3>
    <a class="beginner-home-panel__route-link" data-panel="route" href="#route" role="button">観測ルートを見る</a>
  </section>

  <section class="beginner-home-panel__section">
    <h3>用語辞典</h3>
    <a class="beginner-home-panel__glossary-link" data-panel="glossary" href="#glossary" role="button">用語辞典を開く</a>
  </section>

  <section class="beginner-home-panel__section beginner-home-panel__not-list-section">
    <h3>これは何ではないか</h3>
    <ul class="beginner-home-panel__not-list">
      <li>意識・生命・知性を証明するものではありません</li>
      <li>霊的なシステムではありません</li>
      <li>LLM・外部API呼び出しはありません</li>
      <li>結果を保証するものではありません</li>
    </ul>
  </section>

  <div class="beginner-home-panel__footer">
    <button class="beginner-home-panel__safe-reset" type="button" data-action="safe-reset">迷ったら Safe Baseline に戻す</button>
  </div>
</div>`;
}

function _esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
