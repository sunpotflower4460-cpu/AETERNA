/**
 * FirstRunGuideStep.tsx
 * AETERNA-NATURAL v1.4 — First Run Guide Supporting Component
 *
 * Headless TypeScript model for a single step in the first-run guide.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 * Follows the same headless-panel pattern as LongRunComparisonPanel.tsx.
 *
 * Reference: docs/public-research-mode.md §1
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FirstRunGuideStepData {
  stepNumber: number;
  title: string;
  bodyLines: string[];
  noteLines: string[];
}

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a plain-text block representation of a single guide step.
 */
export function renderGuideStepText(step: FirstRunGuideStepData): string[] {
  const lines: string[] = [
    `Step ${step.stepNumber}: ${step.title}`,
    '',
    ...step.bodyLines,
  ];
  if (step.noteLines.length > 0) {
    lines.push('');
    lines.push('Note:');
    for (const note of step.noteLines) {
      lines.push(`  ${note}`);
    }
  }
  return lines;
}

/**
 * Returns a Markdown block for a single guide step.
 */
export function renderGuideStepMarkdown(step: FirstRunGuideStepData): string {
  const lines: string[] = [
    `### Step ${step.stepNumber}: ${step.title}`,
    '',
    ...step.bodyLines,
  ];
  if (step.noteLines.length > 0) {
    lines.push('');
    lines.push('> ' + step.noteLines.join('  \n> '));
  }
  return lines.join('\n');
}
