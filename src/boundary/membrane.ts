import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { MembraneCell, MembraneState } from '../types/membraneState.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';
import type { MembraneConfig } from '../config/membraneConfig.ts';

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function wrappedDistance(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 1 - raw);
}

function normalizeSegments(segments: number): number {
  const safeSegments = Math.floor(Number.isFinite(segments) ? segments : 1);
  return Math.max(1, safeSegments);
}

function toRegionId(u: number, v: number): string {
  return `u${u}-v${v}`;
}

function makeCell(index: number, segments: number, permeability: number, tension: number): MembraneCell {
  const u = Math.floor(index / segments);
  const v = index % segments;
  const localResistance = clamp01((1 - permeability) * 0.55 + tension * 0.45);
  const localAttenuation = clamp01(localResistance * 0.7 + tension * 0.3);

  return {
    regionId: toRegionId(u, v),
    index,
    permeability,
    tension,
    deformation: 0,
    recovery: 1,
    actuationImprint: 0,
    returnImprint: 0,
    twoSidedness: 0,
    localResistance,
    localAttenuation,
    confidence: 1,
  };
}

function computeStats(timestamp: number, segments: number, cells: MembraneCell[], nanOrInfinityCount: number): MembraneState {
  const permeabilities = cells.map((cell) => cell.permeability);
  const tensions = cells.map((cell) => cell.tension);
  const deformations = cells.map((cell) => cell.deformation);
  const recoveries = cells.map((cell) => cell.recovery);
  const actuationImprints = cells.map((cell) => cell.actuationImprint);
  const returnImprints = cells.map((cell) => cell.returnImprint);
  const twoSidednessValues = cells.map((cell) => cell.twoSidedness);
  const confidences = cells.map((cell) => cell.confidence);

  const averagePermeability = average(permeabilities);
  const averageTension = average(tensions);
  const averageDeformation = average(deformations);
  const averageRecovery = average(recoveries);
  const averageActuationImprint = average(actuationImprints);
  const averageReturnImprint = average(returnImprints);
  const averageTwoSidedness = average(twoSidednessValues);
  const membraneConfidence = average(confidences);
  const maxDeformation = deformations.length > 0 ? Math.max(...deformations) : 0;
  const deformationVariance = average(
    deformations.map((value) => {
      const delta = value - averageDeformation;
      return delta * delta;
    }),
  );
  const deformationPenalty = clamp01(averageDeformation + maxDeformation * 0.35 + deformationVariance * 2);
  const tensionPenalty = clamp01(Math.abs(averageTension - 0.5) * 1.2);
  const permeabilityPenalty = clamp01(Math.abs(averagePermeability - 0.5) * 1.2);
  const finitePenalty = clamp01(nanOrInfinityCount / Math.max(1, cells.length));
  const membraneIntegrity = clamp01(
    1 - deformationPenalty * 0.45 - tensionPenalty * 0.2 - permeabilityPenalty * 0.2 - finitePenalty * 0.15,
  );

  return {
    timestamp,
    segments,
    cells,
    averagePermeability,
    averageTension,
    averageDeformation,
    averageRecovery,
    averageActuationImprint,
    averageReturnImprint,
    averageTwoSidedness,
    maxDeformation,
    deformationVariance,
    membraneIntegrity,
    membraneConfidence,
    nanOrInfinityCount,
  };
}

function centerFromActuation(actuationPulse: ActuationPulse): { u: number; v: number } {
  return actuationPulse.channel === 'visual'
    ? { u: 0.25, v: 0.35 }
    : { u: 0.72, v: 0.62 };
}

function centerFromReturn(packet: SensoryReturnPacket): { u: number; v: number } {
  switch (packet.channel) {
    case 'simulatedLight':
      return { u: 0.25, v: 0.35 };
    case 'simulatedEcho':
      return { u: 0.34, v: 0.42 };
    case 'simulatedPressure':
      return { u: 0.72, v: 0.62 };
    case 'simulatedMotion':
      return { u: 0.62, v: 0.54 };
    case 'simulatedNoise':
    default:
      return { u: 0.56, v: 0.2 };
  }
}

function footprintWeight(
  index: number,
  segments: number,
  center: { u: number; v: number },
  locality: number,
): number {
  const u = Math.floor(index / segments) / segments;
  const v = (index % segments) / segments;
  const du = wrappedDistance(u, center.u);
  const dv = wrappedDistance(v, center.v);
  const distance = Math.sqrt(du * du + dv * dv);
  const spread = 0.12 + (1 - clamp01(locality)) * 0.24;
  return clamp01(1 - distance / Math.max(spread, 1e-6));
}

function sanitizeCell(cell: MembraneCell, config: MembraneConfig): { cell: MembraneCell; invalidCount: number } {
  let invalidCount = 0;
  const rawValues = [
    cell.permeability,
    cell.tension,
    cell.deformation,
    cell.recovery,
    cell.actuationImprint,
    cell.returnImprint,
    cell.twoSidedness,
    cell.localResistance,
    cell.localAttenuation,
    cell.confidence,
  ];
  invalidCount += rawValues.filter((value) => !Number.isFinite(value)).length;

  const permeability = clamp(cell.permeability, config.permeabilityMin, config.permeabilityMax);
  const tension = clamp(cell.tension, config.tensionMin, config.tensionMax);
  const deformation = clamp(cell.deformation, 0, config.deformationClamp);
  const actuationImprint = clamp01(cell.actuationImprint);
  const returnImprint = clamp01(cell.returnImprint);
  const overlap = Math.min(actuationImprint, returnImprint);
  const combinedImprint = actuationImprint + returnImprint;
  const twoSidedness = clamp01((2 * overlap) / Math.max(1e-6, combinedImprint));
  const recovery = clamp01(1 - deformation / Math.max(config.deformationClamp, 1e-6));
  const localResistance = clamp01((1 - permeability) * 0.55 + tension * 0.45 + deformation * 0.1);
  const localAttenuation = clamp01(localResistance * 0.6 + deformation * 0.25 + overlap * 0.15);
  const confidence = clamp01(1 - invalidCount * 0.2 - deformation * 0.08);

  return {
    invalidCount,
    cell: {
      ...cell,
      permeability,
      tension,
      deformation,
      recovery,
      actuationImprint,
      returnImprint,
      twoSidedness,
      localResistance,
      localAttenuation,
      confidence,
    },
  };
}

export function createMembraneState(params: {
  segments: number;
  timestamp: number;
  initialPermeability?: number;
  initialTension?: number;
}): MembraneState {
  const segments = normalizeSegments(params.segments);
  const permeability = clamp01(params.initialPermeability ?? 0.5);
  const tension = clamp01(params.initialTension ?? 0.5);
  const cells = Array.from({ length: segments * segments }, (_, index) =>
    makeCell(index, segments, permeability, tension),
  );

  return computeStats(params.timestamp, segments, cells, 0);
}

export function updateMembraneState(params: {
  previous: MembraneState;
  actuationPulse?: ActuationPulse | null;
  sensoryReturns?: SensoryReturnPacket[];
  bodySurface?: BodySurfaceState | null;
  worldMedium?: WorldMediumState | null;
  config: MembraneConfig;
  timestamp: number;
  dt: number;
}): MembraneState {
  const {
    previous,
    actuationPulse = null,
    sensoryReturns = [],
    bodySurface = null,
    worldMedium = null,
    config,
    timestamp,
    dt,
  } = params;

  if (!config.enabled) {
    return computeStats(timestamp, previous.segments, previous.cells.map((cell) => ({ ...cell })), previous.nanOrInfinityCount);
  }

  const decay = clamp01(1 - clamp01(config.recoveryRate) * Math.max(0, dt));
  const weakModeGain = config.mode === 'weakCoupling' ? 1 : 0.5;
  const bodyPermeabilityBias = clamp01(bodySurface?.permeability ?? previous.averagePermeability);
  const bodyTensionBias = clamp01(bodySurface?.surfaceTension ?? bodySurface?.boundaryIntegrity ?? previous.averageTension);
  const worldResistanceBias = clamp01(worldMedium?.surfaceResistance ?? previous.averageTension);
  const worldEchoBias = clamp01(worldMedium?.echoLevel ?? previous.averagePermeability);

  let invalidCount = 0;
  const nextCells = previous.cells.map((cell) => {
    const nextCell: MembraneCell = {
      ...cell,
      deformation: cell.deformation * decay,
      actuationImprint: cell.actuationImprint * decay,
      returnImprint: cell.returnImprint * decay,
    };

    const repeatedImprint = clamp01((nextCell.actuationImprint + nextCell.returnImprint) * 0.5);
    nextCell.tension = clamp(
      cell.tension * 0.98 + nextCell.deformation * 0.04 + bodyTensionBias * 0.01 + worldResistanceBias * 0.01 * weakModeGain,
      config.tensionMin,
      config.tensionMax,
    );
    nextCell.permeability = clamp(
      cell.permeability * 0.98 + repeatedImprint * 0.015 * weakModeGain + (worldEchoBias - worldResistanceBias) * 0.01 + (bodyPermeabilityBias - 0.5) * 0.01,
      config.permeabilityMin,
      config.permeabilityMax,
    );

    return nextCell;
  });

  if (actuationPulse) {
    const center = centerFromActuation(actuationPulse);
    const amplitude = clamp01(actuationPulse.intensity) * clamp01(config.actuationInfluence)
      * (0.55 + clamp01(actuationPulse.coherence) * 0.25 + clamp01(actuationPulse.boundaryLinked) * 0.2);

    for (const cell of nextCells) {
      const weight = footprintWeight(cell.index, previous.segments, center, actuationPulse.locality ?? 0.5);
      if (weight <= 0) continue;
      const imprintDelta = clamp01(amplitude * weight);
      cell.actuationImprint = clamp01(cell.actuationImprint + imprintDelta);
      cell.deformation = clamp(
        cell.deformation + imprintDelta * (0.7 + clamp01(actuationPulse.locality) * 0.15 + clamp01(actuationPulse.boundaryLinked) * 0.15),
        0,
        config.deformationClamp,
      );
      cell.tension = clamp(cell.tension + imprintDelta * 0.04 * weakModeGain, config.tensionMin, config.tensionMax);
    }
  }

  for (const packet of sensoryReturns) {
    const center = centerFromReturn(packet);
    const amplitude = clamp01(packet.intensity) * clamp01(config.returnInfluence)
      * (0.55 + clamp01(packet.worldOriginStrength) * 0.25 + clamp01(packet.returnDelayHint) * 0.2);

    for (const cell of nextCells) {
      const weight = footprintWeight(cell.index, previous.segments, center, packet.locality ?? 0.5);
      if (weight <= 0) continue;
      const imprintDelta = clamp01(amplitude * weight);
      cell.returnImprint = clamp01(cell.returnImprint + imprintDelta);
      cell.deformation = clamp(cell.deformation + imprintDelta * 0.75, 0, config.deformationClamp);
      cell.permeability = clamp(cell.permeability + imprintDelta * 0.03 * weakModeGain, config.permeabilityMin, config.permeabilityMax);
    }
  }

  const sanitizedCells = nextCells.map((cell) => {
    const sanitized = sanitizeCell(cell, config);
    invalidCount += sanitized.invalidCount;
    return sanitized.cell;
  });

  return computeStats(timestamp, previous.segments, sanitizedCells, invalidCount);
}
