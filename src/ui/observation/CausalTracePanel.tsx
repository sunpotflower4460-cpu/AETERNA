/**
 * CausalTracePanel.tsx
 * v1.8: Causal Trace / Layer Correlation
 *
 * Renders the Causal Trace panel as an HTML string.
 *
 * Design principles:
 * - Shows possible contributing signals only — never claims causal proof.
 * - Cautions are displayed prominently.
 * - "not causal proof" disclaimer is always shown.
 * - No consciousness / emotion / life / soul / mystical claims.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/causal-trace-layer-correlation.md §3
 */

import type { CausalTraceResult, CausalTraceSignal } from '../../types/causalTrace.ts';

// ── CausalTracePanelProps ─────────────────────────────────────────────────────

export interface CausalTracePanelProps {
    result: CausalTraceResult | null;
    /** Whether to show the overlay variant (compact) */
    compact?: boolean;
}

// ── _esc ──────────────────────────────────────────────────────────────────────

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Signal renderer ───────────────────────────────────────────────────────────

function renderSignalHTML(signal: CausalTraceSignal): string {
    const delta = signal.delta !== null && signal.delta !== undefined
        ? ` (Δ ${signal.delta >= 0 ? '+' : ''}${signal.delta.toFixed(4)})`
        : '';
    const before = signal.valueBefore !== null && signal.valueBefore !== undefined
        ? _esc(signal.valueBefore.toFixed(4))
        : '—';
    const after = signal.valueAfter !== null && signal.valueAfter !== undefined
        ? _esc(signal.valueAfter.toFixed(4))
        : '—';

    return `<li class="causal-trace-panel__signal causal-trace-panel__signal--${_esc(signal.confidence)}">
  <span class="causal-trace-panel__signal-label">${_esc(signal.label)}</span>
  <span class="causal-trace-panel__signal-kind">[${_esc(signal.relationKind)}]</span>
  <span class="causal-trace-panel__signal-values">before: ${before} → after: ${after}${_esc(delta)}</span>
  <span class="causal-trace-panel__signal-confidence">confidence: ${_esc(signal.confidence)}</span>
  <span class="causal-trace-panel__signal-caution">${_esc(signal.caution)}</span>
</li>`;
}

// ── renderCausalTracePanelHTML ────────────────────────────────────────────────

/**
 * Render the Causal Trace panel as an HTML string.
 *
 * @param props - CausalTracePanelProps
 * @returns HTML string
 */
export function renderCausalTracePanelHTML(props: CausalTracePanelProps): string {
    const { result, compact = false } = props;

    const disclaimer = `<div class="causal-trace-panel__disclaimer">
  <strong>⚠ Not causal proof.</strong>
  Signals shown are possible contributing signals only.
  Correlation between metrics is not evidence of causation.
  No consciousness, life, or intelligence claims are made.
</div>`;

    if (!result) {
        return `<div class="causal-trace-panel causal-trace-panel--empty">
  ${disclaimer}
  <p class="causal-trace-panel__empty-msg">No causal trace data available.</p>
</div>`;
    }

    const { possibleContributingSignals, summary, cautions, confidence, currentTick } = result;

    const summaryHtml = summary.map((s) => `<p class="causal-trace-panel__summary-line">${_esc(s)}</p>`).join('');

    const cautionsHtml = cautions.map((c) => `<li class="causal-trace-panel__caution-item">${_esc(c)}</li>`).join('');

    const signalsHtml = possibleContributingSignals.length > 0
        ? `<ul class="causal-trace-panel__signals-list">
${possibleContributingSignals.map(renderSignalHTML).join('\n')}
</ul>`
        : '<p class="causal-trace-panel__no-signals">No possible contributing signals found for this tick and cell.</p>';

    const compactClass = compact ? ' causal-trace-panel--compact' : '';

    return `<div class="causal-trace-panel${compactClass}">
  <div class="causal-trace-panel__header">
    <span class="causal-trace-panel__title">Causal Trace</span>
    <span class="causal-trace-panel__tick">tick ${_esc(currentTick)}</span>
    <span class="causal-trace-panel__confidence">confidence: ${_esc(confidence)}</span>
  </div>
  ${disclaimer}
  <div class="causal-trace-panel__summary">${summaryHtml}</div>
  <div class="causal-trace-panel__signals">
    <div class="causal-trace-panel__signals-title">Possible Contributing Signals</div>
    ${signalsHtml}
  </div>
  <div class="causal-trace-panel__cautions">
    <div class="causal-trace-panel__cautions-title">Cautions</div>
    <ul class="causal-trace-panel__cautions-list">${cautionsHtml}</ul>
  </div>
  <div class="causal-trace-panel__guide-actions">
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'Explain relation',mode:'explain'}}))">Explain relation</button>
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'Is this causal?',mode:'caution'}}))">Is this causal?</button>
  </div>
</div>`;
}
