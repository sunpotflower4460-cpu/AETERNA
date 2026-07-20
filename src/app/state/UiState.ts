/**
 * UiState.ts
 *
 * Deliberately minimal slice of the target UiState (master spec §8.3) —
 * only fields with a real, live consumer are included.
 * contextPanel/contextSheetState/selectedCellId/activeLensId/
 * displayDensity from the full target interface still have no
 * corresponding UI (Context Pane doesn't exist yet — see
 * docs/ui-migration-boundary.md), so they are not added as dead fields.
 * primaryRoute was added in PR6 once NavigationRail became a real
 * consumer (src/ui/shell/NavigationRail.ts, src/app/AppShell.ts).
 */

export type InteractionMode = 'observe' | 'inspect' | 'stimulate' | 'camera';
export type PrimaryRoute = 'observe' | 'experiment' | 'history' | 'research';

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

  /**
   * Which of the 4 top-level routes (master spec §5.1) is active in the
   * new Observatory Shell (src/app/AppShell.ts, opt-in — see
   * docs/ui-feature-status.md PR6 entry). Has no effect on the legacy UI.
   */
  primaryRoute: PrimaryRoute;
}

export const DEFAULT_UI_STATE: UiState = {
  interactionMode: 'stimulate',
  primaryRoute: 'observe',
};
