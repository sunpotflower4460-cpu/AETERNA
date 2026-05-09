export type ObservationMetricKind =
  | 'measured'
  | 'derived'
  | 'ledger'
  | 'proxy'
  | 'visual'
  | 'unknown';

export type ObservationLayoutMode = 'mobile' | 'tablet' | 'desktop';

export type ObservationStatus = 'closed' | 'open' | 'warning' | 'insufficient' | 'unknown';

export interface ObservationViewport {
  width: number;
  height?: number;
}

export interface FieldSnapshot {
  fieldName: string;
  total: number;
  min: number;
  max: number;
  mean: number;
  nonZeroCount: number;
  cellCount: number;
  peakCellIndex: number | null;
  distributionSpread: number;
  metricKind: 'measured';
}

export interface TransferObservation {
  sourceName: 'ExternalDriveField';
  destinationName: 'SpatialWorldMedium';
  sourceOutEnergy: number;
  destinationInputEnergy: number;
  transferEnergy: number;
  residual: number;
  signedResidual: number;
  pairLedgerStatus: ObservationStatus;
  matched: boolean;
  mapping: 'same-index';
  metricKind: 'ledger';
  summaryLine: string;
  warnings: string[];
}

export interface ObservationTimelineFrame {
  tick: number;
  externalDriveTotal: number;
  mediumStorageTotal: number;
  dissipationTotal: number;
  residueTotal: number;
  outflowTotal: number;
  membraneExchangeTotal: number;
  transferEnergy: number;
  pairResidual: number;
  pairLedgerStatus: ObservationStatus;
  metricKind: 'derived';
}

export interface ObservationTimelineSummary {
  frameCount: number;
  firstTick: number | null;
  lastTick: number | null;
  totalTransferred: number;
  maxPairResidual: number;
  openFrameCount: number;
  closedFrameCount: number;
  warningFrameCount: number;
  latestStatus: ObservationStatus;
  metricKind: 'derived';
}

export type FlowAttributionKind =
  | 'transfer'
  | 'dissipation'
  | 'residue'
  | 'outflow'
  | 'boundaryExchange'
  | 'storageCarry'
  | 'unknownChange';

export interface FlowAttributionItem {
  tick: number;
  fieldName: string;
  kind: FlowAttributionKind;
  direction: 'increase' | 'decrease' | 'unchanged';
  amount: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  metricKind: 'derived';
}

export interface FlowAttributionReport {
  tick: number;
  items: FlowAttributionItem[];
  unknownChangeCount: number;
  summaryLine: string;
  warnings: string[];
  metricKind: 'derived';
}

export type ObservationAnomalySeverity = 'info' | 'warning' | 'critical';

export type ObservationAnomalyKind =
  | 'pairLedgerOpen'
  | 'pairResidualTooHigh'
  | 'unknownChange'
  | 'zeroTransferMoved'
  | 'destinationInputMismatch'
  | 'negativeTotal'
  | 'missingTimeline'
  | 'upstreamWarning';

export interface ObservationAnomaly {
  id: string;
  tick: number | null;
  severity: ObservationAnomalySeverity;
  kind: ObservationAnomalyKind;
  message: string;
  suspectedCause: string;
  relatedFields: string[];
  metricKind: 'derived';
}

export interface ObservationAnomalyReport {
  anomalies: ObservationAnomaly[];
  infoCount: number;
  warningCount: number;
  criticalCount: number;
  maxSeverity: ObservationAnomalySeverity | 'none';
  summaryLine: string;
  metricKind: 'derived';
}

export type ObservationExportFormat = 'json' | 'csv' | 'summaryText';

export interface ObservationExportResult {
  format: ObservationExportFormat;
  filename: string;
  mimeType: string;
  content: string;
  warningCount: number;
  metricKind: 'derived';
}

export interface ObservationReport {
  title: string;
  mode: 'observation-only';
  layout: ObservationLayoutMode;
  status: ObservationStatus;
  snapshots: FieldSnapshot[];
  transferObservation?: TransferObservation;
  timelineFrames?: ObservationTimelineFrame[];
  timelineSummary?: ObservationTimelineSummary;
  flowAttribution?: FlowAttributionReport;
  anomalyReport?: ObservationAnomalyReport;
  warnings: string[];
  notes: string[];
}

export interface ObservationShellSection {
  id: string;
  title: string;
  priority: number;
  mobileTab: 'current' | 'flow' | 'ledger' | 'history' | 'audit';
  desktopRegion: 'summary' | 'snapshot' | 'ledger' | 'timeline' | 'attribution' | 'audit' | 'raw';
}

export interface ObservationShellRenderResult {
  layout: ObservationLayoutMode;
  html: string;
  sections: ObservationShellSection[];
  warnings: string[];
}
