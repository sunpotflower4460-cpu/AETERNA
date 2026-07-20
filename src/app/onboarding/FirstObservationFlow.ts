/**
 * FirstObservationFlow.ts
 *
 * The state machine from master spec §6: WELCOME → BASELINE_OBSERVING →
 * TOUCH_INVITED → REACTION_OBSERVED → INSIGHT_PRESENTED →
 * FREE_EXPLORATION. Distinct from the existing (unconnected)
 * src/ui/onboarding/FirstRunGuide.tsx, which is a 5-step feature-tour
 * modal — a different concept from this touch-and-see-a-reaction flow.
 *
 * Pure state container, no DOM — src/ui/onboarding/renderFirstObservationCard.ts
 * renders each state, src/app/AppShell.ts wires it up (mounted in the
 * Context Pane, behind the same opt-in newShell flag as the rest of the
 * Shell — see docs/ui-migration-boundary.md).
 */

export type FirstObservationStage =
  | 'WELCOME'
  | 'BASELINE_OBSERVING'
  | 'TOUCH_INVITED'
  | 'REACTION_OBSERVED'
  | 'INSIGHT_PRESENTED'
  | 'FREE_EXPLORATION';

export interface FirstObservationFlowState {
  stage: FirstObservationStage;
}

export interface FirstObservationFlow {
  getState(): FirstObservationFlowState;
  /** WELCOME → BASELINE_OBSERVING. No-op outside WELCOME. */
  start(): void;
  /** BASELINE_OBSERVING → TOUCH_INVITED (call after the baseline-observing wait). No-op elsewhere. */
  invite(): void;
  /**
   * A real stimulation occurred (see src/app/interaction/stimulationEvents.ts).
   * TOUCH_INVITED → REACTION_OBSERVED. Ignored in any other stage — this
   * flow does not fabricate a "reaction" it didn't actually observe.
   */
  recordTouch(): void;
  /** REACTION_OBSERVED → INSIGHT_PRESENTED. No-op elsewhere. */
  presentInsight(): void;
  /** INSIGHT_PRESENTED → FREE_EXPLORATION. No-op elsewhere. Terminal. */
  finish(): void;
  subscribe(listener: (state: FirstObservationFlowState) => void): () => void;
}

export function createFirstObservationFlow(): FirstObservationFlow {
  let state: FirstObservationFlowState = { stage: 'WELCOME' };
  const listeners = new Set<(state: FirstObservationFlowState) => void>();

  function transition(from: FirstObservationStage, to: FirstObservationStage) {
    if (state.stage !== from) return;
    state = { stage: to };
    for (const listener of listeners) listener(state);
  }

  return {
    getState: () => state,
    start: () => transition('WELCOME', 'BASELINE_OBSERVING'),
    invite: () => transition('BASELINE_OBSERVING', 'TOUCH_INVITED'),
    recordTouch: () => transition('TOUCH_INVITED', 'REACTION_OBSERVED'),
    presentInsight: () => transition('REACTION_OBSERVED', 'INSIGHT_PRESENTED'),
    finish: () => transition('INSIGHT_PRESENTED', 'FREE_EXPLORATION'),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
