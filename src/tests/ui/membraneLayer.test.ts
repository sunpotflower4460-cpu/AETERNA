import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { FIELD_LAYER_REGISTRY, getFieldLayerDefinition } from '../../ui/render/fieldLayerRegistry.js';
import { FIELD_LAYER_OVERLAY_RULES } from '../../ui/render/fieldLayerOverlayRules.js';

const ROOT = resolve(__dirname, '../..');
const registrySrc = readFileSync(resolve(ROOT, 'ui/render/fieldLayerRegistry.ts'), 'utf-8');
const timelineSrc = readFileSync(resolve(ROOT, 'ui/timeline/deriveAeternaEvents.ts'), 'utf-8');
const summarySrc = readFileSync(resolve(ROOT, 'ui/summary/deriveNowSummary.ts'), 'utf-8');
const guideSrc = readFileSync(resolve(ROOT, 'ui/guide/deriveGuideExplanation.ts'), 'utf-8');

describe('membrane field layer integration', () => {
  it('registers membraneState as a field layer', () => {
    expect(FIELD_LAYER_REGISTRY.membraneState).toBeDefined();
    expect(getFieldLayerDefinition('membraneState')?.label).toBe('Membrane Layer');
    expect(FIELD_LAYER_OVERLAY_RULES.membraneState).toBeDefined();
  });

  it('uses neutral membrane terminology', () => {
    const membrane = getFieldLayerDefinition('membraneState');
    expect(membrane?.description).toContain('mediating layer');
    expect(membrane?.description).not.toMatch(/soul|self boundary|conscious|emotion/i);
    expect(membrane?.disclaimer).toContain('NOT');
  });

  it('does not add semantic or consciousness claims in membrane UI text', () => {
    [registrySrc, timelineSrc, summarySrc, guideSrc].forEach((src) => {
      expect(src).not.toContain('魂の膜');
      expect(src).not.toContain('self boundary');
      expect(src).not.toContain('soul boundary');
      expect(src).not.toContain('膜が自己を感じています');
      expect(src).not.toContain('world and self boundary');
    });
  });
});
