/**
 * observatoryShell.test.ts
 *
 * Confirms:
 * - renderTopBarHTML includes the title and correct LIVE/REPLAY badge
 * - renderNavigationRailHTML / renderBottomNavigationHTML mark exactly
 *   the active route and include all 4 routes
 * - UiStore.setPrimaryRoute updates state and notifies subscribers
 * - isNewShellEnabled reads the ?newShell=1 query param and the
 *   localStorage flag, off by default
 */

import { describe, it, expect, vi } from 'vitest';
import { renderTopBarHTML } from '../../ui/shell/TopBar.js';
import { renderNavigationRailHTML, NAV_ITEMS } from '../../ui/shell/NavigationRail.js';
import { renderBottomNavigationHTML } from '../../ui/shell/BottomNavigation.js';
import { createUiStore } from '../../app/state/UiStore.js';
import { isNewShellEnabled } from '../../app/shellFeatureFlag.js';

describe('renderTopBarHTML', () => {
  it('includes the title', () => {
    expect(renderTopBarHTML({ title: 'AETERNA', isLive: true })).toContain('AETERNA');
  });

  it('shows LIVE badge when isLive=true', () => {
    const html = renderTopBarHTML({ title: 'AETERNA', isLive: true });
    expect(html).toContain('LIVE');
    expect(html).not.toContain('REPLAY');
  });

  it('shows REPLAY badge when isLive=false', () => {
    const html = renderTopBarHTML({ title: 'AETERNA', isLive: false });
    expect(html).toContain('REPLAY');
  });
});

describe('renderNavigationRailHTML / renderBottomNavigationHTML', () => {
  it('includes all 4 routes', () => {
    const html = renderNavigationRailHTML('observe');
    for (const item of NAV_ITEMS) {
      expect(html).toContain(`data-route="${item.route}"`);
    }
  });

  it('marks exactly the active route', () => {
    const html = renderNavigationRailHTML('history');
    const activeCount = (html.match(/observatory-nav__item--active/g) ?? []).length;
    expect(activeCount).toBe(1);
    const historyButtonMatch = html.match(/<button[^>]*data-route="history"[^>]*>/)?.[0] ?? '';
    expect(historyButtonMatch).toContain('observatory-nav__item--active');
  });

  it('bottom navigation matches the same active route', () => {
    const html = renderBottomNavigationHTML('research');
    const activeCount = (html.match(/observatory-bottom-nav__item--active/g) ?? []).length;
    expect(activeCount).toBe(1);
    const researchButtonMatch = html.match(/<button[^>]*data-route="research"[^>]*>/)?.[0] ?? '';
    expect(researchButtonMatch).toContain('observatory-bottom-nav__item--active');
  });
});

describe('UiStore primaryRoute', () => {
  it('defaults to observe', () => {
    expect(createUiStore().getState().primaryRoute).toBe('observe');
  });

  it('setPrimaryRoute updates state and notifies subscribers', () => {
    const store = createUiStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setPrimaryRoute('experiment');
    expect(store.getState().primaryRoute).toBe('experiment');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when setting the same route again', () => {
    const store = createUiStore();
    const listener = vi.fn();
    store.setPrimaryRoute('research');
    store.subscribe(listener);
    store.setPrimaryRoute('research');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('isNewShellEnabled', () => {
  it('is off by default (no query param, no localStorage flag)', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const location = { search: '' } as Location;
    expect(isNewShellEnabled(location)).toBe(false);
  });

  it('is on when ?newShell=1 is present', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const location = { search: '?newShell=1' } as Location;
    expect(isNewShellEnabled(location)).toBe(true);
  });

  it('is on when the localStorage flag is set', () => {
    vi.stubGlobal('localStorage', { getItem: (key: string) => (key === 'aeterna_newShell' ? '1' : null) });
    const location = { search: '' } as Location;
    expect(isNewShellEnabled(location)).toBe(true);
  });

  it('falls back to false when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });
    const location = { search: '' } as Location;
    expect(isNewShellEnabled(location)).toBe(false);
  });
});
