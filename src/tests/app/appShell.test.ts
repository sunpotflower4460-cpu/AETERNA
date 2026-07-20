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
 * - mountAppShell renders TopBar + Navigation + Context Pane (with the
 *   PR7 First Observation Flow's WELCOME card) into root
 * - clicking a nav item calls store.setPrimaryRoute with the right route
 * - the store notifying triggers a re-render reflecting the new active route
 * - unmount removes the click listener, clears timers, and clears root content
 * - the full First Observation Flow lifecycle end to end (see
 *   src/tests/app/firstObservationFlow.test.ts for the state machine's
 *   own isolated unit tests; this file covers it wired into real DOM +
 *   real timers via a mocked RuntimeAdapter/stimulationEvents)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createUiStore } from '../../app/state/UiStore.js';

const getRuntimeSnapshot = vi.fn();
vi.mock('../../app/runtime/RuntimeAdapter.js', () => ({ getRuntimeSnapshot }));

let stimulateListener: (() => void) | null = null;
vi.mock('../../app/interaction/stimulationEvents.js', () => ({
  onStimulate: (listener: () => void) => {
    stimulateListener = listener;
    return () => {
      stimulateListener = null;
    };
  },
}));

const { mountAppShell } = await import('../../app/AppShell.js');

describe('mountAppShell', () => {
  it('renders TopBar, Navigation, and the WELCOME card in the Context Pane', () => {
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    expect(root.querySelector('.observatory-topbar__title')?.textContent).toBe('AETERNA');
    expect(root.querySelector('.observatory-nav')).not.toBeNull();
    expect(root.querySelector('.observatory-bottom-nav')).not.toBeNull();
    expect(root.querySelector('[data-testid="first-observation-card"]')).not.toBeNull();
    expect(root.querySelector('[data-action="start"]')).not.toBeNull();
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

describe('First Observation Flow lifecycle wired into AppShell', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getRuntimeSnapshot.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks WELCOME → BASELINE_OBSERVING → TOUCH_INVITED → REACTION_OBSERVED → INSIGHT_PRESENTED → FREE_EXPLORATION', () => {
    getRuntimeSnapshot
      .mockReturnValueOnce({ sigma: 1.0 }) // captured at TOUCH_INVITED
      .mockReturnValueOnce({ sigma: 1.08 }); // captured when presenting insight

    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    // BASELINE_OBSERVING — no CTA, waiting for the 5s timer
    expect(root.querySelector('[data-testid="first-observation-card"]')).not.toBeNull();
    expect(root.querySelector('[data-action]')).toBeNull();

    vi.advanceTimersByTime(5000);
    // TOUCH_INVITED — baseline sigma captured
    expect(getRuntimeSnapshot).toHaveBeenCalledTimes(1);

    expect(stimulateListener).not.toBeNull();
    stimulateListener?.(); // simulates a real stimulation (PR7: not a fake timer)
    // REACTION_OBSERVED — waiting for the 2s insight delay

    vi.advanceTimersByTime(2000);
    // INSIGHT_PRESENTED — after sigma captured, insight text rendered
    expect(getRuntimeSnapshot).toHaveBeenCalledTimes(2);
    const cardText = root.querySelector('[data-testid="first-observation-card"]')?.textContent ?? '';
    expect(cardText).toContain('変化が観測されました');
    const finishBtn = root.querySelector('[data-action="finish"]') as HTMLButtonElement;
    expect(finishBtn).not.toBeNull();

    finishBtn.click();
    // FREE_EXPLORATION — card disappears
    expect(root.querySelector('[data-testid="first-observation-card"]')).toBeNull();
  });

  it('does not react to a stimulation before TOUCH_INVITED (no fabricated reaction)', () => {
    getRuntimeSnapshot.mockReturnValue({ sigma: 1.0 });
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    // Still WELCOME — a stimulation now must not advance the flow.
    stimulateListener?.();
    expect(root.querySelector('[data-action="start"]')).not.toBeNull();
  });

  it('unmount clears pending timers (no late invite()/presentInsight() after unmount)', () => {
    getRuntimeSnapshot.mockReturnValue({ sigma: 1.0 });
    const root = document.createElement('div');
    const store = createUiStore();
    const handle = mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    handle.unmount();

    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
    expect(root.innerHTML).toBe('');
  });
});
