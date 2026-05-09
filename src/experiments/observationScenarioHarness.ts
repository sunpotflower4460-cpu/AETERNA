import { deriveFlowAttribution } from '../observer/flowAttribution.ts';
import { deriveObservationAnomalyReport } from '../observer/observationAnomalyDetector.ts';
import {
  appendObservationTimelineFrame,
  createObservationTimelineFrame,
  summarizeObservationTimeline,
} from '../observer/observationTimeline.ts';
import {
  exportObservationReportAsCsv,
  exportObservationReportAsJson,
  exportObservationReportAsSummaryText,
} from '../observer/exportObservationReport.ts';
import { observeFieldSnapshots } from '../observer/fieldSnapshotObserver.ts';
import { observeTransferReport } from '../observer/transferObservation.ts';
import type { ExternalDriveToMediumTransferConfig } from '../types/externalDriveToMediumTransfer.ts';
import type {
  ObservationExportResult,
  ObservationReport,
  ObservationTimelineFrame,
} from '../types/observation.ts';
import type { SpatialWorldMediumState } from '../types/spatialWorldMedium.ts';
import {
  createExternalDriveField,
  updateSteadyExternalDrive,
} from '../world/externalDriveField.ts';
import { updateExternalDriveToMediumTransferPositive } from '../world/externalDriveToMediumTransfer.ts';
import { createSpatialWorldMedium } from '../world/spatialWorldMedium.ts';

export interface ObservationScenarioHarnessConfig {
  width?: number;
  height?: number;
  steadyDrivePerCell?: number;
  transferCoefficient?: number;
  dt?: number;
  tolerance?: number;
}

export interface ObservationScenarioHarnessResult {
  report: ObservationReport;
  frames: ObservationTimelineFrame[];
  exports: {
    json: ObservationExportResult;
    csv: ObservationExportResult;
    summaryText: ObservationExportResult;
  };
}

function snapshotFields(input: {
  externalDriveField: ArrayLike<number>;
  spatialWorldMedium: SpatialWorldMediumState;
}) {
  return observeFieldSnapshots([
    { fieldName: 'ExternalDriveField', field: input.externalDriveField },
    { fieldName: 'SpatialWorldMedium', field: input.spatialWorldMedium.mediumStorageField },
    { fieldName: 'Dissipation', field: input.spatialWorldMedium.mediumDissipationField },
    { fieldName: 'Residue', field: input.spatialWorldMedium.mediumResidueField },
    { fieldName: 'Outflow', field: input.spatialWorldMedium.mediumOutflowField },
    { fieldName: 'MembraneExchange', field: input.spatialWorldMedium.membraneExchangeField },
  ]);
}

export function runObservationScenarioHarness(
  configInput: ObservationScenarioHarnessConfig = {},
): ObservationScenarioHarnessResult {
  const width = Math.max(1, Math.floor(configInput.width ?? 2));
  const height = Math.max(1, Math.floor(configInput.height ?? 2));
  const dt = Number.isFinite(configInput.dt) ? Math.max(0, configInput.dt ?? 1) : 1;
  const tolerance = Number.isFinite(configInput.tolerance)
    ? Math.max(1e-12, configInput.tolerance ?? 1e-9)
    : 1e-9;
  const steadyDrivePerCell = Number.isFinite(configInput.steadyDrivePerCell)
    ? Math.max(0, configInput.steadyDrivePerCell ?? 1)
    : 1;
  const transferCoefficient = Number.isFinite(configInput.transferCoefficient)
    ? Math.max(0, configInput.transferCoefficient ?? 0.25)
    : 0.25;

  const base = { width, height, boundaryMode: 'torus' as const };
  const externalDriveInitial = createExternalDriveField(base);
  const steadyDrive = updateSteadyExternalDrive(externalDriveInitial, {
    ...base,
    steadyDrivePerCell,
    dt,
    tolerance,
  });

  const mediumInitial = createSpatialWorldMedium(base);
  const baselineSnapshots = snapshotFields({
    externalDriveField: steadyDrive.state.driveField,
    spatialWorldMedium: mediumInitial,
  });
  const baselineFrame = createObservationTimelineFrame({
    tick: steadyDrive.state.tick,
    snapshots: baselineSnapshots,
  });

  const transferConfig: ExternalDriveToMediumTransferConfig = {
    ...base,
    cellMapping: 'same-index',
    transferCoefficient,
    dt,
    tolerance,
  };
  const transfer = updateExternalDriveToMediumTransferPositive(
    steadyDrive.state,
    mediumInitial,
    transferConfig,
  );
  const transferObservation = observeTransferReport(transfer.report);
  const finalSnapshots = snapshotFields({
    externalDriveField: transfer.externalDriveState.driveField,
    spatialWorldMedium: transfer.spatialWorldMediumState,
  });
  const transferFrame = createObservationTimelineFrame({
    tick: transfer.report.tick,
    snapshots: finalSnapshots,
    transferObservation,
  });
  const frames = appendObservationTimelineFrame([baselineFrame], transferFrame);
  const timelineSummary = summarizeObservationTimeline(frames);
  const flowAttribution = deriveFlowAttribution(baselineFrame, transferFrame);
  const anomalyReport = deriveObservationAnomalyReport({
    transferObservation,
    timelineFrames: frames,
    flowAttribution,
    residualTolerance: tolerance,
  });

  const warnings = [
    ...steadyDrive.report.warnings,
    ...transfer.report.warnings,
    ...transferObservation.warnings,
    ...flowAttribution.warnings,
  ];

  const report: ObservationReport = {
    title: 'AETERNA Observation Scenario Harness',
    mode: 'observation-only',
    layout: 'desktop',
    status: anomalyReport.criticalCount > 0
      ? 'open'
      : anomalyReport.warningCount > 0
        ? 'warning'
        : transferObservation.pairLedgerStatus,
    snapshots: finalSnapshots,
    transferObservation,
    timelineFrames: frames,
    timelineSummary,
    flowAttribution,
    anomalyReport,
    warnings,
    notes: [
      'Observation scenario harness is read-only after each modeled step.',
      'This scenario does not couple into AETERNA internals.',
      'This scenario does not run SpatialWorldMedium update behavior.',
    ],
  };

  return {
    report,
    frames,
    exports: {
      json: exportObservationReportAsJson(report),
      csv: exportObservationReportAsCsv(report),
      summaryText: exportObservationReportAsSummaryText(report),
    },
  };
}
