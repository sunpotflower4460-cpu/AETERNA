/**
 * runtimeAdapterDispatch.test.ts
 *
 * Confirms dispatchRuntimeCommand routes each RuntimeCommand to the
 * matching pointerHandlers.js function with the right arguments, without
 * actually executing pointerHandlers.js's DOM-touching bodies (mocked —
 * this test suite runs without a DOM, matching the rest of src/tests/**).
 */

import { describe, it, expect, vi } from 'vitest';

const applyPreset = vi.fn();
const resetTouchMemory = vi.fn();
const injectMassiveError = vi.fn();
const toggleVisualLayer = vi.fn();
const toggleDebugLabels = vi.fn();

vi.mock('../../perception/pointerHandlers.js', () => ({
  applyPreset,
  resetTouchMemory,
  injectMassiveError,
  toggleVisualLayer,
  toggleDebugLabels,
}));

const { dispatchRuntimeCommand } = await import('../../app/runtime/RuntimeAdapter.js');

describe('dispatchRuntimeCommand', () => {
  it('routes APPLY_PRESET to applyPreset with the preset name', () => {
    dispatchRuntimeCommand({ type: 'APPLY_PRESET', name: 'schumann' });
    expect(applyPreset).toHaveBeenCalledWith('schumann');
  });

  it('routes RESET_TOUCH_MEMORY to resetTouchMemory', () => {
    dispatchRuntimeCommand({ type: 'RESET_TOUCH_MEMORY' });
    expect(resetTouchMemory).toHaveBeenCalledTimes(1);
  });

  it('routes INJECT_MASSIVE_ERROR to injectMassiveError', () => {
    dispatchRuntimeCommand({ type: 'INJECT_MASSIVE_ERROR' });
    expect(injectMassiveError).toHaveBeenCalledTimes(1);
  });

  it('routes TOGGLE_VISUAL_LAYER to toggleVisualLayer', () => {
    dispatchRuntimeCommand({ type: 'TOGGLE_VISUAL_LAYER' });
    expect(toggleVisualLayer).toHaveBeenCalledTimes(1);
  });

  it('routes TOGGLE_DEBUG_LABELS to toggleDebugLabels', () => {
    dispatchRuntimeCommand({ type: 'TOGGLE_DEBUG_LABELS' });
    expect(toggleDebugLabels).toHaveBeenCalledTimes(1);
  });
});
