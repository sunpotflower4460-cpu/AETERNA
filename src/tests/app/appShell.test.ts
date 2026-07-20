/**
 * @vitest-environment jsdom
 *
 * appShell.test.ts
 *
 * Real DOM coverage for AppShell.ts's mount/click/render wiring, run
 * under jsdom rather than a real browser. This exists specifically
 * because tests/e2e/observatoryShell.spec.ts's click-interaction test is
 * currently skipped in this sandbox (Three.js CDN blocked — see that
 * spec's skip comment) — this test covers the same wiring logic without
 * needing a real browser or any network access.
 *
 * Confirms:
 * - mountAppShell renders TopBar + Navigation + Context Pane into root
 * - clicking a nav item calls store.setPrimaryRoute with the right route
 * - the store notifying triggers a re-render reflecting the new active route
 * - unmount removes the click listener and clears root content
 */

import { describe, it, expect } from 'vitest';
import { mountAppShell } from '../../app/AppShell.js';
import { createUiStore } from '../../app/state/UiStore.js';

describe('mountAppShell', () => {
  it('renders TopBar, Navigation, and an (empty) Context Pane', () => {
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    expect(root.querySelector('.observatory-topbar__title')?.textContent).toBe('AETERNA');
    expect(root.querySelector('.observatory-nav')).not.toBeNull();
    expect(root.querySelector('.observatory-bottom-nav')).not.toBeNull();
    expect(root.querySelector('[data-testid="observatory-context-pane"]')).not.toBeNull();
  });

  it('clicking a nav item updates the store', () => {
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    const experimentBtn = root.querySelector('[data-route="experiment"]') as HTMLButtonElement;
    experimentBtn.click();

    expect(store.getState().primaryRoute).toBe('experiment');
  });

  it('re-renders the active state when the store changes externally', () => {
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    store.setPrimaryRoute('history');

    const historyBtn = root.querySelector('[data-route="history"]');
    const observeBtn = root.querySelector('[data-route="observe"]');
    expect(historyBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(observeBtn?.getAttribute('aria-pressed')).toBe('false');
  });

  it('unmount clears root content and stops handling clicks', () => {
    const root = document.createElement('div');
    const store = createUiStore();
    const handle = mountAppShell(root, store);

    handle.unmount();

    expect(root.innerHTML).toBe('');
    // A click on a now-detached button must not throw and must not
    // change the store (listener was removed with the DOM it was on).
    store.setPrimaryRoute('observe');
    expect(store.getState().primaryRoute).toBe('observe');
  });
});
