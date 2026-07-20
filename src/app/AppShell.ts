/**
 * AppShell.ts
 *
 * Mounts the new Observatory Shell chrome (TopBar + Navigation) into a
 * dedicated container, alongside — not replacing — the legacy UI
 * (docs/ui-migration-boundary.md, master spec §0 "旧UIを削除する前に、
 * 新UIのE2Eを完了してください"). Opt-in only (see shellFeatureFlag.ts);
 * default behavior is completely unaffected.
 *
 * Deliberately does NOT render a Field Stage or Context Pane with real
 * content: the Field Stage is the existing legacy canvas showing through
 * underneath (no duplicate canvas is created here), and the Context Pane
 * is an empty container — building real panel content is PR8-scoped
 * work, once ObservationSnapshotStore/ObservationEventStore have
 * consumers. Rendering a fake/placeholder panel here would be
 * RENDERABLE, not honestly CONNECTED.
 */

import { renderTopBarHTML } from '../ui/shell/TopBar.js';
import { renderNavigationRailHTML } from '../ui/shell/NavigationRail.js';
import { renderBottomNavigationHTML } from '../ui/shell/BottomNavigation.js';
import type { UiStore } from './state/UiStore.js';
import type { PrimaryRoute } from './state/UiState.js';

export interface AppShellHandle {
  unmount(): void;
}

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

  function handleClick(event: Event) {
    const target = (event.target as HTMLElement).closest('[data-route]') as HTMLElement | null;
    if (!target) return;
    const route = target.dataset.route as PrimaryRoute | undefined;
    if (route) store.setPrimaryRoute(route);
  }
  root.addEventListener('click', handleClick);

  function render() {
    const nav = root.querySelector('.observatory-nav');
    const bottomNav = root.querySelector('.observatory-bottom-nav');
    const route = store.getState().primaryRoute;
    if (nav) nav.outerHTML = renderNavigationRailHTML(route);
    if (bottomNav) bottomNav.outerHTML = renderBottomNavigationHTML(route);
  }

  const unsubscribe = store.subscribe(render);

  return {
    unmount() {
      unsubscribe();
      root.removeEventListener('click', handleClick);
      root.innerHTML = '';
    },
  };
}
