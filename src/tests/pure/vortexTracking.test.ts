import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { detectVortexCandidates } from '../../pure/observe/vortexCandidates.ts';
import type { VortexCandidate } from '../../pure/observe/vortexCandidates.ts';
import { trackVortices, evaluateL3, type TrackedVortex } from '../../pure/observe/vortexTracking.ts';

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

describe('pure core K11 (L3): vortex identity tracking on hand-constructed candidate histories', () => {
  it('a stationary defect (same cell, same sign, every tick) forms one track with zero grid velocity throughout - does NOT satisfy L3', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 10 });
    const history: VortexCandidate[][] = Array.from({ length: 5 }, () => [{ cellIndex: 44, winding: 1 }]);

    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    expect(tracks).toHaveLength(1);
    expect(tracks[0].samples).toHaveLength(5);
    for (let k = 1; k < 5; k++) {
      expect(tracks[0].samples[k].gridVelocity).toEqual({ di: 0, dj: 0 });
    }

    const [judgment] = evaluateL3(tracks);
    expect(judgment.comVelocityNonzero).toBe(false);
    expect(judgment.circulationNonzero).toBe(true);
    expect(judgment.satisfiesL3).toBe(false);
    expect(judgment.lifetimeTicks).toBe(5);
  });

  it('a defect moving by +1 cell in j every tick forms one continuous track with nonzero grid velocity - satisfies L3', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const history: VortexCandidate[][] = Array.from({ length: 6 }, (_, tick) => [{ cellIndex: 2 * N + tick, winding: 1 }]);

    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 }, 0.01);
    expect(tracks).toHaveLength(1);
    expect(tracks[0].samples).toHaveLength(6);
    for (let k = 1; k < 6; k++) {
      expect(tracks[0].samples[k].gridVelocity).toEqual({ di: 0, dj: 1 });
      expect(tracks[0].samples[k].physicalVelocity).toBeDefined();
      expect(tracks[0].samples[k].physicalVelocity!.vPhi).toBeGreaterThan(0);
    }

    const [judgment] = evaluateL3(tracks);
    expect(judgment.comVelocityNonzero).toBe(true);
    expect(judgment.satisfiesL3).toBe(true);
  });

  it('a defect crossing the periodic seam (j: N-1 -> 0) is tracked as continuous motion, not a large jump', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const history: VortexCandidate[][] = [
      [{ cellIndex: 3 * N + (N - 1), winding: 1 }],
      [{ cellIndex: 3 * N + 0, winding: 1 }],
    ];

    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    expect(tracks).toHaveLength(1);
    expect(tracks[0].samples[1].gridVelocity).toEqual({ di: 0, dj: 1 });
  });

  it('a uniform field (no candidates at any tick) produces zero tracks', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const history: VortexCandidate[][] = Array.from({ length: 10 }, () => []);
    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    expect(tracks).toHaveLength(0);
  });

  it('a defect moving farther than maxDisplacementCells per tick is NOT linked into one track (the tracker refuses to invent implausible motion)', () => {
    const N = 20;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const history: VortexCandidate[][] = [
      [{ cellIndex: 2 * N + 0, winding: 1 }],
      [{ cellIndex: 2 * N + 10, winding: 1 }],
    ];
    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 2 });
    expect(tracks).toHaveLength(2);
    expect(tracks[0].samples).toHaveLength(1);
    expect(tracks[1].samples).toHaveLength(1);
  });

  it('a turbulent field of independently-relocating defects produces only short-lived tracks, never one spanning the whole run', () => {
    const N = 30;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    // Deterministic pseudo-random cell positions, each tick's set unrelated to the last (jumps far exceed the threshold).
    let seed = 12345;
    const nextInt = (max: number): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % max;
    };
    const history: VortexCandidate[][] = Array.from({ length: 20 }, () =>
      Array.from({ length: 6 }, () => ({ cellIndex: nextInt(N * N), winding: nextInt(2) === 0 ? 1 : -1 })),
    );

    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    const longestLifetime = Math.max(...tracks.map((t) => t.samples.length));
    expect(longestLifetime).toBeLessThan(20);
    const longestJudgment = evaluateL3(tracks).reduce((a, b) => (b.lifetimeTicks > a.lifetimeTicks ? b : a));
    expect(longestJudgment.lifetimeTicks).toBeLessThan(20);
  });

  it('opposite-sign candidates at the same location on consecutive ticks are NOT linked (sign must match)', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const history: VortexCandidate[][] = [
      [{ cellIndex: 44, winding: 1 }],
      [{ cellIndex: 44, winding: -1 }],
    ];
    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    expect(tracks).toHaveLength(2);
    expect(tracks[0].sign).toBe(1);
    expect(tracks[1].sign).toBe(-1);
  });

  it('two same-sign candidates passing near each other: greedy assignment is documented, not asserted globally optimal - the result is deterministic and no track silently gains a wrong sign', () => {
    const N = 20;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    // Two +1 defects several cells apart, drifting toward and past each other.
    const history: VortexCandidate[][] = [
      [{ cellIndex: 5 * N + 2, winding: 1 }, { cellIndex: 5 * N + 6, winding: 1 }],
      [{ cellIndex: 5 * N + 3, winding: 1 }, { cellIndex: 5 * N + 5, winding: 1 }],
      [{ cellIndex: 5 * N + 4, winding: 1 }, { cellIndex: 5 * N + 4, winding: 1 }],
    ];
    const runOnce = (): TrackedVortex[] => trackVortices(history, geometry, { maxDisplacementCells: 1 });
    const a = runOnce();
    const b = runOnce();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (const track of a) {
      expect(track.sign).toBe(1);
    }
  });

  it('throws for a negative or non-integer maxDisplacementCells', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    expect(() => trackVortices([], geometry, { maxDisplacementCells: -1 })).toThrow();
    expect(() => trackVortices([], geometry, { maxDisplacementCells: 1.5 })).toThrow();
  });

  it('is deterministic across repeated calls on the same input', () => {
    const N = 12;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const history: VortexCandidate[][] = Array.from({ length: 8 }, (_, tick) => [{ cellIndex: 1 * N + (tick % N), winding: 1 }]);
    const a = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    const b = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('pure core K11 (L3): end-to-end through detectVortexCandidates on real hand-constructed phase fields', () => {
  it('a four-quadrant defect relocated by +1 in j each tick is detected and tracked as one moving structure that satisfies L3', () => {
    const N = 16;
    const i0 = 6;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });

    const history: VortexCandidate[][] = [];
    for (let tick = 0; tick < 5; tick++) {
      const j0 = 4 + tick;
      const psi = fourQuadrantVortexField(N, i0, j0, 1);
      history.push(detectVortexCandidates(psi, geometry));
    }

    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 2 });
    // The core defect at (i0, j0(tick)) should be trackable across all 5 ticks (allow some slack for the
    // periodic-domain companion defects fourQuadrantVortexField's own doc says necessarily exist elsewhere on the grid).
    const coreTrack = tracks.find((t) => t.samples[0].i === i0 && t.samples[0].j === 4 && t.samples.length === 5);
    expect(coreTrack).toBeDefined();

    const [judgment] = evaluateL3([coreTrack!]);
    expect(judgment.comVelocityNonzero).toBe(true);
    expect(judgment.satisfiesL3).toBe(true);
  });

  it('a stationary four-quadrant defect (same phase field every tick) is detected at the same place every tick and does NOT satisfy L3', () => {
    const N = 12;
    const i0 = 5;
    const j0 = 5;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const psi = fourQuadrantVortexField(N, i0, j0, 1);

    const history: VortexCandidate[][] = Array.from({ length: 5 }, () => detectVortexCandidates(psi, geometry));
    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    const coreTrack = tracks.find((t) => t.samples[0].i === i0 && t.samples[0].j === j0);
    expect(coreTrack).toBeDefined();
    expect(coreTrack!.samples).toHaveLength(5);

    const [judgment] = evaluateL3([coreTrack!]);
    expect(judgment.comVelocityNonzero).toBe(false);
    expect(judgment.satisfiesL3).toBe(false);
  });

  it('a uniform-phase field (no defects) yields zero tracks', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const psi: ComplexField = { real: new Float64Array(N * N).fill(Math.cos(0.4)), imag: new Float64Array(N * N).fill(Math.sin(0.4)) };
    const history: VortexCandidate[][] = Array.from({ length: 5 }, () => detectVortexCandidates(psi, geometry));
    const tracks = trackVortices(history, geometry, { maxDisplacementCells: 1 });
    expect(tracks).toHaveLength(0);
  });
});
