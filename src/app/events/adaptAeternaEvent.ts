/**
 * adaptAeternaEvent.ts
 *
 * Converts the existing live AeternaEvent shape (src/types/aeternaEvent.ts,
 * produced by src/ui/timeline/deriveAeternaEvents.ts — already CONNECTED,
 * called every ~30 frames from updateMetricsUI.js) into an ObservationEvent
 * for the new store. This is the first real producer feeding the store —
 * see docs/ui-feature-status.md addendum.
 *
 * deriveAeternaEvents' events are point-in-time threshold-crossing
 * observations, not persistent conditions with a real start/end, so they
 * map to lifecycle='updated' here rather than a fabricated
 * started/resolved pair — true lifecycle tracking for persistent states
 * is later work once a producer that actually has that concept
 * (e.g. a migrated MajorStateObserver) exists.
 */

import type { AeternaEvent } from '../../types/aeternaEvent.js';
import type { ObservationEvent, ObservationEventSeverity } from './ObservationEvent.js';
import { computeDedupeKey, computePayloadFingerprint } from './eventDedupe.js';

export function adaptAeternaEvent(event: AeternaEvent): ObservationEvent {
  const severity: ObservationEventSeverity = event.severity;
  const base = {
    source: event.source,
    kind: event.kind,
    subjectId: undefined,
    scenarioId: undefined,
    lifecycle: 'updated' as const,
  };
  return {
    id: event.id,
    dedupeKey: computeDedupeKey(base),
    ...base,
    severity,
    tick: event.tick,
    timestamp: event.timestamp,
    messageJa: event.text,
    messageEn: event.text,
    valueKind: event.valueKind,
    payloadFingerprint: computePayloadFingerprint(event.text, event.tick),
  };
}
