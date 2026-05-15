import type {
  NonlinearPotentialAppliedUpdateProposalConfig,
  NonlinearPotentialAppliedUpdateProposalReport,
  NonlinearPotentialAppliedUpdateProposalStatus,
} from '../types/nonlinearPotentialField.ts';
import type { WaveCapableMediumState } from '../types/waveCapableMedium.ts';
import { deriveNonlinearPotentialBoundaryAudit } from './nonlinearPotentialBoundaryAudit.ts';

const ALLOWED_MUTATION_FIELDS = [
  'mediumRealVelocityField',
  'mediumImagVelocityField',
  'tick',
] as const;

const FORBIDDEN_MUTATION_FIELDS = [
  'mediumRealField',
  'mediumImagField',
  'waveEnergyDissipationField',
  'waveEnergyResidueField',
  'waveEnergyOutflowField',
  'phaseDriveState',
  'internalBuffers',
] as const;

const REQUIRED_ENERGY_ACCOUNTING = [
  'potentialEnergyBefore',
  'potentialEnergyAfter',
  'kineticEnergyDelta',
  'totalEnergyDelta',
  'workTermEstimate',
  'ledgerStatus',
] as const;

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeNonnegativeParameter(input: {
  value: number | undefined;
  fallback: number;
  nonFiniteWarning: string;
  negativeWarning: string;
}): { requested: number; effective: number; warnings: string[] } {
  const warnings: string[] = [];
  const requested = finiteNumber(input.value, input.fallback);
  let effective = requested;

  if (input.value !== undefined && !Number.isFinite(input.value)) {
    warnings.push(input.nonFiniteWarning);
  }

  if (effective < 0) {
    warnings.push(input.negativeWarning);
    effective = 0;
  }

  return { requested, effective, warnings };
}

export function deriveNonlinearPotentialAppliedUpdateProposal(input: {
  mediumState: WaveCapableMediumState;
  config: NonlinearPotentialAppliedUpdateProposalConfig;
}): NonlinearPotentialAppliedUpdateProposalReport {
  const dt = normalizeNonnegativeParameter({
    value: input.config.proposedDt,
    fallback: 0,
    nonFiniteWarning: 'Non-finite proposed nonlinear update dt was treated as 0.',
    negativeWarning: 'Negative proposed nonlinear update dt was clamped to 0.',
  });
  const velocityScale = normalizeNonnegativeParameter({
    value: input.config.proposedVelocityUpdateScale,
    fallback: 0,
    nonFiniteWarning: 'Non-finite proposed nonlinear velocity update scale was treated as 0.',
    negativeWarning: 'Negative proposed nonlinear velocity update scale was clamped to 0.',
  });

  const boundaryAudit = deriveNonlinearPotentialBoundaryAudit({
    mediumState: input.mediumState,
    config: input.config,
  });

  const size = input.mediumState.width * input.mediumState.height;
  const proposedVelocityDeltaRealField = new Float64Array(size);
  const proposedVelocityDeltaImagField = new Float64Array(size);
  const warnings = [...boundaryAudit.warnings, ...dt.warnings, ...velocityScale.warnings];
  const findings = [...boundaryAudit.findings];
  const accelerationPreview = boundaryAudit.accelerationPreview;

  let proposalStatus: NonlinearPotentialAppliedUpdateProposalStatus =
    boundaryAudit.boundaryAuditStatus === 'pass' ? 'proposed' : 'blocked';

  const previewFieldSizeMatches =
    accelerationPreview.previewAccelerationRealField.length === size &&
    accelerationPreview.previewAccelerationImagField.length === size;

  if (proposalStatus === 'proposed' && !previewFieldSizeMatches) {
    proposalStatus = 'blocked';
    warnings.push('Applied update proposal was blocked because acceleration preview field lengths did not match medium size.');
    findings.push('Applied nonlinear update proposal was blocked by preview field size mismatch.');
  }

  const updateScale = dt.effective * velocityScale.effective;
  if (proposalStatus === 'proposed' && !Number.isFinite(updateScale)) {
    proposalStatus = 'blocked';
    warnings.push('Applied update proposal was blocked because proposed dt and velocity scale produced a non-finite update scale.');
    findings.push('Applied nonlinear update proposal was blocked by non-finite update scale.');
  }

  let maxProposedVelocityDeltaMagnitude = 0;
  let proposedVelocityDeltaEnergyProxy = 0;

  if (proposalStatus === 'proposed') {
    for (let i = 0; i < size; i++) {
      const deltaReal = accelerationPreview.previewAccelerationRealField[i] * updateScale;
      const deltaImag = accelerationPreview.previewAccelerationImagField[i] * updateScale;

      if (!Number.isFinite(deltaReal) || !Number.isFinite(deltaImag)) {
        proposalStatus = 'blocked';
        proposedVelocityDeltaRealField.fill(0);
        proposedVelocityDeltaImagField.fill(0);
        maxProposedVelocityDeltaMagnitude = 0;
        proposedVelocityDeltaEnergyProxy = 0;
        warnings.push('Applied update proposal was blocked because a proposed velocity delta was non-finite.');
        findings.push('Applied nonlinear update proposal was blocked by non-finite velocity delta.');
        break;
      }

      proposedVelocityDeltaRealField[i] = deltaReal;
      proposedVelocityDeltaImagField[i] = deltaImag;

      const magnitude = Math.sqrt(deltaReal * deltaReal + deltaImag * deltaImag);
      maxProposedVelocityDeltaMagnitude = Math.max(maxProposedVelocityDeltaMagnitude, magnitude);
      proposedVelocityDeltaEnergyProxy += 0.5 * (deltaReal * deltaReal + deltaImag * deltaImag);
    }

    if (proposalStatus === 'proposed') {
      findings.push('A future applied update may be proposed for velocity fields only.');
    }
  }

  if (proposalStatus === 'blocked') {
    findings.push('Applied nonlinear update proposal was blocked before runtime application.');
  }

  findings.push('v6.4 does not mutate medium state and does not authorize runtime application.');

  return {
    source: 'nonlinear-potential-applied-update-proposal',
    mediumTick: input.mediumState.tick,
    boundaryAudit,
    proposalStatus,
    appliedRuntimeReady: false,
    requestedProposedDt: dt.requested,
    effectiveProposedDt: dt.effective,
    requestedProposedVelocityUpdateScale: velocityScale.requested,
    effectiveProposedVelocityUpdateScale: velocityScale.effective,
    proposedVelocityDeltaRealField,
    proposedVelocityDeltaImagField,
    maxProposedVelocityDeltaMagnitude,
    proposedVelocityDeltaEnergyProxy,
    proposedTickDelta: proposalStatus === 'proposed' ? 1 : 0,
    allowedMutationFields: [...ALLOWED_MUTATION_FIELDS],
    forbiddenMutationFields: [...FORBIDDEN_MUTATION_FIELDS],
    requiredEnergyAccounting: [...REQUIRED_ENERGY_ACCOUNTING],
    findings,
    warnings,
    mediumChangedFieldCount: 0,
    metricKind: 'derived',
  };
}
