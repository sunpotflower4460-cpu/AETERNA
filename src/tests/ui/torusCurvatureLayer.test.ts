import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLayerOverlayRule } from '../../ui/render/fieldLayerOverlayRules.js';
import {
  getFieldLayerDefinition,
  getDefaultFieldLayerVisibility,
} from '../../ui/render/fieldLayerRegistry.js';
import { buildTorusCurvatureSummary } from '../../ui/render/fieldLayerSummaries.js';

const ROOT = resolve(__dirname, '../../..');
const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');

describe('torus curvature field layer + UI wiring', () => {
  it('registers torusCurvature as a derived field layer', () => {
    const layer = getFieldLayerDefinition('torusCurvature');

    expect(layer?.label).toBe('Torus Curvature');
    expect(layer?.valueKind).toBe('derived');
    expect(layer?.defaultVisible).toBe(false);
    expect(layer?.description.toLowerCase()).toContain('geometry');
  });

  it('defines overlay rules for torusCurvature', () => {
    const rule = getLayerOverlayRule('torusCurvature');

    expect(rule.layerId).toBe('torusCurvature');
    expect(rule.maxOpacity).toBeGreaterThan(0);
    expect(rule.defaultBlendMode).toBe('normal');
  });

  it('keeps torusCurvature hidden by default so legacy views are unchanged', () => {
    const visibility = getDefaultFieldLayerVisibility();

    expect(visibility.torusCurvature).toBe(false);
  });

  it('builds a neutral torus curvature summary without semantic claim language', () => {
    const summary = buildTorusCurvatureSummary(true, 0.45, 8, 8, 1);

    expect(summary.layerId).toBe('torusCurvature');
    expect(summary.shortText.toLowerCase()).toContain('curvature');
    expect(summary.shortText.toLowerCase()).not.toContain('conscious');
    expect(summary.shortText.toLowerCase()).not.toContain('emotion');
  });

  it('includes flat/curved metric controls and curvature diagnostics in the geometry panel', () => {
    expect(html).toContain("id=\"torus-metric-flat-btn\"");
    expect(html).toContain("id=\"torus-metric-curved-btn\"");
    expect(html).toContain("id=\"row-gaussian-range\"");
    expect(html).toContain("id=\"row-curvature-asymmetry\"");
    expect(html).toContain('Curved metric is enabled for observation only');
  });
});
