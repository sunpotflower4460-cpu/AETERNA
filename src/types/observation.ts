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

export interface ObservationReport {
  title: string;
  mode: 'observation-only';
  layout: ObservationLayoutMode;
  status: ObservationStatus;
  snapshots: FieldSnapshot[];
  transferObservation?: TransferObservation;
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
