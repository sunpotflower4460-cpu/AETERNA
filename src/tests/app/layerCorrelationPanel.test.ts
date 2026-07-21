/**
 * layerCorrelationPanel.test.ts
 *
 * Confirms:
 * - all 6 pairs render with their sample size
 * - a null correlation renders as "—", not "0"
 * - a numeric correlation renders with 3 decimal places
 * - the caution text is always present
 */

import { describe, it, expect } from 'vitest';
import { renderLayerCorrelationPanelHTML } from '../../ui/shell/LayerCorrelationPanel.js';
import type { LayerCorrelationResult } from '../../app/replay/computeLayerCorrelation.js';

function makeResult(overrides: Partial<LayerCorrelationResult['pairs'][number]> = {}): LayerCorrelationResult {
  return {
    pairs: [
      { metricA: 'sigma', metricB: 'phi', correlation: null, sampleSize: 0 },
      { metricA: 'sigma', metricB: 'energy', correlation: 0.75, sampleSize: 10, ...overrides },
      { metricA: 'sigma', metricB: 'arousal', correlation: null, sampleSize: 1 },
      { metricA: 'phi', metricB: 'energy', correlation: -0.5, sampleSize: 8 },
      { metricA: 'phi', metricB: 'arousal', correlation: null, sampleSize: 0 },
      { metricA: 'energy', metricB: 'arousal', correlation: 0.1, sampleSize: 4 },
    ] as LayerCorrelationResult['pairs'],
  };
}

describe('renderLayerCorrelationPanelHTML', () => {
  it('renders all 6 pairs with their sample size', () => {
    const html = renderLayerCorrelationPanelHTML(makeResult());
    for (const n of [0, 10, 1, 8, 0, 4]) {
      expect(html).toContain(`n=${n}`);
    }
  });

  it('renders a null correlation as "—", not "0"', () => {
    const html = renderLayerCorrelationPanelHTML(makeResult());
    expect(html).toContain('—');
  });

  it('renders a numeric correlation with 3 decimal places', () => {
    const html = renderLayerCorrelationPanelHTML(makeResult());
    expect(html).toContain('0.750');
    expect(html).toContain('-0.500');
  });

  it('always includes the caution text', () => {
    const html = renderLayerCorrelationPanelHTML(makeResult());
    expect(html).toContain('相関は因果関係を示すものではありません');
  });
});
