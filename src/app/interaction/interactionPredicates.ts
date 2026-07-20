/**
 * interactionPredicates.ts
 *
 * Pure predicates the legacy pointer handlers gate real Runtime-affecting
 * side effects on (master spec §10 "必須条件"). Kept separate from
 * pointerHandlers.js itself, which touches DOM/state directly and can't
 * easily be unit-tested — these predicates carry the actual logic and are.
 */

import type { InteractionMode } from '../state/UiState.js';

/**
 * Whether a canvas tap should be allowed to stimulate the field
 * (network.injectPredictionError / touchMem.recordTouch's
 * network.injectSTDPExternal — both real Runtime effects, not just
 * visual feedback). Only 'stimulate' mode allows this — see master spec
 * §10 "Inspect中のタップでRuntimeが変わらない".
 */
export function shouldStimulateOnTap(mode: InteractionMode): boolean {
  return mode === 'stimulate';
}
