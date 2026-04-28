/**
 * Long-Run Natural Emergence Scenario Runner
 *
 * S8: Long-Run Natural Emergence Scenarios
 *
 * Headless scenario runner that exercises S0–S7 components together over
 * extended tick counts to observe what naturally emerges under various
 * world-medium conditions.
 *
 * Components exercised:
 *   DynamicViabilityState (S2) → NaturalFeedbackAdjustment (S3)
 *   → MediumProfileState (S4) → LocalExcitabilityField (S5)
 *   → RepeatedFlowPathObservation (S6)
 *
 * Purpose:
 * Observe whether pre-semantic structures (flow continuity, local excitability
 * gradients, repeated path candidates, proto-network candidates) arise naturally
 * under long-run conditions. This is NOT a proof of life, consciousness, meaning,
 * or intelligence.
 *
 * Prohibited content:
 * - No semantic nodes, object labels, or meaning structures
 * - No runtime graph edges or node placement
 * - No Node bridge connections
 * - No consciousness claims
 * - No artificial fluctuation or command-style stabilization
 * - No NaN or Infinity in outputs
 */

import { deriveBodyWorldClosureState } from '../../closure/deriveBodyWorldClosureState.ts';
import { deriveDynamicViabilityState } from '../../closure/deriveDynamicViabilityState.ts';
import { deriveMinimalNaturalFeedback } from '../../closure/deriveMinimalNaturalFeedback.ts';
import { applyMinimalNaturalFeedback } from '../../closure/applyMinimalNaturalFeedback.ts';
import { deriveMediumProfileState } from '../../closure/deriveMediumProfileState.ts';
import { deriveReafferenceComparison } from '../../closure/deriveReafferenceComparison.ts';
import { deriveLocalExcitabilityField } from '../../observer/deriveLocalExcitabilityField.ts';
import { deriveRepeatedFlowPaths } from '../../observer/deriveRepeatedFlowPaths.ts';
import { deriveActuationPulse } from '../../actuation/deriveActuationPulse.ts';
import { initializeWorldMediumState } from '../../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../../world/updateWorldMedium.ts';
import { deriveSensoryReturn } from '../../perception/deriveSensoryReturn.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { BodySurfaceState } from '../../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { LocalExcitabilityFieldState } from '../../types/localExcitabilityField.ts';
import type { MediumProfileState } from '../../types/mediumProfileState.ts';
import type { NaturalFeedbackAdjustment } from '../../types/naturalFeedbackAdjustment.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { RepeatedFlowPathObservationState } from '../../types/repeatedFlowPath.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { TraceState } from '../../types/traceState.ts';
import type { WorldMediumState } from '../../types/worldMediumState.ts';
import type { LongRunEmergenceScenarioSummary } from '../../types/longRunEmergenceScenarioSummary.ts';
import { createNeutralNaturalFeedbackAdjustment } from '../../types/naturalFeedbackAdjustment.ts';
import type { LongRunEmergenceScenarioConfig, LongRunWorldMode } from './longRunEmergenceScenarioConfig.ts';

// ─── Simple seeded PRNG ───────────────────────────────────────────────────────

// xorshift32 — a fast, deterministic PRNG suitable for reproducible headless
// scenario testing. Not cryptographically secure; used only for test seeding.
function makeSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_TICKS = 200;
const DT = 1 / 60;

const SEMANTIC_FORBIDDEN_KEYS = [
  'label', 'meaning', 'concept', 'category', 'relation',
  'sameObject', 'objectId', 'teacherVerdict', 'languageMeaning',
  'utterance', 'nodeId', 'sharedTrunkCandidate',
  'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
  'naturalLanguage', 'objectIdentity', 'selfAwareness',
  'iDidThis', 'agentLabel', 'meaningNode',
];

// Proto-network proxy thresholds (observer-side only; not semantic criteria)
const PROTO_NETWORK_MIN_STABLE_PATHS = 2;
const PROTO_NETWORK_MIN_CLOSURE_COUPLING = 0.35;
const PROTO_NETWORK_MIN_FLOW_CONTINUITY = 0.40;
const PROTO_NETWORK_STABLE_MIN_CONFIDENCE = 0.40;
const PROTO_NETWORK_STABLE_MIN_PATHS = 3;
const PROTO_NETWORK_EMERGENCE_MIN_CONFIDENCE = 0.50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function hasSemanticLeak(obj: object): boolean {
  for (const key of Object.keys(obj)) {
    if (SEMANTIC_FORBIDDEN_KEYS.includes(key)) return true;
  }
  return false;
}

function makeBodySurface(timestamp: number, overrides: Partial<BodySurfaceState> = {}): BodySurfaceState {
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

function makeTraceState(timestamp: number, overrides: Partial<TraceState> = {}): TraceState {
  return {
    timestamp,
    traceStrength: overrides.traceStrength ?? 0.35,
    recurrenceWeight: overrides.recurrenceWeight ?? 0.32,
    salienceResidue: overrides.salienceResidue ?? 0.28,
    replayReadiness: overrides.replayReadiness ?? 0.30,
    replaySuppression: overrides.replaySuppression ?? 0.14,
    settlingResidue: overrides.settlingResidue ?? 0.26,
    recoveryLinkedResidue: overrides.recoveryLinkedResidue ?? 0.22,
  };
}

// ─── World mode helpers ───────────────────────────────────────────────────────

function getWorldModeInitialState(mode: LongRunWorldMode): Partial<WorldMediumState> {
  switch (mode) {
    case 'quiet':
      return { mediumStability: 0.72, worldTurbulence: 0.05, motionDrift: 0.08, echoLevel: 0.12, fieldTemperature: 0.40 };
    case 'weakRepeatedReturn':
      return { mediumStability: 0.65, worldTurbulence: 0.15, motionDrift: 0.18, echoLevel: 0.22, fieldTemperature: 0.45 };
    case 'delayedReturn':
      return { mediumStability: 0.60, feedbackDelay: 0.65, worldTurbulence: 0.18, echoLevel: 0.20 };
    case 'alternatingPerturbation':
      return { mediumStability: 0.50, worldTurbulence: 0.35, motionDrift: 0.30, fieldTemperature: 0.52 };
    case 'stableMedium':
      return { mediumStability: 0.85, worldTurbulence: 0.05, motionDrift: 0.05, echoLevel: 0.15, fieldTemperature: 0.42 };
    case 'unstableMedium':
      return { mediumStability: 0.25, worldTurbulence: 0.65, motionDrift: 0.55, echoLevel: 0.35, fieldTemperature: 0.62 };
    case 'highResistance':
      return { mediumStability: 0.55, worldTurbulence: 0.12, surfaceResistance: 0.75, motionDrift: 0.10 };
    case 'lowResistance':
      return { mediumStability: 0.68, worldTurbulence: 0.20, surfaceResistance: 0.10, motionDrift: 0.25, echoLevel: 0.45 };
    case 'slowEcho':
      return { mediumStability: 0.62, echoLevel: 0.70, worldTurbulence: 0.12, motionDrift: 0.12, fieldTemperature: 0.44 };
    case 'fastEcho':
      return { mediumStability: 0.62, echoLevel: 0.10, worldTurbulence: 0.25, motionDrift: 0.20 };
    default:
      return { mediumStability: 0.65 };
  }
}

function applyWorldModePacketTransform(
  packets: SensoryReturnPacket[],
  mode: LongRunWorldMode,
  tick: number,
  rng: () => number,
): SensoryReturnPacket[] {
  switch (mode) {
    case 'quiet':
      return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 0.55) }));

    case 'weakRepeatedReturn':
      return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 0.40) }));

    case 'delayedReturn':
      return packets.map((p) => ({ ...p, returnDelayHint: clamp01(p.returnDelayHint + 0.50) }));

    case 'alternatingPerturbation':
      if (tick % 2 === 0) {
        return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 1.5), worldOriginStrength: clamp01(p.worldOriginStrength + 0.2) }));
      } else {
        return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 0.3) }));
      }

    case 'stableMedium':
      return packets;

    case 'unstableMedium':
      return packets.map((p) => ({
        ...p,
        intensity: clamp01(p.intensity * (0.5 + rng() * 1.0)),
        worldOriginStrength: clamp01(p.worldOriginStrength + (rng() - 0.5) * 0.4),
      }));

    case 'highResistance':
      return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 0.15), worldOriginStrength: clamp01(p.worldOriginStrength * 0.4) }));

    case 'lowResistance':
      return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 1.8), worldOriginStrength: clamp01(p.worldOriginStrength + 0.25) }));

    case 'slowEcho':
      return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 0.90), returnDelayHint: clamp01(p.returnDelayHint + 0.20) }));

    case 'fastEcho':
      return packets.map((p) => ({ ...p, intensity: clamp01(p.intensity * 0.35) }));

    default:
      return packets;
  }
}

// ─── Scenario Runner ──────────────────────────────────────────────────────────

export function runLongRunEmergenceScenario(params: {
  scenarioName: string;
  ticks: number;
  seed?: number;
  scenarioConfig: LongRunEmergenceScenarioConfig;
}): LongRunEmergenceScenarioSummary {
  const { scenarioName, scenarioConfig } = params;
  const ticks = Math.max(1, Math.round(params.ticks * scenarioConfig.durationScale));
  const seed = params.seed ?? 42;
  const rng = makeSeededRng(seed);
  const { worldMode, feedbackEnabled, perturbationLevel } = scenarioConfig;

  const startMs = Date.now();

  // Initialize world state
  const modeInitial = getWorldModeInitialState(worldMode);
  let worldState: WorldMediumState = { ...initializeWorldMediumState(), ...modeInitial };
  let previousWorldState: WorldMediumState | null = null;
  let previousClosureState: BodyWorldClosureState | null = null;
  let previousLocalField: LocalExcitabilityFieldState | null = null;
  let previousFlowPathObs: RepeatedFlowPathObservationState | null = null;
  let previousViability: DynamicViabilityState | null = null;
  let previousMediumProfile: MediumProfileState | null = null;
  let previousFeedbackAdjustment: NaturalFeedbackAdjustment | null = null;

  // Accumulators
  const flowContinuities: number[] = [];
  const energyThroughputs: number[] = [];
  const dissipationBalances: number[] = [];
  const resistanceBalances: number[] = [];
  const delayCoherences: number[] = [];
  const boundaryExchanges: number[] = [];
  const saturationRisks: number[] = [];
  const extinctionRisks: number[] = [];
  const feedbackDominanceRisks: number[] = [];
  const echoStrengths: number[] = [];
  const returnDelays: number[] = [];
  const transmissionRatios: number[] = [];
  const protoNetworkConfidences: number[] = [];
  const closureCouplings: number[] = [];

  let highExcitabilityRegionCount = 0;
  let repeatedFlowPathCandidateCount = 0;
  let protoNetworkCandidateCount = 0;
  let stablePathCandidateCount = 0;
  let stableProtoNetworkCandidateCount = 0;
  let semanticLeakCount = 0;
  let nanOrInfinityCount = 0;
  let collapseEventCount = 0;
  let recoveryEventCount = 0;
  let emergenceEventCount = 0;

  let wasCollapsed = false;

  const baseTimestamp = Date.now();

  for (let tick = 0; tick < ticks; tick++) {
    const timestamp = baseTimestamp + tick;

    // --- Body Surface ---
    const bodySurface = makeBodySurface(timestamp, {
      outputReadiness: clamp01(0.65 + perturbationLevel * 0.15),
      boundaryIntegrity: clamp01(0.74 - perturbationLevel * 0.10),
    });

    // --- Actuation Pulse ---
    let pulse: ActuationPulse | null = null;
    const shouldEmitPulse = worldMode !== 'quiet' || tick % 8 === 0;
    if (shouldEmitPulse && bodySurface.outputReadiness >= 0.50) {
      pulse = deriveActuationPulse({
        timestamp,
        bodySurfaceState: bodySurface,
        ongoingness: 0.62,
        stability: 0.68,
        boundaryIntegrity: bodySurface.boundaryIntegrity,
        collapseRisk: 0.10,
        meanActivity: 0.22,
      });
    }

    // --- World Medium Update ---
    worldState = updateWorldMedium(worldState, pulse, DT);

    // --- Sensory Return ---
    const rawPackets = deriveSensoryReturn(worldState, previousWorldState, DT);
    const packets = applyWorldModePacketTransform(rawPackets, worldMode, tick, rng);

    // --- Reafference Comparison ---
    const reafference: ReafferenceComparisonState = deriveReafferenceComparison(pulse, packets, worldState, DT);

    // --- Body-World Closure ---
    const closureState = deriveBodyWorldClosureState({
      timestamp,
      actuationPulse: pulse,
      sensoryReturns: packets,
      worldMediumState: worldState,
      reafferenceComparisonState: reafference,
      ongoingness: 0.62,
      previousState: previousClosureState,
    });
    previousClosureState = closureState;

    // --- Trace (minimal) ---
    const priorViabilityFlow = previousViability?.flowContinuity ?? 0.5;
    const priorClosureStability = previousClosureState?.closureStability ?? 0.5;
    const trace = makeTraceState(timestamp, {
      traceStrength: clamp01(closureState.returnStrength * 0.6 + priorViabilityFlow * 0.3),
      recurrenceWeight: clamp01(priorViabilityFlow * 0.5),
      salienceResidue: clamp01(priorClosureStability * 0.4),
    });

    // --- Dynamic Viability ---
    const viability = deriveDynamicViabilityState({
      closure: closureState,
      world: worldState,
      bodySurface,
      pulse,
      returns: packets,
      reafference,
      trace,
      previousViability,
      dt: DT,
    });
    previousViability = viability;

    // --- Medium Profile ---
    const mediumProfile = deriveMediumProfileState({
      closure: closureState,
      reafference,
      world: worldState,
      bodySurface,
      pulse,
      returns: packets,
      viability,
      previousProfile: previousMediumProfile,
      dt: DT,
    });
    previousMediumProfile = mediumProfile;

    // --- Natural Feedback (optional) ---
    if (feedbackEnabled) {
      const feedbackAdjustment = deriveMinimalNaturalFeedback({
        viability,
        closure: closureState,
        world: worldState,
        bodySurface,
        trace,
        previousAdjustment: previousFeedbackAdjustment,
        dt: DT,
      });
      previousFeedbackAdjustment = feedbackAdjustment;
      const applied = applyMinimalNaturalFeedback({
        world: worldState,
        returns: packets,
        pulse,
        bodySurface,
        trace,
        adjustment: feedbackAdjustment,
        flags: { minimalNaturalFeedbackEnabled: true },
      });
      worldState = applied.world;
    } else {
      previousFeedbackAdjustment = createNeutralNaturalFeedbackAdjustment(timestamp);
    }

    // --- Local Excitability Field ---
    const localField = deriveLocalExcitabilityField({
      trace,
      returns: packets,
      closure: closureState,
      mediumProfile,
      viability,
      previousField: previousLocalField,
      dt: DT,
    });
    previousLocalField = localField;

    // --- Repeated Flow Paths ---
    const flowPathObs = deriveRepeatedFlowPaths({
      localField,
      previousLocalField,
      trace,
      mediumProfile,
      closure: closureState,
      reafference,
      viability,
      previousObservation: previousFlowPathObs,
      dt: DT,
    });
    previousFlowPathObs = flowPathObs;

    // --- Accumulate metrics ---
    flowContinuities.push(viability.flowContinuity);
    energyThroughputs.push(viability.energyThroughput);
    dissipationBalances.push(viability.dissipationBalance);
    resistanceBalances.push(viability.resistanceBalance);
    delayCoherences.push(viability.delayCoherence);
    boundaryExchanges.push(viability.boundaryExchange);
    saturationRisks.push(viability.saturationRisk);
    extinctionRisks.push(viability.extinctionRisk);
    feedbackDominanceRisks.push(
      feedbackEnabled
        ? (previousFeedbackAdjustment?.feedbackDominanceRisk ?? 0)
        : 0,
    );
    echoStrengths.push(mediumProfile.echo.echoStrength);
    returnDelays.push(reafference.returnDelay);
    transmissionRatios.push(mediumProfile.resistance.transmissionRatio);

    if (localField.highExcitabilityRegionCount > 0) {
      highExcitabilityRegionCount++;
    }

    repeatedFlowPathCandidateCount += flowPathObs.pathCandidateCount;
    stablePathCandidateCount += flowPathObs.stablePathCandidateCount;

    // Proto-network candidate proxy: observe if multiple stable paths cluster
    const hasProtoNetworkSignal =
      flowPathObs.stablePathCandidateCount >= PROTO_NETWORK_MIN_STABLE_PATHS &&
      flowPathObs.averageClosureCoupling >= PROTO_NETWORK_MIN_CLOSURE_COUPLING &&
      viability.flowContinuity >= PROTO_NETWORK_MIN_FLOW_CONTINUITY;
    if (hasProtoNetworkSignal) {
      protoNetworkCandidateCount++;
      closureCouplings.push(flowPathObs.averageClosureCoupling);
      const proxyConf = clamp01(
        flowPathObs.averageConfidence * 0.5 +
        viability.flowContinuity * 0.3 +
        closureState.closureStability * 0.2,
      );
      protoNetworkConfidences.push(proxyConf);
      if (proxyConf >= PROTO_NETWORK_STABLE_MIN_CONFIDENCE && flowPathObs.stablePathCandidateCount >= PROTO_NETWORK_STABLE_MIN_PATHS) {
        stableProtoNetworkCandidateCount++;
      }
      if (proxyConf >= PROTO_NETWORK_EMERGENCE_MIN_CONFIDENCE) {
        emergenceEventCount++;
      }
    }

    // Collapse / recovery tracking
    const isCollapsed = viability.flowContinuity < 0.10;
    if (isCollapsed && !wasCollapsed) {
      collapseEventCount++;
    }
    if (!isCollapsed && wasCollapsed) {
      recoveryEventCount++;
    }
    wasCollapsed = isCollapsed;

    // --- NaN / Infinity detection ---
    if (
      hasNanOrInfinity(viability) ||
      hasNanOrInfinity(mediumProfile) ||
      hasNanOrInfinity(closureState) ||
      hasNanOrInfinity(reafference) ||
      hasNanOrInfinity(worldState) ||
      hasNanOrInfinity(localField) ||
      hasNanOrInfinity(flowPathObs)
    ) {
      nanOrInfinityCount++;
    }

    // --- Semantic leak detection ---
    if (
      hasSemanticLeak(viability) ||
      hasSemanticLeak(mediumProfile) ||
      hasSemanticLeak(closureState) ||
      hasSemanticLeak(reafference) ||
      hasSemanticLeak(worldState) ||
      hasSemanticLeak(localField) ||
      hasSemanticLeak(flowPathObs) ||
      (pulse !== null && hasSemanticLeak(pulse))
    ) {
      semanticLeakCount++;
    }

    previousWorldState = worldState;
  }

  const durationMs = Date.now() - startMs;

  return {
    scenarioName,
    ticks,
    durationMs,
    averageFlowContinuity: average(flowContinuities),
    averageEnergyThroughput: average(energyThroughputs),
    averageDissipationBalance: average(dissipationBalances),
    averageResistanceBalance: average(resistanceBalances),
    averageDelayCoherence: average(delayCoherences),
    averageBoundaryExchange: average(boundaryExchanges),
    maxSaturationRisk: saturationRisks.length > 0 ? Math.max(...saturationRisks) : 0,
    maxExtinctionRisk: extinctionRisks.length > 0 ? Math.max(...extinctionRisks) : 0,
    maxFeedbackDominanceRisk: feedbackDominanceRisks.length > 0 ? Math.max(...feedbackDominanceRisks) : 0,
    averageEchoStrength: average(echoStrengths),
    averageReturnDelay: average(returnDelays),
    averageTransmissionRatio: average(transmissionRatios),
    highExcitabilityRegionCount,
    repeatedFlowPathCandidateCount,
    protoNetworkCandidateCount,
    stablePathCandidateCount,
    stableProtoNetworkCandidateCount,
    semanticLeakCount,
    nanOrInfinityCount,
    averageProtoNetworkConfidence: protoNetworkConfidences.length > 0 ? average(protoNetworkConfidences) : 0,
    maxProtoNetworkConfidence: protoNetworkConfidences.length > 0 ? Math.max(...protoNetworkConfidences) : 0,
    averageClosureCoupling: average(closureCouplings),
    emergenceEventCount,
    collapseEventCount,
    recoveryEventCount,
  };
}

// ─── Scenario Suite ───────────────────────────────────────────────────────────

export interface LongRunEmergenceScenarioResult {
  summary: LongRunEmergenceScenarioSummary;
}

export function runLongRunEmergenceScenarioSuite(): LongRunEmergenceScenarioResult[] {
  const BASE = BASE_TICKS;
  const results: LongRunEmergenceScenarioResult[] = [];

  const run = (name: string, ticks: number, config: LongRunEmergenceScenarioConfig): void => {
    const summary = runLongRunEmergenceScenario({ scenarioName: name, ticks, seed: 42, scenarioConfig: config });
    results.push({ summary });
  };

  // S8-A: quiet world
  run('S8-A-quiet-world', BASE, { worldMode: 'quiet', feedbackEnabled: false, perturbationLevel: 0.0, durationScale: 1.0 });

  // S8-B: weak repeated return
  run('S8-B-weak-repeated-return', BASE, { worldMode: 'weakRepeatedReturn', feedbackEnabled: false, perturbationLevel: 0.15, durationScale: 1.0 });

  // S8-C: delayed return
  run('S8-C-delayed-return', BASE, { worldMode: 'delayedReturn', feedbackEnabled: false, perturbationLevel: 0.20, durationScale: 1.0 });

  // S8-D: alternating world perturbation
  run('S8-D-alternating-perturbation', BASE, { worldMode: 'alternatingPerturbation', feedbackEnabled: false, perturbationLevel: 0.40, durationScale: 1.0 });

  // S8-E: stable medium
  run('S8-E-stable-medium', BASE, { worldMode: 'stableMedium', feedbackEnabled: true, perturbationLevel: 0.10, durationScale: 1.0 });

  // S8-F: unstable medium
  run('S8-F-unstable-medium', BASE, { worldMode: 'unstableMedium', feedbackEnabled: false, perturbationLevel: 0.65, durationScale: 1.0 });

  // S8-G: high resistance
  run('S8-G-high-resistance', BASE, { worldMode: 'highResistance', feedbackEnabled: false, perturbationLevel: 0.20, durationScale: 1.0 });

  // S8-H: low resistance
  run('S8-H-low-resistance', BASE, { worldMode: 'lowResistance', feedbackEnabled: false, perturbationLevel: 0.30, durationScale: 1.0 });

  // S8-I: slow echo
  run('S8-I-slow-echo', BASE, { worldMode: 'slowEcho', feedbackEnabled: false, perturbationLevel: 0.20, durationScale: 1.0 });

  // S8-J: fast echo
  run('S8-J-fast-echo', BASE, { worldMode: 'fastEcho', feedbackEnabled: false, perturbationLevel: 0.20, durationScale: 1.0 });

  // S8-K: no semantic leak full run
  run('S8-K-no-semantic-leak-full-run', BASE, { worldMode: 'stableMedium', feedbackEnabled: true, perturbationLevel: 0.15, durationScale: 1.0 });

  // S8-L: feedback ablation comparison (feedback off baseline)
  run('S8-L-feedback-ablation-off', BASE, { worldMode: 'stableMedium', feedbackEnabled: false, perturbationLevel: 0.15, durationScale: 1.0 });

  return results;
}

// ─── Summary Display ──────────────────────────────────────────────────────────

/**
 * Format a LongRunEmergenceScenarioSummary for observer / diagnostic display.
 *
 * Display policy:
 * - Do NOT display "生命が発生した" (life arose)
 * - Do NOT display "知性が生まれた" (intelligence emerged)
 * - Do NOT display "意識あり" (consciousness present)
 * - Display as "Long-Run Natural Emergence Summary" — research / diagnostic output
 */
export function formatLongRunEmergenceScenarioSummary(summary: LongRunEmergenceScenarioSummary): string {
  const lines: string[] = [
    `[Long-Run Natural Emergence Summary]`,
    `  scenario                       : ${summary.scenarioName}`,
    `  ticks                          : ${summary.ticks}`,
    `  durationMs                     : ${summary.durationMs}`,
    `  averageFlowContinuity          : ${summary.averageFlowContinuity.toFixed(4)}`,
    `  averageEnergyThroughput        : ${summary.averageEnergyThroughput.toFixed(4)}`,
    `  averageDissipationBalance      : ${summary.averageDissipationBalance.toFixed(4)}`,
    `  averageResistanceBalance       : ${summary.averageResistanceBalance.toFixed(4)}`,
    `  averageDelayCoherence          : ${summary.averageDelayCoherence.toFixed(4)}`,
    `  averageBoundaryExchange        : ${summary.averageBoundaryExchange.toFixed(4)}`,
    `  maxSaturationRisk              : ${summary.maxSaturationRisk.toFixed(4)}`,
    `  maxExtinctionRisk              : ${summary.maxExtinctionRisk.toFixed(4)}`,
    `  maxFeedbackDominanceRisk       : ${summary.maxFeedbackDominanceRisk.toFixed(4)}`,
    `  averageEchoStrength            : ${summary.averageEchoStrength.toFixed(4)}`,
    `  averageReturnDelay             : ${summary.averageReturnDelay.toFixed(4)}`,
    `  averageTransmissionRatio       : ${summary.averageTransmissionRatio.toFixed(4)}`,
    `  highExcitabilityRegionCount    : ${summary.highExcitabilityRegionCount}`,
    `  repeatedFlowPathCandidateCount : ${summary.repeatedFlowPathCandidateCount}`,
    `  protoNetworkCandidateCount     : ${summary.protoNetworkCandidateCount}`,
    `  stablePathCandidateCount       : ${summary.stablePathCandidateCount}`,
    `  stableProtoNetworkCandidateCount : ${summary.stableProtoNetworkCandidateCount}`,
    `  semanticLeakCount              : ${summary.semanticLeakCount}`,
    `  nanOrInfinityCount             : ${summary.nanOrInfinityCount}`,
  ];

  if (summary.emergenceEventCount !== undefined) {
    lines.push(`  emergenceEventCount            : ${summary.emergenceEventCount}`);
  }
  if (summary.collapseEventCount !== undefined) {
    lines.push(`  collapseEventCount             : ${summary.collapseEventCount}`);
  }
  if (summary.recoveryEventCount !== undefined) {
    lines.push(`  recoveryEventCount             : ${summary.recoveryEventCount}`);
  }
  if (summary.averageProtoNetworkConfidence !== undefined) {
    lines.push(`  averageProtoNetworkConfidence  : ${summary.averageProtoNetworkConfidence.toFixed(4)}`);
  }

  return lines.join('\n');
}
