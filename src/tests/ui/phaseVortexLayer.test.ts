import { describe, expect, it } from 'vitest';

import {
  FIELD_LAYER_REGISTRY,
  getFieldLayerDefinition,
} from '../../ui/render/fieldLayerRegistry.js';
import { FIELD_LAYER_OVERLAY_RULES } from '../../ui/render/fieldLayerOverlayRules.js';
import { TORUS_COLOR_MAP } from '../../ui/render/torusColorMap.js';
import {
  getVortexMarkerColor,
  mapPhaseToColor,
} from '../../ui/render/phaseColorMap.js';

describe('N2 phase/vortex layer wiring', () => {
  it('registers fieldPhase and vortexCandidate layers', () => {
    expect(getFieldLayerDefinition('fieldPhase')).toBeDefined();
    expect(getFieldLayerDefinition('vortexCandidate')).toBeDefined();
    expect(FIELD_LAYER_REGISTRY.fieldPhase.valueKind).toBe('derived');
    expect(FIELD_LAYER_REGISTRY.vortexCandidate.valueKind).toBe('proxy');
  });

  it('defines overlay rules and color roles for new layers', () => {
    expect(FIELD_LAYER_OVERLAY_RULES.fieldPhase).toBeDefined();
    expect(FIELD_LAYER_OVERLAY_RULES.vortexCandidate).toBeDefined();
    expect(TORUS_COLOR_MAP.fieldPhase).toBeDefined();
    expect(TORUS_COLOR_MAP.vortexCandidate).toBeDefined();
  });

  it('maps actual phase to amplitude-weighted color without semantic labels', () => {
    const bright = mapPhaseToColor({ phase: Math.PI / 2, amplitude: 1, maxAmplitude: 1 });
    const faint = mapPhaseToColor({ phase: Math.PI / 2, amplitude: 0.05, maxAmplitude: 1 });

    expect(bright.opacity).toBeGreaterThan(faint.opacity);
    expect(bright.r + bright.g + bright.b).toBeGreaterThan(0);
  });

  it('uses distinct marker colors for positive and negative vortex charge', () => {
    const positive = getVortexMarkerColor(1);
    const negative = getVortexMarkerColor(-1);

    expect(positive).not.toEqual(negative);
  });
});
