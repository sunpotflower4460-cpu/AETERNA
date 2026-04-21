/**
 * Replay State Types
 *
 * AETERNA v0.5 / A3: Offline Replay / Rest Consolidation
 *
 * This module defines state for replay and consolidation mechanisms.
 * Replay is NOT event reconstruction, but trace/pattern reactivation
 * that happens quietly during low-input/rest conditions.
 *
 * Important:
 * - Replay is weak and does not dominate main dynamics
 * - Replay is suppressed during high external input
 * - Consolidation is gradual and accumulative
 * - This is NOT dream演出 or narrative replay
 */

/**
 * ReplayState - Current replay/consolidation availability and activity
 */
export interface ReplayState {
  /** Frame timestamp */
  timestamp: number;

  /** Pressure to initiate replay (builds during quiet) */
  replayPressure: number;

  /** Readiness/availability for replay to occur */
  replayReadiness: number;

  /** Consolidation gain: how much replay affects slow state */
  consolidationGain: number;

  /** Count of active replay traces in current frame */
  activeReplayCount: number;

  /** Recent replay salience (weight of what was replayed) */
  recentReplaySalience: number;

  /** Rest-based consolidation depth */
  restConsolidationDepth: number;

  /** Suppression pressure (high input suppresses replay) */
  replaySuppression: number;

  /** Last replay category (or null if none recent) */
  lastReplayCategory: string | null;
}
