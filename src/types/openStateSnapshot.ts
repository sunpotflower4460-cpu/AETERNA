/**
 * Open-State Snapshot
 *
 * AETERNA v0.5 / Quantum-Inspired Q1-1
 *
 * Open-State Snapshot は literal な量子状態ではなく、
 * AETERNA の複数内部傾向の mixed-state 的 snapshot である。
 *
 * Purpose:
 * - 複数の内部傾向の混合状態を観測・保持できるようにする
 * - felt-state / arousal-awareness / need-motivation の混合比を表現する
 * - 安定性と混合度合いを proxy として評価する
 *
 * Important:
 * - これは literal quantum state ではない
 * - 主ループの主因にはならない (今は観測層のみ)
 * - stabilityIndex と mixtureEntropy は derived / proxy 扱い
 * - dominantPole は observer / debug 用の便宜的タグ
 */

export interface OpenStateSnapshot {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Felt-State Mix
   *
   * organism の felt-state 混合状態
   */
  feltMix: {
    /** Depletion: 0 (no depletion) to 1+ (severe depletion) */
    depletion: number;
    /** Overload: 0 (no overload) to 1+ (severe overload) */
    overload: number;
    /** Coherence: 0 (incoherent) to 1 (highly coherent) */
    coherence: number;
    /** Boundary Integrity: 0 (boundary loss) to 1 (strong boundary) */
    boundaryIntegrity: number;
    /** Restoration Readiness: 0 (no restoration) to 1 (high restoration readiness) */
    restorationReadiness: number;
    /** Perturbation Load: 0 (calm) to 1+ (high perturbation) */
    perturbationLoad: number;
    /** Openness: 0 (closed) to 1 (open) */
    openness: number;
  };

  /**
   * Activation Mix
   *
   * 活動・前景化の混合状態
   */
  activationMix: {
    /** Arousal Level: 0 (minimal) to 1 (high arousal) */
    arousalLevel: number;
    /** Awareness Window: 0 (narrow) to 1 (wide) */
    awarenessWindow: number;
    /** Salience Openness: 0 (closed) to 1 (open) */
    salienceOpenness: number;
    /** Foreground Pressure: 0 (low) to 1 (high pressure) */
    foregroundPressure: number;
  };

  /**
   * Drive Mix
   *
   * need / motivation の混合状態
   */
  driveMix: {
    /** Energy Need: 0 (no energy need) to 1+ (severe energy deficiency) */
    energyNeed: number;
    /** Safety Need: 0 (no safety need) to 1+ (severe safety pressure) */
    safetyNeed: number;
    /** Restoration Need: 0 (no restoration need) to 1 (high restoration pressure) */
    restorationNeed: number;
    /** Novelty Motivation: 0 (no novelty tendency) to 1 (strong novelty tendency) */
    noveltyMotivation: number;
    /** Repetition Motivation: 0 (no repetition tendency) to 1 (strong repetition tendency) */
    repetitionMotivation: number;
    /** Exploration Motivation: 0 (no exploration tendency) to 1 (strong exploration tendency) */
    explorationMotivation: number;
  };

  /**
   * Stability Index (derived / proxy)
   *
   * 今の mixed-state がどれくらい安定しているか
   * coherence / boundaryIntegrity / restorationReadiness などから算出
   *
   * Range: 0 (unstable) to 1 (stable)
   */
  stabilityIndex: number;

  /**
   * Mixture Entropy (derived / proxy)
   *
   * 混ざり具合 / 一極集中していない度合いの rough 指標
   * これは literal quantum entropy ではなく、
   * 正規化した複数軸の分布から Shannon entropy 風に算出した proxy
   *
   * Range: 0 (single dominant pole) to ~2.0+ (highly mixed)
   */
  mixtureEntropy: number;

  /**
   * Dominant Pole (optional, observer用)
   *
   * 便宜的な優勢軸のラベル
   * これは runtime の主決定器ではなく、observer/debug 用の簡易タグ
   *
   * Values: 'restoration' | 'overload' | 'exploration' | 'safety' | 'neutral-mixed' | null
   */
  dominantPole: string | null;
}
