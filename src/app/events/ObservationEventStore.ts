/**
 * ObservationEventStore.ts
 *
 * A bounded, deduped event history producers can push into (master spec
 * §8.4, §9). One store instance is exported as a singleton
 * (observationEventStore) for the live app to share; the class itself is
 * exported too so tests and future producers aren't forced through the
 * singleton.
 */

import type { ObservationEvent } from './ObservationEvent.js';
import { computeDedupeKey, computeSubjectKey } from './eventDedupe.js';
import { keepsKeyActive } from './eventLifecycle.js';

export interface AddEventResult {
  accepted: boolean;
  reason?: 'duplicate';
}

export class ObservationEventStore {
  private history: ObservationEvent[] = [];
  // Keyed by subjectKey (source+kind+subjectId+scenarioId, WITHOUT
  // lifecycle) so a 'started' and its matching 'resolved' are recognized
  // as the same ongoing condition — see eventDedupe.ts computeSubjectKey.
  private lastBySubject = new Map<string, ObservationEvent>();
  private readonly maxHistory: number;

  constructor(maxHistory = 200) {
    this.maxHistory = maxHistory;
  }

  /**
   * Add an event. Returns accepted=false (without touching history) when
   * the event is a duplicate of the current active state for its
   * subject — same source/kind/subject/scenario, still
   * 'started'/'updated', same payload as last time.
   */
  add(event: ObservationEvent): AddEventResult {
    const subjectKey = computeSubjectKey(event);
    const last = this.lastBySubject.get(subjectKey);

    if (keepsKeyActive(event.lifecycle) && last && keepsKeyActive(last.lifecycle)) {
      if (last.payloadFingerprint === event.payloadFingerprint) {
        return { accepted: false, reason: 'duplicate' };
      }
    }

    const withKey: ObservationEvent = {
      ...event,
      dedupeKey: event.dedupeKey || computeDedupeKey(event),
    };
    this.lastBySubject.set(subjectKey, withKey);
    this.history.unshift(withKey);
    if (this.history.length > this.maxHistory) {
      this.history.length = this.maxHistory;
    }
    return { accepted: true };
  }

  getRecent(n = 20): ObservationEvent[] {
    return this.history.slice(0, n);
  }

  getHistory(): ObservationEvent[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
    this.lastBySubject.clear();
  }
}

export const observationEventStore = new ObservationEventStore();
