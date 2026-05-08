import { describe, expect, it } from 'vitest';
import { deriveEnergyLedgerFromRuntimeSnapshot } from '../../observer/deriveEnergyLedgerFromRuntimeSnapshot.ts';

describe('deriveEnergyLedgerFromRuntimeSnapshot', () => {
  it('derives internal accumulation from previous/current buffers', () => {
    const observation = deriveEnergyLedgerFromRuntimeSnapshot({
      previousInternalBuffer: [1, 1],
      currentInternalBuffer: [2, 1],
      inputEnergy: 3,
      dissipatedEnergy: 0,
      actuationOutputEnergy: 0,
      residueConvertedEnergy: 0,
      clampLossOrOverflow: 0,
    });

    expect(observation.previousInternalEnergyEstimate).toBe(2);
    expect(observation.currentInternalEnergyEstimate).toBe(5);
    expect(observation.ledger.internalAccumulationDelta).toBe(3);
    expect(observation.ledger.status).toBe('closed');
    expect(observation.ledger.verifiedModeledFlow).toBe(true);
  });

  it('keeps missing flow terms insufficient instead of guessing from proxy state', () => {
    const observation = deriveEnergyLedgerFromRuntimeSnapshot({
      previousInternalBuffer: [1],
      currentInternalBuffer: [2],
      inputEnergy: 3,
      // required flow terms intentionally missing
    });

    expect(observation.ledger.status).toBe('insufficient');
    expect(observation.ledger.verifiedModeledFlow).toBe(false);
    expect(observation.ledger.missingTermIds).toContain('dissipatedEnergy');
    expect(observation.ledger.missingTermIds).toContain('actuationOutputEnergy');
    expect(observation.ledger.missingTermIds).toContain('residueConvertedEnergy');
    expect(observation.warnings.join('\n')).toContain('does not infer missing flow terms');
  });

  it('reports non-finite samples without throwing', () => {
    const observation = deriveEnergyLedgerFromRuntimeSnapshot({
      previousInternalBuffer: [1, Number.NaN],
      currentInternalBuffer: [1, 2, Number.POSITIVE_INFINITY],
      inputEnergy: 4,
      dissipatedEnergy: 0,
      actuationOutputEnergy: 0,
      residueConvertedEnergy: 0,
      clampLossOrOverflow: 0,
    });

    expect(observation.nonFiniteSampleCount).toBe(2);
    expect(observation.warnings.join('\n')).toContain('Non-finite samples were ignored');
  });

  it('does not claim energy flow when the ledger is open', () => {
    const observation = deriveEnergyLedgerFromRuntimeSnapshot({
      previousInternalBuffer: [0],
      currentInternalBuffer: [1],
      inputEnergy: 10,
      dissipatedEnergy: 0,
      actuationOutputEnergy: 0,
      residueConvertedEnergy: 0,
      clampLossOrOverflow: 0,
    });

    expect(observation.ledger.status).toBe('open');
    expect(observation.ledger.verifiedModeledFlow).toBe(false);
    expect(observation.ledger.notes.join('\n')).toContain('Energy flow is not yet verified');
  });
});
