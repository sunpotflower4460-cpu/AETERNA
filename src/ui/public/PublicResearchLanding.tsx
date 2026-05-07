/**
 * PublicResearchLanding.tsx
 * AETERNA-NATURAL v2.2 — Public Research Landing Panel
 *
 * Headless TypeScript model for the public landing panel.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 * Follows the same headless-panel pattern as LongRunComparisonPanel.tsx.
 *
 * Shows:
 * - Hero section: title, subtitle, short description, primary + secondary actions
 * - "What this is / What this is not" section
 * - Action buttons: Start Safe Observation, Open Research Scenarios,
 *   View Observation Guide, Export/Reproducibility
 * - "No proof" note prominently (always visible)
 *
 * Principles:
 * - No consciousness / life / intelligence / mystical proof claims.
 * - "No proof" note is always rendered — never hidden.
 * - Presented as an observation lab, not a proof engine.
 *
 * Reference: docs/public-research-mode.md §1, docs/public-demo-polish.md
 */

// ── Hero section ───────────────────────────────────────────────────────────────

export const PUBLIC_LANDING_TITLE = 'AETERNA-NATURAL';

export const PUBLIC_LANDING_SUBTITLE = 'Torus Field Observation Lab';
export const PUBLIC_LANDING_SUBTITLE_JA = 'トーラス場 観測ラボ';

export const PUBLIC_LANDING_SHORT_DESCRIPTION_EN =
  'Observe how patterns, traces, phase changes, and candidate structures appear in a torus-based field.';
export const PUBLIC_LANDING_SHORT_DESCRIPTION_JA =
  'トーラス場の中で、流れ・位相・渦候補・膜痕跡・弱い媒質履歴・比率比較がどう現れるかを観測します。';

// ── Full description ───────────────────────────────────────────────────────────

export const PUBLIC_LANDING_DESCRIPTION_EN = [
  'AETERNA-NATURAL is a torus-field observation lab.',
  'It lets you observe flow, phase, vortex candidates, membrane traces,',
  'weak plasticity traces, ratio comparisons, and time-based changes',
  'in a torus-based field.',
  '',
  'It does not claim to prove consciousness, life, intelligence, healing, or mystical truth.',
].join('\n');

export const PUBLIC_LANDING_DESCRIPTION_JA = [
  'AETERNA-NATURAL は、トーラス場の変化を観測する研究装置です。',
  '流れ、位相、渦候補、膜痕跡、弱可塑性痕跡、比率比較、時間変化を、',
  'セル単位・レンズ単位で観測できます。',
  '',
  'これは意識・生命・知性・癒し・神秘的真理を証明するものではありません。',
].join('\n');

// ── No-proof note ──────────────────────────────────────────────────────────────

export const PUBLIC_LANDING_NO_PROOF_NOTE =
  'This system is not proof of consciousness, life, intelligence, healing, or mystical truth. ' +
  'Observations are observations — not proof.';

export const PUBLIC_LANDING_NO_PROOF_NOTE_JA =
  'このシステムは意識・生命・知能・癒し・神秘的真実の証明ではありません。' +
  '観測は観測であり、証明ではありません。';

// ── What this is / What this is not ───────────────────────────────────────────

export const LANDING_WHAT_THIS_IS_EN: string[] = [
  'A torus-field observation prototype',
  'A visual research tool for field dynamics',
  'A way to inspect cells, metrics, lenses, replay snapshots, and relation candidates',
  'A reproducible experiment environment using seed / scenario / config / ticks',
];

export const LANDING_WHAT_THIS_IS_JA: string[] = [
  'トーラス場の観測プロトタイプ',
  '場の変化を視覚的に見る研究ツール',
  'セル・指標・レンズ・リプレイ・関係候補を調べる装置',
  'seed / scenario / config / ticks による再現可能な実験環境',
];

export const LANDING_WHAT_THIS_IS_NOT_EN: string[] = [
  'Not a proof of consciousness',
  'Not a proof of life',
  'Not a proof of intelligence',
  'Not a healing tool',
  'Not a mystical truth engine',
  'Not a chatbot personality',
];

export const LANDING_WHAT_THIS_IS_NOT_JA: string[] = [
  '意識の証明ではありません',
  '生命の証明ではありません',
  '知性の証明ではありません',
  '癒しを保証するツールではありません',
  '神秘的真理を証明する装置ではありません',
  '人格チャットAIではありません',
];

// ── Visual copy (torus display surroundings) ───────────────────────────────────

export const LANDING_VISUAL_COPY_EN: string[] = [
  'Observe the field.',
  'Inspect a cell.',
  'Open a lens.',
  'Replay a moment.',
  'Compare what changed.',
];

export const LANDING_VISUAL_COPY_JA: string[] = [
  '場を見る。',
  'セルを調べる。',
  'レンズで見る。',
  '時間を戻す。',
  '変化を比べる。',
];

// ── Action button definitions ──────────────────────────────────────────────────

export interface LandingActionButton {
  id: string;
  label: string;
  labelJa: string;
  description: string;
  actionKey: string;
  isPrimary?: boolean;
}

export const PUBLIC_LANDING_ACTION_BUTTONS: LandingActionButton[] = [
  {
    id: 'startSafeObservation',
    label: 'Start Safe Observation',
    labelJa: '安全な観測を始める',
    description: 'Run the Quiet Baseline scenario with the safeBaseline preset.',
    actionKey: 'startSafeObservation',
    isPrimary: true,
  },
  {
    id: 'openResearchScenarios',
    label: 'Open Research Scenarios',
    labelJa: '研究シナリオを見る',
    description: 'Browse the public-safe research scenario library.',
    actionKey: 'openResearchScenarios',
  },
  {
    id: 'viewObservationGuide',
    label: 'View Observation Guide',
    labelJa: '観測ガイドを見る',
    description: 'Open the first-run guide and observation instructions.',
    actionKey: 'viewObservationGuide',
  },
  {
    id: 'exportReproducibility',
    label: 'Export / Reproducibility',
    labelJa: 'Export / 再現性を見る',
    description: 'Export the current observation as JSON or Markdown with full seed / config / scenario / ticks.',
    actionKey: 'exportReproducibility',
  },
];

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the landing panel as plain-text lines.
 */
export function renderPublicLandingText(): string[] {
  const lines: string[] = [
    PUBLIC_LANDING_TITLE,
    PUBLIC_LANDING_SUBTITLE,
    '='.repeat(PUBLIC_LANDING_SUBTITLE.length),
    '',
    PUBLIC_LANDING_SHORT_DESCRIPTION_EN,
    '',
    '⚠ ' + PUBLIC_LANDING_NO_PROOF_NOTE,
    '',
    PUBLIC_LANDING_DESCRIPTION_EN,
    '',
    '--- What this is ---',
    ...LANDING_WHAT_THIS_IS_EN.map(l => `  ✓ ${l}`),
    '',
    '--- What this is not ---',
    ...LANDING_WHAT_THIS_IS_NOT_EN.map(l => `  ✗ ${l}`),
    '',
    '--- Actions ---',
  ];
  for (const btn of PUBLIC_LANDING_ACTION_BUTTONS) {
    const primary = btn.isPrimary ? '[PRIMARY] ' : '';
    lines.push(`  ${primary}[${btn.label}] — ${btn.description}`);
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
    `**${PUBLIC_LANDING_SUBTITLE}**`,
    '',
    PUBLIC_LANDING_SHORT_DESCRIPTION_EN,
    '',
    `> ⚠ **${PUBLIC_LANDING_NO_PROOF_NOTE}**`,
    '',
    PUBLIC_LANDING_DESCRIPTION_EN,
    '',
    PUBLIC_LANDING_DESCRIPTION_JA,
    '',
    '## What this is',
    '',
    ...LANDING_WHAT_THIS_IS_EN.map(l => `- ${l}`),
    '',
    '## What this is not',
    '',
    ...LANDING_WHAT_THIS_IS_NOT_EN.map(l => `- ${l}`),
    '',
    '## Actions',
    '',
  ];
  for (const btn of PUBLIC_LANDING_ACTION_BUTTONS) {
    const tag = btn.isPrimary ? ' _(primary)_' : '';
    parts.push(`- **${btn.label}**${tag} — ${btn.description}`);
  }
  return parts.join('\n');
}
