/**
 * causalTracePanel.test.ts
 *
 * Confirms:
 * - shows an empty message with confidence='insufficient'
 * - shows the metric label, delta, and confidence label for a real signal
 * - always renders the caution text
 */

import { describe, it, expect } from 'vitest';
import { renderCausalTracePanelHTML } from '../../ui/shell/CausalTracePanel.js';
import type { CausalTraceSignalSummary } from '../../app/replay/deriveCausalTraceSignal.js';

const CAUTION = 'これは時間的な相関の観測であり、因果関係の証明ではありません。 This is a temporal correlation, not proof of causation.';

describe('renderCausalTracePanelHTML', () => {
  it('shows an empty message when insufficient', () => {
    const signal: CausalTraceSignalSummary = {
      metricId: null,
      label: null,
      delta: null,
      confidence: 'insufficient',
      caution: CAUTION,
    };
    const html = renderCausalTracePanelHTML(signal);
    expect(html).toContain('変化を検出できませんでした');
  });

  it('shows the metric label, delta, and confidence for a real signal', () => {
    const signal: CausalTraceSignalSummary = {
      metricId: 'energy',
      label: 'energy',
      delta: 0.4,
      confidence: 'high',
      caution: CAUTION,
    };
    const html = renderCausalTracePanelHTML(signal);
    expect(html).toContain('energy');
    expect(html).toContain('+0.4000');
    expect(html).toContain('確信度: 高');
  });

  it('always renders the caution text', () => {
    const signal: CausalTraceSignalSummary = {
      metricId: 'sigma',
      label: 'σ',
      delta: 0.01,
      confidence: 'low',
      caution: CAUTION,
    };
    expect(renderCausalTracePanelHTML(signal)).toContain('因果関係の証明ではありません');
  });
});
