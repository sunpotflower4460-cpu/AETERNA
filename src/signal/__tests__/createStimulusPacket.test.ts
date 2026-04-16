import { describe, it, expect } from 'vitest';
import { createStimulusPacket } from '../createStimulusPacket.js';

describe('createStimulusPacket', () => {
  it('produces tokens from raw text', () => {
    const p = createStimulusPacket('疲れた、もう限界かも');
    expect(p.tokens.length).toBeGreaterThan(0);
  });

  it('sets explicitQuestion=true for ? mark', () => {
    const p = createStimulusPacket('どうしたらいいですか？');
    expect(p.explicitQuestion).toBe(true);
  });

  it('sets explicitQuestion=true for question keyword', () => {
    const p = createStimulusPacket('アドバイスをください');
    expect(p.explicitQuestion).toBe(true);
  });

  it('sets explicitQuestion=true for どう keyword', () => {
    const p = createStimulusPacket('どうすればいいかわからない');
    expect(p.explicitQuestion).toBe(true);
  });

  it('sets explicitQuestion=false for plain statement', () => {
    const p = createStimulusPacket('今日は晴れています');
    expect(p.explicitQuestion).toBe(false);
  });

  it('raises emotionalCharge for fatigue keywords', () => {
    const p = createStimulusPacket('すごく疲れた、しんどい');
    expect(p.emotionalCharge).toBeGreaterThan(0.2);
  });

  it('keeps emotionalCharge low for neutral text', () => {
    const p = createStimulusPacket('今日は天気がいい');
    expect(p.emotionalCharge).toBe(0);
  });

  it('computes salience within [0, 1]', () => {
    const p = createStimulusPacket('つらくてどうすればいいかわからない');
    expect(p.salience).toBeGreaterThan(0);
    expect(p.salience).toBeLessThanOrEqual(1);
  });

  it('accepts custom novelty', () => {
    const p = createStimulusPacket('hello', 0.8);
    expect(p.novelty).toBe(0.8);
  });
});
