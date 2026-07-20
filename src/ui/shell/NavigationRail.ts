/**
 * NavigationRail.ts
 *
 * Observatory Shell 4-route navigation (master spec §5.1: 観測/実験/履歴/研究).
 * Pure render function; src/app/AppShell.ts wires click listeners after
 * mounting (not inline onclick — this is new code, not bound to the
 * legacy window.* onclick convention documented in
 * docs/ui-runtime-inventory.md §6).
 */

import type { PrimaryRoute } from '../../app/state/UiState.js';

export interface NavItem {
  route: PrimaryRoute;
  labelJa: string;
}

export const NAV_ITEMS: NavItem[] = [
  { route: 'observe', labelJa: '観測' },
  { route: 'experiment', labelJa: '実験' },
  { route: 'history', labelJa: '履歴' },
  { route: 'research', labelJa: '研究' },
];

export function renderNavigationRailHTML(activeRoute: PrimaryRoute): string {
  const items = NAV_ITEMS.map((item) => {
    const active = item.route === activeRoute;
    return `<button
      type="button"
      class="observatory-nav__item${active ? ' observatory-nav__item--active' : ''}"
      data-route="${item.route}"
      aria-pressed="${active}"
    >${item.labelJa}</button>`;
  }).join('');
  return `<nav class="observatory-nav" role="navigation" aria-label="観測メニュー">${items}</nav>`;
}
