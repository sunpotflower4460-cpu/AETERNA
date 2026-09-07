/**
 * PUT-IN: nothing beyond what transducer.ts's ChiTransducer already
 *   requires (signal, t, cellCount)
 * EMERGED: two minimal, deliberately uninteresting transducers used to
 *   exercise and test the transducer/replay mechanism itself
 * claim-tier: C1 (implemented; not claimed to model any real sensor,
 *   audio, or text input - see floors)
 * floors (誠実な床): these are test fixtures, not the "declared
 *   transducers" the K15 plan means by "センサー・音・テキストの
 *   エネルギー化". Per K15-runtime-design.md Choice 4's own floor, no
 *   meaningful signal-to-J_chi mapping is decided in this PR. Both
 *   transducers below are registered in docs/vessel/K15-transducer-
 *   catalog.md as K15-M1/K15-M2.
 */

import type { ChiTransducer } from './transducer.ts';

/** K15-M1: adds one constant real amplitude, uniformly, to every cell of chi's drive. Signal is that amplitude itself. */
export const uniformAmplitudeTransducer: ChiTransducer<number> = {
  id: 'K15-M1',
  description: '一定振幅を全セルへ一様に加算するテスト用変換器。信号は加算する実数振幅そのもの。',
  toChiDriveContribution: (signal, _t, cellCount) => new Float64Array(cellCount).fill(signal),
};

export interface SingleCellPulseSignal {
  cellIndex: number;
  amplitude: number;
}

/** K15-M2: adds a pulse amplitude to exactly one named cell of chi's drive, zero elsewhere. */
export const singleCellPulseTransducer: ChiTransducer<SingleCellPulseSignal> = {
  id: 'K15-M2',
  description: '指定した1セルにのみパルス振幅を加算するテスト用変換器。',
  toChiDriveContribution: (signal, _t, cellCount) => {
    if (!Number.isInteger(signal.cellIndex) || signal.cellIndex < 0 || signal.cellIndex >= cellCount) {
      throw new Error(`singleCellPulseTransducer: cellIndex ${signal.cellIndex} out of range [0, ${cellCount})`);
    }
    const contribution = new Float64Array(cellCount);
    contribution[signal.cellIndex] = signal.amplitude;
    return contribution;
  },
};
