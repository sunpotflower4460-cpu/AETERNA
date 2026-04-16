import { describe, it, expect } from 'vitest';
import { createStimulusPacket } from '../createStimulusPacket.js';
import { activateSignals } from '../activateSignals.js';
import { runSelfLoop } from '../runSelfLoop.js';
import { runBoundaryLoop } from '../runBoundaryLoop.js';
import { buildSignalField } from '../buildSignalField.js';
import { bindSignals } from '../bindSignals.js';
import { deriveProtoMeanings } from '../deriveProtoMeanings.js';
import { runSignalRuntime } from '../runSignalRuntime.js';
import type { TouchPatternSeeds } from '../types.js';

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

  it('signal-derived proto meanings have sourceSignalIds populated', () => {
    const { protoMeanings } = runPipeline('疲れた、どうすればいい？');
    // Only check signal-derived meanings (touch-seed ones have empty sourceSignalIds by design)
    const signalDerived = protoMeanings.filter(pm => pm.sourceSignalIds.length > 0);
    expect(signalDerived.length).toBeGreaterThan(0);
  });

  it('produces multiple proto meanings for rich emotional input', () => {
    const { protoMeanings } = runPipeline('疲れた、しんどい、もうどうすればいいかわからない');
    expect(protoMeanings.length).toBeGreaterThanOrEqual(2);
  });

  // PR8-B: touch pattern seed tests
  describe('touch pattern seeds (PR8-B)', () => {
    const holdSeeds: TouchPatternSeeds = {
      noveltyBias: 0.05,
      recurrenceBias: 0.05,
      persistenceBias: 0.8,
      directionalityBias: 0.05,
      protoMeaningSeeds: ['persistence', 'pressure'],
    };
    const tapSeeds: TouchPatternSeeds = {
      noveltyBias: 0.7,
      recurrenceBias: 0.05,
      persistenceBias: 0.05,
      directionalityBias: 0.05,
      protoMeaningSeeds: ['arrival', 'novelty'],
    };
    const repeatSeeds: TouchPatternSeeds = {
      noveltyBias: 0.05,
      recurrenceBias: 0.75,
      persistenceBias: 0.05,
      directionalityBias: 0.05,
      protoMeaningSeeds: ['recurrence', 'return'],
    };
    const strokeSeeds: TouchPatternSeeds = {
      noveltyBias: 0.05,
      recurrenceBias: 0.05,
      persistenceBias: 0.05,
      directionalityBias: 0.65,
      protoMeaningSeeds: ['passage', 'direction'],
    };

    it('hold seeds → 持続の感触 proto-meaning is produced', () => {
      const result = runSignalRuntime('状態を観測中', 0.3, holdSeeds);
      const pm = result.protoMeanings.find(p => p.glossJa === '持続の感触');
      expect(pm).toBeDefined();
      expect(pm!.strength).toBeGreaterThan(0);
    });

    it('tap seeds → 到来の感触 proto-meaning is produced', () => {
      const result = runSignalRuntime('状態を観測中', 0.3, tapSeeds);
      const pm = result.protoMeanings.find(p => p.glossJa === '到来の感触');
      expect(pm).toBeDefined();
      expect(pm!.strength).toBeGreaterThan(0);
    });

    it('repeat seeds → 反復の感触 proto-meaning is produced', () => {
      const result = runSignalRuntime('状態を観測中', 0.3, repeatSeeds);
      const pm = result.protoMeanings.find(p => p.glossJa === '反復の感触');
      expect(pm).toBeDefined();
      expect(pm!.strength).toBeGreaterThan(0);
    });

    it('stroke seeds → 通過の感触 proto-meaning is produced', () => {
      const result = runSignalRuntime('状態を観測中', 0.3, strokeSeeds);
      const pm = result.protoMeanings.find(p => p.glossJa === '通過の感触');
      expect(pm).toBeDefined();
      expect(pm!.strength).toBeGreaterThan(0);
    });

    it('touch seed strengths are subordinate (≤ 0.4) to signal-derived meanings', () => {
      const result = runSignalRuntime('疲れた', 0.5, holdSeeds);
      const touchPm = result.protoMeanings.find(p => p.glossJa === '持続の感触');
      expect(touchPm!.strength).toBeLessThanOrEqual(0.4);
    });

    it('no touch seeds → 持続の感触 is absent', () => {
      const result = runSignalRuntime('状態を観測中', 0.3);
      const pm = result.protoMeanings.find(p => p.glossJa === '持続の感触');
      expect(pm).toBeUndefined();
    });

    it('touchSeeds is present in result when seeds are passed', () => {
      const result = runSignalRuntime('状態を観測中', 0.3, holdSeeds);
      expect(result.touchSeeds).toBeTruthy();
      expect(result.touchSeeds!.persistenceBias).toBe(0.8);
    });

    it('touch seeds mix score-based (non-dominant seed below threshold not added)', () => {
      // With very low scores (< 0.2), no touch proto-meanings should appear
      const lowSeeds: TouchPatternSeeds = {
        noveltyBias: 0.1,
        recurrenceBias: 0.1,
        persistenceBias: 0.1,
        directionalityBias: 0.1,
        protoMeaningSeeds: [],
      };
      const result = runSignalRuntime('状態を観測中', 0.3, lowSeeds);
      const touchPms = result.protoMeanings.filter(p =>
        ['到来の感触', '反復の感触', '持続の感触', '通過の感触'].includes(p.glossJa),
      );
      expect(touchPms.length).toBe(0);
    });
  });
});
