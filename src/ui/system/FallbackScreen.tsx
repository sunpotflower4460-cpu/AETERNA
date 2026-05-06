/**
 * FallbackScreen.tsx
 * AETERNA-NATURAL v1.5 — Fallback Screen (headless model)
 *
 * Headless TypeScript model for the application fallback screen.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 *
 * Shown when the application fails to load or encounters a critical error.
 * Provides user-facing guidance with no fake observation values.
 *
 * Principles:
 * - No consciousness / life / intelligence claims.
 * - No fake fallback runtime results or observation values.
 * - No observer values fabricated during fallback state.
 *
 * Reference: docs/deployment-readiness.md §8
 */

// ── Fallback screen content ────────────────────────────────────────────────────

export const FALLBACK_SCREEN_TITLE_EN = 'AETERNA-NATURAL — Loading Error';
export const FALLBACK_SCREEN_TITLE_JA = 'AETERNA-NATURAL — 読み込みエラー';

export const FALLBACK_SCREEN_BODY_EN = [
  'The simulation could not be started.',
  'No observation values have been generated.',
].join('\n');

export const FALLBACK_SCREEN_BODY_JA = [
  'シミュレーションを開始できませんでした。',
  '観測値は生成されていません。',
].join('\n');

export const FALLBACK_SCREEN_ACTIONS_EN = [
  'Reload the page to try again.',
  'Use the "Return to Safe Baseline" button if available.',
  'Contact the project maintainer if the error persists.',
];

export const FALLBACK_SCREEN_ACTIONS_JA = [
  'ページを再読み込みして再試行してください。',
  '利用可能な場合は「Safe Baseline に戻す」ボタンを使用してください。',
  'エラーが続く場合はプロジェクトのメンテナーに連絡してください。',
];

export const FALLBACK_SCREEN_NO_FAKE_NOTE_EN =
  'Note: No fake observation values or results are shown during error state.';

export const FALLBACK_SCREEN_NO_FAKE_NOTE_JA =
  '注記：エラー状態では偽の観測値や結果は表示されません。';

// ── Fallback screen model ──────────────────────────────────────────────────────

export interface FallbackScreenData {
  titleEn: string;
  titleJa: string;
  bodyEn: string;
  bodyJa: string;
  actionsEn: string[];
  actionsJa: string[];
  noFakeNoteEn: string;
  noFakeNoteJa: string;
}

/**
 * Returns the fallback screen data for rendering.
 */
export function getFallbackScreenData(): FallbackScreenData {
  return {
    titleEn: FALLBACK_SCREEN_TITLE_EN,
    titleJa: FALLBACK_SCREEN_TITLE_JA,
    bodyEn: FALLBACK_SCREEN_BODY_EN,
    bodyJa: FALLBACK_SCREEN_BODY_JA,
    actionsEn: FALLBACK_SCREEN_ACTIONS_EN,
    actionsJa: FALLBACK_SCREEN_ACTIONS_JA,
    noFakeNoteEn: FALLBACK_SCREEN_NO_FAKE_NOTE_EN,
    noFakeNoteJa: FALLBACK_SCREEN_NO_FAKE_NOTE_JA,
  };
}

/**
 * Returns the fallback screen as plain-text lines for display.
 */
export function renderFallbackScreenText(): string[] {
  return [
    FALLBACK_SCREEN_TITLE_EN,
    FALLBACK_SCREEN_TITLE_JA,
    '',
    FALLBACK_SCREEN_BODY_EN,
    '',
    ...FALLBACK_SCREEN_ACTIONS_EN,
    '',
    FALLBACK_SCREEN_NO_FAKE_NOTE_EN,
  ];
}
