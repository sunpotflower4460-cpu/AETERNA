/**
 * ObservationEvent.ts
 *
 * The shared event shape all notification/history producers should
 * eventually emit through (master spec §8.4, §9). This is new
 * infrastructure — it does not yet replace the four independent live
 * notification decision-makers found in PR0
 * (MajorStateObserver / GuidePanel / ObservationDisplay /
 * deriveAeternaEvents, see docs/ui-runtime-inventory.md §6). Migrating
 * each of those onto this store is later, panel-by-panel work (PR8).
 * PR4 connects the first one: deriveAeternaEvents.ts's already-live event
 * push also lands in this store — see src/app/events/ObservationEventStore.ts.
 */

export type ObservationEventLifecycle = 'started' | 'updated' | 'resolved';
export type ObservationEventSeverity = 'info' | 'notice' | 'warning' | 'critical';
export type ObservationEventValueKind =
  | 'measured'
  | 'derived'
  | 'proxy'
  | 'presentation-smoothed'
  | 'check';

export interface ObservationEvent {
  id: string;
  dedupeKey: string;
  source: string;
  kind: string;
  lifecycle: ObservationEventLifecycle;
  severity: ObservationEventSeverity;
  subjectId?: string;
  scenarioId?: string;
  tick: number;
  timestamp: number;
  /**
   * Japanese message. Today's live event producers (deriveAeternaEvents.ts)
   * only generate English text — messageJa currently duplicates messageEn
   * for those events rather than fabricating a translation. A real
   * Japanese-first rewrite of event text is separate, later work (out of
   * scope for the event-store plumbing this file defines).
   */
  messageJa: string;
  messageEn?: string;
  valueKind: ObservationEventValueKind;
  payloadFingerprint: string;
}
