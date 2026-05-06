/**
 * lensGuideProvider.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for getLensGuideProvider and provider adapters.
 */

import { describe, it, expect } from 'vitest';
import {
  getLensGuideProvider,
  ruleBasedLensGuideProvider,
  externalLlmLensGuideProvider,
} from '../../guide/lensGuideProvider.ts';
import { defaultLensGuideConfig } from '../../config/lensGuideConfig.ts';
import type { LensGuideConfig } from '../../config/lensGuideConfig.ts';
import type { LensGuideRequest } from '../../guide/lensGuideTypes.ts';
import type { LensContextPacket } from '../../ui/lens/lensContextPacket.ts';
import type { CellObservation } from '../../types/cellObservation.ts';

function makeCellObservation(): CellObservation {
  return {
    timestamp: 1000,
    tick: 42,
    cellIndex: 5,
    segments: 16,
    geometry: { i: 0, j: 5, majorAngle: 0.2, minorAngle: 0.3 },
    field: { amplitude: 0.55, phase: 1.2, phaseCoherenceLocal: 0.8, flowContinuityLocal: 0.6, energyThroughputLocal: 0.33 },
    vortex: { candidateConfidence: 0.7, topologicalCharge: 1, phaseWinding: 6.28 },
    membrane: { deformation: 0.3, tension: 0.2, permeability: 0.5, returnImprint: 0.1, twoSidedness: 0.4 },
    plasticity: { accumulatedTrace: 0.15, resistanceScale: 1.05 },
    ratios: { strongestMatchId: null, strongestMatchStrength: 0.6 },
    events: { recentEventIds: [], recentEventCount: 0 },
    diagnostics: {
      valueKinds: { geometry: 'measured', field: 'derived', vortex: 'proxy', membrane: 'proxy', plasticity: 'proxy', ratios: 'proxy', events: 'measured' },
      missingFieldCount: 0,
      hasUnavailableSource: false,
    },
  } as CellObservation;
}

function makeRequest(): LensGuideRequest {
  const obs = makeCellObservation();
  const lensContext: LensContextPacket = {
    timestamp: Date.now(),
    tick: 42,
    cellObservation: obs,
    activeLens: null,
    highlightedMetricValue: undefined,
    contextSummary: 'cell index=5',
    epistemicNote: 'Observer-side only.',
    isReplayMode: false,
  };
  return { mode: 'explain', userQuestion: 'test', lensContext };
}

describe('getLensGuideProvider', () => {
  it('getLensGuideProvider(defaultConfig) returns ruleBased', () => {
    const provider = getLensGuideProvider(defaultLensGuideConfig);
    expect(provider.id).toBe('ruleBased');
    expect(provider.kind).toBe('ruleBased');
  });

  it('public mode returns ruleBased', () => {
    const config: LensGuideConfig = {
      ...defaultLensGuideConfig,
      allowInPublicMode: true,
      provider: 'ruleBased',
    };
    const provider = getLensGuideProvider(config);
    expect(provider.kind).toBe('ruleBased');
  });

  it('externalLlm config without allowExternalApi returns ruleBased', () => {
    const config: LensGuideConfig = {
      ...defaultLensGuideConfig,
      provider: 'llmInterfaceOnly',
      allowExternalApi: false,
    };
    const provider = getLensGuideProvider(config);
    expect(provider.kind).toBe('ruleBased');
  });
});

describe('ruleBasedLensGuideProvider', () => {
  it('kind is ruleBased', () => {
    expect(ruleBasedLensGuideProvider.kind).toBe('ruleBased');
  });

  it('answer() returns a LensGuideResponse', async () => {
    const response = await ruleBasedLensGuideProvider.answer(makeRequest());
    expect(response).toBeDefined();
    expect(response.mode).toBe('explain');
    expect(typeof response.answer).toBe('string');
  });

  it('answer() resolves without error', async () => {
    await expect(ruleBasedLensGuideProvider.answer(makeRequest())).resolves.toBeDefined();
  });
});

describe('externalLlmLensGuideProvider', () => {
  it('kind is externalLlm', () => {
    expect(externalLlmLensGuideProvider.kind).toBe('externalLlm');
  });

  it('answer() throws "External LLM guide is not enabled in this build."', async () => {
    await expect(externalLlmLensGuideProvider.answer(makeRequest())).rejects.toThrow(
      'External LLM guide is not enabled in this build.',
    );
  });
});
