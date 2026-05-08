/**
 * LensGuideQuestionInput.tsx
 * v2.2: Public Demo Polish — updated shortcut copy for first-time users
 *
 * Renders the question input area for the Lens-aware AI Guide.
 * Includes shortcut buttons and dispatches CustomEvents on ask.
 *
 * Design principles:
 * - Pure HTML string rendering.
 * - No LLM / API calls.
 * - All output is XSS-safe via _esc().
 * - Events dispatched via window.dispatchEvent + CustomEvent.
 * - "これは証明になる？" shortcut always includes a caution response.
 *
 * Reference: docs/lens-aware-ai-guide.md §8, docs/public-demo-polish.md §7
 */

import type { LensGuideMode } from '../../config/lensGuideConfig.ts';

// ── LensGuideQuestionInputProps ───────────────────────────────────────────────

export interface LensGuideQuestionInputProps {
  currentMode: LensGuideMode;
  placeholder?: string;
  onAsk?: (question: string) => void;
}

// ── Shortcut buttons ──────────────────────────────────────────────────────────

const SHORTCUT_BUTTONS: Array<{ label: string; question: string; mode: LensGuideMode }> = [
  { label: 'これなに？',         question: 'これなに？',         mode: 'explain' },
  { label: '何が起きてる？',     question: '何が起きてる？',     mode: 'explain' },
  { label: 'どう仮説できる？',   question: 'どう仮説できる？',   mode: 'hypothesis' },
  { label: '次どこを見る？',     question: '次どこを見る？',     mode: 'nextObservation' },
  { label: 'これは証明になる？', question: 'これは証明になる？', mode: 'caution' },
  { label: '生命幹は安定してる？', question: '生命幹は安定してる？', mode: 'explain' },
  { label: '閉ループはある？',     question: '閉ループはある？',     mode: 'explain' },
  { label: '意識候補条件は？',     question: '意識候補条件は？',     mode: 'caution' },
];

// ── renderLensGuideQuestionInputHTML ──────────────────────────────────────────

/**
 * Render the question input area as an HTML string.
 *
 * @param props - LensGuideQuestionInputProps
 * @returns HTML string
 */
export function renderLensGuideQuestionInputHTML(props: LensGuideQuestionInputProps): string {
  const { currentMode, placeholder } = props;
  const ph = placeholder ?? 'Ask about the current observation…';

  const shortcutsHtml = SHORTCUT_BUTTONS.map((btn) => {
    const isCurrentMode = btn.mode === currentMode;
    const activeClass = isCurrentMode ? ' lens-guide-question-input__shortcut--active' : '';
    return `<button
  class="lens-guide-question-input__shortcut${activeClass}"
  data-question="${_esc(btn.question)}"
  data-mode="${_esc(btn.mode)}"
  onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'${_esc(btn.question)}',mode:'${_esc(btn.mode)}'}}))">
  ${_esc(btn.label)}
</button>`;
  }).join('\n');

  return `<div class="lens-guide-question-input">
  <div class="lens-guide-question-input__shortcuts">
    ${shortcutsHtml}
  </div>
  <div class="lens-guide-question-input__row">
    <input
      class="lens-guide-question-input__text"
      type="text"
      placeholder="${_esc(ph)}"
      data-current-mode="${_esc(currentMode)}"
      onkeydown="if(event.key==='Enter'){const q=this.value.trim();if(q)window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:q,mode:'${_esc(currentMode)}'}}));}"
    />
    <button
      class="lens-guide-question-input__submit"
      onclick="const inp=this.previousElementSibling;const q=inp&&inp.value?inp.value.trim():'';if(q)window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:q,mode:'${_esc(currentMode)}'}}));">Ask</button>
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
