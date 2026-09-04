import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveNonlinearPotentialAppliedUpdateProposal } from '../../observer/nonlinearPotentialAppliedUpdateProposal.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import type { NonlinearPotentialAppliedUpdateProposalConfig } from '../../types/nonlinearPotentialField.ts';

const config: NonlinearPotentialAppliedUpdateProposalConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localQuadraticCoefficient: 2,
  localQuarticCoefficient: 0.5,
  previewForceScale: 0.25,
  previewMass: 0.5,
  proposedDt: 0.1,
  proposedVelocityUpdateScale: 0.5,
  tolerance: 1e-9,
};

const forbiddenResultTerms = [
  'coherenceTarget',
  'phaseLockingRate',
  'naturalFrequencyPull',
  'desiredOrderParameter',
  'driveSyncStrength',
  'globalDecayRate',
  'vital',
  'breath',
  'heartbeat',
  'metabolic',
  'lifeDrive',
  '呼吸',
  '鼓動',
  '生命',
  '心拍',
];

function snapshotMedium(state: ReturnType<typeof createWaveCapableMediumState>) {
  return {
    real: Array.from(state.mediumRealField),
    imag: Array.from(state.mediumImagField),
    realVelocity: Array.from(state.mediumRealVelocityField),
    imagVelocity: Array.from(state.mediumImagVelocityField),
    dissipation: Array.from(state.waveEnergyDissipationField),
    residue: Array.from(state.waveEnergyResidueField),
    outflow: Array.from(state.waveEnergyOutflowField),
    tick: state.tick,
  };
}

describe('nonlinear potential applied update proposal', () => {
  it('proposes velocity delta candidates without mutating medium state when boundary audit passes', () => {
    const medium = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 2, 0],
        mediumImagField: [0, 1, 0, 0],
        mediumRealVelocityField: [0.5, 0, 0, 0],
        mediumImagVelocityField: [0, 0.25, 0, 0],
        waveEnergyDissipationField: [0.01, 0, 0, 0],
        waveEnergyResidueField: [0, 0.02, 0, 0],
        waveEnergyOutflowField: [0, 0, 0.03, 0],
      },
    );
    const before = snapshotMedium(medium);

    const report = deriveNonlinearPotentialAppliedUpdateProposal({ mediumState: medium, config });

    expect(snapshotMedium(medium)).toEqual(before);
    expect(report.source).toBe('nonlinear-potential-applied-update-proposal');
    expect(report.boundaryAudit.boundaryAuditStatus).toBe('pass');
    expect(report.proposalStatus).toBe('proposed');
    expect(report.appliedRuntimeReady).toBe(false);
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(report.proposedTickDelta).toBe(1);
    expect(report.allowedMutationFields).toEqual(['mediumRealVelocityField', 'mediumImagVelocityField', 'tick']);
    expect(report.forbiddenMutationFields).toContain('mediumRealField');
    expect(report.forbiddenMutationFields).toContain('mediumImagField');
    expect(report.requiredEnergyAccounting).toContain('totalEnergyDelta');

    expect(Array.from(report.proposedVelocityDeltaRealField)).toEqual([-0.0625, -0, -0.2, -0]);
    expect(Array.from(report.proposedVelocityDeltaImagField)).toEqual([-0, -0.0625, -0, -0]);
    expect(report.maxProposedVelocityDeltaMagnitude).toBeCloseTo(0.2, 12);
    expect(report.proposedVelocityDeltaEnergyProxy).toBeCloseTo(0.5 * (0.0625 * 0.0625 + 0.0625 * 0.0625 + 0.2 * 0.2), 12);
    expect(report.findings.join('\n')).toContain('does not mutate medium state');
  });

  it('blocks proposal when boundary audit returns warning from non-finite diagnostics', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [Number.MAX_VALUE], mediumImagField: [0] },
    );
    const before = snapshotMedium(medium);

    const report = deriveNonlinearPotentialAppliedUpdateProposal({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: Number.MAX_VALUE,
        localQuarticCoefficient: 0,
        previewForceScale: 1,
        previewMass: Number.MIN_VALUE,
        proposedDt: 0.1,
        proposedVelocityUpdateScale: 0.5,
      },
    });

    expect(snapshotMedium(medium)).toEqual(before);
    expect(report.boundaryAudit.boundaryAuditStatus).toBe('warning');
    expect(report.proposalStatus).toBe('blocked');
    expect(report.proposedTickDelta).toBe(0);
    expect(Array.from(report.proposedVelocityDeltaRealField)).toEqual([0]);
    expect(Array.from(report.proposedVelocityDeltaImagField)).toEqual([0]);
    expect(report.warnings.join('\n')).toContain('non-finite nonlinear-acceleration preview cell');
    expect(report.findings.join('\n')).toContain('blocked before runtime application');
    expect(report.appliedRuntimeReady).toBe(false);
  });

  it('blocks proposal when proposed dt and velocity scale overflow into a non-finite update scale', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );
    const before = snapshotMedium(medium);

    const report = deriveNonlinearPotentialAppliedUpdateProposal({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: 0.5,
        previewMass: 1,
        proposedDt: 1e308,
        proposedVelocityUpdateScale: 1e308,
      },
    });

    expect(snapshotMedium(medium)).toEqual(before);
    expect(report.boundaryAudit.boundaryAuditStatus).toBe('pass');
    expect(report.proposalStatus).toBe('blocked');
    expect(report.proposedTickDelta).toBe(0);
    expect(Array.from(report.proposedVelocityDeltaRealField)).toEqual([0]);
    expect(Array.from(report.proposedVelocityDeltaImagField)).toEqual([0]);
    expect(report.maxProposedVelocityDeltaMagnitude).toBe(0);
    expect(report.proposedVelocityDeltaEnergyProxy).toBe(0);
    expect(report.warnings.join('\n')).toContain('non-finite update scale');
    expect(report.appliedRuntimeReady).toBe(false);
  });

  it('blocks proposal if proposed velocity deltas become non-finite', () => {
    // Chosen so every intermediate stage stays finite (gradient, force,
    // acceleration, and the dt*scale update factor are each individually
    // well within double range) and boundaryAuditStatus stays 'pass' -
    // distinct from the two preceding tests, which cover a warning-carrying
    // boundary audit and a non-finite update *scale* respectively. Only the
    // final per-cell product (acceleration * updateScale, ~1e300 * 1e10)
    // overflows past Number.MAX_VALUE into -Infinity.
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );
    const before = snapshotMedium(medium);

    const report = deriveNonlinearPotentialAppliedUpdateProposal({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 1,
        localQuarticCoefficient: 0,
        previewForceScale: 1e250,
        previewMass: 1e-50,
        proposedDt: 1e10,
        proposedVelocityUpdateScale: 1,
      },
    });

    expect(snapshotMedium(medium)).toEqual(before);
    expect(report.boundaryAudit.boundaryAuditStatus).toBe('pass');
    expect(report.proposalStatus).toBe('blocked');
    expect(report.proposedTickDelta).toBe(0);
    expect(Array.from(report.proposedVelocityDeltaRealField)).toEqual([0]);
    expect(Array.from(report.proposedVelocityDeltaImagField)).toEqual([0]);
    expect(report.maxProposedVelocityDeltaMagnitude).toBe(0);
    expect(report.proposedVelocityDeltaEnergyProxy).toBe(0);
    expect(report.warnings.join('\n')).toContain('a proposed velocity delta was non-finite');
    expect(report.appliedRuntimeReady).toBe(false);
  });

  it('normalizes proposed update parameters without authorizing runtime application', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialAppliedUpdateProposal({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: 0.5,
        previewMass: 1,
        proposedDt: -1,
        proposedVelocityUpdateScale: Number.POSITIVE_INFINITY,
      },
    });

    expect(report.proposalStatus).toBe('proposed');
    expect(report.requestedProposedDt).toBe(-1);
    expect(report.effectiveProposedDt).toBe(0);
    expect(report.requestedProposedVelocityUpdateScale).toBe(0);
    expect(report.effectiveProposedVelocityUpdateScale).toBe(0);
    expect(Array.from(report.proposedVelocityDeltaRealField)).toEqual([-0]);
    expect(report.warnings.join('\n')).toContain('Negative proposed nonlinear update dt was clamped to 0.');
    expect(report.warnings.join('\n')).toContain('Non-finite proposed nonlinear velocity update scale was treated as 0.');
    expect(report.appliedRuntimeReady).toBe(false);
  });

  it('does not include result-coded, internal-buffer, or direct mutation identifiers in proposal source files', () => {
    const source = [
      readFileSync('src/types/nonlinearPotentialField.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialFieldPreparation.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialForcePreview.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialAccelerationPreview.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialBoundaryAudit.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialAppliedUpdateProposal.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }

    // A read like `input.mediumState.mediumRealField[i]` is required for
    // this preview chain to do its job (it must read the medium's current
    // field to derive potential/gradient/force from it) and is not a
    // mutation. Only flag the field being used as an assignment target -
    // `field[i] = ...` / `field[i] += ...` etc, never `field[i] ==`.
    const mutationPattern = (identifier: string) =>
      new RegExp(`${identifier}\\s*\\[[^\\]]*\\]\\s*[+\\-*/]?=(?!=)`);

    for (const identifier of [
      'mediumRealField',
      'mediumImagField',
      'mediumRealVelocityField',
      'mediumImagVelocityField',
      'waveEnergyDissipationField',
      'waveEnergyResidueField',
      'waveEnergyOutflowField',
    ]) {
      expect(source, `${identifier} appears to be a mutation target`).not.toMatch(mutationPattern(identifier));
    }
  });
});
