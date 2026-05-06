/**
 * timeReplay.ts
 * v1.7: Deep Inspector / Time Replay
 *
 * Defines the TimeReplaySnapshot and related types for the UI replay system.
 *
 * Design principles:
 * - TimeReplay is OBSERVATION replay only — the runtime is NOT wound back.
 * - Raw field arrays are NOT stored; only lightweight summaries are kept.
 * - Missing ticks produce null results — no interpolation, no fake data.
 * - No consciousness / emotion / mystical proof claims in any field.
 * - Replay Mode shows recorded observation snapshots, not runtime state rollback.
 *
 * Guardrails:
 * - Time Replay is the re-display of recorded observation snapshots.
 *   It does NOT imply the runtime itself has moved backward.
 * - Snapshot storage MUST NOT include raw field buffers (Float32Array etc.)
 *   to avoid memory leaks.
 *
 * Reference: docs/deep-inspector-time-replay.md
 */

import type { CellObservation } from './cellObservation.ts';
import type { MetricLensId } from '../ui/lens/metricLensRegistry.ts';

// ── TimeReplaySnapshot ────────────────────────────────────────────────────────

/**
 * Lightweight snapshot of UI observation state at a single simulation tick.
 *
 * Stored in TimeReplayBuffer to allow replay of past cell observations.
 *
 * IMPORTANT:
 * - Raw field buffers (Float32Array, Uint8Array etc.) are NOT included.
 * - Only scalar summaries and the selected cell observation are stored.
 * - globalSummary contains only bounded numeric summaries, not arrays.
 */
export interface TimeReplaySnapshot {
    /** Simulation tick this snapshot was taken at */
    tick: number;
    /** Wall-clock timestamp (Date.now()) when snapshot was taken */
    timestamp: number;
    /**
     * Observation of the selected cell at this tick, or null if no cell was
     * selected or observation data was unavailable.
     */
    selectedCellObservation: CellObservation | null;
    /** Active Metric Visual Lens ID at time of snapshot, or null */
    activeLensId: MetricLensId | null;
    /** Focused metric ID at time of snapshot, or null */
    focusedMetricId: string | null;
    /**
     * Lightweight global field summary at this tick.
     * All fields are optional — missing = not observed at this tick.
     * No raw arrays. No unbounded buffers.
     */
    globalSummary: {
        phaseCoherence?: number;
        vortexCandidateCount?: number;
        membraneOverlap?: number;
        plasticityAccumulation?: number;
        observedRatioMatchStrength?: number;
        nanOrInfinityCount?: number;
    };
    /**
     * IDs of AeternaEvents that were active at this tick.
     * Only IDs — not full event objects — to minimise memory.
     */
    eventIds: string[];
}

// ── ReplayModeState ───────────────────────────────────────────────────────────

/**
 * Whether the UI is currently in Replay Mode or Live Mode.
 *
 * - 'live':   Showing current runtime state (normal mode).
 * - 'replay': Showing a recorded snapshot; runtime continues in background.
 *
 * IMPORTANT: 'replay' mode does NOT stop or rewind the runtime.
 * It only changes which data the UI displays.
 */
export type ReplayModeState = 'live' | 'replay';

// ── ReplayUIState ─────────────────────────────────────────────────────────────

/**
 * UI state for the Time Replay panel.
 */
export interface ReplayUIState {
    /** Whether the user is currently viewing a past snapshot */
    mode: ReplayModeState;
    /** The tick being displayed in replay mode (null = live) */
    replayTick: number | null;
    /** The current live simulation tick */
    liveTick: number;
    /** Whether a snapshot is available for the selected replayTick */
    snapshotAvailable: boolean;
}
