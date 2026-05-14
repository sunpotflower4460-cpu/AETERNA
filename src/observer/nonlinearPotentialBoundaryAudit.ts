import type {
  NonlinearPotentialAccelerationPreviewConfig,
  NonlinearPotentialBoundaryAuditReport,
  NonlinearPotentialBoundaryAuditStatus,
} from '../types/nonlinearPotentialField.ts';
import type { WaveCapableMediumState } from '../types/waveCapableMedium.ts';
import { deriveNonlinearPotentialAccelerationPreview } from './nonlinearPotentialAccelerationPreview.ts';

function snapshotMediumFields(state: WaveCapableMediumState): number[][] {
  return [
    Array.from(state.mediumRealField),
    Array.from(state.mediumImagField),
    Array.from(state.mediumRealVelocityField),
    Array.from(state.mediumImagVelocityField),
    Array.from(state.waveEnergyDissipationField),
    Array.from(state.waveEnergyResidueField),
    Array.from(state.waveEnergyOutflowField),
    [state.tick],
  ];
}

function countChangedSamples(before: number[][], after: number[][]): number {
  let changed = 0;

  for (let fieldIndex = 0; fieldIndex < before.length; fieldIndex++) {
    const beforeField = before[fieldIndex];
    const afterField = after[fieldIndex];
    const length = Math.max(beforeField.length, afterField.length);

    for (let i = 0; i < length; i++) {
      if (!Object.is(beforeField[i], afterField[i])) changed += 1;
    }
  }

  return changed;
}

function countPreviewReportChanges(reports: Array<{ mediumChangedFieldCount: number }>): number {
  return reports.reduce((total, report) => total + report.mediumChangedFieldCount, 0);
}

function deriveStatus(input: {
  boundaryViolationCount: number;
  numericWarningCount: number;
  warningCount: number;
}): NonlinearPotentialBoundaryAuditStatus {
  if (input.boundaryViolationCount > 0) return 'fail';
  if (input.numericWarningCount > 0 || input.warningCount > 0) return 'warning';
  return 'pass';
}

export function deriveNonlinearPotentialBoundaryAudit(input: {
  mediumState: WaveCapableMediumState;
  config: NonlinearPotentialAccelerationPreviewConfig;
}): NonlinearPotentialBoundaryAuditReport {
  const before = snapshotMediumFields(input.mediumState);
  const accelerationPreview = deriveNonlinearPotentialAccelerationPreview({
    mediumState: input.mediumState,
    config: input.config,
  });
  const after = snapshotMediumFields(input.mediumState);

  const mediumFieldChangeCount = countChangedSamples(before, after);
  const previewReportChangeCount = countPreviewReportChanges([
    accelerationPreview.forcePreview.preparation,
    accelerationPreview.forcePreview,
    accelerationPreview,
  ]);
  const numericWarningCount =
    accelerationPreview.forcePreview.preparation.nonFiniteCellCount +
    accelerationPreview.forcePreview.nonFiniteCellCount +
    accelerationPreview.nonFiniteCellCount;
  const boundaryViolationCount = mediumFieldChangeCount + previewReportChangeCount;
  const findings: string[] = [];
  const warnings = [...accelerationPreview.warnings];

  if (mediumFieldChangeCount === 0) {
    findings.push('Medium fields remained unchanged across nonlinear potential preview chain.');
  } else {
    findings.push(`${mediumFieldChangeCount} medium field sample(s) changed during nonlinear potential preview chain.`);
  }

  if (previewReportChangeCount === 0) {
    findings.push('Preview reports declared zero medium changes across preparation, force preview, and acceleration preview.');
  } else {
    findings.push(`${previewReportChangeCount} preview-reported medium change(s) were detected.`);
  }

  if (numericWarningCount === 0) {
    findings.push('No non-finite preview cells were reported across the nonlinear potential preview chain.');
  } else {
    findings.push(`${numericWarningCount} non-finite preview cell report(s) were detected across the nonlinear potential preview chain.`);
  }

  findings.push('Applied nonlinear runtime remains locked behind a later explicitly audited phase.');

  const boundaryAuditStatus = deriveStatus({
    boundaryViolationCount,
    numericWarningCount,
    warningCount: warnings.length,
  });

  return {
    source: 'nonlinear-potential-boundary-audit',
    mediumTick: input.mediumState.tick,
    accelerationPreview,
    boundaryAuditStatus,
    appliedRuntimeReady: false,
    mediumFieldChangeCount,
    previewReportChangeCount,
    boundaryViolationCount,
    numericWarningCount,
    findings,
    warnings,
    mediumChangedFieldCount: 0,
    metricKind: 'derived',
  };
}
