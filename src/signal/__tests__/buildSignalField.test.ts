import { describe, it, expect } from 'vitest';
import { createStimulusPacket } from '../createStimulusPacket.js';
import { activateSignals } from '../activateSignals.js';
import { runSelfLoop } from '../runSelfLoop.js';
import { runBoundaryLoop } from '../runBoundaryLoop.js';
import { buildSignalField } from '../buildSignalField.js';

describe('buildSignalField', () => {
  function runPipeline(text: string) {
    const p = createStimulusPacket(text);
    let signals = activateSignals(p);
    signals = runSelfLoop(p, signals);
    const boundary = runBoundaryLoop(p, signals);
    const field = buildSignalField(signals, boundary);
    return { field, p };
  }

  it('returns relational field values, not user-diagnosis values', () => {
    const { field } = runPipeline('疲れた、どうすればいい？');
    // All values should be in [0, 1]
    for (const key of ['closeness', 'fragility', 'urgency', 'permission', 'answerPressure', 'unfinishedness'] as const) {
      expect(field[key]).toBeGreaterThanOrEqual(0);
      expect(field[key]).toBeLessThanOrEqual(1);
    }
  });

  it('raises answerPressure when explicit question is present', () => {
    const { field } = runPipeline('どうすればいいかアドバイスをください');
    expect(field.answerPressure).toBeGreaterThan(0.3);
  });

  it('raises fragility for fatigue input', () => {
    const { field: fatigueField } = runPipeline('とても疲れた、しんどい');
    const { field: neutralField } = runPipeline('今日は天気がいい');
    expect(fatigueField.fragility).toBeGreaterThan(neutralField.fragility);
  });

  it('raises closeness when emotional charge is high', () => {
    const { field: highField } = runPipeline('疲れた、つらい、しんどい');
    const { field: lowField } = runPipeline('今日は天気がいい');
    expect(highField.closeness).toBeGreaterThan(lowField.closeness);
  });

  it('raises unfinishedness when hesitation is strong', () => {
    // High emotional charge drives hesitation up, which should raise unfinishedness
    const { field } = runPipeline('疲れた、もうどうすればいいかわからない');
    expect(field.unfinishedness).toBeGreaterThan(0.2);
  });

  it('all field values are numbers', () => {
    const { field } = runPipeline('test');
    for (const v of Object.values(field)) {
      expect(typeof v).toBe('number');
    }
  });
});
