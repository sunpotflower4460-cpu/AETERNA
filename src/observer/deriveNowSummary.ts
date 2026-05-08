/**
 * deriveNowSummary.ts
 * AETERNA-NATURAL v2.7 — Observer-side Now Summary Panel Derivation
 *
 * Derives NowSummaryPanelState from observation inputs.
 *
 * Design principles:
 * - No LLM / API calls.
 * - All text is in Japanese.
 * - undefined values are NEVER treated as 0 — if a value is undefined, report 'insufficient'.
 * - No consciousness / life / intelligence proof claims.
 * - Observer-side summary only.
 *
 * Reference: docs/now-summary-panel.md
 */

import type {
    NowSummaryPanelState,
    NowSummarySection,
    NowSummarySeverity,
    NowSummaryConfidence,
    ConsciousnessCandidateCondition,
    ConsciousnessCandidateConditionStatus,
} from '../types/nowSummary.ts';

// ── DeriveNowSummaryInput ─────────────────────────────────────────────────────

export interface DeriveNowSummaryInput {
    timestamp: number;
    // A. トーラス生命場
    arousal?: number;
    sigma?: number;
    phaseCoherence?: number;
    clusterRatio?: number;
    baselineLevel?: number;
    residueLevel?: number;
    firingRateError?: number;
    // B. 生命幹
    energy?: number;
    stability?: number;
    overload?: number;
    fatigue?: number;
    coherenceMemory?: number;
    predictionSensitivity?: number;
    touchNeedBaseline?: number;
    modeState?: string;
    actionState?: string;
    orientingDrive?: number;
    restDrive?: number;
    // C. 閉ループ
    loopGain?: number;
    returnStrength?: number;
    returnMismatch?: number;
    selfCausedMatch?: number;
    closureStability?: number;
    membraneDeformation?: number;
    actuationReturnOverlap?: number;
    // D. 履歴
    activityResidue?: number;
    traceStrength?: number;
    replayReadiness?: number;
    plasticityTrace?: number;
    recentHistoryBias?: number;
    // E. 創発候補
    vortexCandidateCount?: number;
    protoPointCandidateCount?: number;
    protoNeuronCandidateCount?: number;
    protoNetworkCandidateCount?: number;
    maxProtoNeuronConfidence?: number;
    maxProtoNetworkConfidence?: number;
    // F. リスク
    collapseRisk?: number;
    saturationRisk?: number;
    feedbackSaturationRisk?: number;
    nanOrInfinityCount?: number;
    // G. 信号交換
    touchActive?: boolean;
    soundActive?: boolean;
    lightActive?: boolean;
    motionActive?: boolean;
    recentInputKind?: string | null;
    recentActionPulse?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _allUndefined(vals: Array<unknown>): boolean {
    return vals.every((v) => v === undefined);
}

function _confidenceFromDefined(vals: Array<unknown>): NowSummaryConfidence {
    const defined = vals.filter((v) => v !== undefined).length;
    if (defined === 0) return 'insufficient';
    if (defined < vals.length / 3) return 'low';
    if (defined < vals.length * 2 / 3) return 'medium';
    return 'high';
}

// ── Section derivers ──────────────────────────────────────────────────────────

function _deriveTorusLifeField(inp: DeriveNowSummaryInput): NowSummarySection {
    const vals = [inp.arousal, inp.sigma, inp.phaseCoherence, inp.clusterRatio, inp.baselineLevel, inp.residueLevel, inp.firingRateError];
    const confidence = _confidenceFromDefined(vals);

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '観測値が不足しています。';

    if (!_allUndefined(vals)) {
        if (inp.arousal !== undefined) {
            if (inp.arousal >= 0.7) {
                severity = 'active';
                oneLineJa = 'トーラス生命場は活性化しています。';
            } else if (inp.arousal >= 0.3) {
                severity = 'calm';
                oneLineJa = 'トーラス生命場はゆるやかに活動しています。';
            } else {
                severity = 'calm';
                oneLineJa = 'トーラス生命場は低活動状態です。';
            }
        } else {
            oneLineJa = 'トーラス生命場の一部の値のみ観測できています。';
        }
    }

    const detailsJa: string[] = [];
    if (inp.sigma !== undefined) {
        detailsJa.push(`シグマ（場の分散）: ${inp.sigma.toFixed(4)}`);
    }
    if (inp.phaseCoherence !== undefined) {
        detailsJa.push(`位相コヒーレンス: ${inp.phaseCoherence.toFixed(4)}`);
    }
    if (inp.clusterRatio !== undefined) {
        detailsJa.push(`クラスター比率: ${inp.clusterRatio.toFixed(4)}`);
    }
    if (inp.baselineLevel !== undefined) {
        detailsJa.push(`ベースラインレベル: ${inp.baselineLevel.toFixed(4)}`);
    }
    if (inp.residueLevel !== undefined) {
        detailsJa.push(`残留レベル: ${inp.residueLevel.toFixed(4)}`);
    }
    if (inp.firingRateError !== undefined) {
        detailsJa.push(`発火率誤差: ${inp.firingRateError.toFixed(4)}`);
    }

    return {
        id: 'torusLifeField',
        titleJa: 'トーラス生命場',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: ['arousal', 'sigma', 'phaseCoherence', 'clusterRatio', 'baselineLevel', 'residueLevel', 'firingRateError'],
        cautionsJa: [
            'トーラス生命場の活動は生命や意識の証明ではありません。',
        ],
    };
}

function _deriveVitalStem(inp: DeriveNowSummaryInput): NowSummarySection {
    const vals = [inp.energy, inp.stability, inp.overload, inp.fatigue, inp.modeState, inp.actionState, inp.orientingDrive, inp.restDrive];
    const confidence = _confidenceFromDefined(vals);

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '観測値が不足しています。';

    if (!_allUndefined(vals)) {
        if (inp.overload !== undefined && inp.overload > 0.7) {
            severity = 'strained';
            oneLineJa = '生命幹は過負荷状態にあります。';
        } else if (inp.fatigue !== undefined && inp.fatigue > 0.7) {
            severity = 'recovering';
            oneLineJa = '生命幹は疲労・回復状態にあります。';
        } else if (inp.energy !== undefined && inp.stability !== undefined && inp.energy > 0.5 && inp.stability > 0.5) {
            severity = 'calm';
            oneLineJa = '生命幹は安定した活動状態にあります。';
        } else {
            severity = 'unknown';
            oneLineJa = '生命幹の状態は部分的に観測されています。';
        }
    }

    const detailsJa: string[] = [];
    if (inp.energy !== undefined) detailsJa.push(`エネルギー: ${inp.energy.toFixed(4)}`);
    if (inp.stability !== undefined) detailsJa.push(`安定性: ${inp.stability.toFixed(4)}`);
    if (inp.overload !== undefined) detailsJa.push(`過負荷: ${inp.overload.toFixed(4)}`);
    if (inp.fatigue !== undefined) detailsJa.push(`疲労: ${inp.fatigue.toFixed(4)}`);
    if (inp.modeState !== undefined) detailsJa.push(`モード状態: ${inp.modeState}`);
    if (inp.actionState !== undefined) detailsJa.push(`行動状態: ${inp.actionState}`);
    if (inp.orientingDrive !== undefined) detailsJa.push(`探索ドライブ: ${inp.orientingDrive.toFixed(4)}`);
    if (inp.restDrive !== undefined) detailsJa.push(`休息ドライブ: ${inp.restDrive.toFixed(4)}`);

    return {
        id: 'vitalStem',
        titleJa: '生命幹',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: ['energy', 'stability', 'overload', 'fatigue', 'modeState', 'actionState', 'orientingDrive', 'restDrive'],
        cautionsJa: [
            '生命幹サマリーは生命の証明ではありません。持続・反応・回復・状態依存性の観測です。',
        ],
    };
}

function _deriveBodyWorldLoop(inp: DeriveNowSummaryInput): NowSummarySection {
    const vals = [inp.loopGain, inp.returnStrength, inp.returnMismatch, inp.selfCausedMatch, inp.closureStability, inp.membraneDeformation, inp.actuationReturnOverlap];
    const confidence = _confidenceFromDefined(vals);

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '観測値が不足しています。';

    if (!_allUndefined(vals)) {
        if (inp.closureStability !== undefined && inp.closureStability > 0.6) {
            severity = 'calm';
            oneLineJa = '身体-世界ループは安定した閉ループ候補が観測されています。';
        } else if (inp.returnMismatch !== undefined && inp.returnMismatch > 0.5) {
            severity = 'strained';
            oneLineJa = '戻り信号にミスマッチが観測されています。';
        } else if (inp.loopGain !== undefined) {
            severity = 'active';
            oneLineJa = '身体-世界ループの一部が観測されています。';
        } else {
            oneLineJa = '身体-世界ループの観測値が部分的です。';
        }
    }

    const detailsJa: string[] = [];
    if (inp.loopGain !== undefined) detailsJa.push(`ループゲイン: ${inp.loopGain.toFixed(4)}`);
    if (inp.returnStrength !== undefined) detailsJa.push(`戻り強度: ${inp.returnStrength.toFixed(4)}`);
    if (inp.returnMismatch !== undefined) detailsJa.push(`戻りミスマッチ: ${inp.returnMismatch.toFixed(4)}`);
    if (inp.selfCausedMatch !== undefined) detailsJa.push(`自己起因一致: ${inp.selfCausedMatch.toFixed(4)}`);
    if (inp.closureStability !== undefined) detailsJa.push(`閉ループ安定性: ${inp.closureStability.toFixed(4)}`);
    if (inp.membraneDeformation !== undefined) detailsJa.push(`膜変形: ${inp.membraneDeformation.toFixed(4)}`);
    if (inp.actuationReturnOverlap !== undefined) detailsJa.push(`作動-戻り重複: ${inp.actuationReturnOverlap.toFixed(4)}`);

    return {
        id: 'bodyWorldLoop',
        titleJa: '身体-世界ループ',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: ['loopGain', 'returnStrength', 'returnMismatch', 'selfCausedMatch', 'closureStability', 'membraneDeformation', 'actuationReturnOverlap'],
        cautionsJa: [
            '閉ループ候補の観測です。因果証明ではありません。',
        ],
    };
}

function _deriveHistory(inp: DeriveNowSummaryInput): NowSummarySection {
    const vals = [inp.activityResidue, inp.traceStrength, inp.replayReadiness, inp.plasticityTrace, inp.recentHistoryBias];
    const confidence = _confidenceFromDefined(vals);

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '観測値が不足しています。';

    if (!_allUndefined(vals)) {
        if (inp.traceStrength !== undefined && inp.traceStrength > 0.6) {
            severity = 'active';
            oneLineJa = '場に強い痕跡・履歴が残っています。';
        } else if (inp.activityResidue !== undefined && inp.activityResidue > 0.3) {
            severity = 'calm';
            oneLineJa = '場に活動の残留が観測されています。';
        } else {
            severity = 'calm';
            oneLineJa = '履歴・痕跡の観測値が部分的です。';
        }
    }

    const detailsJa: string[] = [];
    if (inp.activityResidue !== undefined) detailsJa.push(`活動残留: ${inp.activityResidue.toFixed(4)}`);
    if (inp.traceStrength !== undefined) detailsJa.push(`痕跡強度: ${inp.traceStrength.toFixed(4)}`);
    if (inp.replayReadiness !== undefined) detailsJa.push(`再発しやすさ: ${inp.replayReadiness.toFixed(4)}`);
    if (inp.plasticityTrace !== undefined) detailsJa.push(`可塑性痕跡: ${inp.plasticityTrace.toFixed(4)}`);
    if (inp.recentHistoryBias !== undefined) detailsJa.push(`直近履歴バイアス: ${inp.recentHistoryBias.toFixed(4)}`);

    return {
        id: 'history',
        titleJa: '履歴と痕跡',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: ['activityResidue', 'traceStrength', 'replayReadiness', 'plasticityTrace', 'recentHistoryBias'],
        cautionsJa: [
            'これは意味記憶ではありません。場に残る履歴・痕跡・再発しやすさの観測です。',
        ],
    };
}

function _deriveEmergenceCandidates(inp: DeriveNowSummaryInput): NowSummarySection {
    const vals = [inp.vortexCandidateCount, inp.protoPointCandidateCount, inp.protoNeuronCandidateCount, inp.protoNetworkCandidateCount, inp.maxProtoNeuronConfidence, inp.maxProtoNetworkConfidence];
    const confidence = _confidenceFromDefined(vals);

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '観測値が不足しています。';

    if (!_allUndefined(vals)) {
        const hasProtoNetwork = inp.protoNetworkCandidateCount !== undefined && inp.protoNetworkCandidateCount > 0;
        const hasProtoNeuron = inp.protoNeuronCandidateCount !== undefined && inp.protoNeuronCandidateCount > 0;
        const hasVortex = inp.vortexCandidateCount !== undefined && inp.vortexCandidateCount > 0;

        if (hasProtoNetwork) {
            severity = 'active';
            oneLineJa = 'proto-networkの候補が観測されています。';
        } else if (hasProtoNeuron) {
            severity = 'active';
            oneLineJa = 'proto-neuronの候補が観測されています。';
        } else if (hasVortex) {
            severity = 'calm';
            oneLineJa = '渦候補が観測されています。';
        } else {
            severity = 'calm';
            oneLineJa = '現在、顕著な創発候補は観測されていません。';
        }
    }

    const detailsJa: string[] = [];
    if (inp.vortexCandidateCount !== undefined) detailsJa.push(`渦候補数: ${inp.vortexCandidateCount}`);
    if (inp.protoPointCandidateCount !== undefined) detailsJa.push(`proto-point候補数: ${inp.protoPointCandidateCount}`);
    if (inp.protoNeuronCandidateCount !== undefined) detailsJa.push(`proto-neuron候補数: ${inp.protoNeuronCandidateCount}`);
    if (inp.protoNetworkCandidateCount !== undefined) detailsJa.push(`proto-network候補数: ${inp.protoNetworkCandidateCount}`);
    if (inp.maxProtoNeuronConfidence !== undefined) detailsJa.push(`proto-neuron最大信頼度: ${inp.maxProtoNeuronConfidence.toFixed(4)}`);
    if (inp.maxProtoNetworkConfidence !== undefined) detailsJa.push(`proto-network最大信頼度: ${inp.maxProtoNetworkConfidence.toFixed(4)}`);

    return {
        id: 'emergenceCandidates',
        titleJa: '創発候補',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: ['vortexCandidateCount', 'protoPointCandidateCount', 'protoNeuronCandidateCount', 'protoNetworkCandidateCount', 'maxProtoNeuronConfidence', 'maxProtoNetworkConfidence'],
        cautionsJa: [
            'proto-neuron / proto-network は意味ノードではありません。創発候補の観測です。',
        ],
    };
}

function _deriveRisks(inp: DeriveNowSummaryInput): NowSummarySection {
    const vals = [inp.collapseRisk, inp.saturationRisk, inp.feedbackSaturationRisk, inp.overload, inp.nanOrInfinityCount];
    const confidence = _confidenceFromDefined(vals);

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '観測値が不足しています。';

    if (!_allUndefined(vals)) {
        if (inp.nanOrInfinityCount !== undefined && inp.nanOrInfinityCount > 0) {
            severity = 'unstable';
            oneLineJa = '重大な数値異常があります。NaN/Infinityが検出されています。';
        } else if (inp.collapseRisk !== undefined && inp.collapseRisk > 0.7) {
            severity = 'unstable';
            oneLineJa = '崩壊リスクが高い状態です。';
        } else if (inp.saturationRisk !== undefined && inp.saturationRisk > 0.7) {
            severity = 'strained';
            oneLineJa = '飽和リスクが観測されています。';
        } else {
            severity = 'calm';
            oneLineJa = '現在、重大なリスクは観測されていません。';
        }
    }

    const detailsJa: string[] = [];
    if (inp.collapseRisk !== undefined) detailsJa.push(`崩壊リスク: ${inp.collapseRisk.toFixed(4)}`);
    if (inp.saturationRisk !== undefined) detailsJa.push(`飽和リスク: ${inp.saturationRisk.toFixed(4)}`);
    if (inp.feedbackSaturationRisk !== undefined) detailsJa.push(`フィードバック飽和リスク: ${inp.feedbackSaturationRisk.toFixed(4)}`);
    if (inp.nanOrInfinityCount !== undefined) detailsJa.push(`NaN/Infinity検出数: ${inp.nanOrInfinityCount}`);

    return {
        id: 'risks',
        titleJa: 'リスク',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: ['collapseRisk', 'saturationRisk', 'feedbackSaturationRisk', 'overload', 'nanOrInfinityCount'],
        cautionsJa: [
            'リスク指標が高い場合は、Safe Baselineと比較してください。',
        ],
    };
}

function _deriveSignalExchange(inp: DeriveNowSummaryInput): NowSummarySection {
    const vals = [inp.touchActive, inp.soundActive, inp.lightActive, inp.motionActive, inp.recentInputKind, inp.recentActionPulse, inp.actionState, inp.returnStrength];
    const confidence = _confidenceFromDefined(vals);

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '観測値が不足しています。';

    if (!_allUndefined(vals)) {
        const activeInputs = [inp.touchActive, inp.soundActive, inp.lightActive, inp.motionActive].filter(Boolean).length;
        if (activeInputs >= 2) {
            severity = 'active';
            oneLineJa = '複数の信号入力が観測されています。';
        } else if (activeInputs === 1) {
            severity = 'calm';
            oneLineJa = '信号入力が観測されています。';
        } else if (inp.recentActionPulse !== undefined && inp.recentActionPulse > 0) {
            severity = 'calm';
            oneLineJa = '出力パルスが観測されています（入力はなし）。';
        } else {
            severity = 'calm';
            oneLineJa = '現在、活発な信号のやり取りは観測されていません。';
        }
    }

    const detailsJa: string[] = [];
    if (inp.touchActive !== undefined) detailsJa.push(`タッチ入力: ${inp.touchActive ? 'あり' : 'なし'}`);
    if (inp.soundActive !== undefined) detailsJa.push(`音響入力: ${inp.soundActive ? 'あり' : 'なし'}`);
    if (inp.lightActive !== undefined) detailsJa.push(`光入力: ${inp.lightActive ? 'あり' : 'なし'}`);
    if (inp.motionActive !== undefined) detailsJa.push(`動き入力: ${inp.motionActive ? 'あり' : 'なし'}`);
    if (inp.recentInputKind !== undefined && inp.recentInputKind !== null) detailsJa.push(`直近入力種別: ${inp.recentInputKind}`);
    if (inp.recentActionPulse !== undefined) detailsJa.push(`直近出力パルス: ${inp.recentActionPulse.toFixed(4)}`);
    if (inp.returnStrength !== undefined) detailsJa.push(`戻り強度: ${inp.returnStrength.toFixed(4)}`);

    return {
        id: 'signalExchange',
        titleJa: '信号のやり取り',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: ['touchActive', 'soundActive', 'lightActive', 'motionActive', 'recentInputKind', 'recentActionPulse', 'actionState', 'returnStrength'],
        cautionsJa: [
            '信号のやり取りは言語的な会話ではありません。低層の入力・反応・戻り・履歴の観測です。',
        ],
    };
}

// ── Consciousness candidate conditions derivation ─────────────────────────────

function _deriveConditionStatus(defined: boolean, value: number | undefined, threshold: number, invert = false): ConsciousnessCandidateConditionStatus {
    if (!defined || value === undefined) return 'insufficient';
    const passes = invert ? value < threshold : value >= threshold;
    if (passes) return 'observed';
    // 'weak': within 50% of threshold (half-strength signal still worth noting)
    if (invert ? value < threshold * 1.5 : value >= threshold * 0.5) return 'weak';
    return 'notObserved';
}

function _statusFromBool(val: boolean | undefined): ConsciousnessCandidateConditionStatus {
    if (val === undefined) return 'insufficient';
    return val ? 'observed' : 'notObserved';
}

/** Formats a boolean sensor flag as Japanese text for display in reasonJa fields. */
function _boolJa(val: boolean | undefined): string {
    if (val === undefined) return '?';
    return val ? 'あり' : 'なし';
}

function _deriveConsciousnessConditions(inp: DeriveNowSummaryInput): ConsciousnessCandidateCondition[] {
    const caution = 'これは意識の証明ではありません。観測可能な前提条件候補の一部です。';

    return [
        {
            id: 'persistence',
            labelJa: '持続性',
            status: _deriveConditionStatus(inp.energy !== undefined, inp.energy, 0.3),
            reasonJa: inp.energy !== undefined ? `エネルギー観測値: ${inp.energy.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['energy'],
            cautionJa: caution,
        },
        {
            id: 'boundary',
            labelJa: '境界性',
            status: _deriveConditionStatus(inp.membraneDeformation !== undefined, inp.membraneDeformation, 0.1),
            reasonJa: inp.membraneDeformation !== undefined ? `膜変形観測値: ${inp.membraneDeformation.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['membraneDeformation'],
            cautionJa: caution,
        },
        {
            id: 'stateDependent',
            labelJa: '状態依存応答',
            status: inp.modeState !== undefined ? 'observed' : 'insufficient',
            reasonJa: inp.modeState !== undefined ? `モード状態: ${inp.modeState}` : '観測値なし',
            sourceMetricIds: ['modeState', 'actionState'],
            cautionJa: caution,
        },
        {
            id: 'historyDependent',
            labelJa: '履歴依存性',
            status: _deriveConditionStatus(inp.traceStrength !== undefined, inp.traceStrength, 0.2),
            reasonJa: inp.traceStrength !== undefined ? `痕跡強度: ${inp.traceStrength.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['traceStrength', 'activityResidue'],
            cautionJa: caution,
        },
        {
            id: 'closedLoop',
            labelJa: '閉ループ性',
            status: _deriveConditionStatus(inp.closureStability !== undefined, inp.closureStability, 0.4),
            reasonJa: inp.closureStability !== undefined ? `閉ループ安定性: ${inp.closureStability.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['closureStability', 'loopGain', 'returnStrength'],
            cautionJa: caution,
        },
        {
            id: 'selfMaintaining',
            labelJa: '自己維持傾向',
            status: _deriveConditionStatus(inp.stability !== undefined, inp.stability, 0.4),
            reasonJa: inp.stability !== undefined ? `安定性: ${inp.stability.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['stability', 'energy'],
            cautionJa: caution,
        },
        {
            id: 'predictionError',
            labelJa: '予測誤差応答',
            status: _deriveConditionStatus(inp.predictionSensitivity !== undefined, inp.predictionSensitivity, 0.2),
            reasonJa: inp.predictionSensitivity !== undefined ? `予測感度: ${inp.predictionSensitivity.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['predictionSensitivity', 'firingRateError'],
            cautionJa: caution,
        },
        {
            id: 'spontaneity',
            labelJa: '自発性',
            status: _deriveConditionStatus(inp.orientingDrive !== undefined, inp.orientingDrive, 0.2),
            reasonJa: inp.orientingDrive !== undefined ? `探索ドライブ: ${inp.orientingDrive.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['orientingDrive'],
            cautionJa: caution,
        },
        {
            id: 'integration',
            labelJa: '統合性',
            status: _deriveConditionStatus(inp.phaseCoherence !== undefined, inp.phaseCoherence, 0.4),
            reasonJa: inp.phaseCoherence !== undefined ? `位相コヒーレンス: ${inp.phaseCoherence.toFixed(4)}` : '観測値なし',
            sourceMetricIds: ['phaseCoherence', 'clusterRatio'],
            cautionJa: caution,
        },
        {
            id: 'signalDialogue',
            labelJa: '信号対話性',
            status: _statusFromBool(inp.touchActive || inp.soundActive || inp.lightActive || inp.motionActive),
            reasonJa: `タッチ:${_boolJa(inp.touchActive)} 音:${_boolJa(inp.soundActive)} 光:${_boolJa(inp.lightActive)} 動き:${_boolJa(inp.motionActive)}`,
            sourceMetricIds: ['touchActive', 'soundActive', 'lightActive', 'motionActive'],
            cautionJa: caution,
        },
    ];
}

function _deriveConsciousnessCandidateConditionsSection(inp: DeriveNowSummaryInput, conditions: ConsciousnessCandidateCondition[]): NowSummarySection {
    const observedCount = conditions.filter((c) => c.status === 'observed').length;
    const weakCount = conditions.filter((c) => c.status === 'weak').length;
    const insufficientCount = conditions.filter((c) => c.status === 'insufficient').length;

    let severity: NowSummarySeverity = 'unknown';
    let oneLineJa = '意識候補条件を観測しています。';
    let confidence: NowSummaryConfidence = 'insufficient';

    if (insufficientCount >= conditions.length - 2) {
        confidence = 'insufficient';
        oneLineJa = '意識候補条件の観測値が不足しています。';
    } else if (observedCount >= 7) {
        confidence = 'high';
        severity = 'active';
        oneLineJa = `意識候補条件: ${observedCount}/10 が観測されています（弱: ${weakCount}）。`;
    } else if (observedCount >= 4) {
        confidence = 'medium';
        severity = 'calm';
        oneLineJa = `意識候補条件: ${observedCount}/10 が観測されています（弱: ${weakCount}）。`;
    } else {
        confidence = 'low';
        severity = 'calm';
        oneLineJa = `意識候補条件: ${observedCount}/10 が観測されています（弱: ${weakCount}）。`;
    }

    const detailsJa = conditions.map((c) => {
        const statusLabel = c.status === 'observed' ? '観測' : c.status === 'weak' ? '弱観測' : c.status === 'notObserved' ? '非観測' : '不足';
        return `${c.labelJa}: ${statusLabel}`;
    });

    return {
        id: 'consciousnessCandidateConditions',
        titleJa: '意識候補条件',
        oneLineJa,
        detailsJa,
        severity,
        confidence,
        sourceMetricIds: conditions.flatMap((c) => c.sourceMetricIds),
        cautionsJa: [
            'これは意識の証明ではありません。意識が宿るかもしれない前提条件の一部を観測可能な指標として整理したものです。',
        ],
    };
}

// ── Overall confidence ────────────────────────────────────────────────────────

function _deriveOverallConfidence(sections: NowSummarySection[]): NowSummaryConfidence {
    const counts = { high: 0, medium: 0, low: 0, insufficient: 0 };
    for (const s of sections) counts[s.confidence]++;
    if (counts.insufficient >= sections.length / 2) return 'insufficient';
    if (counts.high >= sections.length / 2) return 'high';
    if (counts.high + counts.medium >= sections.length / 2) return 'medium';
    return 'low';
}

// ── deriveNowSummaryPanel ─────────────────────────────────────────────────────

/**
 * Derive a NowSummaryPanelState from observation inputs.
 *
 * No LLM / API calls. All text is in Japanese.
 * undefined values are NOT treated as 0.
 *
 * @param input - DeriveNowSummaryInput
 * @returns NowSummaryPanelState
 */
export function deriveNowSummaryPanel(input: DeriveNowSummaryInput): NowSummaryPanelState {
    const torusSection = _deriveTorusLifeField(input);
    const vitalStemSection = _deriveVitalStem(input);
    const bodyWorldLoopSection = _deriveBodyWorldLoop(input);
    const historySection = _deriveHistory(input);
    const emergenceCandidatesSection = _deriveEmergenceCandidates(input);
    const risksSection = _deriveRisks(input);
    const signalExchangeSection = _deriveSignalExchange(input);
    const conditions = _deriveConsciousnessConditions(input);
    const consciousnessSection = _deriveConsciousnessCandidateConditionsSection(input, conditions);

    const sections: NowSummarySection[] = [
        torusSection,
        vitalStemSection,
        bodyWorldLoopSection,
        historySection,
        emergenceCandidatesSection,
        risksSection,
        signalExchangeSection,
        consciousnessSection,
    ];

    const overallConfidence = _deriveOverallConfidence(sections);

    // Overall one-line
    let overallOneLineJa = 'AETERNAの観測パネルを表示しています。';
    if (risksSection.severity === 'unstable') {
        overallOneLineJa = '⚠ 数値異常が検出されています。Safe Baselineと比較してください。';
    } else if (overallConfidence === 'insufficient') {
        overallOneLineJa = '観測値が不足しています。各センサーの状態を確認してください。';
    } else if (torusSection.severity === 'active' && vitalStemSection.severity === 'calm') {
        overallOneLineJa = 'トーラス生命場が活性化し、生命幹は安定しています。';
    } else if (vitalStemSection.severity === 'strained') {
        overallOneLineJa = '生命幹に過負荷が観測されています。';
    } else if (vitalStemSection.severity === 'recovering') {
        overallOneLineJa = '生命幹は疲労・回復状態にあります。';
    } else {
        overallOneLineJa = `観測中 — ${torusSection.oneLineJa}`;
    }

    // Beginner summary
    const beginnerSummaryJa = [
        overallOneLineJa,
        `生命幹: ${vitalStemSection.oneLineJa}`,
        `信号: ${signalExchangeSection.oneLineJa}`,
    ].join('\n');

    // Researcher summary
    const researcherSummaryJa = sections
        .map((s) => `[${s.titleJa}] ${s.oneLineJa} (信頼度: ${s.confidence})`)
        .join('\n');

    // Strongest observed changes
    const strongestObservedChanges: string[] = [];
    if (risksSection.severity === 'unstable') strongestObservedChanges.push('NaN/Infinity検出');
    if (torusSection.severity === 'active') strongestObservedChanges.push('トーラス生命場活性化');
    if (vitalStemSection.severity === 'strained') strongestObservedChanges.push('生命幹過負荷');
    if (emergenceCandidatesSection.severity === 'active') strongestObservedChanges.push('創発候補出現');
    if (bodyWorldLoopSection.severity === 'strained') strongestObservedChanges.push('閉ループミスマッチ');

    return {
        timestamp: input.timestamp,
        overallOneLineJa,
        beginnerSummaryJa,
        researcherSummaryJa,
        sections,
        strongestObservedChanges,
        suggestedNextObservations: [
            'セル観測を見る',
            '時間を戻して見る',
            '関連候補を見る',
            'Safe Baselineと比較する',
        ],
        claimGuardJa: 'このパネルはAETERNAの発話ではありません。観測装置による条件観測です。意識・生命・知性の証明ではありません。',
        confidence: overallConfidence,
    };
}
