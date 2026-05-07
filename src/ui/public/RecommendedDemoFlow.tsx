/**
 * RecommendedDemoFlow.tsx
 * AETERNA-NATURAL v2.2 — Recommended First Demo Flow
 *
 * Headless TypeScript model for the recommended first-demo flow.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 *
 * Provides a 9-step guided path for first-time users who want
 * a quick, clear introduction to the torus field observation lab.
 *
 * Principles:
 * - No consciousness / life / intelligence / mystical proof claims.
 * - Steps are presented as observation actions, not proof steps.
 * - No fake visual, fake event, or fake result.
 *
 * Reference: docs/public-demo-polish.md §5
 */

// ── Demo step definition ──────────────────────────────────────────────────────

export interface RecommendedDemoStep {
  stepNumber: number;
  action: string;
  actionJa: string;
  detail: string;
  detailJa: string;
  actionKey: string;
}

// ── Recommended demo flow ─────────────────────────────────────────────────────

export const RECOMMENDED_DEMO_FLOW: RecommendedDemoStep[] = [
  {
    stepNumber: 1,
    action: 'Start Safe Observation',
    actionJa: '安全な観測を始める',
    detail: 'Opens with safeBaseline preset. Quietest, safest starting configuration.',
    detailJa: 'safeBaseline プリセットで開始します。最も静かで安全な設定です。',
    actionKey: 'startSafeObservation',
  },
  {
    stepNumber: 2,
    action: 'Run Quiet Baseline',
    actionJa: 'Quiet Baseline を実行する',
    detail: 'seed=1000, ticks=2000. Observe the resting-state field.',
    detailJa: 'seed=1000, ticks=2000。場の基底状態を観測します。',
    actionKey: 'runQuietBaseline',
  },
  {
    stepNumber: 3,
    action: 'Tap a cell',
    actionJa: 'セルをタップする',
    detail: 'Tap any area in the field to select a cell.',
    detailJa: '場の任意の場所をタップしてセルを選択します。',
    actionKey: 'tapCell',
  },
  {
    stepNumber: 4,
    action: 'Open Cell Inspector',
    actionJa: 'Cell Inspector を開く',
    detail: 'See all observed values for the selected cell.',
    detailJa: '選択したセルの全観測値を確認します。',
    actionKey: 'openCellInspector',
  },
  {
    stepNumber: 5,
    action: 'Select Phase or Curvature metric',
    actionJa: 'Phase または Curvature の指標を選ぶ',
    detail: 'Tap a metric row to switch the active Visual Lens.',
    detailJa: '指標の行をタップして、表示中の Visual Lens を切り替えます。',
    actionKey: 'selectMetric',
  },
  {
    stepNumber: 6,
    action: 'View Lens',
    actionJa: 'レンズで見る',
    detail: 'Observe the selected metric visualized across the full field.',
    detailJa: '選択した指標が場全体にどう分布しているかを観測します。',
    actionKey: 'viewLens',
  },
  {
    stepNumber: 7,
    action: 'Open Replay',
    actionJa: 'Replay を開く',
    detail: 'Scrub through recorded snapshots to see how values changed over time.',
    detailJa: '記録された snapshot を再生し、時間変化を観測します。',
    actionKey: 'openReplay',
  },
  {
    stepNumber: 8,
    action: 'Ask Guide: "これなに？"',
    actionJa: 'ガイドに聞く: 「これなに？」',
    detail: 'Ask the Observation Guide about the active lens. No LLM — rule-based responses.',
    detailJa: '観測ガイドに現在のレンズについて聞きます。LLM なし、ルールベースの回答です。',
    actionKey: 'askGuide',
  },
  {
    stepNumber: 9,
    action: 'Export Markdown',
    actionJa: 'Markdown でエクスポートする',
    detail: 'Save a reproducible record with seed / config / scenario / ticks.',
    detailJa: 'seed / config / scenario / ticks を含む再現可能な記録を保存します。',
    actionKey: 'exportMarkdown',
  },
];

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the recommended demo flow as plain-text lines.
 */
export function renderRecommendedDemoFlowText(): string[] {
  const lines: string[] = [
    'Recommended first demo (AETERNA-NATURAL)',
    '='.repeat(40),
    '',
  ];
  for (const step of RECOMMENDED_DEMO_FLOW) {
    lines.push(`${step.stepNumber}. ${step.action}`);
    lines.push(`   ${step.detail}`);
    lines.push('');
  }
  return lines;
}

/**
 * Returns the recommended demo flow as a Markdown string.
 */
export function renderRecommendedDemoFlowMarkdown(): string {
  const parts: string[] = [
    '## Recommended first demo',
    '',
    '_A quick 9-step path for first-time users._',
    '',
  ];
  for (const step of RECOMMENDED_DEMO_FLOW) {
    parts.push(`${step.stepNumber}. **${step.action}** — ${step.detail}`);
  }
  parts.push('');
  return parts.join('\n');
}
