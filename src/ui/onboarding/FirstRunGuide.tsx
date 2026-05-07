/**
 * FirstRunGuide.tsx
 * AETERNA-NATURAL v2.2 — First Run Guide Modal
 *
 * Headless TypeScript model for the first-run guide.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 * Follows the same headless-panel pattern as LongRunComparisonPanel.tsx.
 *
 * Steps (v2.2 — first-user-friendly, 5 steps):
 *   1. What this is (observation device)
 *   2. First look — the field
 *   3. Tap a cell — Cell Inspector
 *   4. Replay — time snapshots
 *   5. Ask the Guide
 *
 * Principles:
 * - No consciousness / life / intelligence / mystical proof claims.
 * - Observations are observations — not proofs.
 * - Absence of emergence is a valid and expected result.
 * - Presented as an observation device, not a proof engine.
 *
 * Reference: docs/public-research-mode.md §1, docs/public-demo-polish.md §4
 */

import type { FirstRunGuideStepData } from './FirstRunGuideStep.js';
import { renderGuideStepText, renderGuideStepMarkdown } from './FirstRunGuideStep.js';

// ── Guide state ────────────────────────────────────────────────────────────────

export interface FirstRunGuideState {
  currentStep: number;
  totalSteps: number;
  dismissed: boolean;
}

// ── Step definitions ───────────────────────────────────────────────────────────

export const FIRST_RUN_GUIDE_STEPS: FirstRunGuideStepData[] = [
  {
    stepNumber: 1,
    title: 'What is this?',
    bodyLines: [
      'AETERNA-NATURAL は、トーラス場で起きる変化を観測する研究装置です。',
      'AETERNA-NATURAL is a torus field observation lab.',
      '',
      'You can observe:',
      '  • Field flow and phase',
      '  • Vortex candidates (phase-defect candidates)',
      '  • Membrane traces',
      '  • Weak plasticity traces (medium-history proxies)',
      '  • Ratio comparisons',
      '  • Time-based changes',
      '',
      'It starts in Safe Observation mode — the quietest, safest configuration.',
      '',
      'What this is NOT:',
      '  ✗ Not a proof of consciousness',
      '  ✗ Not a proof of life or intelligence',
      '  ✗ Not a healing or mystical system',
      '  ✗ Not a chatbot or AI personality',
    ],
    noteLines: [
      'Observations are observations — not proof.',
      'No emergence is a valid observation result.',
    ],
  },
  {
    stepNumber: 2,
    title: 'First look — the field',
    bodyLines: [
      'まずは場全体を見てください。',
      'Start by looking at the field.',
      '',
      'The dots, colors, and layers you see are actual observed values,',
      'translated into a visual form.',
      '',
      '  • Colors show field values (flow, phase, curvature…)',
      '  • Brighter areas show higher activity',
      '  • Low activity is a normal and valid observation',
      '',
      'Recommended first run:',
      '  Scenario: Quiet Baseline',
      '  Preset: safeBaseline',
      '  Seed: 1000  |  Ticks: 2000',
      '',
      'Press [Start Safe Observation] to begin.',
    ],
    noteLines: [
      'High values do not mean "better." Low activity is a valid baseline result.',
    ],
  },
  {
    stepNumber: 3,
    title: 'Tap a cell — Cell Inspector',
    bodyLines: [
      '気になる場所をタップすると Cell Inspector が開きます。',
      'Tap any cell in the field to open the Cell Inspector.',
      '',
      'The inspector shows all observed values for that cell:',
      '  • Flow, phase, curvature',
      '  • Vortex candidate score',
      '  • Membrane trace',
      '  • Weak plasticity trace',
      '  • Observed ratio',
      '',
      'Each value has a kind tag:',
      '  Raw       — direct field output',
      '  Derived   — computed from raw values',
      '  Proxy     — indirect indicator',
      '  Check     — integrity invariant (must be 0)',
      '  Reference — baseline for comparison only',
      '',
      'Tap a metric to open the matching Visual Lens for that value.',
    ],
    noteLines: [
      'Tap a metric row to switch to the Visual Lens for that measurement.',
    ],
  },
  {
    stepNumber: 4,
    title: 'Replay — time snapshots',
    bodyLines: [
      'Replay は記録された観測 snapshot を表示します。',
      'Replay shows recorded observation snapshots.',
      '',
      'You can:',
      '  • Scrub through recorded ticks',
      '  • See how values changed over time',
      '  • Compare earlier and later states',
      '',
      'Important:',
      '  Replay shows stored snapshots — the runtime itself does not go back in time.',
      '  What you see is the recorded history of observations.',
    ],
    noteLines: [
      'Replay is observation playback, not time travel in the simulation.',
    ],
  },
  {
    stepNumber: 5,
    title: 'Ask the Guide',
    bodyLines: [
      '観測レンズを見ながら「これなに？」「どう仮説できる？」と聞けます。',
      'While viewing a lens, you can ask the Observation Guide questions.',
      '',
      'Shortcut questions:',
      '  これなに？         — What is this?',
      '  何が起きてる？     — What is happening?',
      '  どう仮説できる？   — How can I form a hypothesis?',
      '  次どこを見る？     — Where should I look next?',
      '  これは証明になる？ — Is this proof?',
      '',
      'The Guide is an observation-auxiliary tool.',
      'It is not AETERNA itself speaking.',
      'It has no LLM or external API calls.',
      '',
      'For "これは証明になる？" — the answer will always include a caution:',
      '  "これは証明ではありません。',
      '   現在の観測値から見える候補・関係・proxy を整理することはできます。"',
    ],
    noteLines: [
      'The Guide is observation-auxiliary — not AETERNA itself speaking.',
      'No LLM / API calls. All responses are rule-based.',
    ],
  },
];

// ── State helpers ──────────────────────────────────────────────────────────────

export function createFirstRunGuideState(): FirstRunGuideState {
  return {
    currentStep: 1,
    totalSteps: FIRST_RUN_GUIDE_STEPS.length,
    dismissed: false,
  };
}

export function advanceGuideStep(state: FirstRunGuideState): FirstRunGuideState {
  if (state.currentStep >= state.totalSteps) {
    return { ...state, dismissed: true };
  }
  return { ...state, currentStep: state.currentStep + 1 };
}

export function dismissGuide(state: FirstRunGuideState): FirstRunGuideState {
  return { ...state, dismissed: true };
}

export function getCurrentStep(state: FirstRunGuideState): FirstRunGuideStepData | null {
  return FIRST_RUN_GUIDE_STEPS[state.currentStep - 1] ?? null;
}

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the full guide as plain-text lines.
 */
export function renderFullGuideText(): string[] {
  const lines: string[] = [
    'AETERNA-NATURAL — First Run Guide',
    '='.repeat(40),
    '',
  ];
  for (const step of FIRST_RUN_GUIDE_STEPS) {
    lines.push(...renderGuideStepText(step));
    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('');
  }
  return lines;
}

/**
 * Returns the full guide as a Markdown string.
 */
export function renderFullGuideMarkdown(): string {
  const parts: string[] = [
    '# AETERNA-NATURAL — First Run Guide',
    '',
    '_This guide introduces you to the torus field observation lab._',
    '',
  ];
  for (const step of FIRST_RUN_GUIDE_STEPS) {
    parts.push(renderGuideStepMarkdown(step));
    parts.push('');
  }
  return parts.join('\n');
}

// ── v2.5 additions ─────────────────────────────────────────────────────────────

export interface FirstRunGuideLinkV25 {
  labelJa: string;
  targetPanel: string;
}

export const FIRST_RUN_GUIDE_STEPS_V25: FirstRunGuideStepData[] = [
  ...FIRST_RUN_GUIDE_STEPS,
  {
    stepNumber: 6,
    title: '観測ルートを使う',
    bodyLines: [
      '観測ルートは初回観測の推奨手順です。',
      '',
      '「はじめに」タブから観測ルートを開いてください。',
      '',
      '観測ルートは証明の手順ではありません。観測を整理するための補助です。',
    ],
    noteLines: [
      '観測ルートはオプションです。自由に観測しても構いません。',
    ],
  },
];

export const FIRST_RUN_GUIDE_LINKS_V25: FirstRunGuideLinkV25[] = [
  { labelJa: '観測ルートを見る',   targetPanel: 'route' },
  { labelJa: '用語辞典を開く',     targetPanel: 'glossary' },
  { labelJa: 'Safe Baseline に戻す', targetPanel: 'landing' },
];

/**
 * Render the v2.5 first-run guide as an HTML string.
 * No JSX — pure template literal rendering.
 */
export function renderFirstRunGuideV25HTML(state: FirstRunGuideState): string {
  const currentStep = FIRST_RUN_GUIDE_STEPS_V25[state.currentStep - 1];
  if (!currentStep || state.dismissed) return '';

  const bodyHtml = currentStep.bodyLines
    .map(line => line === '' ? '<br>' : `<p class="first-run-guide__body-line">${_esc(line)}</p>`)
    .join('\n  ');

  const noteHtml = currentStep.noteLines.length > 0
    ? `<div class="first-run-guide__notes">${currentStep.noteLines.map(n => `<p class="first-run-guide__note" role="note">${_esc(n)}</p>`).join('\n')}</div>`
    : '';

  const linksHtml = FIRST_RUN_GUIDE_LINKS_V25
    .map(l => `<a class="first-run-guide__link" data-panel="${_esc(l.targetPanel)}" href="#${_esc(l.targetPanel)}" role="button">${_esc(l.labelJa)}</a>`)
    .join('\n  ');

  return `<div class="first-run-guide" role="dialog" aria-label="はじめにガイド">
  <div class="first-run-guide__header">
    <span class="first-run-guide__step-label">ステップ ${_esc(state.currentStep)} / ${_esc(state.totalSteps)}</span>
    <h2 class="first-run-guide__title">${_esc(currentStep.title)}</h2>
  </div>
  <div class="first-run-guide__body">
  ${bodyHtml}
  </div>
  ${noteHtml}
  <div class="first-run-guide__links">
  ${linksHtml}
  </div>
  <div class="first-run-guide__actions">
    <button class="first-run-guide__next" type="button" data-action="guide-next">次へ</button>
    <button class="first-run-guide__dismiss" type="button" data-action="guide-dismiss">閉じる</button>
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
