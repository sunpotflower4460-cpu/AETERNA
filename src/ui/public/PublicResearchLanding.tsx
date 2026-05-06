/**
 * PublicResearchLanding.tsx
 * AETERNA-NATURAL v1.4 — Public Research Landing Panel
 *
 * Headless TypeScript model for the public landing panel.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 * Follows the same headless-panel pattern as LongRunComparisonPanel.tsx.
 *
 * Shows:
 * - Title and short description (English + Japanese)
 * - Action buttons: Start Safe Observation, Open Research Scenarios,
 *   View Long-Run Comparison, Export/Reproducibility, Open Advanced Controls
 * - "No proof" note prominently
 *
 * Principles:
 * - No consciousness / life / intelligence / mystical proof claims.
 * - "No proof" note is always rendered — never hidden.
 *
 * Reference: docs/public-research-mode.md §1
 */

// ── Panel content ──────────────────────────────────────────────────────────────

export const PUBLIC_LANDING_TITLE = 'AETERNA-NATURAL / Torus Field Observation Lab';

export const PUBLIC_LANDING_DESCRIPTION_EN = [
  'AETERNA-NATURAL is a torus field simulation and observation system.',
  'It implements geometry (torus metric + curvature), a complex scalar field,',
  'vortex candidates, a membrane layer, weak plasticity trace, and observed',
  'ratios — and lets you observe the resulting dynamics.',
  '',
  'All observations are scientific field measurements.',
  'No consciousness, life, intelligence, or mystical claims are made.',
].join('\n');

export const PUBLIC_LANDING_DESCRIPTION_JA = [
  'AETERNA-NATURAL はトーラスフィールドのシミュレーション・観測システムです。',
  'トーラス計量と曲率を持つジオメトリ、複素スカラーフィールド、渦候補、',
  '境界層（膜）、弱可塑性トレース、観測比率を実装し、その動態を観測します。',
  '',
  'すべての観測は科学的なフィールド測定です。',
  '意識・生命・知能・神秘的な主張は一切行いません。',
].join('\n');

export const PUBLIC_LANDING_NO_PROOF_NOTE =
  'This system is not proof of consciousness, life, intelligence, healing, or mystical truth. ' +
  'Observations are observations — not proof.';

export const PUBLIC_LANDING_NO_PROOF_NOTE_JA =
  'このシステムは意識・生命・知能・癒し・神秘的真実の証明ではありません。' +
  '観測は観測であり、証明ではありません。';

// ── Action button definitions ──────────────────────────────────────────────────

export interface LandingActionButton {
  id: string;
  label: string;
  labelJa: string;
  description: string;
  actionKey: string;
}

export const PUBLIC_LANDING_ACTION_BUTTONS: LandingActionButton[] = [
  {
    id: 'startSafeObservation',
    label: 'Start Safe Observation',
    labelJa: '安全な観測を開始',
    description: 'Run the Quiet Baseline scenario with the safeBaseline preset.',
    actionKey: 'startSafeObservation',
  },
  {
    id: 'openResearchScenarios',
    label: 'Open Research Scenarios',
    labelJa: '研究シナリオを開く',
    description: 'Browse the public-safe research scenario library.',
    actionKey: 'openResearchScenarios',
  },
  {
    id: 'viewLongRunComparison',
    label: 'View Long-Run Comparison',
    labelJa: '長期比較を表示',
    description: 'Open the long-run comparison suite to compare preset variants.',
    actionKey: 'viewLongRunComparison',
  },
  {
    id: 'exportReproducibility',
    label: 'Export / Reproducibility',
    labelJa: 'エクスポート / 再現性',
    description: 'Export the current observation as JSON or Markdown with full seed / config / scenario / ticks.',
    actionKey: 'exportReproducibility',
  },
  {
    id: 'openAdvancedControls',
    label: 'Open Advanced Controls',
    labelJa: '高度なコントロールを開く',
    description: 'Open advanced configuration panels (requires confirmation).',
    actionKey: 'openAdvancedControls',
  },
];

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the landing panel as plain-text lines.
 */
export function renderPublicLandingText(): string[] {
  const lines: string[] = [
    PUBLIC_LANDING_TITLE,
    '='.repeat(PUBLIC_LANDING_TITLE.length),
    '',
    '⚠ ' + PUBLIC_LANDING_NO_PROOF_NOTE,
    '',
    PUBLIC_LANDING_DESCRIPTION_EN,
    '',
    '--- Actions ---',
  ];
  for (const btn of PUBLIC_LANDING_ACTION_BUTTONS) {
    lines.push(`  [${btn.label}] — ${btn.description}`);
  }
  return lines;
}

/**
 * Returns the landing panel as a Markdown string.
 */
export function renderPublicLandingMarkdown(): string {
  const parts: string[] = [
    `# ${PUBLIC_LANDING_TITLE}`,
    '',
    `> ⚠ **${PUBLIC_LANDING_NO_PROOF_NOTE}**`,
    '',
    PUBLIC_LANDING_DESCRIPTION_EN,
    '',
    PUBLIC_LANDING_DESCRIPTION_JA,
    '',
    '## Actions',
    '',
  ];
  for (const btn of PUBLIC_LANDING_ACTION_BUTTONS) {
    parts.push(`- **${btn.label}** — ${btn.description}`);
  }
  return parts.join('\n');
}
