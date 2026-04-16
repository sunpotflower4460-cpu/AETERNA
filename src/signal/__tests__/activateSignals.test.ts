import { describe, it, expect } from 'vitest';
import { createStimulusPacket } from '../createStimulusPacket.js';
import { activateSignals } from '../activateSignals.js';

describe('activateSignals', () => {
  it('raises other_fatigue_signal for fatigue text', () => {
    const p = createStimulusPacket('疲れた、もうしんどい');
    const signals = activateSignals(p);
    const fatigue = signals.find(s => s.id === 'other_fatigue_signal');
    expect(fatigue).toBeDefined();
    expect(fatigue!.activation).toBeGreaterThan(0.5);
    expect(['dominant', 'coactive']).toContain(fatigue!.kind);
  });

  it('raises other_question_signal for explicit question', () => {
    const p = createStimulusPacket('どうしたらいい？');
    const signals = activateSignals(p);
    const q = signals.find(s => s.id === 'other_question_signal');
    expect(q).toBeDefined();
    expect(q!.activation).toBeGreaterThan(0.5);
  });

  it('self_care_response and belief_not_push_too_early can both be active simultaneously', () => {
    const p = createStimulusPacket('つらくてどうすればいいかわからない');
    const signals = activateSignals(p);
    const care = signals.find(s => s.id === 'self_care_response');
    const notPush = signals.find(s => s.id === 'belief_not_push_too_early');
    expect(care).toBeDefined();
    expect(notPush).toBeDefined();
    // Both should have non-trivial activation
    expect(care!.activation).toBeGreaterThan(0.2);
    expect(notPush!.activation).toBeGreaterThan(0.2);
  });

  it('produces signals from all three layers (other, self, belief)', () => {
    const p = createStimulusPacket('疲れた');
    const signals = activateSignals(p);
    const sources = new Set(signals.map(s => s.source));
    expect(sources.has('other')).toBe(true);
    expect(sources.has('self')).toBe(true);
    expect(sources.has('belief')).toBe(true);
  });

  it('includes at least one suppressed signal', () => {
    const p = createStimulusPacket('疲れた');
    const signals = activateSignals(p);
    const suppressed = signals.filter(s => s.kind === 'suppressed');
    expect(suppressed.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps all activation values in [0, 1]', () => {
    const p = createStimulusPacket('むかつく！うざい！なんとかしてアドバイスをくれ！');
    const signals = activateSignals(p);
    for (const s of signals) {
      expect(s.activation).toBeGreaterThanOrEqual(0);
      expect(s.activation).toBeLessThanOrEqual(1);
    }
  });
});
