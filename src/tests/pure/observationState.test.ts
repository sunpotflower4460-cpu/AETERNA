import { describe, expect, it } from 'vitest';
import { buildObservationSnapshot, type WorldLedgerSummary } from '../../pure/runtime/observationState.ts';
import { createTorusGeometry } from '../../pure/geometry/torus.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

const zeroLedger: WorldLedgerSummary = {
  nBeforeExchangePsi: 0,
  nAfterExchangePsi: 0,
  hBeforeExchangePsi: 0,
  hAfterExchangePsi: 0,
  nBeforeExchangeChi: 0,
  nAfterExchangeChi: 0,
  hBeforeExchangeChi: 0,
  hAfterExchangeChi: 0,
  exchangeWorkNPsi: 0,
  exchangeWorkHPsi: 0,
  exchangeWorkNChi: 0,
  exchangeWorkHChi: 0,
};

describe('pure core K15 observationState: buildObservationSnapshot', () => {
  it('computes density (|psi|^2) and phase matching a hand-computed reference for a small planted field', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const size = geometry.N * geometry.N;
    const psi: ComplexField = { real: new Float64Array(size).fill(0), imag: new Float64Array(size).fill(0) };
    psi.real[0] = 3;
    psi.imag[0] = 4; // |psi|^2 = 25, phase = atan2(4,3)
    const chi: ComplexField = { real: new Float64Array(size).fill(1), imag: new Float64Array(size).fill(0) };

    const snapshot = buildObservationSnapshot({
      tick: 5,
      psi,
      psiNu: new Float64Array(size).fill(0.2),
      psiGeometry: geometry,
      chi,
      chiNu: new Float64Array(size).fill(0.3),
      chiGeometry: geometry,
      ledger: zeroLedger,
    });

    expect(snapshot.tick).toBe(5);
    expect(snapshot.psiDensity[0]).toBeCloseTo(25, 12);
    expect(snapshot.psiPhase[0]).toBeCloseTo(Math.atan2(4, 3), 12);
    expect(snapshot.psiDensity[1]).toBe(0);
    expect(snapshot.chiDensity.every((d) => Math.abs(d - 1) < 1e-12)).toBe(true);
    expect(snapshot.chiPhase.every((p) => p === 0)).toBe(true);
    expect(snapshot.psiNu).toEqual(Array.from(new Float64Array(size).fill(0.2)));
    expect(snapshot.chiNu).toEqual(Array.from(new Float64Array(size).fill(0.3)));
  });

  it('copies the ledger summary rather than aliasing the caller\'s object', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const size = geometry.N * geometry.N;
    const psi: ComplexField = { real: new Float64Array(size), imag: new Float64Array(size) };
    const ledger: WorldLedgerSummary = { ...zeroLedger, exchangeWorkNPsi: 1.5 };
    const snapshot = buildObservationSnapshot({ tick: 0, psi, psiNu: new Float64Array(size), psiGeometry: geometry, chi: psi, chiNu: new Float64Array(size), chiGeometry: geometry, ledger });
    expect(snapshot.ledger).toEqual(ledger);
    expect(snapshot.ledger).not.toBe(ledger);
    ledger.exchangeWorkNPsi = 999;
    expect(snapshot.ledger.exchangeWorkNPsi).toBe(1.5);
  });

  it('does not mutate its psi/chi/nu inputs', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const size = geometry.N * geometry.N;
    const psi: ComplexField = { real: Float64Array.from({ length: size }, (_, i) => i), imag: Float64Array.from({ length: size }, (_, i) => -i) };
    const psiRealCopy = Float64Array.from(psi.real);
    const psiImagCopy = Float64Array.from(psi.imag);
    buildObservationSnapshot({ tick: 0, psi, psiNu: new Float64Array(size), psiGeometry: geometry, chi: psi, chiNu: new Float64Array(size), chiGeometry: geometry, ledger: zeroLedger });
    expect(psi.real).toEqual(psiRealCopy);
    expect(psi.imag).toEqual(psiImagCopy);
  });

  it('reports vortexCandidateCount and structureIndicatorLargestBlob as finite numbers for a uniform field (no structure)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const size = geometry.N * geometry.N;
    const uniform: ComplexField = { real: new Float64Array(size).fill(1), imag: new Float64Array(size).fill(0) };
    const snapshot = buildObservationSnapshot({
      tick: 0,
      psi: uniform,
      psiNu: new Float64Array(size),
      psiGeometry: geometry,
      chi: uniform,
      chiNu: new Float64Array(size),
      chiGeometry: geometry,
      ledger: zeroLedger,
    });
    expect(Number.isFinite(snapshot.vortexCandidateCount)).toBe(true);
    expect(Number.isFinite(snapshot.structureIndicatorLargestBlob)).toBe(true);
    expect(snapshot.vortexCandidateCount).toBe(0);
  });
});
