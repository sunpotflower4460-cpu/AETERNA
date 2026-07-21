/**
 * AppShell.ts
 *
 * Mounts the new Observatory Shell chrome (TopBar + Navigation +
 * Context Pane content) into a dedicated container, alongside — not
 * replacing — the legacy UI (docs/ui-migration-boundary.md, master spec
 * §0 "旧UIを削除する前に、新UIのE2Eを完了してください"). Opt-in only
 * (see shellFeatureFlag.ts); default behavior is completely unaffected.
 *
 * Context Pane content, in order:
 * 1. While the First Observation Flow (PR7) hasn't reached
 *    FREE_EXPLORATION yet: its card.
 * 2. Once FREE_EXPLORATION, on the 'observe' route, with a cell selected
 *    (uiStore.selectedCellId, set by pointerHandlers.js's 'inspect'
 *    branch): the Cell Inspector panel (PR8b — master spec §8's PR8
 *    order, item 2), reading real per-node values via
 *    RuntimeAdapter.getCellValue — takes priority over Now Summary —
 *    plus the Ratio Involvement panel (PR8h — item 8) underneath, which
 *    is honest about currently having no real data to show
 *    (RuntimeSnapshot.observedRatios is null today; see
 *    src/ui/shell/RatioInvolvementPanel.ts's header comment).
 * 3. Once FREE_EXPLORATION, on the 'observe' route, no cell selected:
 *    the Now Summary panel (PR8a — item 1), reading the already-live
 *    NowSummaryState via RuntimeAdapter.getNowSummary().
 * 4. On the 'history' route: the Replay panel (PR8d — item 4), showing
 *    a captured history of RuntimeSnapshot readings
 *    (src/app/replay/RuntimeSnapshotHistory.ts), plus the Difference
 *    panel (PR8e — item 5) and Causal Trace panel (PR8f — item 6)
 *    underneath whenever a specific tick is selected — comparing that
 *    recorded tick against the current live RuntimeSnapshot and
 *    reporting the single strongest metric change as a possible
 *    contributing signal (never framed as proof) — and the Layer
 *    Correlation panel (PR8g — item 7) always shown, computing real
 *    Pearson correlation across the whole captured history (not gated
 *    by tick selection — it describes the recorded interval as a whole).
 * 5. Any other route (experiment/research): empty — no panel content
 *    exists for them yet (not faked here).
 * The Field Stage is intentionally not duplicated: the existing legacy
 * canvas shows through underneath.
 */

import { renderTopBarHTML } from '../ui/shell/TopBar.js';
import { renderNavigationRailHTML } from '../ui/shell/NavigationRail.js';
import { renderBottomNavigationHTML } from '../ui/shell/BottomNavigation.js';
import { renderNowSummaryPanelHTML } from '../ui/shell/NowSummaryPanel.js';
import { renderCellInspectorPanelHTML } from '../ui/shell/CellInspectorPanel.js';
import { renderRatioInvolvementPanelHTML } from '../ui/shell/RatioInvolvementPanel.js';
import { renderReplayPanelHTML } from '../ui/shell/ReplayPanel.js';
import { renderDifferencePanelHTML } from '../ui/shell/DifferencePanel.js';
import { renderCausalTracePanelHTML } from '../ui/shell/CausalTracePanel.js';
import { renderLayerCorrelationPanelHTML } from '../ui/shell/LayerCorrelationPanel.js';
import type { UiStore } from './state/UiStore.js';
import type { PrimaryRoute, LensId } from './state/UiState.js';
import { createFirstObservationFlow, type FirstObservationFlow } from './onboarding/FirstObservationFlow.js';
import { renderFirstObservationCardHTML, deriveInsightText } from '../ui/onboarding/renderFirstObservationCard.js';
import { onStimulate } from './interaction/stimulationEvents.js';
import { getRuntimeSnapshot, getNowSummary, getCellValue } from './runtime/RuntimeAdapter.js';
import { createRuntimeSnapshotHistory, pushRuntimeSnapshot, getSnapshotByTick } from './replay/RuntimeSnapshotHistory.js';
import { buildRuntimeSnapshotDifference } from './replay/RuntimeSnapshotDifference.js';
import { computeLayerCorrelation } from './replay/computeLayerCorrelation.js';
import { deriveCausalTraceSignal } from './replay/deriveCausalTraceSignal.js';

export interface AppShellHandle {
  unmount(): void;
}

const BASELINE_OBSERVING_MS = 5000;
const REACTION_TO_INSIGHT_MS = 2000;
// Now Summary is recomputed live roughly every 30 frames (~2/sec at
// 60fps); polling at 1s stays within the "max 2 FPS" Now Summary budget
// (master spec §16) without needing a dedicated change-subscription.
const NOW_SUMMARY_POLL_MS = 1000;
// Cell Inspector budget is "2-5 FPS while shown" (master spec §16) — poll
// faster than Now Summary since a selected cell's raw value changes every
// simulation frame, unlike the coarser Now Summary derivation.
const CELL_INSPECTOR_POLL_MS = 400;
// How often a RuntimeSnapshot is captured into replay history — runs
// continuously while the Shell is mounted (not gated by route/stage),
// independent of how often the Replay panel itself is actually viewed.
const SNAPSHOT_CAPTURE_MS = 1000;

export function mountAppShell(root: HTMLElement, store: UiStore): AppShellHandle {
  root.className = 'observatory-shell';
  root.innerHTML = [
    renderTopBarHTML({ title: 'AETERNA', isLive: true }),
    '<div class="observatory-shell__body">',
    renderNavigationRailHTML(store.getState().primaryRoute),
    '<div class="observatory-shell__context-pane" data-testid="observatory-context-pane"></div>',
    '</div>',
    renderBottomNavigationHTML(store.getState().primaryRoute),
  ].join('');

  // ── First Observation Flow (PR7, master spec §6) ──────────────────────
  const flow: FirstObservationFlow = createFirstObservationFlow();
  let baselineSigma: number | null = null;
  let insightText: string | null = null;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let nowSummaryPollId: ReturnType<typeof setInterval> | null = null;
  let cellInspectorPollId: ReturnType<typeof setInterval> | null = null;
  let snapshotHistory = createRuntimeSnapshotHistory();

  function stopNowSummaryPoll() {
    if (nowSummaryPollId !== null) {
      clearInterval(nowSummaryPollId);
      nowSummaryPollId = null;
    }
  }

  function stopCellInspectorPoll() {
    if (cellInspectorPollId !== null) {
      clearInterval(cellInspectorPollId);
      cellInspectorPollId = null;
    }
  }

  function renderContextPane() {
    const pane = root.querySelector('[data-testid="observatory-context-pane"]');
    if (!pane) return;

    if (flow.getState().stage !== 'FREE_EXPLORATION') {
      stopNowSummaryPoll();
      stopCellInspectorPoll();
      pane.innerHTML = renderFirstObservationCardHTML(flow.getState().stage, insightText);
      return;
    }

    const route = store.getState().primaryRoute;

    if (route === 'history') {
      stopNowSummaryPoll();
      stopCellInspectorPoll();
      const selectedTick = store.getState().replaySelectedTick;
      let html = renderReplayPanelHTML(snapshotHistory, selectedTick);
      if (selectedTick !== null) {
        const before = getSnapshotByTick(snapshotHistory, selectedTick);
        const after = getRuntimeSnapshot();
        const diff = buildRuntimeSnapshotDifference(before, after);
        html += renderDifferencePanelHTML(diff);
        html += renderCausalTracePanelHTML(deriveCausalTraceSignal(diff));
      }
      html += renderLayerCorrelationPanelHTML(computeLayerCorrelation(snapshotHistory));
      pane.innerHTML = html;
      return;
    }

    if (route !== 'observe') {
      stopNowSummaryPoll();
      stopCellInspectorPoll();
      pane.innerHTML = '';
      return;
    }

    const selectedCellId = store.getState().selectedCellId;
    if (selectedCellId !== null) {
      stopNowSummaryPoll();
      const renderCell = () =>
        (pane.innerHTML =
          renderCellInspectorPanelHTML(getCellValue(selectedCellId), store.getState().activeLensId) +
          renderRatioInvolvementPanelHTML(getRuntimeSnapshot()?.observedRatios ?? null, selectedCellId));
      renderCell();
      if (cellInspectorPollId === null) {
        cellInspectorPollId = setInterval(renderCell, CELL_INSPECTOR_POLL_MS);
      }
      return;
    }

    stopCellInspectorPoll();
    pane.innerHTML = renderNowSummaryPanelHTML(getNowSummary());
    if (nowSummaryPollId === null) {
      nowSummaryPollId = setInterval(() => {
        pane.innerHTML = renderNowSummaryPanelHTML(getNowSummary());
      }, NOW_SUMMARY_POLL_MS);
    }
  }

  const unsubscribeFlow = flow.subscribe((flowState) => {
    if (flowState.stage === 'TOUCH_INVITED') {
      baselineSigma = getRuntimeSnapshot()?.sigma ?? null;
    }
    if (flowState.stage === 'REACTION_OBSERVED') {
      timers.push(
        setTimeout(() => {
          const afterSigma = getRuntimeSnapshot()?.sigma ?? null;
          insightText = deriveInsightText(baselineSigma, afterSigma);
          flow.presentInsight();
        }, REACTION_TO_INSIGHT_MS)
      );
    }
    renderContextPane();
  });

  const unsubscribeStimulate = onStimulate(() => flow.recordTouch());

  renderContextPane();

  // Replay history capture: runs continuously while mounted, independent
  // of route/onboarding stage — the Replay panel (item 4/9) only reads
  // this buffer, it doesn't control when snapshots are captured.
  const snapshotCaptureId = setInterval(() => {
    const snap = getRuntimeSnapshot();
    if (snap) snapshotHistory = pushRuntimeSnapshot(snapshotHistory, snap);
    if (store.getState().primaryRoute === 'history') renderContextPane();
  }, SNAPSHOT_CAPTURE_MS);

  // ── Nav + flow-card click routing ──────────────────────────────────────
  function handleClick(event: Event) {
    const target = event.target as HTMLElement;
    const navTarget = target.closest('[data-route]') as HTMLElement | null;
    if (navTarget) {
      const route = navTarget.dataset.route as PrimaryRoute | undefined;
      if (route) store.setPrimaryRoute(route);
      return;
    }
    const lensTarget = target.closest('[data-lens]') as HTMLElement | null;
    if (lensTarget) {
      const lensId = lensTarget.dataset.lens as LensId | undefined;
      if (lensId) {
        // Clicking the already-active lens's row clears it (toggle off),
        // matching a single-select control rather than a one-way switch.
        store.setActiveLensId(store.getState().activeLensId === lensId ? null : lensId);
      }
      return;
    }
    const actionTarget = target.closest('[data-action]') as HTMLElement | null;
    if (actionTarget) {
      const action = actionTarget.dataset.action;
      if (action === 'start') {
        flow.start();
        timers.push(setTimeout(() => flow.invite(), BASELINE_OBSERVING_MS));
      } else if (action === 'finish') {
        flow.finish();
      } else if (action === 'replay-return-to-live') {
        store.setReplaySelectedTick(null);
      }
    }
  }
  root.addEventListener('click', handleClick);

  function handleChange(event: Event) {
    const target = event.target as HTMLElement;
    if (target.dataset.testid === 'replay-tick-select') {
      const value = (target as HTMLSelectElement).value;
      const tick = value === '' ? null : Number(value);
      store.setReplaySelectedTick(Number.isNaN(tick as number) ? null : tick);
    }
  }
  root.addEventListener('change', handleChange);

  function render() {
    const nav = root.querySelector('.observatory-nav');
    const bottomNav = root.querySelector('.observatory-bottom-nav');
    const route = store.getState().primaryRoute;
    if (nav) nav.outerHTML = renderNavigationRailHTML(route);
    if (bottomNav) bottomNav.outerHTML = renderBottomNavigationHTML(route);
    renderContextPane();
  }

  const unsubscribeStore = store.subscribe(render);

  return {
    unmount() {
      unsubscribeStore();
      unsubscribeFlow();
      unsubscribeStimulate();
      stopNowSummaryPoll();
      stopCellInspectorPoll();
      clearInterval(snapshotCaptureId);
      for (const t of timers) clearTimeout(t);
      root.removeEventListener('click', handleClick);
      root.removeEventListener('change', handleChange);
      root.innerHTML = '';
    },
  };
}
