/**
 * PUT-IN: M (ring cell count), dx (uniform cell spacing/"area" weight)
 * EMERGED: the 1D periodic ring geometry chi lives on
 * claim-tier: C1 (implemented; geometric validity checked in
 *   src/tests/pure/ringGeometry.test.ts)
 * floors (誠実な床): uniform spacing only - no curvature, no
 *   non-uniform cell sizing. This is deliberately the simplest possible
 *   1D periodic domain (see docs/vessel/K5-exchange-medium-adr.md
 *   choice 1 for why chi is a ring at all).
 *
 * χ の幾何は ψ のトーラスとは独立した、別個の1次元周期リングである。
 * M個のセルが dx 間隔で並び、セル M-1 の次はセル 0 に戻る（周期境界）。
 * dA_chi（このリングでの「面積」= 長さ要素）は全セルで一様に dx。
 *
 * dx は「境界セルとのdA整合」（`docs/vessel/K5-exchange-medium-adr.md`
 * 選択3）のため、呼び出し側がψの境界セルのcellAreaと一致させて渡す
 * ことを想定する（このモジュール自体はその整合を強制しない - それは
 * src/pure/exchange/coupling.ts 側の責務）。
 */

export interface ExchangeRingGeometry {
  readonly M: number;
  readonly dx: number;
  /** dA_chi per cell, uniformly dx. Length M. */
  readonly cellArea: Float64Array;
  readonly totalLength: number;
}

export function createExchangeRingGeometry(M: number, dx: number): ExchangeRingGeometry {
  if (!Number.isInteger(M) || M < 2) {
    throw new Error(`createExchangeRingGeometry: M must be an integer >= 2, got ${M}`);
  }
  if (!(Number.isFinite(dx) && dx > 0)) {
    throw new Error(`createExchangeRingGeometry: dx must be a finite positive number, got ${dx}`);
  }

  const cellArea = new Float64Array(M).fill(dx);
  return { M, dx, cellArea, totalLength: M * dx };
}
