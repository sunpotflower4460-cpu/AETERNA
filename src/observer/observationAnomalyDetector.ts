import type {
  FlowAttributionReport,
  ObservationAnomaly,
  ObservationAnomalyKind,
  ObservationAnomalyReport,
  ObservationAnomalySeverity,
  ObservationTimelineFrame,
  TransferObservation,
} from '../types/observation.ts';

const DEFAULT_RESIDUAL_TOLERANCE = 1e-6;
const EPSILON = 1e-9;

function finite(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function severityRank(severity: ObservationAnomalySeverity | 'none'): number {
  if (severity === 'critical') return 3;
  if (severity === 'warning') return 2;
  if (severity === 'info') return 1;
  return 0;
}

function makeAnomaly(input: {
  id: string;
  tick?: number | null;
  severity: ObservationAnomalySeverity;
  kind: ObservationAnomalyKind;
  message: string;
  suspectedCause: string;
  relatedFields?: string[];
}): ObservationAnomaly {
  return {
    id: input.id,
    tick: input.tick ?? null,
    severity: input.severity,
    kind: input.kind,
    message: input.message,
    suspectedCause: input.suspectedCause,
    relatedFields: input.relatedFields ?? [],
    metricKind: 'derived',
  };
}

function addUnique(anomalies: ObservationAnomaly[], anomaly: ObservationAnomaly): void {
  if (!anomalies.some((existing) => existing.id === anomaly.id)) {
    anomalies.push(anomaly);
  }
}

function detectNegativeTotals(anomalies: ObservationAnomaly[], frames: ObservationTimelineFrame[]): void {
  const fieldEntries: Array<[keyof ObservationTimelineFrame, string]> = [
    ['externalDriveTotal', 'ExternalDriveField'],
    ['mediumStorageTotal', 'SpatialWorldMedium'],
    ['dissipationTotal', 'Dissipation'],
    ['residueTotal', 'Residue'],
    ['outflowTotal', 'Outflow'],
    ['membraneExchangeTotal', 'MembraneExchange'],
  ];

  for (const frame of frames) {
    for (const [key, fieldName] of fieldEntries) {
      const value = frame[key];
      if (typeof value === 'number' && value < -EPSILON) {
        addUnique(anomalies, makeAnomaly({
          id: `negative-total:${frame.tick}:${fieldName}`,
          tick: frame.tick,
          severity: 'critical',
          kind: 'negativeTotal',
          message: `${fieldName} total is negative at tick ${frame.tick}.`,
          suspectedCause: 'A measured storage-like field became negative, which should not happen in conservative observation accounting.',
          relatedFields: [fieldName],
        }));
      }
    }
  }
}

function detectTransferAnomalies(
  anomalies: ObservationAnomaly[],
  transferObservation: TransferObservation | undefined,
  residualTolerance: number,
): void {
  if (!transferObservation) return;

  if (transferObservation.pairLedgerStatus === 'open') {
    addUnique(anomalies, makeAnomaly({
      id: 'pair-ledger-open:transfer-observation',
      tick: null,
      severity: 'warning',
      kind: 'pairLedgerOpen',
      message: 'Transfer pair ledger is open.',
      suspectedCause: 'Source out energy and destination input energy did not close within the transfer pair ledger.',
      relatedFields: [transferObservation.sourceName, transferObservation.destinationName],
    }));
  }

  if (Math.abs(finite(transferObservation.residual)) > residualTolerance) {
    addUnique(anomalies, makeAnomaly({
      id: 'pair-residual-too-high:transfer-observation',
      tick: null,
      severity: 'critical',
      kind: 'pairResidualTooHigh',
      message: `Transfer pair residual exceeded tolerance: ${transferObservation.residual}.`,
      suspectedCause: 'The transfer pair ledger reported a residual larger than the configured observation tolerance.',
      relatedFields: [transferObservation.sourceName, transferObservation.destinationName],
    }));
  }

  const sourceDestinationMismatch = Math.abs(
    finite(transferObservation.sourceOutEnergy) - finite(transferObservation.destinationInputEnergy),
  );
  if (sourceDestinationMismatch > residualTolerance) {
    addUnique(anomalies, makeAnomaly({
      id: 'destination-input-mismatch:transfer-observation',
      tick: null,
      severity: 'critical',
      kind: 'destinationInputMismatch',
      message: 'Transfer source out and destination input differ.',
      suspectedCause: 'The same transfer amount may not have been applied atomically on both sides.',
      relatedFields: [transferObservation.sourceName, transferObservation.destinationName],
    }));
  }

  if (
    Math.abs(finite(transferObservation.transferEnergy)) <= EPSILON &&
    (Math.abs(finite(transferObservation.sourceOutEnergy)) > residualTolerance ||
      Math.abs(finite(transferObservation.destinationInputEnergy)) > residualTolerance)
  ) {
    addUnique(anomalies, makeAnomaly({
      id: 'zero-transfer-moved:transfer-observation',
      tick: null,
      severity: 'critical',
      kind: 'zeroTransferMoved',
      message: 'Transfer energy is zero but source or destination movement was reported.',
      suspectedCause: 'A zero-transfer step appears to have changed source or destination accounting.',
      relatedFields: [transferObservation.sourceName, transferObservation.destinationName],
    }));
  }

  for (const [index, warning] of transferObservation.warnings.entries()) {
    addUnique(anomalies, makeAnomaly({
      id: `upstream-warning:transfer:${index}`,
      tick: null,
      severity: 'warning',
      kind: 'upstreamWarning',
      message: warning,
      suspectedCause: 'Transfer observation emitted an upstream warning.',
      relatedFields: [transferObservation.sourceName, transferObservation.destinationName],
    }));
  }
}

function detectFlowAttributionAnomalies(
  anomalies: ObservationAnomaly[],
  flowAttribution: FlowAttributionReport | undefined,
): void {
  if (!flowAttribution) return;

  for (const [index, item] of flowAttribution.items.entries()) {
    if (item.kind === 'unknownChange') {
      addUnique(anomalies, makeAnomaly({
        id: `unknown-change:${item.tick}:${item.fieldName}:${index}`,
        tick: item.tick,
        severity: 'warning',
        kind: 'unknownChange',
        message: `${item.fieldName} had an unexplained ${item.direction} of ${item.amount}.`,
        suspectedCause: item.reason,
        relatedFields: [item.fieldName],
      }));
    }
  }

  for (const [index, warning] of flowAttribution.warnings.entries()) {
    addUnique(anomalies, makeAnomaly({
      id: `upstream-warning:flow-attribution:${index}`,
      tick: flowAttribution.tick,
      severity: 'warning',
      kind: 'upstreamWarning',
      message: warning,
      suspectedCause: 'Flow attribution emitted an upstream warning.',
      relatedFields: [],
    }));
  }
}

function detectTimelineAnomalies(
  anomalies: ObservationAnomaly[],
  frames: ObservationTimelineFrame[] | undefined,
  residualTolerance: number,
): void {
  if (!frames || frames.length === 0) {
    addUnique(anomalies, makeAnomaly({
      id: 'missing-timeline:no-frames',
      tick: null,
      severity: 'info',
      kind: 'missingTimeline',
      message: 'No observation timeline frames are attached.',
      suspectedCause: 'Timeline observation has not started or no frames have been passed to the detector.',
      relatedFields: [],
    }));
    return;
  }

  detectNegativeTotals(anomalies, frames);

  for (const frame of frames) {
    if (frame.pairLedgerStatus === 'open') {
      addUnique(anomalies, makeAnomaly({
        id: `pair-ledger-open:frame:${frame.tick}`,
        tick: frame.tick,
        severity: 'warning',
        kind: 'pairLedgerOpen',
        message: `Pair ledger is open at tick ${frame.tick}.`,
        suspectedCause: 'Timeline frame recorded an open transfer pair ledger.',
        relatedFields: ['ExternalDriveField', 'SpatialWorldMedium'],
      }));
    }

    if (Math.abs(finite(frame.pairResidual)) > residualTolerance) {
      addUnique(anomalies, makeAnomaly({
        id: `pair-residual-too-high:frame:${frame.tick}`,
        tick: frame.tick,
        severity: 'critical',
        kind: 'pairResidualTooHigh',
        message: `Pair residual exceeded tolerance at tick ${frame.tick}.`,
        suspectedCause: 'Timeline frame residual is larger than the configured observation tolerance.',
        relatedFields: ['ExternalDriveField', 'SpatialWorldMedium'],
      }));
    }
  }
}

export function deriveObservationAnomalyReport(input: {
  transferObservation?: TransferObservation;
  timelineFrames?: ObservationTimelineFrame[];
  flowAttribution?: FlowAttributionReport;
  residualTolerance?: number;
}): ObservationAnomalyReport {
  const residualTolerance = Math.max(DEFAULT_RESIDUAL_TOLERANCE, Math.abs(input.residualTolerance ?? DEFAULT_RESIDUAL_TOLERANCE));
  const anomalies: ObservationAnomaly[] = [];

  detectTimelineAnomalies(anomalies, input.timelineFrames, residualTolerance);
  detectTransferAnomalies(anomalies, input.transferObservation, residualTolerance);
  detectFlowAttributionAnomalies(anomalies, input.flowAttribution);

  const infoCount = anomalies.filter((anomaly) => anomaly.severity === 'info').length;
  const warningCount = anomalies.filter((anomaly) => anomaly.severity === 'warning').length;
  const criticalCount = anomalies.filter((anomaly) => anomaly.severity === 'critical').length;
  const maxSeverity = anomalies.reduce<ObservationAnomalySeverity | 'none'>((current, anomaly) => (
    severityRank(anomaly.severity) > severityRank(current) ? anomaly.severity : current
  ), 'none');

  return {
    anomalies,
    infoCount,
    warningCount,
    criticalCount,
    maxSeverity,
    summaryLine: anomalies.length === 0
      ? 'No observation anomalies detected.'
      : `anomalies=${anomalies.length} info=${infoCount} warning=${warningCount} critical=${criticalCount}`,
    metricKind: 'derived',
  };
}
