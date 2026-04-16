import { describe, it, expect, beforeEach } from 'vitest';
import { runSignalRuntime } from '../runSignalRuntime.js';
import { clearSignalMemoryLog, getSignalMemoryLog } from '../memory.js';

// List of internal terms that must not appear in the utterance
const INTERNAL_TERMS = [
  'proto_meaning', 'protoMeaning', 'signal_field', 'SignalField',
  'other_fatigue', 'self_care', 'belief_',
  'dominant', 'coactive', 'background', 'suppressed',
  'emotionalCharge', 'salience', 'novelty', 'explicitQuestion',
];

describe('runSignalRuntime', () => {
  beforeEach(() => {
    clearSignalMemoryLog();
  });

  it('returns a non-empty utterance', () => {
    const result = runSignalRuntime('疲れた');
    expect(result.utterance).toBeTruthy();
    expect(result.utterance.length).toBeGreaterThan(0);
  });

  it('question input → shouldAnswerQuestion === true', () => {
    const result = runSignalRuntime('どうすればいいですか？アドバイスをください');
    expect(result.decision.shouldAnswerQuestion).toBe(true);
  });

  it('fatigue input → other_fatigue_signal is dominant or coactive', () => {
    const result = runSignalRuntime('疲れた、しんどい');
    const fatigue = result.signals.find(s => s.id === 'other_fatigue_signal');
    expect(fatigue).toBeDefined();
    expect(['dominant', 'coactive']).toContain(fatigue!.kind);
  });

  it('self_care_response and belief_not_push_too_early can be active simultaneously', () => {
    const result = runSignalRuntime('つらくてどうすればいいかわからない');
    const care = result.signals.find(s => s.id === 'self_care_response');
    const notPush = result.signals.find(s => s.id === 'belief_not_push_too_early');
    expect(care!.activation).toBeGreaterThan(0.2);
    expect(notPush!.activation).toBeGreaterThan(0.2);
  });

  it('field is a relational field (all values numeric in [0,1])', () => {
    const result = runSignalRuntime('疲れた、どうしよう');
    for (const v of Object.values(result.field)) {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('produces at least 1 proto meaning', () => {
    const result = runSignalRuntime('こんにちは');
    expect(result.protoMeanings.length).toBeGreaterThanOrEqual(1);
  });

  it('utterance contains no internal terms', () => {
    const result = runSignalRuntime('疲れた、どうすればいい？');
    for (const term of INTERNAL_TERMS) {
      expect(result.utterance).not.toContain(term);
    }
  });

  it('records utterance in memory log', () => {
    runSignalRuntime('疲れた');
    const log = getSignalMemoryLog();
    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[0].utterance).toBeTruthy();
  });

  it('debugNotes is populated', () => {
    const result = runSignalRuntime('疲れた');
    expect(result.debugNotes.length).toBeGreaterThan(0);
  });

  it('signals include entries from all sources', () => {
    const result = runSignalRuntime('疲れた');
    const sources = new Set(result.signals.map(s => s.source));
    expect(sources.has('other')).toBe(true);
    expect(sources.has('self')).toBe(true);
    expect(sources.has('belief')).toBe(true);
  });
});
