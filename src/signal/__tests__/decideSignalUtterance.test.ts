import { describe, it, expect } from 'vitest';
import { createStimulusPacket } from '../createStimulusPacket.js';
import { activateSignals } from '../activateSignals.js';
import { runSelfLoop } from '../runSelfLoop.js';
import { runBoundaryLoop } from '../runBoundaryLoop.js';
import { buildSignalField } from '../buildSignalField.js';
import { bindSignals } from '../bindSignals.js';
import { deriveProtoMeanings } from '../deriveProtoMeanings.js';
import { decideSignalUtterance } from '../decideSignalUtterance.js';

describe('decideSignalUtterance', () => {
  function runPipeline(text: string) {
    const p = createStimulusPacket(text);
    let signals = activateSignals(p);
    signals = runSelfLoop(p, signals);
    const boundary = runBoundaryLoop(p, signals);
    const field = buildSignalField(signals, boundary);
    const bindings = bindSignals(signals);
    const protoMeanings = deriveProtoMeanings(signals, bindings);
    const decision = decideSignalUtterance(p, protoMeanings, field, signals);
    return { decision, p, signals, field };
  }

  it('sets shouldAnswerQuestion=true for question input with high answerPressure', () => {
    const { decision } = runPipeline('どうすればいいですか？アドバイスをください');
    expect(decision.shouldAnswerQuestion).toBe(true);
  });

  it('sets shouldAnswerQuestion=false for non-question input', () => {
    const { decision } = runPipeline('今日は天気がいいですね');
    expect(decision.shouldAnswerQuestion).toBe(false);
  });

  it('returns a valid stance', () => {
    const { decision } = runPipeline('疲れた、どうすれば？');
    expect(['hold', 'answer', 'soft_answer', 'open_reflect']).toContain(decision.stance);
  });

  it('returns a valid replyIntent', () => {
    const { decision } = runPipeline('つらい');
    expect(['emotional_holding', 'judgment_support', 'practical_advice', 'free_reflection']).toContain(decision.replyIntent);
  });

  it('sets shouldStayOpen=true when hesitation + fragility are high', () => {
    // High emotional charge → high hesitation → shouldStayOpen
    const { decision } = runPipeline('疲れた、しんどい、つらい、もうだめかも');
    expect(decision.shouldStayOpen).toBe(true);
  });

  it('closeness is in [0, 1]', () => {
    const { decision } = runPipeline('疲れた');
    expect(decision.closeness).toBeGreaterThanOrEqual(0);
    expect(decision.closeness).toBeLessThanOrEqual(1);
  });

  it('withheldBias is in [0, 1]', () => {
    const { decision } = runPipeline('疲れた');
    expect(decision.withheldBias).toBeGreaterThanOrEqual(0);
    expect(decision.withheldBias).toBeLessThanOrEqual(1);
  });

  it('stance is hold when hostility is high', () => {
    const { decision } = runPipeline('うざい！むかつく！');
    expect(decision.stance).toBe('hold');
  });
});
