import type { Signal, BoundaryState, SignalField } from './types.js';

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function getActivation(signals: Signal[], id: string): number {
  return signals.find(s => s.id === id)?.activation ?? 0;
}

export function buildSignalField(signals: Signal[], boundary: BoundaryState): SignalField {
  const fatigue = getActivation(signals, 'other_fatigue_signal');
  const confusion = getActivation(signals, 'other_confusion_signal');
  const pressure = getActivation(signals, 'other_pressure_signal');
  const help = getActivation(signals, 'other_help_signal');
  const question = getActivation(signals, 'other_question_signal');
  const care = getActivation(signals, 'self_care_response');
  const answerPull = getActivation(signals, 'self_answer_pull');
  const hesitation = getActivation(signals, 'self_hesitation');
  const notPush = getActivation(signals, 'belief_not_push_too_early');
  const protectAlive = getActivation(signals, 'belief_protect_aliveness');

  // ── closeness: sense of relational proximity in this moment ──
  // Rises when other shows vulnerability (fatigue) and self responds with care
  const closeness = clamp(
    0.3 + fatigue * 0.3 + care * 0.25 + boundary.permeability * 0.15,
  );

  // ── fragility: how delicate the relational field is ──
  // Rises with fatigue and confusion; presence of care also raises it
  // (recognizing fragility is itself part of care)
  const fragility = clamp(
    0.2 + fatigue * 0.35 + confusion * 0.2 + care * 0.15 + (1 - boundary.selfOuterSeparation) * 0.1,
  );

  // ── urgency: felt time-pressure in the field ──
  // Rises with pressure and help signals
  const urgency = clamp(
    0.1 + pressure * 0.45 + help * 0.2 + boundary.externalPressure * 0.15,
  );

  // ── permission: sense that it's OK to speak, give an answer ──
  // Rises with answerPull and question; drops with hesitation
  const permission = clamp(
    0.3 + answerPull * 0.3 + question * 0.2 - hesitation * 0.1 + protectAlive * 0.1,
  );

  // ── answerPressure: pull toward giving an actual answer ──
  // Rises when explicit question + self wants to answer
  const answerPressure = clamp(
    0.1 + question * 0.4 + answerPull * 0.35 + help * 0.1,
  );

  // ── unfinishedness: sense that something remains unsaid or unresolved ──
  // Rises when hesitation meets the belief "not push too early"
  const unfinishedness = clamp(
    0.2 + hesitation * 0.3 + notPush * 0.3 + confusion * 0.1,
  );

  return {
    closeness,
    fragility,
    urgency,
    permission,
    answerPressure,
    unfinishedness,
  };
}
