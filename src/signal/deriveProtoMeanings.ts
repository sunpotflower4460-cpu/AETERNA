import type { Signal, SignalBinding, ProtoMeaning } from './types.js';

let pmCounter = 0;

function makePM(
  glossJa: string,
  strength: number,
  sourceSignalIds: string[],
  sourceBindingIds: string[],
): ProtoMeaning {
  return {
    id: `pm_${++pmCounter}`,
    glossJa,
    strength: Math.max(0, Math.min(1, strength)),
    sourceSignalIds,
    sourceBindingIds,
  };
}

function getActivation(signals: Signal[], id: string): number {
  return signals.find(s => s.id === id)?.activation ?? 0;
}

function getBindingWeight(bindings: SignalBinding[], sourceId: string, targetId: string): number {
  return bindings.find(b => b.sourceId === sourceId && b.targetId === targetId)?.weight ?? 0;
}

export function deriveProtoMeanings(
  signals: Signal[],
  bindings: SignalBinding[],
): ProtoMeaning[] {
  // Reset counter for deterministic output in tests
  pmCounter = 0;

  const protoMeanings: ProtoMeaning[] = [];

  const fatigue = getActivation(signals, 'other_fatigue_signal');
  const confusion = getActivation(signals, 'other_confusion_signal');
  const care = getActivation(signals, 'self_care_response');
  const answerPull = getActivation(signals, 'self_answer_pull');
  const hesitation = getActivation(signals, 'self_hesitation');
  const notPush = getActivation(signals, 'belief_not_push_too_early');
  const protectAlive = getActivation(signals, 'belief_protect_aliveness');
  const question = getActivation(signals, 'other_question_signal');
  const help = getActivation(signals, 'other_help_signal');
  const noFalseBright = getActivation(signals, 'belief_no_false_brightness');

  const bFatigueCare = getBindingWeight(bindings, 'other_fatigue_signal', 'self_care_response');
  const bCareProtect = getBindingWeight(bindings, 'self_care_response', 'belief_protect_aliveness');
  const bHesNotPush = getBindingWeight(bindings, 'self_hesitation', 'belief_not_push_too_early');
  const bQuestionAnswer = getBindingWeight(bindings, 'other_question_signal', 'self_answer_pull');

  // ── 消耗の気配 ──
  // Triggered when fatigue signal is active enough
  if (fatigue > 0.3 || (bFatigueCare > 0.2)) {
    const strength = (fatigue * 0.6 + bFatigueCare * 0.4);
    if (strength > 0.15) {
      protoMeanings.push(makePM(
        '消耗の気配',
        strength,
        ['other_fatigue_signal', 'self_care_response'],
        bindings.filter(b => b.sourceId === 'other_fatigue_signal').map(b => b.id),
      ));
    }
  }

  // ── 守りたい引力 ──
  // Care + protect_aliveness binding
  if (care > 0.3 || bCareProtect > 0.2) {
    const strength = care * 0.5 + protectAlive * 0.3 + bCareProtect * 0.2;
    if (strength > 0.2) {
      protoMeanings.push(makePM(
        '守りたい引力',
        strength,
        ['self_care_response', 'belief_protect_aliveness'],
        bindings.filter(b => b.targetId === 'belief_protect_aliveness').map(b => b.id),
      ));
    }
  }

  // ── まだ押せない ──
  // Hesitation + notPush binding creates a sense of not being ready to push
  if (hesitation > 0.25 || bHesNotPush > 0.2 || notPush > 0.4) {
    const strength = hesitation * 0.4 + notPush * 0.4 + bHesNotPush * 0.2;
    if (strength > 0.2) {
      protoMeanings.push(makePM(
        'まだ押せない',
        strength,
        ['self_hesitation', 'belief_not_push_too_early'],
        bindings.filter(b => b.targetId === 'belief_not_push_too_early').map(b => b.id),
      ));
    }
  }

  // ── でも答えたい ──
  // Answer_pull + question_signal creates tension toward answering
  if (answerPull > 0.3 || (bQuestionAnswer > 0.2)) {
    const strength = answerPull * 0.5 + question * 0.3 + bQuestionAnswer * 0.2;
    if (strength > 0.2) {
      protoMeanings.push(makePM(
        'でも答えたい',
        strength,
        ['self_answer_pull', 'other_question_signal'],
        bindings.filter(b => b.targetId === 'self_answer_pull').map(b => b.id),
      ));
    }
  }

  // ── 開いたままでいたい ──
  // When confusion is present and no_false_brightness is high
  // and hesitation holds back closure
  if ((hesitation > 0.3 && notPush > 0.3) || confusion > 0.4) {
    const strength = (hesitation + notPush + confusion) / 3 * 0.9;
    if (strength > 0.2) {
      protoMeanings.push(makePM(
        '開いたままでいたい',
        strength,
        ['self_hesitation', 'belief_not_push_too_early', 'other_confusion_signal'],
        [],
      ));
    }
  }

  // ── 助けたい ──
  // When help signal + care are both active
  if (help > 0.4 && care > 0.35) {
    const strength = (help + care + noFalseBright) / 3;
    protoMeanings.push(makePM(
      '助けたい',
      strength,
      ['other_help_signal', 'self_care_response', 'belief_no_false_brightness'],
      bindings.filter(b => b.targetId === 'self_answer_pull').map(b => b.id),
    ));
  }

  // Ensure at least one ProtoMeaning is produced (fallback)
  if (protoMeanings.length === 0) {
    protoMeanings.push(makePM(
      '何かを感じている',
      0.3,
      signals.filter(s => s.kind !== 'suppressed').slice(0, 2).map(s => s.id),
      [],
    ));
  }

  return protoMeanings;
}
