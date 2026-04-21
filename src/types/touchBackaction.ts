/**
 * Touch Backaction State
 *
 * AETERNA v0.5 / Quantum-Inspired Q1-2
 *
 * touch を state-dependent weighting で通すための最小 backaction 記述。
 * literal な量子測定ではなく、current state による微小な入り方の差分を表す。
 */
export interface TouchBackactionState {
  /** Frame timestamp */
  timestamp: number;
  /** touch 全体が organism に与える書き換え強度 */
  backactionGain: number;
  /** same touch に対する surprise 増減 */
  surpriseGain: number;
  /** 境界経由の受け方の変化 */
  boundaryModulation: number;
  /** 開き具合による通りやすさの変化 */
  opennessModulation: number;
  /** touch 後のまとまりの崩れ/整いやすさ傾き (微小) */
  coherenceShift: number;
  /** awarenessWindow と結びついた前景化のしやすさ */
  awarenessCoupling: number;
  /** 過負荷時に同じ touch が強く刺さる度合い */
  overloadAmplification: number;
  /** 慣れた touch による surprise 減衰 */
  familiarityDamping: number;
}
