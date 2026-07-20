/**
 * AppShell.ts
 *
 * Mounts the new Observatory Shell chrome (TopBar + Navigation +
 * First Observation Flow) into a dedicated container, alongside — not
 * replacing — the legacy UI (docs/ui-migration-boundary.md, master spec
 * §0 "旧UIを削除する前に、新UIのE2Eを完了してください"). Opt-in only
 * (see shellFeatureFlag.ts); default behavior is completely unaffected.
 *
 * The Context Pane's only real content so far is the First Observation
 * Flow card (PR7) — no other panel content exists yet
 * (ObservationSnapshotStore/ObservationEventStore consumers are
 * PR8-scoped work). The Field Stage is intentionally not duplicated
 * here: the existing legacy canvas shows through underneath.
 */

import { renderTopBarHTML } from '../ui/shell/TopBar.js';
import { renderNavigationRailHTML } from '../ui/shell/NavigationRail.js';
import { renderBottomNavigationHTML } from '../ui/shell/BottomNavigation.js';
import type { UiStore } from './state/UiStore.js';
import type { PrimaryRoute } from './state/UiState.js';
import { createFirstObservationFlow, type FirstObservationFlow } from './onboarding/FirstObservationFlow.js';
import { renderFirstObservationCardHTML, deriveInsightText } from '../ui/onboarding/renderFirstObservationCard.js';
import { onStimulate } from './interaction/stimulationEvents.js';
import { getRuntimeSnapshot } from './runtime/RuntimeAdapter.js';

export interface AppShellHandle {
  unmount(): void;
}

const BASELINE_OBSERVING_MS = 5000;
const REACTION_TO_INSIGHT_MS = 2000;

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

  function renderFlowCard() {
    const pane = root.querySelector('[data-testid="observatory-context-pane"]');
    if (pane) pane.innerHTML = renderFirstObservationCardHTML(flow.getState().stage, insightText);
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
    renderFlowCard();
  });

  const unsubscribeStimulate = onStimulate(() => flow.recordTouch());

  renderFlowCard();

  // ── Nav + flow-card click routing ──────────────────────────────────────
  function handleClick(event: Event) {
    const target = event.target as HTMLElement;
    const navTarget = target.closest('[data-route]') as HTMLElement | null;
    if (navTarget) {
      const route = navTarget.dataset.route as PrimaryRoute | undefined;
      if (route) store.setPrimaryRoute(route);
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
      }
    }
  }
  root.addEventListener('click', handleClick);

  function render() {
    const nav = root.querySelector('.observatory-nav');
    const bottomNav = root.querySelector('.observatory-bottom-nav');
    const route = store.getState().primaryRoute;
    if (nav) nav.outerHTML = renderNavigationRailHTML(route);
    if (bottomNav) bottomNav.outerHTML = renderBottomNavigationHTML(route);
  }

  const unsubscribeStore = store.subscribe(render);

  return {
    unmount() {
      unsubscribeStore();
      unsubscribeFlow();
      unsubscribeStimulate();
      for (const t of timers) clearTimeout(t);
      root.removeEventListener('click', handleClick);
      root.innerHTML = '';
    },
  };
}
