/**
 * PublicInterpretationNote.tsx
 * AETERNA-NATURAL v1.4 — Always-Visible Interpretation Note
 *
 * Headless TypeScript model for the interpretation note displayed to all users.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 *
 * Key points always shown:
 * - Vortex candidates are phase-defect candidates, not minds
 * - Weak plasticity traces are medium-history proxies, not semantic memory
 * - Observed ratio matches are comparisons, not proof
 * - No emergence is a valid observation
 *
 * Principles:
 * - This note is never optional. It is always shown.
 * - No consciousness / life / intelligence / mystical proof claims.
 *
 * Reference: docs/public-research-mode.md §6
 */

// ── Note line definitions ──────────────────────────────────────────────────────

export interface InterpretationNoteLine {
  key: string;
  text: string;
  textJa: string;
}

export const INTERPRETATION_NOTE_LINES: InterpretationNoteLine[] = [
  {
    key: 'vortexCandidates',
    text: 'Vortex candidates are phase-defect candidates in the field — not minds, not aware entities.',
    textJa: '渦候補はフィールド内の位相欠陥候補です。心でも、意識を持つ存在でもありません。',
  },
  {
    key: 'weakPlasticityTraces',
    text: 'Weak plasticity traces are medium-history proxies — not semantic memory, not learned meaning.',
    textJa: '弱可塑性トレースは媒質の履歴プロキシです。意味記憶でも、学習された意味でもありません。',
  },
  {
    key: 'observedRatios',
    text: 'Observed ratio matches are comparisons between field measurements — not proof of anything.',
    textJa: '観測比率の一致はフィールド測定値の比較です。何かの証明ではありません。',
  },
  {
    key: 'noEmergence',
    text: 'No emergence is a valid observation. Absence of a result is a result.',
    textJa: '創発なしは有効な観測結果です。結果が出ないことも、結果です。',
  },
  {
    key: 'notProof',
    text: 'This system is not proof of consciousness, life, intelligence, healing, or mystical truth.',
    textJa: 'このシステムは意識・生命・知能・癒し・神秘的真実の証明ではありません。',
  },
];

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the interpretation note as plain-text lines.
 */
export function renderInterpretationNoteText(): string[] {
  return [
    'Interpretation note (always applicable):',
    '',
    ...INTERPRETATION_NOTE_LINES.map(line => `  • ${line.text}`),
  ];
}

/**
 * Returns the interpretation note as a Markdown blockquote.
 */
export function renderInterpretationNoteMarkdown(): string {
  const lines = [
    '> **Interpretation note** (always applicable)',
    '>',
    ...INTERPRETATION_NOTE_LINES.map(line => `> - ${line.text}`),
  ];
  return lines.join('\n');
}

/**
 * Returns the bilingual (EN + JA) interpretation note as plain-text lines.
 */
export function renderInterpretationNoteBilingualText(): string[] {
  const lines: string[] = ['Interpretation note (always applicable):', ''];
  for (const line of INTERPRETATION_NOTE_LINES) {
    lines.push(`  • ${line.text}`);
    lines.push(`    ${line.textJa}`);
    lines.push('');
  }
  return lines;
}
