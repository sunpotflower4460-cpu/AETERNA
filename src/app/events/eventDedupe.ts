/**
 * eventDedupe.ts
 *
 * Dedupe key derivation per master spec §9.2: source + kind + subjectId +
 * scenarioId + lifecycle. payloadFingerprint is compared separately
 * (see ObservationEventStore) so an 'updated' event with genuinely new
 * content isn't dropped just because the key matches.
 */

import type { ObservationEvent } from './ObservationEvent.js';

export function computeDedupeKey(
  event: Pick<ObservationEvent, 'source' | 'kind' | 'subjectId' | 'scenarioId' | 'lifecycle'>
): string {
  return [
    event.source,
    event.kind,
    event.subjectId ?? '',
    event.scenarioId ?? '',
    event.lifecycle,
  ].join('::');
}

/**
 * Same components as computeDedupeKey but WITHOUT lifecycle — identifies
 * "the same subject regardless of lifecycle stage". A 'started' event and
 * its matching 'resolved' event share a subjectKey (so the store can tell
 * they're the same ongoing condition) but have different dedupeKeys
 * (so both still land in history individually, per master spec §9.2).
 */
export function computeSubjectKey(
  event: Pick<ObservationEvent, 'source' | 'kind' | 'subjectId' | 'scenarioId'>
): string {
  return [event.source, event.kind, event.subjectId ?? '', event.scenarioId ?? ''].join('::');
}

/**
 * A stable fingerprint of an event's content, so the store can tell a
 * genuinely new 'updated' payload apart from a re-send of the same one.
 * Deliberately simple (not a cryptographic hash) — collisions across
 * unrelated events are prevented by dedupeKey already scoping by
 * source/kind/subject, not by this fingerprint alone.
 */
export function computePayloadFingerprint(text: string, tick: number): string {
  return `${tick}:${text}`;
}
