/**
 * observationEventStore.test.ts
 *
 * Confirms:
 * - computeDedupeKey/computePayloadFingerprint produce stable keys
 * - ObservationEventStore accepts a genuinely new event
 * - ObservationEventStore rejects an exact duplicate while a key is active
 *   ('started'/'updated' with the same payloadFingerprint)
 * - a changed payload with the same dedupeKey is accepted (real update)
 * - a 'resolved' event clears the active key so a later 'started' isn't
 *   treated as a duplicate
 * - history is bounded to maxHistory
 * - adaptAeternaEvent maps kind/source/severity/tick and sets lifecycle='updated'
 */

import { describe, it, expect } from 'vitest';
import { ObservationEventStore } from '../../app/events/ObservationEventStore.js';
import { computeDedupeKey, computePayloadFingerprint } from '../../app/events/eventDedupe.js';
import { adaptAeternaEvent } from '../../app/events/adaptAeternaEvent.js';
import type { ObservationEvent } from '../../app/events/ObservationEvent.js';
import type { AeternaEvent } from '../../types/aeternaEvent.js';

function makeEvent(overrides: Partial<ObservationEvent> = {}): ObservationEvent {
  const base: ObservationEvent = {
    id: 'ev-1',
    dedupeKey: '',
    source: 'testSource',
    kind: 'testKind',
    lifecycle: 'updated',
    severity: 'info',
    tick: 1,
    timestamp: 1000,
    messageJa: 'test',
    messageEn: 'test',
    valueKind: 'derived',
    payloadFingerprint: '1:test',
  };
  const merged = { ...base, ...overrides };
  merged.dedupeKey = merged.dedupeKey || computeDedupeKey(merged);
  return merged;
}

describe('computeDedupeKey / computePayloadFingerprint', () => {
  it('is stable for identical inputs', () => {
    const a = computeDedupeKey({ source: 's', kind: 'k', subjectId: 'x', scenarioId: 'y', lifecycle: 'updated' });
    const b = computeDedupeKey({ source: 's', kind: 'k', subjectId: 'x', scenarioId: 'y', lifecycle: 'updated' });
    expect(a).toBe(b);
  });

  it('differs when lifecycle differs', () => {
    const started = computeDedupeKey({ source: 's', kind: 'k', lifecycle: 'started' });
    const resolved = computeDedupeKey({ source: 's', kind: 'k', lifecycle: 'resolved' });
    expect(started).not.toBe(resolved);
  });

  it('produces a fingerprint that changes when text changes', () => {
    expect(computePayloadFingerprint('a', 1)).not.toBe(computePayloadFingerprint('b', 1));
  });
});

describe('ObservationEventStore', () => {
  it('accepts a new event', () => {
    const store = new ObservationEventStore();
    const result = store.add(makeEvent());
    expect(result.accepted).toBe(true);
    expect(store.getHistory()).toHaveLength(1);
  });

  it('rejects an exact duplicate while the key is active', () => {
    const store = new ObservationEventStore();
    store.add(makeEvent({ id: 'ev-1' }));
    const result = store.add(makeEvent({ id: 'ev-2' }));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('duplicate');
    expect(store.getHistory()).toHaveLength(1);
  });

  it('accepts a changed payload under the same dedupeKey as a real update', () => {
    const store = new ObservationEventStore();
    store.add(makeEvent({ id: 'ev-1', payloadFingerprint: '1:a' }));
    const result = store.add(makeEvent({ id: 'ev-2', payloadFingerprint: '2:b', tick: 2 }));
    expect(result.accepted).toBe(true);
    expect(store.getHistory()).toHaveLength(2);
  });

  it('clears the active key on resolved, so a later started is not a duplicate', () => {
    const store = new ObservationEventStore();
    store.add(makeEvent({ id: 'ev-1', lifecycle: 'started', payloadFingerprint: 'p' }));
    store.add(makeEvent({ id: 'ev-2', lifecycle: 'resolved', payloadFingerprint: 'p' }));
    const third = store.add(makeEvent({ id: 'ev-3', lifecycle: 'started', payloadFingerprint: 'p' }));
    expect(third.accepted).toBe(true);
    expect(store.getHistory()).toHaveLength(3);
  });

  it('bounds history to maxHistory', () => {
    const store = new ObservationEventStore(3);
    for (let i = 0; i < 5; i++) {
      store.add(makeEvent({ id: `ev-${i}`, payloadFingerprint: `p${i}`, dedupeKey: `key-${i}` }));
    }
    expect(store.getHistory()).toHaveLength(3);
  });

  it('getRecent returns the newest-first slice', () => {
    const store = new ObservationEventStore();
    store.add(makeEvent({ id: 'ev-1', dedupeKey: 'k1', payloadFingerprint: 'p1' }));
    store.add(makeEvent({ id: 'ev-2', dedupeKey: 'k2', payloadFingerprint: 'p2' }));
    expect(store.getRecent(1)[0].id).toBe('ev-2');
  });
});

describe('adaptAeternaEvent', () => {
  it('maps kind/source/severity/tick/timestamp and sets lifecycle=updated', () => {
    const aeternaEvent: AeternaEvent = {
      id: 'riskChange-10-0',
      tick: 10,
      timestamp: 5000,
      kind: 'riskChange',
      severity: 'warning',
      text: 'tick 10: Saturation risk increased → 0.70',
      source: 'DynamicViabilityState.saturationRisk',
      valueKind: 'proxy',
    };
    const adapted = adaptAeternaEvent(aeternaEvent);
    expect(adapted.kind).toBe('riskChange');
    expect(adapted.source).toBe('DynamicViabilityState.saturationRisk');
    expect(adapted.severity).toBe('warning');
    expect(adapted.tick).toBe(10);
    expect(adapted.timestamp).toBe(5000);
    expect(adapted.lifecycle).toBe('updated');
    expect(adapted.messageEn).toBe(aeternaEvent.text);
    expect(adapted.messageJa).toBe(aeternaEvent.text);
    expect(adapted.valueKind).toBe('proxy');
  });
});
