/**
 * FirstRunGuide.tsx
 * AETERNA-NATURAL v1.4 — First Run Guide Modal
 *
 * Headless TypeScript model for the first-run guide.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 * Follows the same headless-panel pattern as LongRunComparisonPanel.tsx.
 *
 * Steps:
 *   1. What AETERNA-NATURAL is
 *   2. First place to look (Overview)
 *   3. First scenario to try (Quiet Baseline or Single Pulse Return)
 *   4. How to read observation values (Raw / Derived / Proxy / Check / Reference)
 *   5. Export (JSON / Markdown, seed / config / scenario / ticks)
 *
 * Principles:
 * - No consciousness / life / intelligence / mystical proof claims.
 * - Observations are observations — not proofs.
 * - Absence of emergence is a valid and expected result.
 *
 * Reference: docs/public-research-mode.md §1
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
    title: 'What AETERNA-NATURAL is',
    bodyLines: [
      'AETERNA-NATURAL is a torus field observation lab.',
      '',
      'It implements a physical-geometry field simulation — torus metric, complex scalar field,',
      'vortex candidates, membrane layer, weak plasticity trace, and observed ratios — and',
      'lets you observe the resulting dynamics.',
      '',
      'It is NOT:',
      '  - A proof of consciousness',
      '  - A proof of life or intelligence',
      '  - A healing or mystical system',
      '  - A mind or aware entity',
      '',
      'Vortex candidates are phase-defect candidates in the field.',
      'Weak plasticity traces are medium-history proxies.',
      'Observed ratios are comparisons, not proof.',
      'No emergence is a valid observation.',
    ],
    noteLines: [
      'All observation labels carry a kind tag: Raw / Derived / Proxy / Check / Reference.',
    ],
  },
  {
    stepNumber: 2,
    title: 'First place to look: Overview',
    bodyLines: [
      'Open the Overview panel first.',
      '',
      'It shows the key observational metrics in one place:',
      '  - Flow Continuity — is field flow uninterrupted?',
      '  - Energy Throughput — how much energy moves through the field?',
      '  - Closure Stability — how stable is the closed-loop geometry?',
      '  - Return Strength — how strongly do signals return after leaving?',
      '  - Extinction Risk — how close is the field to collapse?',
      '  - Semantic Leak — must always be 0 (integrity check)',
      '  - NaN / Infinity — must always be 0 (numeric integrity check)',
      '',
      'Read the Overview before exploring other panels.',
    ],
    noteLines: [
      'All metrics are observational. High values do not mean "better" without context.',
    ],
  },
  {
    stepNumber: 3,
    title: 'First scenario to try',
    bodyLines: [
      'Start with one of these two public-safe scenarios:',
      '',
      '  Quiet Baseline (quietBaseline)',
      '    Observe resting-state field dynamics with no perturbation.',
      '    Low activity is a valid result.',
      '',
      '  Single Pulse Return (singlePulseReturn)',
      '    Apply a single gentle perturbation and observe how the field responds.',
      '    Whether the field returns to baseline or diverges is the observation.',
      '',
      'Recommended preset: safeBaseline',
      'Recommended seed:   1000',
      'Recommended ticks:  2000',
    ],
    noteLines: [
      'You can use the Export action to save the exact seed / config / scenario / ticks',
      'for reproducibility.',
    ],
  },
  {
    stepNumber: 4,
    title: 'How to read observation values',
    bodyLines: [
      'Every observation value has a kind tag:',
      '',
      '  Raw       — direct output from the simulation field, not smoothed',
      '  Derived   — computed from raw values (e.g. averages, ratios)',
      '  Proxy     — indirect indicator, one step removed from direct measurement',
      '  Check     — integrity or safety invariant (must be 0 or inactive)',
      '  Reference — stored baseline value for comparison only',
      '',
      'These distinctions matter:',
      '  - A high Proxy value does not confirm the underlying phenomenon.',
      '  - A Check value that is non-zero requires attention, not interpretation.',
      '  - Reference values are never fed back into runtime dynamics.',
    ],
    noteLines: [
      'Raw / Derived / Proxy / Check / Reference — the label tells you what kind of',
      'evidence you are looking at.',
    ],
  },
  {
    stepNumber: 5,
    title: 'Export / Reproducibility',
    bodyLines: [
      'Use Export to save your observation for later reference or sharing.',
      '',
      'Export formats:',
      '  JSON      — full machine-readable record',
      '  Markdown  — human-readable summary with observation context',
      '',
      'Every export includes:',
      '  seed      — the random seed used for this run',
      '  config    — the runtime preset configuration',
      '  scenario  — the scenario definition',
      '  ticks     — number of simulation steps',
      '',
      'You can use these values to reproduce the exact same observation later.',
      'Reproducibility is a core principle of AETERNA-NATURAL research.',
    ],
    noteLines: [
      'Exported files include full observation context but not raw field data.',
      'Raw field data is observation-only and not stored by default.',
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
