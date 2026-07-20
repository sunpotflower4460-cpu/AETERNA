/**
 * UiStore.ts
 *
 * Minimal mutable store + subscription for UiState (master spec §8.3).
 * A module-level singleton (uiStore) is exported for the live app;
 * createUiStore() is exported separately so tests don't share state
 * across test files.
 */

import { DEFAULT_UI_STATE, type InteractionMode, type PrimaryRoute, type UiState } from './UiState.js';

export interface UiStore {
  getState(): UiState;
  setInteractionMode(mode: InteractionMode): void;
  setPrimaryRoute(route: PrimaryRoute): void;
  subscribe(listener: (state: UiState) => void): () => void;
}

export function createUiStore(initial: UiState = DEFAULT_UI_STATE): UiStore {
  let state: UiState = { ...initial };
  const listeners = new Set<(state: UiState) => void>();

  function notify() {
    for (const listener of listeners) listener(state);
  }

  return {
    getState() {
      return state;
    },
    setInteractionMode(mode) {
      if (state.interactionMode === mode) return;
      state = { ...state, interactionMode: mode };
      notify();
    },
    setPrimaryRoute(route) {
      if (state.primaryRoute === route) return;
      state = { ...state, primaryRoute: route };
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const uiStore = createUiStore();
