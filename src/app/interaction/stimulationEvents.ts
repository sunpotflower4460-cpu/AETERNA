/**
 * stimulationEvents.ts
 *
 * A minimal pub-sub so other code (e.g. src/app/onboarding/
 * FirstObservationFlow.ts) can react to a REAL stimulation actually
 * happening, without pointerHandlers.js needing to know who's listening.
 * Emitted only from inside the interactionMode==='stimulate' gate added
 * in PR5 (src/perception/pointerHandlers.js) — this never fires for a
 * tap that didn't actually stimulate the field.
 */

type StimulationListener = () => void;

const listeners = new Set<StimulationListener>();

export function onStimulate(listener: StimulationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitStimulate(): void {
  for (const listener of listeners) listener();
}
