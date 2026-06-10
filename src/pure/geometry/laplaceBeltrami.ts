import type { TorusGeometry } from './torus.ts';
import { toIndex } from './torus.ts';

export interface ComplexArrays {
  re: Float64Array;
  im: Float64Array;
}

export interface ComplexValue {
  re: number;
  im: number;
}

export function applyLaplaceBeltramiReal(input: Float64Array, geometry: TorusGeometry): Float64Array {
  const { gridSize, dA, uFaceCoefficientByRow, vFaceCoefficientToNextRow } = geometry;
  const expectedLength = gridSize * gridSize;
  if (input.length !== expectedLength) {
    throw new Error(`Expected field length ${expectedLength}, received ${input.length}`);
  }

  const output = new Float64Array(expectedLength);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const index = toIndex(i, j, gridSize);
      const center = input[index];
      const cU = uFaceCoefficientByRow[j];
      const cVForward = vFaceCoefficientToNextRow[j];
      const cVBackward = vFaceCoefficientToNextRow[(j - 1 + gridSize) % gridSize];

      const accumulated =
        cU * (input[toIndex(i + 1, j, gridSize)] - center) +
        cU * (input[toIndex(i - 1, j, gridSize)] - center) +
        cVForward * (input[toIndex(i, j + 1, gridSize)] - center) +
        cVBackward * (input[toIndex(i, j - 1, gridSize)] - center);

      output[index] = accumulated / dA[index];
    }
  }

  return output;
}

export function applyLaplaceBeltramiComplex(input: ComplexArrays, geometry: TorusGeometry): ComplexArrays {
  return {
    re: applyLaplaceBeltramiReal(input.re, geometry),
    im: applyLaplaceBeltramiReal(input.im, geometry),
  };
}

export function weightedInnerProductReal(
  left: Float64Array,
  right: Float64Array,
  geometry: TorusGeometry,
): number {
  const { dA } = geometry;
  if (left.length !== right.length || left.length !== dA.length) {
    throw new Error('Weighted inner product arrays must match geometry length');
  }

  let sum = 0;
  for (let index = 0; index < dA.length; index++) {
    sum += left[index] * right[index] * dA[index];
  }

  return sum;
}

export function weightedInnerProductComplex(
  left: ComplexArrays,
  right: ComplexArrays,
  geometry: TorusGeometry,
): ComplexValue {
  const { dA } = geometry;
  if (
    left.re.length !== dA.length ||
    left.im.length !== dA.length ||
    right.re.length !== dA.length ||
    right.im.length !== dA.length
  ) {
    throw new Error('Weighted inner product arrays must match geometry length');
  }

  let re = 0;
  let im = 0;
  for (let index = 0; index < dA.length; index++) {
    re += (left.re[index] * right.re[index] + left.im[index] * right.im[index]) * dA[index];
    im += (left.re[index] * right.im[index] - left.im[index] * right.re[index]) * dA[index];
  }

  return { re, im };
}
