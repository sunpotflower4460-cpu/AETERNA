import type { Signal, SignalBinding } from './types.js';

let bindingCounter = 0;

function makeBinding(
  sourceId: string,
  targetId: string,
  weight: number,
  reasons: string[],
): SignalBinding {
  return {
    id: `binding_${++bindingCounter}`,
    sourceId,
    targetId,
    weight: Math.max(0, Math.min(1, weight)),
    reasons,
  };
}

function getActivation(signals: Signal[], id: string): number {
  return signals.find(s => s.id === id)?.activation ?? 0;
}

export function bindSignals(signals: Signal[]): SignalBinding[] {
  // Reset counter for deterministic output in tests
  bindingCounter = 0;

  const fatigue = getActivation(signals, 'other_fatigue_signal');
  const care = getActivation(signals, 'self_care_response');
  const question = getActivation(signals, 'other_question_signal');
  const answerPull = getActivation(signals, 'self_answer_pull');
  const hesitation = getActivation(signals, 'self_hesitation');
  const notPush = getActivation(signals, 'belief_not_push_too_early');
  const protectAlive = getActivation(signals, 'belief_protect_aliveness');
  const help = getActivation(signals, 'other_help_signal');
  const confusion = getActivation(signals, 'other_confusion_signal');
  const curiosity = getActivation(signals, 'self_curiosity');

  const bindings: SignalBinding[] = [];

  // other_fatigue_signal → self_care_response
  // Weight is driven by fatigue and care co-activation
  if (fatigue > 0.1 && care > 0.1) {
    bindings.push(makeBinding(
      'other_fatigue_signal', 'self_care_response',
      (fatigue + care) / 2,
      ['消耗信号がケア反応を引き起こす'],
    ));
  }

  // self_care_response → belief_protect_aliveness
  if (care > 0.1) {
    bindings.push(makeBinding(
      'self_care_response', 'belief_protect_aliveness',
      (care + protectAlive) / 2,
      ['ケア反応が生命感保護の信念と結びつく'],
    ));
  }

  // other_question_signal → self_answer_pull
  if (question > 0.1 && answerPull > 0.1) {
    bindings.push(makeBinding(
      'other_question_signal', 'self_answer_pull',
      (question + answerPull) / 2,
      ['問いかけが答えたい引力を活性化'],
    ));
  }

  // self_answer_pull → belief_not_push_too_early
  if (answerPull > 0.1 && notPush > 0.1) {
    bindings.push(makeBinding(
      'self_answer_pull', 'belief_not_push_too_early',
      (answerPull * 0.4 + notPush * 0.6),
      ['答えたい引力が「まだ押さない」信念と拮抗する'],
    ));
  }

  // self_hesitation → belief_not_push_too_early (reinforcing)
  if (hesitation > 0.2 && notPush > 0.2) {
    bindings.push(makeBinding(
      'self_hesitation', 'belief_not_push_too_early',
      (hesitation + notPush) / 2,
      ['躊躇が保留信念を強化する'],
    ));
  }

  // other_help_signal → self_answer_pull
  if (help > 0.3 && answerPull > 0.1) {
    bindings.push(makeBinding(
      'other_help_signal', 'self_answer_pull',
      (help + answerPull) / 2,
      ['助力希求が答えたい引力を強める'],
    ));
  }

  // other_confusion_signal → self_curiosity
  if (confusion > 0.2 && curiosity > 0.1) {
    bindings.push(makeBinding(
      'other_confusion_signal', 'self_curiosity',
      (confusion + curiosity) / 2,
      ['混乱信号が好奇・関心を刺激する'],
    ));
  }

  return bindings;
}
