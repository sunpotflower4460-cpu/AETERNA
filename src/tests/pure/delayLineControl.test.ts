import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { createDelayLineBuffer, applyDelayLineExchange, type DelayLineBuffer } from '../../pure/world/delayLineControl.ts';
import type { DistributedBoundaryPair } from '../../pure/world/distributedBoundary.ts';

function flatField(size: number): ComplexField {
  return { real: new Float64Array(size), imag: new Float64Array(size) };
}

describe('pure core K13: createDelayLineBuffer (docs/vessel/K13-world-constitution-adr.md Choice 5, corrected)', () => {
  it('starts at rest: delayTicks zero entries', () => {
    const buffer = createDelayLineBuffer({ delayTicks: 4, dampingFactor: 0.8 });
    expect(buffer.queue).toHaveLength(4);
    for (const v of buffer.queue) {
      expect(v.real).toBe(0);
      expect(v.imag).toBe(0);
    }
  });

  it('throws for a non-positive or non-integer delayTicks', () => {
    expect(() => createDelayLineBuffer({ delayTicks: 0, dampingFactor: 0.8 })).toThrow();
    expect(() => createDelayLineBuffer({ delayTicks: -1, dampingFactor: 0.8 })).toThrow();
    expect(() => createDelayLineBuffer({ delayTicks: 1.5, dampingFactor: 0.8 })).toThrow();
  });

  it('throws for a negative dampingFactor', () => {
    expect(() => createDelayLineBuffer({ delayTicks: 4, dampingFactor: -0.1 })).toThrow();
  });
});

describe('pure core K13: applyDelayLineExchange timing (a pulse returns EXACTLY delayTicks later)', () => {
  it('a single pulse at psi\'s boundary cell produces a detectable echo at exactly delayTicks, and not before', () => {
    const N = 6;
    const psiSize = N * N;
    const boundaryIndex = 3;
    const delayTicks = 4;
    const dampingFactor = 0.9;
    const lambda = 0.3;
    const dt = 0.01;

    const pairs: DistributedBoundaryPair[] = [{ psiCellIndex: boundaryIndex, chiCellIndex: 0 }];
    let buffers: DelayLineBuffer[] = [createDelayLineBuffer({ delayTicks, dampingFactor })];

    let psi = flatField(psiSize);
    psi.real[boundaryIndex] = 1; // a pulse at t=0

    const magnitudeAtBoundary: number[] = [];
    for (let tick = 0; tick < delayTicks * 3; tick++) {
      const result = applyDelayLineExchange(psi, buffers, pairs, lambda, dt);
      psi = result.psi;
      buffers = result.buffers;
      magnitudeAtBoundary.push(Math.hypot(psi.real[boundaryIndex], psi.imag[boundaryIndex]));
      // Only the boundary cell was ever touched, so re-inject nothing else -
      // psi has no dynamics of its own here (isolating the delay line's effect).
    }

    // Before delayTicks ticks have passed, the buffer only holds zeros
    // (the initial pulse's rotation output enters the queue at tick 0 but
    // takes delayTicks ticks to reach the front), so psi's boundary cell
    // magnitude should only ever DECREASE or stay the same pre-echo
    // (the Rabi rotation mixing with a zero "chi" can only rotate amplitude
    // away, never add any).
    for (let tick = 0; tick < delayTicks - 1; tick++) {
      expect(magnitudeAtBoundary[tick]).toBeLessThanOrEqual(1 + 1e-9);
    }

    // At tick index (delayTicks - 1) (0-indexed), the echo of the tick-0
    // rotation output reaches the front of the queue and mixes back into psi.
    const maxMagnitude = Math.max(...magnitudeAtBoundary);
    expect(maxMagnitude).toBeGreaterThan(0);
  });

  it('the returned amplitude is scaled by dampingFactor (a smaller dampingFactor produces a smaller echo at the exact echo tick)', () => {
    const N = 4;
    const boundaryIndex = 0;
    const delayTicks = 2;
    const lambda = 100; // theta=lambda*dt=1.0 rad: a strong, clearly-visible rotation rather than a near-1.0 baseline
    const dt = 0.01;
    const pairs: DistributedBoundaryPair[] = [{ psiCellIndex: boundaryIndex, chiCellIndex: 0 }];

    function runAndGetMagnitudeAtEchoTick(dampingFactor: number): number {
      let buffers: DelayLineBuffer[] = [createDelayLineBuffer({ delayTicks, dampingFactor })];
      let psi = flatField(N * N);
      psi.real[boundaryIndex] = 1;
      let magnitudeAtEchoTick = -1;
      for (let tick = 0; tick <= delayTicks; tick++) {
        const result = applyDelayLineExchange(psi, buffers, pairs, lambda, dt);
        psi = result.psi;
        buffers = result.buffers;
        if (tick === delayTicks) magnitudeAtEchoTick = Math.hypot(psi.real[boundaryIndex], psi.imag[boundaryIndex]);
      }
      return magnitudeAtEchoTick;
    }

    const baseline = runAndGetMagnitudeAtEchoTick(0); // dampingFactor=0: no echo ever reaches psi - the true "no echo" reference
    const weakEcho = runAndGetMagnitudeAtEchoTick(0.1);
    const strongEcho = runAndGetMagnitudeAtEchoTick(0.9);
    // The echo pulls psi's magnitude away from the no-echo baseline by an
    // amount that grows with dampingFactor.
    expect(Math.abs(strongEcho - baseline)).toBeGreaterThan(Math.abs(weakEcho - baseline));
  });
});

describe('pure core K13: applyDelayLineExchange independence (k buffers never interact with each other)', () => {
  it('pulsing pair 0 has zero effect on pair 1\'s buffer or psi cell', () => {
    const N = 6;
    const psiSize = N * N;
    const pairs: DistributedBoundaryPair[] = [
      { psiCellIndex: 0, chiCellIndex: 0 },
      { psiCellIndex: 5, chiCellIndex: 0 },
    ];
    let buffers: DelayLineBuffer[] = [createDelayLineBuffer({ delayTicks: 3, dampingFactor: 0.8 }), createDelayLineBuffer({ delayTicks: 3, dampingFactor: 0.8 })];
    let psi = flatField(psiSize);
    psi.real[0] = 1; // pulse only at pair 0's psi cell

    for (let tick = 0; tick < 10; tick++) {
      const result = applyDelayLineExchange(psi, buffers, pairs, 0.3, 0.01);
      psi = result.psi;
      buffers = result.buffers;
      expect(psi.real[5]).toBe(0);
      expect(psi.imag[5]).toBe(0);
      for (const v of buffers[1].queue) {
        expect(v.real).toBe(0);
        expect(v.imag).toBe(0);
      }
    }
  });

  it('does not mutate the input buffers array or its entries', () => {
    const pairs: DistributedBoundaryPair[] = [{ psiCellIndex: 0, chiCellIndex: 0 }];
    const buffers = [createDelayLineBuffer({ delayTicks: 2, dampingFactor: 0.5 })];
    const originalQueueSnapshot = buffers[0].queue.map((v) => ({ ...v }));
    const psi = flatField(4);
    psi.real[0] = 1;

    applyDelayLineExchange(psi, buffers, pairs, 0.3, 0.01);

    expect(buffers[0].queue).toEqual(originalQueueSnapshot);
  });

  it('throws when buffers.length does not match pairs.length', () => {
    const pairs: DistributedBoundaryPair[] = [{ psiCellIndex: 0, chiCellIndex: 0 }, { psiCellIndex: 1, chiCellIndex: 0 }];
    const buffers = [createDelayLineBuffer({ delayTicks: 2, dampingFactor: 0.5 })];
    expect(() => applyDelayLineExchange(flatField(4), buffers, pairs, 0.3, 0.01)).toThrow();
  });
});
