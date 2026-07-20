/**
 * eventLifecycle.ts
 *
 * Small helpers around ObservationEventLifecycle (master spec §9.3).
 * 'started'/'updated' keep a dedupeKey "active"; 'resolved' clears it.
 * Continuous state is not re-eventized every tick — only a real change
 * (new payloadFingerprint) while active, or a transition to resolved,
 * should reach the store's history.
 */

import type { ObservationEventLifecycle } from './ObservationEvent.js';

export function keepsKeyActive(lifecycle: ObservationEventLifecycle): boolean {
  return lifecycle === 'started' || lifecycle === 'updated';
}
