/**
 * CausalTracePanel.ts
 *
 * Context Panel Migration item 6/9 (Causal Trace). Shown alongside the
 * Difference panel (PR8e) on the 'history' route whenever a tick is
 * selected. Reports the single strongest metric change as a "possible
 * contributing signal" — never framed as proof, per master spec §2.3's
 * ban on causal/consciousness claims and this feature's own design
 * principle (src/types/causalTrace.ts: "not causal proof").
 */

import type { CausalTraceSignalSummary } from '../../app/replay/deriveCausalTraceSignal.js';

export function renderCausalTracePanelHTML(signal: CausalTraceSignalSummary): string {
  const body =
    signal.metricId === null
      ? '<p class="causal-trace-panel__empty">この区間では変化を検出できませんでした。</p>'
      : `<p class="causal-trace-panel__signal">
          最も変化が大きかった指標: <strong>${signal.label}</strong>
          （Δ${signal.delta !== null && signal.delta >= 0 ? '+' : ''}${signal.delta?.toFixed(4)}）
        </p>
        <p class="causal-trace-panel__confidence" data-confidence="${signal.confidence}">確信度: ${confidenceLabel(signal.confidence)}</p>`;

  return `<div class="causal-trace-panel" data-testid="causal-trace-panel">
    <h3 class="causal-trace-panel__title">因果トレース（候補）</h3>
    ${body}
    <p class="causal-trace-panel__caution">${signal.caution}</p>
  </div>`;
}

function confidenceLabel(confidence: CausalTraceSignalSummary['confidence']): string {
  switch (confidence) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    case 'insufficient':
      return 'データ不足';
  }
}
