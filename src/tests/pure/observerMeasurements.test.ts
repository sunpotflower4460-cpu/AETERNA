import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { detectVortexCandidates, trackVortexPersistence, type VortexCandidate } from '../../pure/observe/vortexCandidates.ts';
import { computePhaseCoherence } from '../../pure/observe/coherence.ts';
import { computeNuFieldEnergyCorrelation } from '../../pure/observe/correlation.ts';

function uniformPhaseField(size: number, phase: number, amplitude = 1): ComplexField {
  return {
    real: Float64Array.from({ length: size }, () => amplitude * Math.cos(phase)),
    imag: Float64Array.from({ length: size }, () => amplitude * Math.sin(phase)),
  };
}

/**
 * Builds a field with a hand-verified winding-+1 (or -1, if `sign` is -1)
 * defect exactly at the plaquette anchored at (i0,j0), by tiling four
 * constant phases around it (SW/SE/NE/NW quadrants split at i0/i0+1 and
 * j0/j0+1). A small offset phi0 keeps every quadrant phase away from the
 * atan2 branch cut at +/-pi, so the test is not sensitive to
 * signed-zero/boundary floating-point behavior there.
 *
 * Note: because the grid is periodic in both directions, this same
 * quadrant split necessarily creates additional defects elsewhere too
 * (a lone, uncompensated point defect cannot exist on a compact periodic
 * domain - total winding is a topological invariant). This helper does
 * not try to avoid that; the tests below only assert what is true of the
 * (i0,j0) plaquette itself, which is unaffected by what happens at the
 * grid's own wrap seams.
 */
function fourQuadrantVortexField(N: number, i0: number, j0: number, sign: 1 | -1 = 1): ComplexField {
  const real = new Float64Array(N * N);
  const imag = new Float64Array(N * N);
  const phi0 = 0.3;
  for (let i = 0; i < N; i++) {
    const south = i <= i0;
    for (let j = 0; j < N; j++) {
      const west = j <= j0;
      let phase: number;
      if (south && west) phase = phi0;
      else if (south && !west) phase = phi0 + Math.PI / 2;
      else if (!south && !west) phase = phi0 + Math.PI;
      else phase = phi0 - Math.PI / 2;
      const idx = i * N + j;
      real[idx] = Math.cos(sign * phase);
      imag[idx] = Math.sin(sign * phase);
    }
  }
  return { real, imag };
}

describe('pure core observer: vortex candidate detection (topological winding quantization)', () => {
  it('a uniform-phase field has zero vortex candidates anywhere', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const psi = uniformPhaseField(geometry.N * geometry.N, 0.4);
    const candidates = detectVortexCandidates(psi, geometry);
    expect(candidates).toHaveLength(0);
  });

  it('a hand-constructed single defect (four quadrant phases meeting at one plaquette) is detected there with winding exactly +1', () => {
    const N = 10;
    const i0 = 4;
    const j0 = 4;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const psi = fourQuadrantVortexField(N, i0, j0, 1);

    const candidates = detectVortexCandidates(psi, geometry);
    const coreCandidate = candidates.find((c) => c.cellIndex === i0 * N + j0);

    expect(coreCandidate).toBeDefined();
    expect(coreCandidate?.winding).toBe(1);
  });

  it('reversing the quadrant order at the same location flips the sign to -1', () => {
    const N = 10;
    const i0 = 4;
    const j0 = 4;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const psi = fourQuadrantVortexField(N, i0, j0, -1);

    const candidates = detectVortexCandidates(psi, geometry);
    const coreCandidate = candidates.find((c) => c.cellIndex === i0 * N + j0);

    expect(coreCandidate).toBeDefined();
    expect(coreCandidate?.winding).toBe(-1);
  });

  it('a plaquette far from the constructed defect (same row/column half) sees zero winding', () => {
    const N = 10;
    const i0 = 4;
    const j0 = 4;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const psi = fourQuadrantVortexField(N, i0, j0, 1);

    const candidates = detectVortexCandidates(psi, geometry);
    // (1,1) sits entirely within the SW quadrant (i,i+1 <= i0 and j,j+1 <= j0) - no transition crossed.
    const farCandidate = candidates.find((c) => c.cellIndex === 1 * N + 1);
    expect(farCandidate).toBeUndefined();
  });

  it('trackVortexPersistence reports the longest consecutive same-sign run per plaquette', () => {
    const history: VortexCandidate[][] = [
      [{ cellIndex: 5, winding: 1 }],
      [{ cellIndex: 5, winding: 1 }],
      [{ cellIndex: 5, winding: 1 }],
      [], // gap - resets the run
      [{ cellIndex: 5, winding: 1 }],
      [{ cellIndex: 5, winding: -1 }], // sign flip - resets the run
    ];

    const persistence = trackVortexPersistence(history);
    expect(persistence.get(5)).toBe(3);
  });

  it('trackVortexPersistence omits plaquettes that never appear', () => {
    const history: VortexCandidate[][] = [[{ cellIndex: 1, winding: 1 }]];
    const persistence = trackVortexPersistence(history);
    expect(persistence.has(2)).toBe(false);
  });
});

describe('pure core observer: phase coherence order parameter', () => {
  it('a uniform-phase field has coherence exactly 1', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const psi = uniformPhaseField(geometry.N * geometry.N, 1.1, 2.5);
    expect(computePhaseCoherence(psi, geometry)).toBeCloseTo(1, 12);
  });

  it('two exactly-opposed half-and-half phase populations of equal area give coherence exactly 0', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;
    const real = new Float64Array(size);
    const imag = new Float64Array(size);
    for (let k = 0; k < size; k++) {
      const phase = k % 2 === 0 ? 0 : Math.PI;
      real[k] = Math.cos(phase);
      imag[k] = Math.sin(phase);
    }
    // Every row has exactly N/2 phase-0 and N/2 phase-pi cells (N even, alternating by flattened index).
    const coherence = computePhaseCoherence({ real, imag }, geometry);
    expect(coherence).toBeCloseTo(0, 9);
  });

  it('a zero field (all cells zero amplitude) has coherence exactly 0, not NaN', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 5 });
    const size = geometry.N * geometry.N;
    const psi: ComplexField = { real: new Float64Array(size), imag: new Float64Array(size) };
    expect(computePhaseCoherence(psi, geometry)).toBe(0);
  });

  it('coherence is bounded in [0,1] for a random field', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;
    const real = Float64Array.from({ length: size }, (_, k) => Math.sin(k * 1.7));
    const imag = Float64Array.from({ length: size }, (_, k) => Math.cos(k * 2.3));
    const coherence = computePhaseCoherence({ real, imag }, geometry);
    expect(coherence).toBeGreaterThanOrEqual(0);
    expect(coherence).toBeLessThanOrEqual(1);
  });
});

describe('pure core observer: nu-vs-|psi|^2 correlation', () => {
  it('nu(x) identical in shape to |psi(x)|^2 gives correlation +1', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;
    const amp = Float64Array.from({ length: size }, (_, k) => 1 + (k % 5));
    const psi: ComplexField = { real: amp, imag: new Float64Array(size) };
    const nu = Float64Array.from(amp, (v) => v * v * 2 + 3); // exact linear function of |psi|^2 = amp^2

    const corr = computeNuFieldEnergyCorrelation(nu, psi, geometry);
    expect(corr).toBeCloseTo(1, 9);
  });

  it('nu(x) exactly inverted relative to |psi(x)|^2 gives correlation -1', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;
    const amp = Float64Array.from({ length: size }, (_, k) => 1 + (k % 5));
    const psi: ComplexField = { real: amp, imag: new Float64Array(size) };
    const amp2 = Float64Array.from(amp, (v) => v * v);
    const maxAmp2 = Math.max(...amp2);
    const nu = Float64Array.from(amp2, (v) => maxAmp2 - v);

    const corr = computeNuFieldEnergyCorrelation(nu, psi, geometry);
    expect(corr).toBeCloseTo(-1, 9);
  });

  it('a uniform-amplitude psi against any nu gives a correlation of essentially 0, not NaN (degenerate/near-zero variance)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 5 });
    const size = geometry.N * geometry.N;
    const psi: ComplexField = { real: Float64Array.from({ length: size }, () => 1), imag: new Float64Array(size) };
    const nu = Float64Array.from({ length: size }, (_, k) => k * 0.3);

    const corr = computeNuFieldEnergyCorrelation(nu, psi, geometry);
    // amp^2 is mathematically constant here, but the weighted mean/variance
    // computation can leave floating-point-scale (not exactly zero) residual
    // variance - toBeCloseTo, not toBe, distinguishes "no real signal" from
    // an exact-zero guard that only fires on bit-exact degenerate input.
    expect(corr).not.toBeNaN();
    expect(Math.abs(corr)).toBeLessThan(1e-6);
  });

  it('throws if nu length does not match psi length', () => {
    const psi: ComplexField = { real: Float64Array.from([1, 2]), imag: new Float64Array(2) };
    const nu = new Float64Array(3);
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 2 });
    expect(() => computeNuFieldEnergyCorrelation(nu, psi, geometry)).toThrow();
  });
});
