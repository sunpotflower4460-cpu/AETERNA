/**
 * LensGuideModeTabs.tsx
 * v1.9: Lens-aware AI Guide
 *
 * Renders tab buttons for selecting the active LensGuideMode.
 *
 * Design principles:
 * - Pure HTML string rendering.
 * - Japanese labels for 5 modes.
 * - No LLM / API calls.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/lens-aware-ai-guide.md §8
 */

import type { LensGuideMode } from '../../config/lensGuideConfig.ts';

// ── LensGuideModeTabsProps ────────────────────────────────────────────────────

export interface LensGuideModeTabsProps {
  activeMode: LensGuideMode;
  onModeChange: (mode: LensGuideMode) => void;
}

// ── Mode label map ────────────────────────────────────────────────────────────

const MODE_LABELS: Record<LensGuideMode, string> = {
  explain:         '説明',
  hypothesis:      '仮説',
  compare:         '比較',
  caution:         '注意点',
  nextObservation: '次の観測',
};

const MODES: LensGuideMode[] = ['explain', 'hypothesis', 'compare', 'caution', 'nextObservation'];

// ── renderLensGuideModeTabs ───────────────────────────────────────────────────

/**
 * Render mode tab buttons as an HTML string.
 *
 * @param props - LensGuideModeTabsProps
 * @returns HTML string
 */
export function renderLensGuideModeTabs(props: LensGuideModeTabsProps): string {
  const { activeMode } = props;

  const tabs = MODES.map((mode) => {
    const label = MODE_LABELS[mode];
    const isActive = mode === activeMode;
    const activeClass = isActive ? ' lens-guide-mode-tabs__tab--active' : '';
    const ariaSelected = isActive ? 'true' : 'false';
    return `<button
  class="lens-guide-mode-tabs__tab${activeClass}"
  data-mode="${_esc(mode)}"
  role="tab"
  aria-selected="${ariaSelected}"
  onclick="window.dispatchEvent(new CustomEvent('guide:modeChange',{detail:{mode:'${_esc(mode)}'}}))">
  ${_esc(label)}
</button>`;
  }).join('\n');

  return `<div class="lens-guide-mode-tabs" role="tablist">
  ${tabs}
</div>`;
}

// ── _esc ──────────────────────────────────────────────────────────────────────

function _esc(s: string | undefined | null): string {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
