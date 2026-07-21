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
const getNowSummary = vi.fn(() => null);
const getCellValue = vi.fn(() => null);
vi.mock('../../app/runtime/RuntimeAdapter.js', () => ({ getRuntimeSnapshot, getNowSummary, getCellValue }));

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
    getNowSummary.mockReset();
    getNowSummary.mockReturnValue(null);
    getCellValue.mockReset();
    getCellValue.mockReturnValue(null);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks WELCOME → BASELINE_OBSERVING → TOUCH_INVITED → REACTION_OBSERVED → INSIGHT_PRESENTED → FREE_EXPLORATION', () => {
    // A stateful mock (not mockReturnValueOnce) since PR8d's replay
    // snapshot-capture interval also calls getRuntimeSnapshot() on its own
    // 1s cadence, independent of the flow's own TOUCH_INVITED/insight reads.
    let currentSigma = 1.0;
    getRuntimeSnapshot.mockImplementation(() => ({ sigma: currentSigma, phi: null, energy: null }));

    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    // BASELINE_OBSERVING — no CTA, waiting for the 5s timer
    expect(root.querySelector('[data-testid="first-observation-card"]')).not.toBeNull();
    expect(root.querySelector('[data-action]')).toBeNull();

    vi.advanceTimersByTime(5000);
    // TOUCH_INVITED — baseline sigma (1.0) captured
    expect(getRuntimeSnapshot).toHaveBeenCalled();

    expect(stimulateListener).not.toBeNull();
    stimulateListener?.(); // simulates a real stimulation (PR7: not a fake timer)
    // REACTION_OBSERVED — waiting for the 2s insight delay; sigma shifts
    // before the insight-capturing read fires.
    currentSigma = 1.08;

    vi.advanceTimersByTime(2000);
    // INSIGHT_PRESENTED — after sigma (1.08) captured, insight text rendered
    const cardText = root.querySelector('[data-testid="first-observation-card"]')?.textContent ?? '';
    expect(cardText).toContain('変化が観測されました');
    const finishBtn = root.querySelector('[data-action="finish"]') as HTMLButtonElement;
    expect(finishBtn).not.toBeNull();

    finishBtn.click();
    // FREE_EXPLORATION on the default 'observe' route — Now Summary panel
    // replaces the flow card (PR8a).
    expect(root.querySelector('[data-testid="first-observation-card"]')).toBeNull();
    expect(root.querySelector('[data-testid="now-summary-panel"]')).not.toBeNull();
  });

  it('shows nothing in the Context Pane on the experiment/research routes after FREE_EXPLORATION', () => {
    getRuntimeSnapshot.mockReturnValue({ sigma: 1.0 });
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(5000);
    stimulateListener?.();
    vi.advanceTimersByTime(2000);
    (root.querySelector('[data-action="finish"]') as HTMLButtonElement).click();

    store.setPrimaryRoute('experiment');
    const pane = root.querySelector('[data-testid="observatory-context-pane"]');
    expect(pane?.querySelector('[data-testid="now-summary-panel"]')).toBeNull();
    expect(pane?.querySelector('[data-testid="first-observation-card"]')).toBeNull();

    store.setPrimaryRoute('observe');
    expect(root.querySelector('[data-testid="now-summary-panel"]')).not.toBeNull();
  });

  it('shows the Replay panel on the history route and captures snapshots continuously (PR8d)', () => {
    let currentSigma = 1.0;
    let currentTick = 0;
    getRuntimeSnapshot.mockImplementation(() => ({
      tick: currentTick,
      sigma: currentSigma,
      phi: null,
      energy: null,
    }));
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(5000);
    stimulateListener?.();
    vi.advanceTimersByTime(2000);
    (root.querySelector('[data-action="finish"]') as HTMLButtonElement).click();

    // Capture runs on the 'observe' route too (continuous, route-independent).
    currentSigma = 2.0;
    currentTick = 1;
    vi.advanceTimersByTime(1000);

    store.setPrimaryRoute('history');
    const pane = root.querySelector('[data-testid="observatory-context-pane"]');
    expect(pane?.querySelector('[data-testid="replay-panel"]')).not.toBeNull();
    expect(pane?.textContent).toContain('2.0000'); // latest captured sigma, shown live

    // PR8g: the Layer Correlation panel is always shown on the history
    // route, even with no tick selected (it describes the whole recorded
    // interval, not a single before/after comparison).
    expect(pane?.querySelector('[data-testid="layer-correlation-panel"]')).not.toBeNull();

    const select = pane?.querySelector('[data-testid="replay-tick-select"]') as HTMLSelectElement;
    expect(select).not.toBeNull();
    const firstTickOption = select.querySelector('option') as HTMLOptionElement;
    select.value = firstTickOption.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(store.getState().replaySelectedTick).toBe(Number(firstTickOption.value));
    expect(pane?.querySelector('[data-action="replay-return-to-live"]')).not.toBeNull();

    // PR8e: selecting a tick also shows the Difference panel (before = the
    // selected recorded tick, after = the current live snapshot).
    expect(pane?.querySelector('[data-testid="difference-panel"]')).not.toBeNull();
    expect(pane?.textContent).toContain('+1.0000'); // sigma delta: 2.0 (live) - 1.0 (tick 0)

    // PR8f: the Causal Trace panel reports sigma (the only real change) as
    // the strongest signal, with the mandatory not-causal-proof caution.
    const causalPanel = pane?.querySelector('[data-testid="causal-trace-panel"]');
    expect(causalPanel).not.toBeNull();
    expect(causalPanel?.textContent).toContain('σ');
    expect(causalPanel?.textContent).toContain('因果関係の証明ではありません');

    (pane?.querySelector('[data-action="replay-return-to-live"]') as HTMLButtonElement).click();
    expect(store.getState().replaySelectedTick).toBeNull();
    expect(root.querySelector('[data-testid="difference-panel"]')).toBeNull();
    expect(root.querySelector('[data-testid="causal-trace-panel"]')).toBeNull();
    // Layer Correlation stays regardless — it was never gated by tick selection.
    expect(root.querySelector('[data-testid="layer-correlation-panel"]')).not.toBeNull();
  });

  it('shows the Cell Inspector panel instead of Now Summary once a cell is selected', () => {
    getRuntimeSnapshot.mockReturnValue({ sigma: 1.0 });
    getCellValue.mockReturnValue({ cellId: 3, currentValue: 0.5, spikeTrace: 0.1 });
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(5000);
    stimulateListener?.();
    vi.advanceTimersByTime(2000);
    (root.querySelector('[data-action="finish"]') as HTMLButtonElement).click();
    expect(root.querySelector('[data-testid="now-summary-panel"]')).not.toBeNull();

    store.setSelectedCellId(3);
    expect(root.querySelector('[data-testid="now-summary-panel"]')).toBeNull();
    const panel = root.querySelector('[data-testid="cell-inspector-panel"]');
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain('#3');

    store.setSelectedCellId(null);
    expect(root.querySelector('[data-testid="cell-inspector-panel"]')).toBeNull();
    expect(root.querySelector('[data-testid="now-summary-panel"]')).not.toBeNull();
  });

  it('polls getCellValue while the Cell Inspector is shown and stops on unmount', () => {
    getRuntimeSnapshot.mockReturnValue({ sigma: 1.0 });
    getCellValue.mockReturnValue({ cellId: 3, currentValue: 0.5, spikeTrace: 0.1 });
    const root = document.createElement('div');
    const store = createUiStore();
    const handle = mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(5000);
    stimulateListener?.();
    vi.advanceTimersByTime(2000);
    (root.querySelector('[data-action="finish"]') as HTMLButtonElement).click();
    store.setSelectedCellId(3);

    const callsAtSelection = getCellValue.mock.calls.length;
    expect(callsAtSelection).toBeGreaterThan(0);

    vi.advanceTimersByTime(2000);
    expect(getCellValue.mock.calls.length).toBeGreaterThan(callsAtSelection);

    handle.unmount();
    const callsAfterUnmount = getCellValue.mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(getCellValue.mock.calls.length).toBe(callsAfterUnmount);
  });

  it('clicking a metric row selects it as the active lens, and clicking again toggles it off (PR8c)', () => {
    getRuntimeSnapshot.mockReturnValue({ sigma: 1.0 });
    getCellValue.mockReturnValue({ cellId: 3, currentValue: 0.5, spikeTrace: 0.1 });
    const root = document.createElement('div');
    const store = createUiStore();
    mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(5000);
    stimulateListener?.();
    vi.advanceTimersByTime(2000);
    (root.querySelector('[data-action="finish"]') as HTMLButtonElement).click();
    store.setSelectedCellId(3);

    const spikeRow = root.querySelector('[data-lens="spikeTrace"]') as HTMLElement;
    spikeRow.click();
    expect(store.getState().activeLensId).toBe('spikeTrace');
    expect(root.querySelector('[data-lens="spikeTrace"]')?.getAttribute('aria-pressed')).toBe('true');

    (root.querySelector('[data-lens="spikeTrace"]') as HTMLElement).click();
    expect(store.getState().activeLensId).toBeNull();
  });

  it('polls getNowSummary while showing the Now Summary panel and stops on unmount', () => {
    getRuntimeSnapshot.mockReturnValue({ sigma: 1.0 });
    const root = document.createElement('div');
    const store = createUiStore();
    const handle = mountAppShell(root, store);

    (root.querySelector('[data-action="start"]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(5000);
    stimulateListener?.();
    vi.advanceTimersByTime(2000);
    (root.querySelector('[data-action="finish"]') as HTMLButtonElement).click();

    const callsAtFreeExploration = getNowSummary.mock.calls.length;
    expect(callsAtFreeExploration).toBeGreaterThan(0);

    vi.advanceTimersByTime(3000);
    expect(getNowSummary.mock.calls.length).toBeGreaterThan(callsAtFreeExploration);

    handle.unmount();
    const callsAfterUnmount = getNowSummary.mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(getNowSummary.mock.calls.length).toBe(callsAfterUnmount);
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
