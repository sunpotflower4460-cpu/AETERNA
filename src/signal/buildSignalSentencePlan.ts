import type { SignalDecision, SignalSentencePlan } from './types.js';
import type { PhrasePack } from './bindSignalPhrases.js';

export function buildSignalSentencePlan(
  phrases: PhrasePack,
  decision: SignalDecision,
): SignalSentencePlan {
  const plan: SignalSentencePlan = {};

  // ── reaction (always try to fill unless hostility/hold) ──
  if (decision.stance !== 'hold') {
    plan.reaction = phrases.reaction;
  }

  // ── core (middle ground / relational position) ──
  plan.core = phrases.core;

  // ── answer (required when shouldAnswerQuestion is true) ──
  if (decision.shouldAnswerQuestion && !phrases.answer) {
    // Fallback: generic answer phrase when no lexical candidate was found
    plan.answer = '少し一緒に考えてみることはできる';
  } else if (phrases.answer && decision.answerDepth > 0) {
    plan.answer = phrases.answer;
  }

  // ── nextStep ──
  if (decision.shouldOfferStep && phrases.nextStep) {
    plan.nextStep = phrases.nextStep;
  }

  return plan;
}
