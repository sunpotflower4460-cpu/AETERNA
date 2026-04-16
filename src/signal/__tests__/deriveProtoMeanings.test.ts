import { describe, it, expect } from 'vitest';
import { createStimulusPacket } from '../createStimulusPacket.js';
import { activateSignals } from '../activateSignals.js';
import { runSelfLoop } from '../runSelfLoop.js';
import { runBoundaryLoop } from '../runBoundaryLoop.js';
import { buildSignalField } from '../buildSignalField.js';
import { bindSignals } from '../bindSignals.js';
import { deriveProtoMeanings } from '../deriveProtoMeanings.js';

describe('deriveProtoMeanings', () => {
  function runPipeline(text: string) {
    const p = createStimulusPacket(text);
    let signals = activateSignals(p);
    signals = runSelfLoop(p, signals);
    const boundary = runBoundaryLoop(p, signals);
    const _field = buildSignalField(signals, boundary);
    const bindings = bindSignals(signals);
    const protoMeanings = deriveProtoMeanings(signals, bindings);
    return { protoMeanings, signals, bindings };
  }

  it('produces at least 1 proto meaning for any input', () => {
    const { protoMeanings } = runPipeline('こんにちは');
    expect(protoMeanings.length).toBeGreaterThanOrEqual(1);
  });

  it('produces 消耗の気配 for fatigue input', () => {
    const { protoMeanings } = runPipeline('とても疲れた、しんどい');
    const pm = protoMeanings.find(p => p.glossJa === '消耗の気配');
    expect(pm).toBeDefined();
  });

  it('produces でも答えたい for question input', () => {
    const { protoMeanings } = runPipeline('どうすればいいですか？');
    const pm = protoMeanings.find(p => p.glossJa === 'でも答えたい');
    expect(pm).toBeDefined();
  });

  it('all proto meanings have strength > 0', () => {
    const { protoMeanings } = runPipeline('疲れた、どうしよう');
    for (const pm of protoMeanings) {
      expect(pm.strength).toBeGreaterThan(0);
    }
  });

  it('proto meanings have sourceSignalIds populated', () => {
    const { protoMeanings } = runPipeline('疲れた、どうすればいい？');
    for (const pm of protoMeanings) {
      expect(pm.sourceSignalIds.length).toBeGreaterThan(0);
    }
  });

  it('produces multiple proto meanings for rich emotional input', () => {
    const { protoMeanings } = runPipeline('疲れた、しんどい、もうどうすればいいかわからない');
    expect(protoMeanings.length).toBeGreaterThanOrEqual(2);
  });
});
