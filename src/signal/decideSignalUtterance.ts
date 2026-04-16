import type { StimulusPacket, ProtoMeaning, SignalField, Signal, SignalDecision } from './types.js';

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function getActivation(signals: Signal[], id: string): number {
  return signals.find(s => s.id === id)?.activation ?? 0;
}

export function decideSignalUtterance(
  stimulus: StimulusPacket,
  protoMeanings: ProtoMeaning[],
  field: SignalField,
  signals: Signal[],
): SignalDecision {
  const hesitation = getActivation(signals, 'self_hesitation');
  const notPush = getActivation(signals, 'belief_not_push_too_early');
  const care = getActivation(signals, 'self_care_response');
  const hostility = getActivation(signals, 'other_hostility_signal');

  const hasMadaPusenai = protoMeanings.some(pm => pm.glossJa === 'まだ押せない');
  const hasAkitai = protoMeanings.some(pm => pm.glossJa === 'でも答えたい');

  // ── shouldAnswerQuestion ──
  // True when explicit question + answerPressure is high
  const shouldAnswerQuestion =
    stimulus.explicitQuestion && field.answerPressure >= 0.4;

  // ── shouldOfferStep ──
  // True when help was sought, urgency is moderate, and permission is present
  const shouldOfferStep =
    field.permission >= 0.45 && field.urgency >= 0.3 && !hasMadaPusenai;

  // ── shouldStayOpen ──
  // True when unfinishedness is high, or fragility is high with hesitation
  const shouldStayOpen =
    field.unfinishedness >= 0.4 ||
    (field.fragility >= 0.5 && hesitation >= 0.4);

  // ── stance ──
  let stance: SignalDecision['stance'];
  if (hostility >= 0.55) {
    // Guard — don't answer aggressively
    stance = 'hold';
  } else if (hasMadaPusenai && field.fragility >= 0.5) {
    stance = notPush >= 0.55 ? 'hold' : 'soft_answer';
  } else if (shouldAnswerQuestion && hasAkitai) {
    stance = 'answer';
  } else if (shouldAnswerQuestion) {
    stance = 'soft_answer';
  } else if (shouldStayOpen) {
    stance = 'open_reflect';
  } else {
    stance = 'soft_answer';
  }

  // ── replyIntent ──
  let replyIntent: SignalDecision['replyIntent'];
  if (field.fragility >= 0.55 || care >= 0.65) {
    replyIntent = 'emotional_holding';
  } else if (shouldAnswerQuestion && field.answerPressure >= 0.55) {
    replyIntent = 'practical_advice';
  } else if (protoMeanings.some(pm => pm.glossJa === '守りたい引力')) {
    replyIntent = 'judgment_support';
  } else {
    replyIntent = 'free_reflection';
  }

  // ── answerDepth ──
  // 0 = no answer, 1 = surface, 2 = moderate, 3 = full
  let answerDepth = 0;
  if (stance === 'hold') answerDepth = 0;
  else if (stance === 'open_reflect') answerDepth = 1;
  else if (stance === 'soft_answer') answerDepth = 2;
  else if (stance === 'answer') answerDepth = 3;

  // ── closeness ──
  const closeness = clamp(field.closeness + care * 0.1);

  // ── withheldBias ──
  // How much we're holding back from saying everything we "could" say
  const withheldBias = clamp(hesitation * 0.5 + notPush * 0.3 + (1 - field.permission) * 0.2);

  return {
    stance,
    replyIntent,
    closeness,
    answerDepth,
    shouldAnswerQuestion,
    shouldOfferStep,
    shouldStayOpen,
    withheldBias,
  };
}
