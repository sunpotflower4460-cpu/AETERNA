/**
 * BottomNavigation.ts
 *
 * Mobile variant of the same 4-route navigation (master spec §5.2).
 * Reuses NAV_ITEMS from NavigationRail.ts rather than duplicating the
 * route list.
 */

import type { PrimaryRoute } from '../../app/state/UiState.js';
import { NAV_ITEMS } from './NavigationRail.js';

export function renderBottomNavigationHTML(activeRoute: PrimaryRoute): string {
  const items = NAV_ITEMS.map((item) => {
    const active = item.route === activeRoute;
    return `<button
      type="button"
      class="observatory-bottom-nav__item${active ? ' observatory-bottom-nav__item--active' : ''}"
      data-route="${item.route}"
      aria-pressed="${active}"
    >${item.labelJa}</button>`;
  }).join('');
  return `<nav class="observatory-bottom-nav" role="navigation" aria-label="観測メニュー（モバイル）">${items}</nav>`;
}
