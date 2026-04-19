/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AETERNA Phase 7: Self-Origin Event Logging
 *
 * This module logs observable events that serve as evidence candidates for:
 * - Spontaneous (non-reactive) actions
 * - Self-preserving state changes
 * - Endogenous mode shifts
 * - History-dependent response divergence
 *
 * These are RESEARCH LOGS, not narrative or演出.
 * Events are timestamped, categorized, and include raw state data.
 */

export type SelfOriginEventType =
  | 'spontaneous_orient'
  | 'spontaneous_settle'
  | 'spontaneous_mode_shift'
  | 'self_protective_dampening'
  | 'restoration_seeking_drift'
  | 'low_energy_conserving_shift'
  | 'overload_recovery_shift'
  | 'history_dependent_divergence'
  | 'repeated_stimulus_divergence'
  | 'no_demand_orient_pulse'
  | 'endogenous_baseline_drift';

export interface SelfOriginEvent {
  frame: number;
  type: SelfOriginEventType;
  description: string;

  // Contextual state at event time
  context: {
    consecutiveQuietFrames: number;
    activeTouchCount: number;
    energy: number;
    stability: number;
    overload: number;
    actionState: string;
    modeState: string;
  };

  // Type-specific data
  data: Record<string, number | string | boolean>;
}

export interface SelfOriginEventLog {
  events: SelfOriginEvent[];
  maxEvents: number;
}

/**
 * Create initial event log
 */
export function createSelfOriginEventLog(maxEvents = 200): SelfOriginEventLog {
  return {
    events: [],
    maxEvents,
  };
}

/**
 * Record a self-origin event candidate
 */
export function recordSelfOriginEvent(
  log: SelfOriginEventLog,
  event: SelfOriginEvent
): void {
  log.events.push(event);

  // Trim old events if exceeding max
  if (log.events.length > log.maxEvents) {
    log.events.shift();
  }
}

/**
 * Detect and log spontaneous orient pulse
 * Called when orient action occurs during quiet period
 */
export function detectSpontaneousOrient(
  network: any,
  log: SelfOriginEventLog
): void {
  const homeostaticState = network.homeostaticState;
  const consecutiveQuietFrames = homeostaticState?.consecutiveQuietFrames ?? 0;

  // Only log if quiet for 100+ frames
  if (consecutiveQuietFrames < 100) return;

  recordSelfOriginEvent(log, {
    frame: network.simTime,
    type: 'spontaneous_orient',
    description: `Orient action after ${consecutiveQuietFrames} quiet frames`,
    context: {
      consecutiveQuietFrames,
      activeTouchCount: 0,
      energy: network.energy ?? 0,
      stability: network.stability ?? 0,
      overload: network.overload ?? 0,
      actionState: network.actionState ?? 'unknown',
      modeState: network.modeState ?? 'unknown',
    },
    data: {
      actionPulseLevel: network.actionPulseLevel ?? 0,
      orientingDrive: network.orientingDrive ?? 0,
    },
  });
}

/**
 * Detect and log spontaneous settle action
 */
export function detectSpontaneousSettle(
  network: any,
  log: SelfOriginEventLog
): void {
  const homeostaticState = network.homeostaticState;
  const consecutiveQuietFrames = homeostaticState?.consecutiveQuietFrames ?? 0;

  if (consecutiveQuietFrames < 100) return;

  recordSelfOriginEvent(log, {
    frame: network.simTime,
    type: 'spontaneous_settle',
    description: `Settle action after ${consecutiveQuietFrames} quiet frames`,
    context: {
      consecutiveQuietFrames,
      activeTouchCount: 0,
      energy: network.energy ?? 0,
      stability: network.stability ?? 0,
      overload: network.overload ?? 0,
      actionState: network.actionState ?? 'unknown',
      modeState: network.modeState ?? 'unknown',
    },
    data: {
      actionPulseLevel: network.actionPulseLevel ?? 0,
      restDrive: network.restDrive ?? 0,
    },
  });
}

/**
 * Detect and log spontaneous mode shift
 */
export function detectSpontaneousModeShift(
  network: any,
  log: SelfOriginEventLog,
  previousMode: string
): void {
  const homeostaticState = network.homeostaticState;
  const consecutiveQuietFrames = homeostaticState?.consecutiveQuietFrames ?? 0;

  // Only log if quiet for 100+ frames
  if (consecutiveQuietFrames < 100) return;

  const currentMode = network.modeState ?? 'unknown';
  if (currentMode === previousMode) return;

  recordSelfOriginEvent(log, {
    frame: network.simTime,
    type: 'spontaneous_mode_shift',
    description: `Mode shift ${previousMode} → ${currentMode} after ${consecutiveQuietFrames} quiet frames`,
    context: {
      consecutiveQuietFrames,
      activeTouchCount: 0,
      energy: network.energy ?? 0,
      stability: network.stability ?? 0,
      overload: network.overload ?? 0,
      actionState: network.actionState ?? 'unknown',
      modeState: currentMode,
    },
    data: {
      previousMode,
      currentMode,
    },
  });
}

/**
 * Detect and log self-protective dampening
 * When high overload triggers dampening/withdrawal
 */
export function detectSelfProtectiveDampening(
  network: any,
  log: SelfOriginEventLog
): void {
  const homeostaticState = network.homeostaticState;
  if (!homeostaticState) return;

  const overload = homeostaticState.overloadLevel;
  const actionState = network.actionState ?? 'unknown';

  // Dampening evidence: high overload + withdraw action
  if (overload > 0.6 && actionState === 'withdraw') {
    recordSelfOriginEvent(log, {
      frame: network.simTime,
      type: 'self_protective_dampening',
      description: `Withdraw action under high overload (${overload.toFixed(2)})`,
      context: {
        consecutiveQuietFrames: homeostaticState.consecutiveQuietFrames,
        activeTouchCount: network.activeTouchCount ?? 0,
        energy: network.energy ?? 0,
        stability: homeostaticState.stabilityIndex,
        overload: overload,
        actionState,
        modeState: network.modeState ?? 'unknown',
      },
      data: {
        collapseRisk: homeostaticState.collapseRisk,
        boundaryIntegrity: homeostaticState.boundaryIntegrity,
      },
    });
  }
}

/**
 * Detect and log restoration-seeking drift
 * When recovery drive rises without active touch
 */
export function detectRestorationSeekingDrift(
  network: any,
  log: SelfOriginEventLog,
  previousRecoveryDrive: number
): void {
  const homeostaticState = network.homeostaticState;
  if (!homeostaticState) return;

  const recoveryDrive = homeostaticState.recoveryDrive;
  const consecutiveQuietFrames = homeostaticState.consecutiveQuietFrames;

  // Evidence: recovery drive increase during quiet
  if (consecutiveQuietFrames > 50 &&
      recoveryDrive > previousRecoveryDrive + 0.05 &&
      recoveryDrive > 0.3) {
    recordSelfOriginEvent(log, {
      frame: network.simTime,
      type: 'restoration_seeking_drift',
      description: `Recovery drive rose to ${recoveryDrive.toFixed(2)} during quiet`,
      context: {
        consecutiveQuietFrames,
        activeTouchCount: 0,
        energy: network.energy ?? 0,
        stability: homeostaticState.stabilityIndex,
        overload: homeostaticState.overloadLevel,
        actionState: network.actionState ?? 'unknown',
        modeState: network.modeState ?? 'unknown',
      },
      data: {
        previousRecoveryDrive,
        currentRecoveryDrive: recoveryDrive,
        restorationBias: homeostaticState.restorationBias,
      },
    });
  }
}

/**
 * Detect and log low-energy conserving shift
 * When low energy triggers energy-conserving behavior
 */
export function detectLowEnergyConservingShift(
  network: any,
  log: SelfOriginEventLog
): void {
  const homeostaticState = network.homeostaticState;
  if (!homeostaticState) return;

  const energyReserve = homeostaticState.energyReserve;
  const lowEnergyPressure = homeostaticState.lowEnergyPressure;

  // Evidence: low energy + conserving action (settle or idle)
  if (energyReserve < 0.3 &&
      lowEnergyPressure > 0.3 &&
      (network.actionState === 'settle' || network.actionState === 'idle')) {
    recordSelfOriginEvent(log, {
      frame: network.simTime,
      type: 'low_energy_conserving_shift',
      description: `Conserving behavior at low energy (${energyReserve.toFixed(2)})`,
      context: {
        consecutiveQuietFrames: homeostaticState.consecutiveQuietFrames,
        activeTouchCount: network.activeTouchCount ?? 0,
        energy: energyReserve,
        stability: homeostaticState.stabilityIndex,
        overload: homeostaticState.overloadLevel,
        actionState: network.actionState ?? 'unknown',
        modeState: network.modeState ?? 'unknown',
      },
      data: {
        lowEnergyPressure,
        actionPulseLevel: network.actionPulseLevel ?? 0,
      },
    });
  }
}

/**
 * Detect and log overload recovery shift
 * When organism transitions from high overload to recovery
 */
export function detectOverloadRecoveryShift(
  network: any,
  log: SelfOriginEventLog,
  previousOverload: number
): void {
  const homeostaticState = network.homeostaticState;
  if (!homeostaticState) return;

  const currentOverload = homeostaticState.overloadLevel;

  // Evidence: overload dropping + recovery drive rising
  if (previousOverload > 0.6 &&
      currentOverload < previousOverload - 0.1 &&
      homeostaticState.recoveryDrive > 0.3) {
    recordSelfOriginEvent(log, {
      frame: network.simTime,
      type: 'overload_recovery_shift',
      description: `Overload recovery: ${previousOverload.toFixed(2)} → ${currentOverload.toFixed(2)}`,
      context: {
        consecutiveQuietFrames: homeostaticState.consecutiveQuietFrames,
        activeTouchCount: network.activeTouchCount ?? 0,
        energy: network.energy ?? 0,
        stability: homeostaticState.stabilityIndex,
        overload: currentOverload,
        actionState: network.actionState ?? 'unknown',
        modeState: network.modeState ?? 'unknown',
      },
      data: {
        previousOverload,
        currentOverload,
        recoveryDrive: homeostaticState.recoveryDrive,
      },
    });
  }
}

/**
 * Get recent events by type
 */
export function getRecentEventsByType(
  log: SelfOriginEventLog,
  type: SelfOriginEventType,
  count = 10
): SelfOriginEvent[] {
  return log.events
    .filter(e => e.type === type)
    .slice(-count);
}

/**
 * Get event summary for debug/research
 */
export function getEventSummary(log: SelfOriginEventLog): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  recentEvents: SelfOriginEvent[];
} {
  const eventsByType: Record<string, number> = {};

  for (const event of log.events) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
  }

  return {
    totalEvents: log.events.length,
    eventsByType,
    recentEvents: log.events.slice(-5),
  };
}
