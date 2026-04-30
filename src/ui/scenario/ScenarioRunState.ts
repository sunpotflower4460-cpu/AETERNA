/**
 * ScenarioRunState.ts
 * U7: Scenario UX
 *
 * Module-level state management for the active scenario run.
 * Pure TypeScript — no DOM, no React, no runtime dynamics modifications.
 *
 * Principles:
 * - Tracks only which scenario the user selected and UI run status.
 * - Does NOT modify any field values, energy, trace, closure, or return values.
 * - Does NOT produce fake results or fake events.
 *
 * Reference: docs/scientific-ui-ux-principles.md
 */

import type { ScenarioPresetId } from '../../types/scenarioPreset.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScenarioRunStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed';

export interface ScenarioRunState {
  status: ScenarioRunStatus;
  activeScenarioId: ScenarioPresetId | null;
  startTick: number | null;
  currentTick: number | null;
  elapsedMs: number | null;
}

// ── Module-level state ────────────────────────────────────────────────────────

let _state: ScenarioRunState = {
    status: 'idle',
    activeScenarioId: null,
    startTick: null,
    currentTick: null,
    elapsedMs: null,
};

// ── Accessors ─────────────────────────────────────────────────────────────────

/** Return a snapshot of the current scenario run state. */
export function getScenarioRunState(): ScenarioRunState {
    return { ..._state };
}

// ── State transitions ─────────────────────────────────────────────────────────

/**
 * Start running a scenario.
 * Transitions from 'idle' or 'stopped' to 'running'.
 */
export function runScenario(id: ScenarioPresetId, tick: number): void {
    _state = {
        status: 'running',
        activeScenarioId: id,
        startTick: tick,
        currentTick: tick,
        elapsedMs: 0,
    };
}

/**
 * Pause the active scenario run.
 * Only transitions if currently 'running'.
 */
export function pauseScenario(): void {
    if (_state.status !== 'running') return;
    _state = { ..._state, status: 'paused' };
}

/**
 * Resume a paused scenario run.
 * Only transitions if currently 'paused'.
 */
export function resumeScenario(): void {
    if (_state.status !== 'paused') return;
    _state = { ..._state, status: 'running' };
}

/**
 * Stop the active scenario run.
 * Records the final tick. Transitions to 'stopped'.
 */
export function stopScenario(tick: number): void {
    _state = { ..._state, status: 'stopped', currentTick: tick };
}

/**
 * Reset the scenario run state to idle.
 */
export function resetScenarioRun(): void {
    _state = {
        status: 'idle',
        activeScenarioId: null,
        startTick: null,
        currentTick: null,
        elapsedMs: null,
    };
}

/**
 * Update the current tick and elapsed time.
 * Only updates if the scenario is currently 'running'.
 */
export function tickScenario(tick: number, elapsedMs: number): void {
    if (_state.status !== 'running') return;
    _state = { ..._state, currentTick: tick, elapsedMs };
}
