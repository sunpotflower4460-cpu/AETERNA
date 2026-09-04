/**
 * PUT-IN: a complex field psi, its TorusGeometry; for persistence
 *   tracking, a per-tick series of prior detection results
 * EMERGED: per-plaquette integer phase-winding numbers ("candidates" -
 *   a topological measurement, not a claim that a physical vortex
 *   exists as a confirmed structure - see docs/vessel/claim-ladder.md's
 *   Candidate kind); for persistence, how many consecutive ticks each
 *   plaquette held a same-signed nonzero winding
 * claim-tier: C2 (unit-validated against hand-constructed phase fields
 *   with a known planted winding number; this is a measurement
 *   instrument, not yet a claim about what AETERNA's dynamics produce -
 *   that is K6/K7's job, using this frozen instrument)
 * floors (誠実な床): winding is computed from psi's phase alone. At a
 *   cell where |psi|=0 exactly the phase is undefined (atan2(0,0)=0 in
 *   JS, not a genuine phase) - a vortex core is expected to sit at
 *   such a point in the continuum, so this discrete detector reports
 *   the winding of the plaquette AROUND that point, not the point
 *   itself. This module never reads N, H, nu, or any ledger value - it
 *   only reads psi's phase. It has no reachable path back into
 *   src/pure/field, src/pure/ledger, src/pure/drive, or src/pure/medium
 *   (checked by src/tests/pure/observerNonIntervention.test.ts and the
 *   forbidden-pattern import-direction scan).
 *
 * ## 手法（標準的な位相欠陥検出：離散circulationの量子化）
 *
 * セル (i,j),(i,j+1),(i+1,j+1),(i+1,j) の4点を反時計回りに結ぶ閉路
 * について、隣接点間の位相差を (-pi, pi] に wrap してから合計する。
 * 任意の閉路について、wrap後の位相差の合計は厳密に 2*pi*n
 * （nは整数）になる（circulationの量子化 - 標準的な結果で、GPE/BEC
 * における渦検出の標準手法）。n が非ゼロならその閉路（plaquette）は
 * 位相特異点（vortex candidate）を1個以上含む。
 *
 * 自己維持（自己維持: track_vortex_persistence）は、呼び出し側が
 * 複数tickにわたって集めた検出結果の履歴を受け取り、各plaquetteが
 * 同符号の非ゼロwindingを連続して保持した最長tick数を返す
 * （Aeterna-Genesis/docs/EMERGENCE_LEVELS.md の
 * tracked_id_lifetime 判定に相当する生データ）。
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { TorusGeometry } from '../geometry/torus.ts';

export interface VortexCandidate {
  /** Flattened index of the plaquette's anchor cell (i*N+j); the plaquette spans (i,j)-(i,j+1)-(i+1,j+1)-(i+1,j). */
  cellIndex: number;
  /** Integer winding number (nonzero by construction - zero-winding plaquettes are not reported). */
  winding: number;
}

function wrapToPi(angle: number): number {
  let wrapped = angle % (2 * Math.PI);
  if (wrapped > Math.PI) wrapped -= 2 * Math.PI;
  if (wrapped <= -Math.PI) wrapped += 2 * Math.PI;
  return wrapped;
}

export function detectVortexCandidates(psi: ComplexField, geometry: TorusGeometry): VortexCandidate[] {
  const { N } = geometry;
  const theta = new Float64Array(psi.real.length);
  for (let k = 0; k < psi.real.length; k++) {
    theta[k] = Math.atan2(psi.imag[k], psi.real[k]);
  }

  const candidates: VortexCandidate[] = [];
  for (let i = 0; i < N; i++) {
    const iPlus = (i + 1) % N;
    for (let j = 0; j < N; j++) {
      const jPlus = (j + 1) % N;
      const idx00 = i * N + j;
      const idx01 = i * N + jPlus;
      const idx11 = iPlus * N + jPlus;
      const idx10 = iPlus * N + j;

      const circulation =
        wrapToPi(theta[idx01] - theta[idx00]) +
        wrapToPi(theta[idx11] - theta[idx01]) +
        wrapToPi(theta[idx10] - theta[idx11]) +
        wrapToPi(theta[idx00] - theta[idx10]);

      const winding = Math.round(circulation / (2 * Math.PI));
      if (winding !== 0) {
        candidates.push({ cellIndex: idx00, winding });
      }
    }
  }

  return candidates;
}

/**
 * Given a per-tick series of detectVortexCandidates() results, returns
 * for each plaquette (by cellIndex) the longest run of CONSECUTIVE ticks
 * in which it held a nonzero winding of the same sign. A plaquette never
 * appearing is absent from the returned map (not present with value 0).
 */
export function trackVortexPersistence(candidateHistory: readonly VortexCandidate[][]): Map<number, number> {
  const currentRun = new Map<number, { sign: number; length: number }>();
  const maxRun = new Map<number, number>();

  for (const tickCandidates of candidateHistory) {
    const presentThisTick = new Map<number, number>();
    for (const candidate of tickCandidates) {
      presentThisTick.set(candidate.cellIndex, Math.sign(candidate.winding));
    }

    for (const [cellIndex, sign] of presentThisTick) {
      const running = currentRun.get(cellIndex);
      if (running && running.sign === sign) {
        running.length += 1;
      } else {
        currentRun.set(cellIndex, { sign, length: 1 });
      }
      const running2 = currentRun.get(cellIndex)!;
      maxRun.set(cellIndex, Math.max(maxRun.get(cellIndex) ?? 0, running2.length));
    }

    for (const cellIndex of currentRun.keys()) {
      if (!presentThisTick.has(cellIndex)) {
        currentRun.delete(cellIndex);
      }
    }
  }

  return maxRun;
}

export interface VortexPersistenceCheck {
  satisfied: boolean;
  /** The longest consecutive same-sign run found across all plaquettes, in ticks. */
  maxPersistenceTicks: number;
}

/**
 * A single, mechanically-defined, non-judgmental condition for use with
 * src/pure/run/parameterSweep.ts: "did any plaquette hold a same-signed
 * winding defect for at least `thresholdTicks` consecutive ticks?" This
 * is raw data (Aeterna-Genesis/docs/EMERGENCE_LEVELS.md's
 * `persistence > tau_min` ingredient), not a claim that persistence at
 * that threshold constitutes any particular emergence level - the
 * threshold and its interpretation are a K6/K7 pre-registration
 * decision, not this function's.
 */
export function vortexPersistenceAtLeast(thresholdTicks: number): (candidateHistory: readonly VortexCandidate[][]) => VortexPersistenceCheck {
  return (candidateHistory) => {
    const persistence = trackVortexPersistence(candidateHistory);
    let maxPersistenceTicks = 0;
    for (const length of persistence.values()) {
      maxPersistenceTicks = Math.max(maxPersistenceTicks, length);
    }
    return { satisfied: maxPersistenceTicks >= thresholdTicks, maxPersistenceTicks };
  };
}
