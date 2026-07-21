/**
 * RuntimeAdapter.ts
 *
 * The single seam between UI code and the live legacy Runtime
 * (master spec §8). Wraps the existing state singleton and
 * src/perception/pointerHandlers.js command functions — it does not
 * reimplement or change any of their behavior, only gives them a typed,
 * single entry point so callers stop reaching into state.network /
 * pointerHandlers.js directly one at a time.
 */

import { state } from '../../organism/state.js';
import {
  applyPreset,
  resetTouchMemory,
  injectMassiveError,
  toggleVisualLayer,
  toggleDebugLabels,
} from '../../perception/pointerHandlers.js';
import { buildRuntimeSnapshot, type RuntimeSnapshot } from './RuntimeSnapshot.js';
import { deriveRuntimeCapabilities, type RuntimeCapabilities } from './RuntimeCapabilities.js';
import type { RuntimeCommand } from './RuntimeCommand.js';
import type { NowSummaryState } from '../../types/nowSummary.js';

export function getRuntimeSnapshot(now: number = performance.now()): RuntimeSnapshot | null {
  return buildRuntimeSnapshot(state, now);
}

/**
 * Most recently computed NowSummaryState (src/ui/summary/deriveNowSummary.ts,
 * already-live — see state.lastNowSummary in updateMetricsUI.js). Null
 * before the first ~30-frame U5 cycle has run.
 */
export function getNowSummary(): NowSummaryState | null {
  return state.lastNowSummary;
}

export function getRuntimeCapabilities(): RuntimeCapabilities {
  return deriveRuntimeCapabilities(state.releaseSafety);
}

export interface CellObservationValue {
  cellId: number;
  /** AeternaNetwork.currentBuffer[cellId] — the raw per-node scalar field value. */
  currentValue: number;
  /** AeternaNetwork.spikeTrace[cellId] — per-node spike-trace accumulator. */
  spikeTrace: number;
}

interface NetworkLike {
  numNodes: number;
  currentBuffer: Float32Array;
  spikeTrace: Float32Array;
}

/**
 * Read-only per-cell readout for the Cell Inspector (PR8b, master spec §10
 * Inspect Mode: "Inspect中のタップでRuntimeが変わらない"). Never mutates
 * state.network — a pure read of already-computed per-node arrays.
 * Returns null if the network isn't constructed yet or cellId is out of range.
 */
export function getCellValue(cellId: number): CellObservationValue | null {
  const network = state.network as NetworkLike | null;
  if (!network || cellId < 0 || cellId >= network.numNodes) return null;
  return {
    cellId,
    currentValue: network.currentBuffer[cellId],
    spikeTrace: network.spikeTrace[cellId],
  };
}

export function dispatchRuntimeCommand(command: RuntimeCommand): void {
  switch (command.type) {
    case 'APPLY_PRESET':
      applyPreset(command.name);
      return;
    case 'RESET_TOUCH_MEMORY':
      resetTouchMemory();
      return;
    case 'INJECT_MASSIVE_ERROR':
      injectMassiveError();
      return;
    case 'TOGGLE_VISUAL_LAYER':
      toggleVisualLayer();
      return;
    case 'TOGGLE_DEBUG_LABELS':
      toggleDebugLabels();
      return;
    default: {
      // Exhaustiveness check: TypeScript errors here if RuntimeCommand
      // gains a variant this switch doesn't handle.
      const _exhaustive: never = command;
      void _exhaustive;
    }
  }
}
