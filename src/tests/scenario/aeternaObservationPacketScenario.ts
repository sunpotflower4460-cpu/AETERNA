/**
 * Aeterna Observation Packet Scenario
 *
 * AETERNA Phase 8: AETERNA → Node bridge 最小版
 *
 * Runs headless scenarios that exercise the observation packet exporter
 * and sanitizer. Verifies:
 * - Packets are generated correctly from field state
 * - No forbidden semantic fields appear
 * - All values are finite and in range
 * - Packet generation does not affect organism dynamics
 * - Proto-point candidates remain unlabeled in packet output
 */

import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario.ts';
import {
  exportAeternaObservationPacket,
  exportAeternaPatternCandidatePacket,
  type AeternaExportInput,
} from '../../bridge/exportAeternaObservationPacket.ts';
import {
  sanitizeAeternaObservationPacket,
  type SanitizeResult,
} from '../../bridge/sanitizeAeternaObservationPacket.ts';
import type { AeternaObservationPacket } from '../../types/aeternaObservationPacket.ts';

export interface PacketObservation {
  frame: number;
  packet: AeternaObservationPacket;
  sanitizeResult: SanitizeResult;
}

export interface AeternaPacketScenarioOutcome {
  name: string;
  result: ScenarioResult;
  packetObservations: PacketObservation[];
  summary: {
    packetGeneratedCount: number;
    semanticLeakTotal: number;
    nonFiniteFieldsTotal: number;
    allPacketsClean: boolean;
    /** Mean confidence across all packets. */
    avgConfidence: number;
    /** Fraction of frames where at least one proto-point candidate was present. */
    protoPointPresentFraction: number;
    /** Fraction of frames where fieldState values are all finite. */
    fieldStateFiniteFraction: number;
    /** Last packet fieldState summary (or null if no packets). */
    lastFieldState: AeternaObservationPacket['fieldState'] | null;
    /** Last packet patternCandidates summary (or null if no packets). */
    lastPatternCandidates: AeternaObservationPacket['patternCandidates'] | null;
  };
}

/** A single metrics snapshot entry from ScenarioResult.metrics. */
type MetricsSnapshotEntry = ScenarioResult['metrics'][number];

/**
 * Build an AeternaExportInput from a ScenarioResult metrics snapshot.
 * This simulates what the live organism loop would produce.
 */
function buildExportInput(
  frame: number,
  metrics: MetricsSnapshotEntry,
  result: ScenarioResult,
): AeternaExportInput {
  // Compute collapse and saturation rates from summary
  const totalFrames = result.summary.totalFrames;
  const collapseRate = result.summary.collapseRate ?? 0;
  const saturationRate = result.summary.saturationRate ?? 0;
  const quietBaselineFloor = result.summary.quietBaselineFloor ?? 0;

  return {
    timestamp: frame,
    meanActivity: metrics.meanActivity ?? 0,
    activityVariance: metrics.variance ?? 0,
    collapseRate,
    saturationRate,
    quietBaselineFloor,
    phaseCoherence: metrics.phaseCoherence ?? undefined,
    boundaryIntegrity: metrics.boundaryIntegrity ?? 1,
    collapseRisk: metrics.collapseRisk ?? 0,
    competitionStability: metrics.pc_competitionStability ?? undefined,
    traceState: metrics.traceStrength != null
      ? {
          timestamp: frame,
          traceStrength: metrics.traceStrength ?? 0,
          recurrenceWeight: metrics.recurrenceWeight ?? 0,
          salienceResidue: metrics.salienceResidue ?? 0,
          replayReadiness: metrics.replayReadiness ?? 0,
          replaySuppression: 0,
        }
      : null,
    recoveryState: metrics.recoveryPressure != null
      ? {
          timestamp: frame,
          recoveryPressure: metrics.recoveryPressure ?? 0,
          relaxationLevel: metrics.relaxationLevel ?? 0,
          stabilizationPull: metrics.stabilizationPull ?? 0,
          collapseRisk: metrics.collapseRisk ?? 0,
          restorationBias: metrics.restorationBias ?? 0.5,
        }
      : null,
    observationPatternState: metrics.obs_knotCount != null
      ? {
          timestamp: frame,
          knotCount: metrics.obs_knotCount ?? 0,
          pathCount: metrics.obs_pathCount ?? 0,
          recurrenceLocusCount: metrics.obs_recurrenceLocusCount ?? 0,
          basinCount: metrics.obs_basinCount ?? 0,
          longLivedAnomalyCount: metrics.obs_longLivedAnomalyCount ?? 0,
          protoPointCandidateCount: metrics.obs_protoPointCandidateCount ?? 0,
          observationConfidence: metrics.obs_observationConfidence ?? undefined,
        }
      : null,
    pressureCompetitionState: metrics.pc_safetyPressure != null
      ? {
          timestamp: frame,
          safetyPressure: metrics.pc_safetyPressure ?? 0,
          restorationPressure: metrics.pc_restorationPressure ?? 0,
          noveltyPressure: metrics.pc_noveltyPressure ?? 0,
          repetitionPressure: metrics.pc_repetitionPressure ?? 0,
          explorationPressure: metrics.pc_explorationPressure ?? 0,
          withdrawalPressure: metrics.pc_withdrawalPressure ?? 0,
          dominantPressure: metrics.pc_dominantPressure ?? null,
          competitionEntropy: metrics.pc_competitionEntropy ?? 0,
          competitionStability: metrics.pc_competitionStability ?? 0,
          annealingTemperature: metrics.pc_annealingTemperature ?? 0,
          pressureEnergy: metrics.pc_pressureEnergy ?? undefined,
        }
      : null,
    totalFrames,
  };
}

/**
 * Run a scenario and generate observation packets from the collected metrics.
 */
async function runPacketScenario(
  config: ScenarioConfig,
): Promise<AeternaPacketScenarioOutcome> {
  const result = await runScenario(config);

  const packetObservations: PacketObservation[] = [];
  let semanticLeakTotal = 0;
  let nonFiniteFieldsTotal = 0;
  let confidenceSum = 0;
  let protoPointPresentCount = 0;
  let fieldStateFiniteCount = 0;

  for (const snap of result.metrics) {
    const exportInput = buildExportInput(snap.frame, snap as never, result);
    const rawPacket = exportAeternaObservationPacket(exportInput);
    const sanitizeResult = sanitizeAeternaObservationPacket(rawPacket);

    semanticLeakTotal += sanitizeResult.semanticLeakCount;
    nonFiniteFieldsTotal += sanitizeResult.nonFiniteFieldsFixed.length;

    const packet = sanitizeResult.packet;
    confidenceSum += packet.confidence ?? 0;

    if (packet.patternCandidates.protoPointCandidateCount > 0) {
      protoPointPresentCount++;
    }

    // Check fieldState all-finite
    const fs = packet.fieldState;
    if (
      Number.isFinite(fs.ongoingness) &&
      Number.isFinite(fs.stability) &&
      Number.isFinite(fs.volatility) &&
      Number.isFinite(fs.boundaryIntegrity) &&
      Number.isFinite(fs.recoveryPressure) &&
      Number.isFinite(fs.collapseRisk)
    ) {
      fieldStateFiniteCount++;
    }

    packetObservations.push({ frame: snap.frame, packet, sanitizeResult });
  }

  const count = packetObservations.length;
  const lastObs = packetObservations[count - 1] ?? null;

  return {
    name: config.name,
    result,
    packetObservations,
    summary: {
      packetGeneratedCount: count,
      semanticLeakTotal,
      nonFiniteFieldsTotal,
      allPacketsClean: semanticLeakTotal === 0,
      avgConfidence: count > 0 ? confidenceSum / count : 0,
      protoPointPresentFraction: count > 0 ? protoPointPresentCount / count : 0,
      fieldStateFiniteFraction: count > 0 ? fieldStateFiniteCount / count : 0,
      lastFieldState: lastObs?.packet.fieldState ?? null,
      lastPatternCandidates: lastObs?.packet.patternCandidates ?? null,
    },
  };
}

/**
 * Run all Phase 8 packet scenarios.
 */
export async function runAeternaObservationPacketSuite(): Promise<AeternaPacketScenarioOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    {
      // Scenario 8A: baseline (no-input) packet generation
      // Verify packets are generated with finite values and no semantic leaks.
      name: 'scenario-8a-packet-baseline-no-input',
      totalFrames: 600,
      metricsInterval: 10,
      touchScript: [],
      collectMetrics: true,
    },
    {
      // Scenario 8B: repeated perturbation packet export
      // Verify packets reflect field activity changes without semantic content.
      name: 'scenario-8b-packet-repeated-perturbation',
      totalFrames: 800,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.72,
        selfPreservationBias: 0.62,
        boundaryIntegrity: 0.80,
      },
      touchScript: [
        { frame: 100, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 250, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 400, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 550, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
      ],
      collectMetrics: true,
    },
    {
      // Scenario 8C: high boundary stress
      // Verify packet stability fields reflect boundary degradation.
      name: 'scenario-8c-packet-boundary-stress',
      totalFrames: 600,
      metricsInterval: 10,
      touchScript: [
        { frame: 100, x: 0.5, y: 0.5, pressure: 1.4, duration: 80 },
      ],
      collectMetrics: true,
    },
    {
      // Scenario 8D: packet generation does not change organism dynamics
      // Compare organism collapse rate with and without packet generation.
      // Both should be equivalent (packet export is read-only).
      name: 'scenario-8d-packet-read-only-verification',
      totalFrames: 600,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.68,
        selfPreservationBias: 0.60,
        boundaryIntegrity: 0.78,
      },
      touchScript: [
        { frame: 200, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 400, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
      ],
      collectMetrics: true,
    },
  ];

  const outcomes: AeternaPacketScenarioOutcome[] = [];
  for (const config of scenarios) {
    outcomes.push(await runPacketScenario(config));
  }

  return outcomes;
}

// Re-export helpers for use in tests
export { exportAeternaObservationPacket, exportAeternaPatternCandidatePacket, sanitizeAeternaObservationPacket };
