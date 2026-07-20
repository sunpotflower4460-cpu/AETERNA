/**
 * UiState.ts
 *
 * Deliberately minimal first slice of the target UiState (master spec
 * §8.3) — only fields with a real, live consumer are included.
 * primaryRoute/contextPanel/contextSheetState/selectedCellId/
 * activeLensId/displayDensity from the full target interface have no
 * corresponding UI yet (no ObservatoryShell/Context Pane exist — see
 * docs/ui-migration-boundary.md), so adding them now would be dead
 * fields, not real state. Extend this interface only as each field gets
 * a real consumer.
 */

export type InteractionMode = 'observe' | 'inspect' | 'stimulate' | 'camera';

export interface UiState {
  /**
   * Gates whether a canvas tap stimulates the field (see
   * src/app/interaction/interactionPredicates.ts). Defaults to
   * 'stimulate' — today's only live behavior is "tap to stimulate", the
   * app's core promoted interaction (see the Welcome copy in index.html:
   * "光の輪に触れて、場へ小さな刺激を与えてください"). This PR adds the
   * missing gate without silently changing that default.
   */
  interactionMode: InteractionMode;
}

export const DEFAULT_UI_STATE: UiState = {
  interactionMode: 'stimulate',
};
