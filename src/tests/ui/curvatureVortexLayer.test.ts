/**
 * curvatureVortexLayer.test.ts
 * N3: Curvature × Vortex Coupling — UI layer registry tests
 */

import { describe, expect, it } from 'vitest';

import {
  FIELD_LAYER_REGISTRY,
  getAllFieldLayerDefinitions,
  getFieldLayerDefinition,
  getDefaultFieldLayerVisibility,
  getFieldLayersForMode,
} from '../../ui/render/fieldLayerRegistry.js';

describe('N3 curvatureVortexCoupling layer registry', () => {

  it('curvatureVortexCoupling layer exists in registry', () => {
    expect(FIELD_LAYER_REGISTRY.curvatureVortexCoupling).toBeDefined();
  });

  it('layer has correct id', () => {
    const layer = FIELD_LAYER_REGISTRY.curvatureVortexCoupling;
    expect(layer.id).toBe('curvatureVortexCoupling');
  });

  it('layer is a proxy valueKind', () => {
    const layer = FIELD_LAYER_REGISTRY.curvatureVortexCoupling;
    expect(layer.valueKind).toBe('proxy');
  });

  it('layer is in overlay and diagnostic modes', () => {
    const layer = FIELD_LAYER_REGISTRY.curvatureVortexCoupling;
    expect(layer.allowedModes).toContain('overlay');
    expect(layer.allowedModes).toContain('diagnostic');
  });

  it('layer is default OFF', () => {
    const layer = FIELD_LAYER_REGISTRY.curvatureVortexCoupling;
    expect(layer.defaultVisible).toBe(false);
  });

  it('layer description does not contain positive consciousness/emotion claims', () => {
    const layer = FIELD_LAYER_REGISTRY.curvatureVortexCoupling;
    const combined = (layer.description + ' ' + layer.disclaimer).toLowerCase();
    // Check for positive claim phrases (not negations) that would be inappropriate.
    // The disclaimer is allowed to say "NOT a consciousness ... indicator".
    const forbiddenPositivePhrases = [
      'is consciousness',
      'is emotion',
      'is a soul',
      'represents consciousness',
      'represents emotion',
      'self-aware',
      'the torus understands',
      'the torus feels',
      'conscious vortex',
      'soul center',
    ];
    for (const phrase of forbiddenPositivePhrases) {
      expect(combined).not.toContain(phrase);
    }
  });

  it('layer is listed in getAllFieldLayerDefinitions', () => {
    const all = getAllFieldLayerDefinitions();
    const ids = all.map((l) => l.id);
    expect(ids).toContain('curvatureVortexCoupling');
  });

  it('getFieldLayerDefinition returns the correct layer', () => {
    const layer = getFieldLayerDefinition('curvatureVortexCoupling');
    expect(layer).toBeDefined();
    expect(layer?.id).toBe('curvatureVortexCoupling');
  });

  it('getDefaultFieldLayerVisibility includes curvatureVortexCoupling as false', () => {
    const visibility = getDefaultFieldLayerVisibility();
    expect(visibility.curvatureVortexCoupling).toBe(false);
  });

  it('layer appears in diagnostic mode layers', () => {
    const diagLayers = getFieldLayersForMode('diagnostic');
    const ids = diagLayers.map((l) => l.id);
    expect(ids).toContain('curvatureVortexCoupling');
  });

  it('layer appears in overlay mode layers', () => {
    const overlayLayers = getFieldLayersForMode('overlay');
    const ids = overlayLayers.map((l) => l.id);
    expect(ids).toContain('curvatureVortexCoupling');
  });

  it('layer is NOT connected to weak plasticity (no plasticity source states)', () => {
    const layer = FIELD_LAYER_REGISTRY.curvatureVortexCoupling;
    for (const src of layer.sourceStates) {
      expect(src.toLowerCase()).not.toContain('plasticity');
    }
  });

  it('layer label contains Curvature and Vortex', () => {
    const layer = FIELD_LAYER_REGISTRY.curvatureVortexCoupling;
    expect(layer.label).toContain('Curvature');
    expect(layer.label).toContain('Vortex');
  });
});
