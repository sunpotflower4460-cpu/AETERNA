/**
 * pointerHandlerStimulationGate.test.ts
 *
 * Confirms handlePointerUp only calls the Runtime-affecting
 * touchMem.recordTouch / network.injectPredictionError when
 * uiStore's interactionMode is 'stimulate' — the actual P0 fix
 * (docs/ui-runtime-inventory.md §12 item 9: previously unconditional,
 * no interaction-mode gate existed at all).
 *
 * Runs without a DOM (consistent with the rest of src/tests/**): a
 * minimal fake `document`/`state` are used since pointerHandlers.js
 * reads module-level `document` for a few DOM lookups even on the
 * gated path (touch-feedback element, observation display).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uiStore } from '../../app/state/UiStore.js';

vi.stubGlobal('document', {
  getElementById: () => null,
});
vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });

const { handlePointerUp } = await import('../../perception/pointerHandlers.js');
const { state } = await import('../../organism/state.js');

function makeCanvasPointerUpEvent(overrides: Partial<PointerEvent> = {}) {
  return {
    target: { tagName: 'CANVAS' },
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    ...overrides,
  } as unknown as PointerEvent;
}

describe('handlePointerUp — interaction-mode stimulation gate', () => {
  beforeEach(() => {
    uiStore.setInteractionMode('stimulate');
    state.activeTouches = new Map([[1, { x: 100, y: 100 }]]);
    state.isDragging = false;
    state.touchMem = { recordTouch: vi.fn() };
    state.network = { simTime: 0, injectPredictionError: vi.fn() };
    state.raycaster = {
      setFromCamera: vi.fn(),
      intersectObject: vi.fn(() => [{ index: 0 }]),
    };
    state.mouse = { x: 0, y: 0 };
    state.camera = {};
    state.particleSystem = {};
    state.observationDisplay = null;
  });

  it('calls touchMem.recordTouch and network.injectPredictionError in stimulate mode', () => {
    uiStore.setInteractionMode('stimulate');
    handlePointerUp(makeCanvasPointerUpEvent());
    expect(state.touchMem.recordTouch).toHaveBeenCalledTimes(1);
    expect(state.network.injectPredictionError).toHaveBeenCalledTimes(1);
  });

  it('does NOT call touchMem.recordTouch or network.injectPredictionError in inspect mode', () => {
    uiStore.setInteractionMode('inspect');
    handlePointerUp(makeCanvasPointerUpEvent());
    expect(state.touchMem.recordTouch).not.toHaveBeenCalled();
    expect(state.network.injectPredictionError).not.toHaveBeenCalled();
  });

  it('selects a cell via uiStore in inspect mode, without any Runtime mutation', () => {
    uiStore.setInteractionMode('inspect');
    uiStore.setSelectedCellId(null);
    state.raycaster.intersectObject = vi.fn(() => [{ index: 7 }]);
    handlePointerUp(makeCanvasPointerUpEvent());
    expect(uiStore.getState().selectedCellId).toBe(7);
    expect(state.touchMem.recordTouch).not.toHaveBeenCalled();
    expect(state.network.injectPredictionError).not.toHaveBeenCalled();
  });

  it('does not change selectedCellId in stimulate mode', () => {
    uiStore.setInteractionMode('stimulate');
    uiStore.setSelectedCellId(null);
    handlePointerUp(makeCanvasPointerUpEvent());
    expect(uiStore.getState().selectedCellId).toBeNull();
  });

  it('does NOT stimulate in observe or camera mode either', () => {
    for (const mode of ['observe', 'camera'] as const) {
      state.touchMem.recordTouch.mockClear();
      state.network.injectPredictionError.mockClear();
      state.activeTouches = new Map([[1, { x: 100, y: 100 }]]);
      uiStore.setInteractionMode(mode);
      handlePointerUp(makeCanvasPointerUpEvent());
      expect(state.touchMem.recordTouch).not.toHaveBeenCalled();
      expect(state.network.injectPredictionError).not.toHaveBeenCalled();
    }
  });
});
