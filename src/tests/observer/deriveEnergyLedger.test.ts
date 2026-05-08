import { describe, expect, it } from 'vitest';
import { deriveEnergyLedger, estimateBufferEnergy } from '../../observer/deriveEnergyLedger.ts';

describe('deriveEnergyLedger', () => {
  it('closes when input equals accounted destinations within tolerance', () => {
    const ledger = deriveEnergyLedger({
      timestamp: 1,
      tolerance: 1e-6,
      inputEnergy: 10,
      internalAccumulationDelta: 4,
      dissipatedEnergy: 2,
      actuationOutputEnergy: 1,
      residueConvertedEnergy: 3,
      clampLossOrOverflow: 0,
    });

    expect(ledger.metricKind).toBe('check');
    expect(ledger.status).toBe('closed');
    expect(ledger.confidence).toBe('high');
    expect(ledger.verifiedModeledFlow).toBe(true);
    expect(ledger.conservationResidual).toBe(0);
    expect(ledger.missingTermIds).toEqual([]);
  });

  it('derives internal accumulation from before/after storage values', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 5,
      internalEnergyBefore: 10,
      internalEnergyAfter: 12,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 1,
      residueConvertedEnergy: 1,
      clampLossOrOverflow: 0,
    });

    expect(ledger.internalAccumulationDelta).toBe(2);
    expect(ledger.status).toBe('closed');
    expect(ledger.verifiedModeledFlow).toBe(true);
  });

  it('marks missing required terms as insufficient rather than assuming zero', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 5,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      // actuationOutputEnergy is intentionally missing.
      residueConvertedEnergy: 1,
    });

    expect(ledger.status).toBe('insufficient');
    expect(ledger.confidence).toBe('insufficient');
    expect(ledger.verifiedModeledFlow).toBe(false);
    expect(ledger.conservationResidual).toBeNull();
    expect(ledger.missingTermIds).toContain('actuationOutputEnergy');
    expect(ledger.warnings.join('\n')).toContain('Energy flow is not yet verified');
  });

  it('detects an open ledger when the accounting does not close', () => {
    const ledger = deriveEnergyLedger({
      tolerance: 0.001,
      inputEnergy: 10,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 1,
      residueConvertedEnergy: 1,
      clampLossOrOverflow: 0,
    });

    expect(ledger.status).toBe('open');
    expect(ledger.confidence).toBe('low');
    expect(ledger.verifiedModeledFlow).toBe(false);
    expect(ledger.conservationResidual).toBe(6);
    expect(ledger.warnings.join('\n')).toContain('Energy ledger is open');
  });

  it('keeps optional clamp loss explicit and accounted when provided', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 10,
      internalAccumulationDelta: 2,
      dissipatedEnergy: 2,
      actuationOutputEnergy: 2,
      residueConvertedEnergy: 2,
      clampLossOrOverflow: 2,
    });

    expect(ledger.status).toBe('closed');
    expect(ledger.clampLossOrOverflow).toBe(2);
    expect(ledger.accountedEnergy).toBe(10);
  });

  it('does not silently clamp negative ledger terms to zero', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 10,
      internalAccumulationDelta: 4,
      dissipatedEnergy: -1,
      actuationOutputEnergy: 1,
      residueConvertedEnergy: 3,
      clampLossOrOverflow: 0,
    });

    expect(ledger.status).toBe('insufficient');
    expect(ledger.dissipatedEnergy).toBeNull();
    expect(ledger.missingTermIds).toContain('dissipatedEnergy');
    expect(ledger.warnings.join('\n')).toContain('dissipatedEnergy was negative');
  });

  it('does not make life or consciousness claims in diagnostic notes', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 0,
      internalAccumulationDelta: 0,
      dissipatedEnergy: 0,
      actuationOutputEnergy: 0,
      residueConvertedEnergy: 0,
      clampLossOrOverflow: 0,
    });

    const text = ledger.notes.join('\n');
    expect(text).not.toContain('AETERNA is alive');
    expect(text).not.toContain('AETERNA is conscious');
    expect(text).toContain('does not prove life, consciousness, intelligence, or selfhood');
  });
});

describe('estimateBufferEnergy', () => {
  it('estimates squared buffer energy while ignoring non-finite values', () => {
    const estimate = estimateBufferEnergy([1, -2, Number.NaN, 3], 'squared');

    expect(estimate.value).toBe(14);
    expect(estimate.sampleCount).toBe(4);
    expect(estimate.finiteCount).toBe(3);
    expect(estimate.nonFiniteCount).toBe(1);
  });

  it('can estimate absolute buffer energy', () => {
    const estimate = estimateBufferEnergy([1, -2, 3], 'absolute');

    expect(estimate.value).toBe(6);
    expect(estimate.mode).toBe('absolute');
  });
});
