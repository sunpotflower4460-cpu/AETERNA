/**
 * uiStore.test.ts
 *
 * Confirms:
 * - createUiStore defaults to interactionMode='stimulate' (preserves
 *   today's only live default behavior — tap to stimulate)
 * - setInteractionMode updates state and notifies subscribers
 * - setInteractionMode is a no-op (no notify) when the mode doesn't change
 * - unsubscribe stops further notifications
 * - shouldStimulateOnTap only returns true for 'stimulate'
 */

import { describe, it, expect, vi } from 'vitest';
import { createUiStore } from '../../app/state/UiStore.js';
import { shouldStimulateOnTap } from '../../app/interaction/interactionPredicates.js';
import type { InteractionMode } from '../../app/state/UiState.js';

describe('createUiStore', () => {
  it('defaults to interactionMode=stimulate', () => {
    const store = createUiStore();
    expect(store.getState().interactionMode).toBe('stimulate');
  });

  it('setInteractionMode updates state and notifies subscribers', () => {
    const store = createUiStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setInteractionMode('inspect');
    expect(store.getState().interactionMode).toBe('inspect');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ interactionMode: 'inspect' }));
  });

  it('does not notify when setting the same mode again', () => {
    const store = createUiStore();
    const listener = vi.fn();
    store.setInteractionMode('camera');
    store.subscribe(listener);
    store.setInteractionMode('camera');
    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribe stops further notifications', () => {
    const store = createUiStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setInteractionMode('observe');
    expect(listener).not.toHaveBeenCalled();
  });

  it('defaults to selectedCellId=null', () => {
    expect(createUiStore().getState().selectedCellId).toBeNull();
  });

  it('setSelectedCellId updates state and notifies subscribers', () => {
    const store = createUiStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setSelectedCellId(12);
    expect(store.getState().selectedCellId).toBe(12);
    expect(listener).toHaveBeenCalledTimes(1);

    store.setSelectedCellId(null);
    expect(store.getState().selectedCellId).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does not notify when setting the same selectedCellId again', () => {
    const store = createUiStore();
    store.setSelectedCellId(5);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setSelectedCellId(5);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('shouldStimulateOnTap', () => {
  it('is true only for stimulate mode', () => {
    const modes: InteractionMode[] = ['observe', 'inspect', 'stimulate', 'camera'];
    const results = modes.map((m) => [m, shouldStimulateOnTap(m)]);
    expect(results).toEqual([
      ['observe', false],
      ['inspect', false],
      ['stimulate', true],
      ['camera', false],
    ]);
  });
});
