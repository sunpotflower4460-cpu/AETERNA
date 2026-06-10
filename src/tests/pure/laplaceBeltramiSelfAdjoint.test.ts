import { describe, expect, it } from 'vitest';
import {
  applyLaplaceBeltramiComplex,
  applyLaplaceBeltramiReal,
  weightedInnerProductComplex,
  weightedInnerProductReal,
} from '../../pure/geometry/laplaceBeltrami.ts';
import { createTorusGeometry, toIndex } from '../../pure/geometry/torus.ts';
import { createPurePhysicsParams } from '../../pure/params.ts';
import { createSeededPrng } from '../../pure/random/seededPrng.ts';

function createRandomField(length: number, seed: number): Float64Array {
  const random = createSeededPrng(seed);
  const field = new Float64Array(length);
  for (let index = 0; index < length; index++) {
    field[index] = random() - 0.5;
  }
  return field;
}

function maxAbs(values: Float64Array): number {
  let result = 0;
  for (const value of values) {
    const absValue = Math.abs(value);
    if (absValue > result) result = absValue;
  }
  return result;
}

describe('PURE Laplace-Beltrami operator', () => {
  it('is self-adjoint for real fields under the dA-weighted inner product', () => {
    const geometry = createTorusGeometry(createPurePhysicsParams({ gridSize: 48 }));
    const phi = createRandomField(geometry.dA.length, 10);
    const psi = createRandomField(geometry.dA.length, 20);
    const laplacePhi = applyLaplaceBeltramiReal(phi, geometry);
    const laplacePsi = applyLaplaceBeltramiReal(psi, geometry);

    const left = weightedInnerProductReal(phi, laplacePsi, geometry);
    const right = weightedInnerProductReal(laplacePhi, psi, geometry);
    const scale = Math.abs(left) + Math.abs(right) + 1;

    expect(Math.abs(left - right) / scale).toBeLessThan(1e-13);
  });

  it('is self-adjoint for complex fields under the dA-weighted inner product', () => {
    const geometry = createTorusGeometry(createPurePhysicsParams({ gridSize: 48 }));
    const phi = {
      re: createRandomField(geometry.dA.length, 30),
      im: createRandomField(geometry.dA.length, 31),
    };
    const psi = {
      re: createRandomField(geometry.dA.length, 40),
      im: createRandomField(geometry.dA.length, 41),
    };
    const laplacePhi = applyLaplaceBeltramiComplex(phi, geometry);
    const laplacePsi = applyLaplaceBeltramiComplex(psi, geometry);

    const left = weightedInnerProductComplex(phi, laplacePsi, geometry);
    const right = weightedInnerProductComplex(laplacePhi, psi, geometry);
    const reScale = Math.abs(left.re) + Math.abs(right.re) + 1;
    const imScale = Math.abs(left.im) + Math.abs(right.im) + 1;

    expect(Math.abs(left.re - right.re) / reScale).toBeLessThan(1e-13);
    expect(Math.abs(left.im - right.im) / imScale).toBeLessThan(1e-13);
  });

  it('is negative semidefinite for random complex fields', () => {
    const geometry = createTorusGeometry(createPurePhysicsParams({ gridSize: 48 }));
    const psi = {
      re: createRandomField(geometry.dA.length, 50),
      im: createRandomField(geometry.dA.length, 51),
    };
    const laplacePsi = applyLaplaceBeltramiComplex(psi, geometry);
    const energy = weightedInnerProductComplex(psi, laplacePsi, geometry);

    expect(energy.re).toBeLessThanOrEqual(1e-12);
    expect(Math.abs(energy.im) / (Math.abs(energy.re) + 1)).toBeLessThan(1e-14);
  });

  it('maps a constant field to zero', () => {
    const geometry = createTorusGeometry(createPurePhysicsParams({ gridSize: 48 }));
    const constant = new Float64Array(geometry.dA.length).fill(3.25);
    const laplaceConstant = applyLaplaceBeltramiReal(constant, geometry);

    expect(maxAbs(laplaceConstant)).toBe(0);
  });

  it('converges at second order for cos(u)', () => {
    const errors = [32, 64, 128].map((gridSize) => {
      const params = createPurePhysicsParams({ R: 2, r: 0.7, gridSize });
      const geometry = createTorusGeometry(params);
      const field = new Float64Array(gridSize * gridSize);

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          field[toIndex(i, j, gridSize)] = Math.cos(geometry.u[i]);
        }
      }

      const laplaceField = applyLaplaceBeltramiReal(field, geometry);
      let error = 0;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const index = toIndex(i, j, gridSize);
          const expected = -Math.cos(geometry.u[i]) / ((params.R + params.r * Math.cos(geometry.v[j])) ** 2);
          const localError = Math.abs(laplaceField[index] - expected);
          if (localError > error) error = localError;
        }
      }

      return error;
    });

    const coarseRatio = errors[0] / errors[1];
    const fineRatio = errors[1] / errors[2];

    expect(coarseRatio).toBeGreaterThan(3.5);
    expect(coarseRatio).toBeLessThan(4.5);
    expect(fineRatio).toBeGreaterThan(3.5);
    expect(fineRatio).toBeLessThan(4.5);
  });
});
