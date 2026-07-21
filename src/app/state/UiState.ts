/**
 * UiState.ts
 *
 * Deliberately minimal slice of the target UiState (master spec §8.3) —
 * only fields with a real, live consumer are included.
 * contextPanel/contextSheetState/displayDensity from the full target
 * interface still have no corresponding UI, so they are not added as
 * dead fields. primaryRoute was added in PR6 (NavigationRail is its
 * consumer); selectedCellId was added in PR8b (CellInspectorPanel is
 * its consumer); activeLensId was added in PR8c; replaySelectedTick was
 * added in PR8d (ReplayPanel is its consumer).
 */

export type InteractionMode = 'observe' | 'inspect' | 'stimulate' | 'camera';
export type PrimaryRoute = 'observe' | 'experiment' | 'history' | 'research';

/**
 * A lens picks which of a selected cell's real metrics to emphasize.
 * Deliberately NOT the full 17-lens set in the existing (unconnected)
 * src/ui/lens/metricLensRegistry.ts scaffolding — that registry assumes
 * a rich CellObservation (curvature, membrane, vortex, plasticity, ...)
 * none of which is available from the live legacy Runtime today (only
 * AeternaNetwork.currentBuffer/spikeTrace are real per-node accessors —
 * see PR8b). This lens set only covers what's genuinely there; extend it
 * once more per-cell derivations are wired into RuntimeAdapter.
 */
export type LensId = 'currentValue' | 'spikeTrace';

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

  /**
   * The cell (network node index) currently selected for inspection, set
   * by a tap while interactionMode==='inspect' (src/perception/pointerHandlers.js).
   * Selecting a cell never mutates Runtime state (master spec §10
   * "Inspect中のタップでRuntimeが変わらない") — see
   * src/app/runtime/RuntimeAdapter.ts's getCellValue, a read-only accessor.
   */
  selectedCellId: number | null;

  /**
   * Which of the selected cell's metrics is emphasized in the Cell
   * Inspector panel (src/ui/shell/CellInspectorPanel.ts). Null means no
   * particular metric is emphasized (both rows shown equally).
   */
  activeLensId: LensId | null;

  /**
   * A tick selected for replay (src/ui/shell/ReplayPanel.ts, shown on the
   * 'history' route) — re-displays a previously captured RuntimeSnapshot
   * (src/app/replay/RuntimeSnapshotHistory.ts). Null means "live" (no
   * replay selected). Selecting a tick never rewinds or otherwise
   * touches the Runtime — it only changes what the panel displays.
   */
  replaySelectedTick: number | null;
}

export const DEFAULT_UI_STATE: UiState = {
  interactionMode: 'stimulate',
  primaryRoute: 'observe',
  selectedCellId: null,
  activeLensId: null,
  replaySelectedTick: null,
};
