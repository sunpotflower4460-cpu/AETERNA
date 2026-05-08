import type {
  FieldSnapshot,
  ObservationStatus,
  ObservationTimelineFrame,
  ObservationTimelineSummary,
  TransferObservation,
} from '../types/observation.ts';

function findSnapshotTotal(snapshots: FieldSnapshot[], fieldName: string): number {
  return snapshots.find((snapshot) => snapshot.fieldName === fieldName)?.total ?? 0;
}

function normalizeFinite(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function mergeTimelineStatus(current: ObservationStatus, next: ObservationStatus): ObservationStatus {
  if (current === 'open' || next === 'open') return 'open';
  if (current === 'warning' || next === 'warning') return 'warning';
  if (current === 'insufficient' || next === 'insufficient') return 'insufficient';
  if (current === 'unknown') return next;
  return current;
}

export function createObservationTimelineFrame(input: {
  tick: number;
  snapshots: FieldSnapshot[];
  transferObservation?: TransferObservation;
}): ObservationTimelineFrame {
  const transferObservation = input.transferObservation;

  return {
    tick: input.tick,
    externalDriveTotal: findSnapshotTotal(input.snapshots, 'ExternalDriveField'),
    mediumStorageTotal: findSnapshotTotal(input.snapshots, 'SpatialWorldMedium'),
    dissipationTotal: findSnapshotTotal(input.snapshots, 'Dissipation'),
    residueTotal: findSnapshotTotal(input.snapshots, 'Residue'),
    outflowTotal: findSnapshotTotal(input.snapshots, 'Outflow'),
    membraneExchangeTotal: findSnapshotTotal(input.snapshots, 'MembraneExchange'),
    transferEnergy: normalizeFinite(transferObservation?.transferEnergy),
    pairResidual: normalizeFinite(transferObservation?.residual),
    pairLedgerStatus: transferObservation?.pairLedgerStatus ?? 'unknown',
    metricKind: 'derived',
  };
}

export function appendObservationTimelineFrame(
  frames: ObservationTimelineFrame[],
  frame: ObservationTimelineFrame,
  maxFrames?: number,
): ObservationTimelineFrame[] {
  const nextFrames = [...frames, frame];
  if (maxFrames && maxFrames > 0 && nextFrames.length > maxFrames) {
    return nextFrames.slice(nextFrames.length - maxFrames);
  }
  return nextFrames;
}

export function summarizeObservationTimeline(
  frames: ObservationTimelineFrame[],
): ObservationTimelineSummary {
  if (frames.length === 0) {
    return {
      frameCount: 0,
      firstTick: null,
      lastTick: null,
      totalTransferred: 0,
      maxPairResidual: 0,
      openFrameCount: 0,
      closedFrameCount: 0,
      warningFrameCount: 0,
      latestStatus: 'unknown',
      metricKind: 'derived',
    };
  }

  let totalTransferred = 0;
  let maxPairResidual = 0;
  let openFrameCount = 0;
  let closedFrameCount = 0;
  let warningFrameCount = 0;
  let latestStatus: ObservationStatus = 'unknown';

  for (const frame of frames) {
    totalTransferred += normalizeFinite(frame.transferEnergy);
    maxPairResidual = Math.max(maxPairResidual, Math.abs(normalizeFinite(frame.pairResidual)));

    if (frame.pairLedgerStatus === 'open') openFrameCount += 1;
    if (frame.pairLedgerStatus === 'closed') closedFrameCount += 1;
    if (frame.pairLedgerStatus === 'warning') warningFrameCount += 1;
    latestStatus = frame.pairLedgerStatus;
  }

  return {
    frameCount: frames.length,
    firstTick: frames[0].tick,
    lastTick: frames[frames.length - 1].tick,
    totalTransferred,
    maxPairResidual,
    openFrameCount,
    closedFrameCount,
    warningFrameCount,
    latestStatus: frames.reduce(
      (status, frame) => mergeTimelineStatus(status, frame.pairLedgerStatus),
      latestStatus,
    ),
    metricKind: 'derived',
  };
}

export function formatObservationTimelineSummaryLine(summary: ObservationTimelineSummary): string {
  return [
    `frames=${summary.frameCount}`,
    `ticks=${summary.firstTick ?? 'none'}..${summary.lastTick ?? 'none'}`,
    `totalTransferred=${summary.totalTransferred.toFixed(6)}`,
    `maxPairResidual=${summary.maxPairResidual.toFixed(6)}`,
    `closed=${summary.closedFrameCount}`,
    `open=${summary.openFrameCount}`,
    `status=${summary.latestStatus}`,
  ].join(' ');
}
