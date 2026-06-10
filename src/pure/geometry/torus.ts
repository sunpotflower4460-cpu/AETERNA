import type { PurePhysicsParams } from '../params.ts';
import { validatePurePhysicsParams } from '../params.ts';

const TWO_PI = Math.PI * 2;

export interface TorusGeometry {
  R: number;
  r: number;
  gridSize: number;
  du: number;
  dv: number;
  u: Float64Array;
  v: Float64Array;
  dA: Float64Array;
  uFaceCoefficientByRow: Float64Array;
  vFaceCoefficientToNextRow: Float64Array;
  totalArea: number;
}

export function wrapIndex(index: number, gridSize: number): number {
  const wrapped = index % gridSize;
  return wrapped < 0 ? wrapped + gridSize : wrapped;
}

export function toIndex(i: number, j: number, gridSize: number): number {
  return wrapIndex(i, gridSize) * gridSize + wrapIndex(j, gridSize);
}

export function createTorusGeometry(params: PurePhysicsParams): TorusGeometry {
  const safeParams = validatePurePhysicsParams(params);
  const { R, r, gridSize } = safeParams;
  const du = TWO_PI / gridSize;
  const dv = TWO_PI / gridSize;
  const u = new Float64Array(gridSize);
  const v = new Float64Array(gridSize);
  const dA = new Float64Array(gridSize * gridSize);
  const uFaceCoefficientByRow = new Float64Array(gridSize);
  const vFaceCoefficientToNextRow = new Float64Array(gridSize);

  for (let i = 0; i < gridSize; i++) {
    u[i] = i * du;
  }

  for (let j = 0; j < gridSize; j++) {
    const vCenter = j * dv;
    const ringRadius = R + r * Math.cos(vCenter);
    v[j] = vCenter;
    uFaceCoefficientByRow[j] = (r / ringRadius) * (dv / du);

    const vFace = vCenter + dv / 2;
    vFaceCoefficientToNextRow[j] = ((R + r * Math.cos(vFace)) / r) * (du / dv);
  }

  let totalArea = 0;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const index = toIndex(i, j, gridSize);
      const area = r * (R + r * Math.cos(v[j])) * du * dv;
      dA[index] = area;
      totalArea += area;
    }
  }

  return {
    R,
    r,
    gridSize,
    du,
    dv,
    u,
    v,
    dA,
    uFaceCoefficientByRow,
    vFaceCoefficientToNextRow,
    totalArea,
  };
}
