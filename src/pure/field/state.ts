import type { PurePhysicsParams } from '../params.ts';
import { validatePurePhysicsParams } from '../params.ts';
import { createSeededPrng } from '../random/seededPrng.ts';

export interface PureFieldState {
  gridSize: number;
  psiRe: Float64Array;
  psiIm: Float64Array;
  nu: Float64Array;
}

export function createPureFieldState(params: PurePhysicsParams): PureFieldState {
  const safeParams = validatePurePhysicsParams(params);
  const { gridSize, nu0, seed } = safeParams;
  const cellCount = gridSize * gridSize;
  const psiRe = new Float64Array(cellCount);
  const psiIm = new Float64Array(cellCount);
  const nu = new Float64Array(cellCount);
  const random = createSeededPrng(seed);

  for (let index = 0; index < cellCount; index++) {
    psiRe[index] = random() - 0.5;
    psiIm[index] = random() - 0.5;
    nu[index] = nu0;
  }

  return {
    gridSize,
    psiRe,
    psiIm,
    nu,
  };
}

export function clonePureFieldState(state: PureFieldState): PureFieldState {
  return {
    gridSize: state.gridSize,
    psiRe: new Float64Array(state.psiRe),
    psiIm: new Float64Array(state.psiIm),
    nu: new Float64Array(state.nu),
  };
}
