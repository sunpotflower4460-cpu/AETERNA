/**
 * renderFirstObservationCard.ts
 *
 * Pure renderer for FirstObservationFlow's current stage, using the
 * exact copy from master spec §6.2-6.6. No DOM/state access — AppShell.ts
 * wires clicks and passes computed values in.
 */

import type { FirstObservationStage } from '../../app/onboarding/FirstObservationFlow.js';

const SIGMA_CHANGE_THRESHOLD = 0.02;

/**
 * Pure comparison of the sigma value read (via RuntimeSnapshot) just
 * before TOUCH_INVITED against the value read after REACTION_OBSERVED.
 * Only describes what was actually measured — "no change" is a valid,
 * expected, explicitly-supported result (master spec §6.5), not an
 * error state.
 */
export function deriveInsightText(baselineSigma: number | null, afterSigma: number | null): string {
  if (baselineSigma === null || afterSigma === null) {
    return '観測データを取得できませんでした。';
  }
  const delta = Math.abs(afterSigma - baselineSigma);
  if (delta < SIGMA_CHANGE_THRESHOLD) {
    return '今回の条件では、大きな変化は観測されませんでした。';
  }
  return `刺激の前後で場の指標（σ）に変化が観測されました（Δ${delta.toFixed(3)}）。`;
}

export function renderFirstObservationCardHTML(
  stage: FirstObservationStage,
  insightText: string | null
): string {
  switch (stage) {
    case 'WELCOME':
      return card(
        'トーラス状の場に現れる、流れ・揺らぎ・痕跡を触れながら観測する実験室です。',
        '<button type="button" class="first-observation-card__cta" data-action="start">最初の観測を始める</button>',
        '研究プロトタイプ｜観測は証明ではありません'
      );
    case 'BASELINE_OBSERVING':
      return card('まずは5秒だけ、触れずに場を見てみましょう。', '', null);
    case 'TOUCH_INVITED':
      return card('光の輪に触れて、場へ小さな刺激を与えてください。', '', null);
    case 'REACTION_OBSERVED':
      return card('観測しています…', '', null);
    case 'INSIGHT_PRESENTED':
      return card(
        insightText ?? '観測データを取得できませんでした。',
        '<button type="button" class="first-observation-card__cta" data-action="finish">続ける</button>',
        null
      );
    case 'FREE_EXPLORATION':
      return '';
  }
}

function card(bodyText: string, ctaHtml: string, noteText: string | null): string {
  const note = noteText
    ? `<p class="first-observation-card__note">${escapeHtml(noteText)}</p>`
    : '';
  return `
    <div class="first-observation-card" data-testid="first-observation-card">
      <p class="first-observation-card__body">${escapeHtml(bodyText)}</p>
      ${ctaHtml}
      ${note}
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
