/**
 * Closed-Loop Scenario Runner
 *
 * W8: Closed-Loop Scenario Tests
 *
 * Headless integration scenario runner that exercises W1–W7 components together:
 *   BodySurfaceState → ActuationPulse → WorldMediumState → SensoryReturnPacket
 *   → ReafferenceComparisonState → BodyWorldClosureState → ProtoNeuronObservationState
 *
 * Purpose:
 * Verify that Body-World Closure functions as a single closed loop across multiple
 * scenario conditions (no return, delayed return, amplified return, etc.).
 *
 * This is NOT a proof of consciousness, self-awareness, or intelligence.
 * It is a research-diagnostic test of closed-loop life-field operation.
 *
 * Prohibited content:
 * - No semantic nodes, object labels, or meaning structures
 * - No runtime neuron node placement
 * - No Node bridge connections
 * - No consciousness claims
 * - No NaN or Infinity in outputs
 */

import { deriveActuationPulse } from '../../actuation/deriveActuationPulse.ts';
import { deriveBodyWorldClosureState } from '../../closure/deriveBodyWorldClosureState.ts';
import { deriveReafferenceComparison } from '../../closure/deriveReafferenceComparison.ts';
import { deriveSensoryReturn } from '../../perception/deriveSensoryReturn.ts';
import { initializeWorldMediumState } from '../../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../../world/updateWorldMedium.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { BodySurfaceState } from '../../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { ClosedLoopScenarioSummary } from '../../types/closedLoopScenarioSummary.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../../types/worldMediumState.ts';

// ─── Scenario Configuration ──────────────────────────────────────────────────

/**
 * WorldResponseMode controls how the simulated world responds to pulses.
 * This is purely a simulation-control parameter — not a semantic interpretation.
 */
export type WorldResponseMode =
  | 'normal'         // standard world response
  | 'no_return'      // world receives pulses but generates no sensory return
  | 'delayed_return' // sensory return arrives with increased delay
  | 'amplified_return' // sensory return intensity is boosted
  | 'weak_return'    // sensory return intensity is dampened
  | 'world_only'     // world generates returns without AETERNA pulses
  | 'repeated_self_pulse'; // AETERNA emits repeated rhythmic pulses

export interface ClosedLoopScenarioConfig {
  /** Scenario name — research label */
  scenarioName: string;
  /** Total number of ticks to run */
  ticks: number;
  /** Time delta per tick in seconds (default: 1/60) */
  dt?: number;
  /** How the world responds to pulses */
  worldResponseMode: WorldResponseMode;
  /** Override initial body surface state */
  initialBodySurface?: Partial<BodySurfaceState>;
  /** Override initial world medium state */
  initialWorld?: Partial<WorldMediumState>;
  /** Whether to emit a pulse on every tick (default: based on bodySurface readiness) */
  forcePulseEveryTick?: boolean;
  /** Pulse interval in ticks for repeated_self_pulse mode (default: 5) */
  pulseInterval?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function hasNanOrInfinity(obj: object): boolean {
  for (const value of Object.values(obj)) {
    if (typeof value === 'number' && !Number.isFinite(value)) return true;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (hasNanOrInfinity(value as object)) return true;
    }
  }
  return false;
}

const SEMANTIC_FORBIDDEN_KEYS = [
  'label', 'meaning', 'concept', 'category', 'sameObject',
  'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
  'naturalLanguage', 'teacherVerdict', 'objectIdentity', 'selfAwareness',
  'iDidThis', 'agentLabel', 'meaningNode',
];

function hasSemanticLeak(obj: object): boolean {
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (SEMANTIC_FORBIDDEN_KEYS.includes(key)) return true;
  }
  return false;
}

function makeBodySurface(
  timestamp: number,
  overrides: Partial<BodySurfaceState> = {},
): BodySurfaceState {
  return {
    timestamp,
    boundaryIntegrity: overrides.boundaryIntegrity ?? 0.74,
    surfaceSensitivity: overrides.surfaceSensitivity ?? 0.62,
    permeability: overrides.permeability ?? 0.55,
    contactReadiness: overrides.contactReadiness ?? 0.60,
    outputReadiness: overrides.outputReadiness ?? 0.65,
    localIrritability: overrides.localIrritability ?? 0.18,
    recoveryShielding: overrides.recoveryShielding ?? 0.22,
    surfaceTension: overrides.surfaceTension ?? 0.30,
    surfaceFatigue: overrides.surfaceFatigue ?? 0.12,
    protectiveClosure: overrides.protectiveClosure ?? 0.15,
    externalContactLoad: overrides.externalContactLoad ?? 0.10,
  };
}

/**
 * Apply world-response mode overrides to the sensory return packets.
 * This is a simulation-control layer; it does not add semantic interpretation.
 */
function applyWorldResponseMode(
  packets: SensoryReturnPacket[],
  mode: WorldResponseMode,
  hasPulse: boolean,
): SensoryReturnPacket[] {
  switch (mode) {
    case 'no_return':
      // World does not generate sensory return
      return [];

    case 'delayed_return':
      // Increase returnDelayHint on all packets
      return packets.map((packet) => ({
        ...packet,
        returnDelayHint: clamp01(packet.returnDelayHint + 0.45),
      }));

    case 'amplified_return':
      // Boost intensity
      return packets.map((packet) => ({
        ...packet,
        intensity: clamp01(packet.intensity * 2.2),
        worldOriginStrength: clamp01(packet.worldOriginStrength + 0.2),
      }));

    case 'weak_return':
      // Dampen intensity
      return packets.map((packet) => ({
        ...packet,
        intensity: clamp01(packet.intensity * 0.25),
        worldOriginStrength: clamp01(packet.worldOriginStrength * 0.5),
      }));

    case 'world_only':
      // If there was a pulse, suppress self-caused attribution; boost world-origin
      // If no pulse, pass packets as-is but mark as world-originated
      if (hasPulse) {
        return packets.map((packet) => ({
          ...packet,
          worldOriginStrength: clamp01(packet.worldOriginStrength + 0.35),
        }));
      }
      return packets;

    case 'normal':
    case 'repeated_self_pulse':
    default:
      return packets;
  }
}

// ─── Scenario Runner ──────────────────────────────────────────────────────────

export interface ClosedLoopScenarioResult {
  summary: ClosedLoopScenarioSummary;
  closureStates: BodyWorldClosureState[];
  reafferenceStates: ReafferenceComparisonState[];
}

export async function runClosedLoopScenario(
  config: ClosedLoopScenarioConfig,
): Promise<ClosedLoopScenarioResult> {
  const {
    scenarioName,
    ticks,
    dt = 1 / 60,
    worldResponseMode,
    initialBodySurface = {},
    initialWorld = {},
    forcePulseEveryTick = false,
    pulseInterval = 5,
  } = config;

  let worldState: WorldMediumState = {
    ...initializeWorldMediumState(),
    ...initialWorld,
  };
  let previousWorldState: WorldMediumState | null = null;
  let previousClosureState: BodyWorldClosureState | null = null;

  const closureStates: BodyWorldClosureState[] = [];
  const reafferenceStates: ReafferenceComparisonState[] = [];

  let pulseCount = 0;
  let sensoryReturnCount = 0;
  let reafferenceCount = 0;
  let worldOnlyReturnCount = 0;
  let selfMatchedReturnCount = 0;
  let unresolvedReturnCount = 0;
  let closureFailureCount = 0;
  let nanOrInfinityCount = 0;
  let semanticLeakCount = 0;
  let protoNeuronCandidateCount = 0;
  let stableProtoNeuronCandidateCount = 0;

  const loopGains: number[] = [];
  const closureStabilities: number[] = [];
  const closureDrifts: number[] = [];
  const feedbackSaturationRisks: number[] = [];
  const roundTripDelays: number[] = [];
  const selfCausedMatches: number[] = [];
  const worldCausedDifferences: number[] = [];
  const protoNeuronConfidences: number[] = [];

  const baseTimestamp = Date.now();

  for (let tick = 0; tick < ticks; tick += 1) {
    const timestamp = baseTimestamp + tick;

    // --- W1: Body Surface State ---
    const bodySurface = makeBodySurface(timestamp, initialBodySurface);

    // --- W2: Actuation Pulse ---
    let pulse: ActuationPulse | null = null;

    const shouldEmitPulse =
      worldResponseMode !== 'world_only' &&
      (forcePulseEveryTick ||
        (worldResponseMode === 'repeated_self_pulse'
          ? tick % pulseInterval === 0
          : bodySurface.outputReadiness >= 0.55));

    if (shouldEmitPulse) {
      pulse = deriveActuationPulse({
        timestamp,
        bodySurfaceState: bodySurface,
        ongoingness: 0.62,
        stability: 0.68,
        boundaryIntegrity: bodySurface.boundaryIntegrity,
        collapseRisk: 0.10,
        meanActivity: 0.22,
      });
      if (pulse !== null) {
        pulseCount += 1;
      }
    }

    // --- W3: World Medium Update ---
    worldState = updateWorldMedium(worldState, pulse, dt);

    // --- W4: Sensory Return ---
    const rawPackets = deriveSensoryReturn(worldState, previousWorldState, dt);
    const hasPulse = pulse !== null;
    const packets = applyWorldResponseMode(rawPackets, worldResponseMode, hasPulse);
    sensoryReturnCount += packets.length;

    // Classify returns for extended metrics
    for (const packet of packets) {
      if (!hasPulse && packet.worldOriginStrength > 0.5) {
        worldOnlyReturnCount += 1;
      }
    }

    // --- W5: Reafference Comparison ---
    const reafference = deriveReafferenceComparison(pulse, packets, worldState, dt);
    reafferenceCount += 1;
    reafferenceStates.push(reafference);

    if (reafference.selfCausedMatch > 0.45) {
      selfMatchedReturnCount += 1;
    }
    if (reafference.unresolvedReturn > 0.40) {
      unresolvedReturnCount += 1;
    }
    selfCausedMatches.push(reafference.selfCausedMatch);
    worldCausedDifferences.push(reafference.worldCausedDifference);

    // --- W6: Body-World Closure State ---
    const closureState = deriveBodyWorldClosureState({
      timestamp,
      actuationPulse: pulse,
      sensoryReturns: packets,
      worldMediumState: worldState,
      reafferenceComparisonState: reafference,
      ongoingness: 0.62,
      previousState: previousClosureState,
    });
    closureStates.push(closureState);
    previousClosureState = closureState;

    loopGains.push(closureState.loopGain);
    closureStabilities.push(closureState.closureStability);
    closureDrifts.push(closureState.closureDrift);
    feedbackSaturationRisks.push(closureState.feedbackSaturationRisk);
    roundTripDelays.push(closureState.roundTripDelay);

    if (closureState.closureStability < 0.25) {
      closureFailureCount += 1;
    }

    // --- W7: Proto-Neuron Observation (lightweight proxy, no runtime node) ---
    // We estimate candidate count from closureCoupling and closureStability
    // without running the full deriveProtoNeuronCandidates pipeline (which
    // requires AeternaNetwork internals). This is an observer-side proxy count.
    const closureCouplingProxy = clamp01(
      closureState.loopGain / 1.1 * 0.25 +
      closureState.returnStrength * 0.20 +
      closureState.closureStability * 0.20 +
      reafference.selfCausedMatch * 0.15 +
      (tick > 3 ? 0.10 : 0),
    );
    const candidateThreshold = 0.42;
    if (closureCouplingProxy >= candidateThreshold) {
      protoNeuronCandidateCount += 1;
      const confidence = clamp01(closureCouplingProxy * 0.85);
      protoNeuronConfidences.push(confidence);
      if (
        closureState.closureStability >= 0.45 &&
        closureCouplingProxy >= 0.52
      ) {
        stableProtoNeuronCandidateCount += 1;
      }
    }

    // --- NaN / Infinity detection ---
    if (
      hasNanOrInfinity(closureState) ||
      hasNanOrInfinity(reafference) ||
      hasNanOrInfinity(worldState)
    ) {
      nanOrInfinityCount += 1;
    }

    // --- Semantic leak detection ---
    if (
      hasSemanticLeak(closureState) ||
      hasSemanticLeak(reafference) ||
      hasSemanticLeak(worldState) ||
      (pulse !== null && hasSemanticLeak(pulse))
    ) {
      semanticLeakCount += 1;
    }

    previousWorldState = worldState;
  }

  const summary: ClosedLoopScenarioSummary = {
    scenarioName,
    ticks,
    pulseCount,
    sensoryReturnCount,
    reafferenceCount,
    averageLoopGain: average(loopGains),
    averageClosureStability: average(closureStabilities),
    averageClosureDrift: average(closureDrifts),
    maxFeedbackSaturationRisk: feedbackSaturationRisks.length > 0
      ? Math.max(...feedbackSaturationRisks)
      : 0,
    protoNeuronCandidateCount,
    stableProtoNeuronCandidateCount,
    averageProtoNeuronConfidence: average(protoNeuronConfidences),
    semanticLeakCount,
    nanOrInfinityCount,
    worldOnlyReturnCount,
    selfMatchedReturnCount,
    unresolvedReturnCount,
    averageRoundTripDelay: average(roundTripDelays),
    closureFailureCount,
    averageSelfCausedMatch: average(selfCausedMatches),
    averageWorldCausedDifference: average(worldCausedDifferences),
    averageClosureCoupling: average(
      closureStates.map((s) =>
        clamp01(
          s.loopGain / 1.1 * 0.25 +
          s.returnStrength * 0.20 +
          s.closureStability * 0.20,
        ),
      ),
    ),
  };

  return { summary, closureStates, reafferenceStates };
}

// ─── Scenario Suite ───────────────────────────────────────────────────────────

export async function runClosedLoopScenarioSuite(): Promise<ClosedLoopScenarioResult[]> {
  const configs: ClosedLoopScenarioConfig[] = [
    // W8-A: No world return
    {
      scenarioName: 'W8-A-no-world-return',
      ticks: 120,
      worldResponseMode: 'no_return',
      forcePulseEveryTick: false,
    },
    // W8-B: Delayed return
    {
      scenarioName: 'W8-B-delayed-return',
      ticks: 120,
      worldResponseMode: 'delayed_return',
      forcePulseEveryTick: false,
    },
    // W8-C: Amplified return
    {
      scenarioName: 'W8-C-amplified-return',
      ticks: 120,
      worldResponseMode: 'amplified_return',
      forcePulseEveryTick: false,
    },
    // W8-D: Weak return
    {
      scenarioName: 'W8-D-weak-return',
      ticks: 120,
      worldResponseMode: 'weak_return',
      forcePulseEveryTick: false,
    },
    // W8-E: Repeated self-pulse
    {
      scenarioName: 'W8-E-repeated-self-pulse',
      ticks: 150,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 4,
      forcePulseEveryTick: false,
    },
    // W8-F: World perturbation not caused by AETERNA
    {
      scenarioName: 'W8-F-world-perturbation-only',
      ticks: 120,
      worldResponseMode: 'world_only',
      initialWorld: {
        motionDrift: 0.75,
        fieldTemperature: 0.72,
        worldTurbulence: 0.55,
        mediumStability: 0.35,
      },
    },
    // W8-G: Self-caused vs world-caused difference
    {
      scenarioName: 'W8-G-self-vs-world-caused',
      ticks: 120,
      worldResponseMode: 'normal',
      forcePulseEveryTick: false,
      initialWorld: {
        motionDrift: 0.40,
        mediumStability: 0.65,
      },
    },
    // W8-H: Closure-coupled proto-neuron candidate
    {
      scenarioName: 'W8-H-closure-coupled-proto-neuron',
      ticks: 200,
      worldResponseMode: 'repeated_self_pulse',
      pulseInterval: 3,
      forcePulseEveryTick: false,
      initialBodySurface: {
        outputReadiness: 0.72,
        boundaryIntegrity: 0.80,
      },
      initialWorld: {
        mediumStability: 0.75,
        feedbackDelay: 0.25,
      },
    },
    // W8-I: Feedback saturation guard observation
    {
      scenarioName: 'W8-I-feedback-saturation-guard',
      ticks: 120,
      worldResponseMode: 'amplified_return',
      forcePulseEveryTick: true,
      initialBodySurface: {
        outputReadiness: 0.90,
        boundaryIntegrity: 0.88,
      },
      initialWorld: {
        echoLevel: 0.65,
        fieldTemperature: 0.70,
        mediumStability: 0.45,
      },
    },
    // W8-J: Semantic leak full check
    {
      scenarioName: 'W8-J-semantic-leak-full-check',
      ticks: 80,
      worldResponseMode: 'normal',
      forcePulseEveryTick: false,
    },
  ];

  const results: ClosedLoopScenarioResult[] = [];
  for (const config of configs) {
    const result = await runClosedLoopScenario(config);
    results.push(result);
  }
  return results;
}

// ─── Summary Display ──────────────────────────────────────────────────────────

/**
 * Format a ClosedLoopScenarioSummary for observer / diagnostic display.
 *
 * Display policy:
 * - Do NOT display "生命証明" (life proof)
 * - Do NOT display "意識あり" (consciousness present)
 * - Display as "Closed-Loop Scenario Summary" — research / diagnostic output
 */
export function formatClosedLoopScenarioSummary(summary: ClosedLoopScenarioSummary): string {
  const lines: string[] = [
    `[Closed-Loop Scenario Summary]`,
    `  scenario             : ${summary.scenarioName}`,
    `  ticks                : ${summary.ticks}`,
    `  pulseCount           : ${summary.pulseCount}`,
    `  sensoryReturnCount   : ${summary.sensoryReturnCount}`,
    `  averageLoopGain      : ${summary.averageLoopGain.toFixed(4)}`,
    `  averageClosureStability : ${summary.averageClosureStability.toFixed(4)}`,
    `  averageClosureDrift  : ${summary.averageClosureDrift.toFixed(4)}`,
    `  maxFeedbackSaturationRisk : ${summary.maxFeedbackSaturationRisk.toFixed(4)}`,
    `  protoNeuronCandidateCount : ${summary.protoNeuronCandidateCount}`,
    `  averageProtoNeuronConfidence : ${summary.averageProtoNeuronConfidence.toFixed(4)}`,
    `  semanticLeakCount    : ${summary.semanticLeakCount}`,
    `  nanOrInfinityCount   : ${summary.nanOrInfinityCount}`,
  ];
  if (summary.worldOnlyReturnCount !== undefined) {
    lines.push(`  worldOnlyReturnCount : ${summary.worldOnlyReturnCount}`);
  }
  if (summary.selfMatchedReturnCount !== undefined) {
    lines.push(`  selfMatchedReturnCount : ${summary.selfMatchedReturnCount}`);
  }
  if (summary.averageRoundTripDelay !== undefined) {
    lines.push(`  averageRoundTripDelay : ${summary.averageRoundTripDelay.toFixed(4)}`);
  }
  if (summary.closureFailureCount !== undefined) {
    lines.push(`  closureFailureCount  : ${summary.closureFailureCount}`);
  }
  return lines.join('\n');
}
