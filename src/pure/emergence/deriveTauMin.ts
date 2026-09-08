/**
 * PUT-IN: omega (the drive's angular frequency) and nu0 (the baseline
 *   dissipation rate) - nothing else
 * EMERGED: tau_min, the L2 persistence threshold (in TIME units - the
 *   caller divides by dt to get ticks), derived from the two
 *   independent natural timescales the system already has: the drive
 *   period 2*pi/omega and the dissipation time 1/nu0
 * claim-tier: C2 (a definition, not a measurement - "correct" here
 *   means "derived without looking at any observed persistence value,"
 *   which src/tests/pure/deriveTauMin.test.ts checks structurally: this
 *   module has zero imports, so it cannot reference K7's or any other
 *   experiment's observed results even by accident)
 * floors (誠実な床): docs/vessel/K-series-II-brain-and-universe-plan.md
 *   K14's own instruction is "tau_min を K7 追加実験で見た値（34〜39）
 *   から逆算しない。独立した物理時間（駆動周期2π/ω、散逸時間1/ν₀）から
 *   導く" - it does not specify a formula beyond "derived from these two
 *   timescales." This module's choice - tau_min = max(2*pi/omega,
 *   1/nu0), the LARGER of the two, with no additional multiplier - is a
 *   judgment call made explicit here rather than hidden: persisting
 *   past whichever natural clock is slower is the minimal, principled
 *   notion of "notable" persistence (surviving less than either
 *   timescale is unsurprising almost by definition - one drive cycle or
 *   one dissipation time is not yet a claim of anything unusual). A
 *   fixed multiplier (e.g. 2x or 3x this value) was considered and
 *   rejected as an unjustified extra free parameter with no natural
 *   origin of its own.
 *
 * ## この零仮説較正コードは「本実験config」を一切importしない
 *
 * `docs/vessel/K-series-II-brain-and-universe-plan.md` K14が要求する
 * 「零仮説較正 → 閾値凍結 → commit バリア」規律のコミットバリア部分を、
 * このファイルへのimportを一切持たない設計そのもので満たす
 * （`src/tests/pure/deriveTauMin.test.ts`のソーススキャンで確認）。
 * 呼び出し側がomega・nu0という汎用的な数値だけを渡すので、このモジュールは
 * どの実験のどのconfigかを一切知りようがない。
 */

export function deriveTauMin(omega: number, nu0: number): number {
  if (!Number.isFinite(omega) || omega <= 0) {
    throw new Error(`deriveTauMin: omega must be a finite positive number, got ${omega}`);
  }
  if (!Number.isFinite(nu0) || nu0 <= 0) {
    throw new Error(`deriveTauMin: nu0 must be a finite positive number, got ${nu0}`);
  }
  const drivePeriod = (2 * Math.PI) / omega;
  const dissipationTime = 1 / nu0;
  return Math.max(drivePeriod, dissipationTime);
}
