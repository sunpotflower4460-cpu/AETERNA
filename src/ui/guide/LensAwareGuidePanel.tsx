/**
 * LensAwareGuidePanel.tsx
 * v1.9: Lens-aware AI Guide
 *
 * Renders the full Lens-aware AI Guide panel as an HTML string.
 *
 * Design principles:
 * - Pure HTML string rendering.
 * - Header note clarifies AI Guide is observation-auxiliary, not AETERNA itself.
 * - No LLM / API calls.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/lens-aware-ai-guide.md §8
 */

import type { LensGuideMode } from '../../config/lensGuideConfig.ts';
import type { LensGuideResponse } from '../../guide/lensGuideTypes.ts';
import { renderLensGuideModeTabs } from './LensGuideModeTabs.tsx';
import { renderLensGuideQuestionInputHTML } from './LensGuideQuestionInput.tsx';
import { renderLensGuideResponseViewHTML } from './LensGuideResponseView.tsx';

// ── LensAwareGuidePanelProps ──────────────────────────────────────────────────

export interface LensAwareGuidePanelProps {
  activeLensId: string | null;
  selectedCellIndex: number | null;
  activeMode: LensGuideMode;
  response: LensGuideResponse | null;
  isPublicMode?: boolean;
}

// ── renderLensAwareGuidePanelHTML ─────────────────────────────────────────────

/**
 * Render the full Lens-aware AI Guide panel as an HTML string.
 *
 * @param props - LensAwareGuidePanelProps
 * @returns HTML string
 */
export function renderLensAwareGuidePanelHTML(props: LensAwareGuidePanelProps): string {
  const { activeLensId, selectedCellIndex, activeMode, response, isPublicMode = false } = props;

  const activeLensDisplay = activeLensId
    ? `<span class="lens-aware-guide-panel__lens-id">${_esc(activeLensId)}</span>`
    : `<span class="lens-aware-guide-panel__lens-none">no lens active</span>`;

  const cellDisplay = selectedCellIndex !== null
    ? `<span class="lens-aware-guide-panel__cell-index">cell ${_esc(String(selectedCellIndex))}</span>`
    : `<span class="lens-aware-guide-panel__cell-none">no cell selected</span>`;

  const publicModeBadge = isPublicMode
    ? `<span class="lens-aware-guide-panel__public-badge">Public Mode</span>`
    : '';

  const modeTabsHtml = renderLensGuideModeTabs({
    activeMode,
    onModeChange: (_mode: LensGuideMode) => { /* handled via CustomEvent */ },
  });

  const questionInputHtml = renderLensGuideQuestionInputHTML({
    currentMode: activeMode,
  });

  const responseViewHtml = renderLensGuideResponseViewHTML({ response });

  return `<div class="lens-aware-guide-panel">
  <div class="lens-aware-guide-panel__header">
    <span class="lens-aware-guide-panel__title">AI Guide</span>
    ${publicModeBadge}
    ${isPublicMode ? '<span class="lens-aware-guide-panel__guide-type">rule-based guide · external LLM disabled</span>' : ''}
    <small class="lens-aware-guide-panel__guardrail-note">
      このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。
    </small>
  </div>
  <div class="lens-aware-guide-panel__context">
    <div class="lens-aware-guide-panel__active-lens">
      Active lens: ${activeLensDisplay}
    </div>
    <div class="lens-aware-guide-panel__selected-cell">
      Selected cell: ${cellDisplay}
    </div>
  </div>
  <div class="lens-aware-guide-panel__shortcuts">
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'これなに？',mode:'explain'}}))">これなに？</button>
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'次どこ見る？',mode:'next'}}))">次どこ見る？</button>
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'注意点は？',mode:'caution'}}))">注意点は？</button>
  </div>
  <div class="lens-aware-guide-panel__mode-tabs">
    ${modeTabsHtml}
  </div>
  <div class="lens-aware-guide-panel__question">
    ${questionInputHtml}
  </div>
  <div class="lens-aware-guide-panel__response">
    ${responseViewHtml}
  </div>
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
