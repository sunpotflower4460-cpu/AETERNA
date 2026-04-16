import type { StimulusPacket, SignalDecision, SignalSentencePlan } from './types.js';

// Internal terms that must not appear in rendered output
const INTERNAL_TERMS = [
  'proto_meaning', 'protoMeaning', 'signal_field', 'SignalField',
  'other_fatigue', 'self_care', 'belief_', 'SignalBinding',
  'dominant', 'coactive', 'background', 'suppressed',
  'emotionalCharge', 'salience', 'novelty', 'explicitQuestion',
];

function hasInternalLeak(text: string): boolean {
  return INTERNAL_TERMS.some(t => text.includes(t));
}

function joinSentences(parts: (string | undefined)[]): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map(p => {
      // Normalise — ensure ends with a sentence-ending character
      const trimmed = p.trim();
      if (/[。！？!?]$/.test(trimmed)) return trimmed;
      return trimmed + '。';
    })
    .join('\n');
}

function buildReactionLine(reaction: string | undefined, decision: SignalDecision): string | undefined {
  if (!reaction) return undefined;
  // For emotional_holding, lead with the sensing
  if (decision.replyIntent === 'emotional_holding') {
    return `${reaction}、かな。`;
  }
  return `${reaction}。`;
}

function buildCoreLine(core: string | undefined, decision: SignalDecision): string | undefined {
  if (!core) return undefined;
  if (decision.shouldStayOpen) {
    return `${core}と思っていて。`;
  }
  return `${core}。`;
}

function buildAnswerLine(answer: string | undefined, decision: SignalDecision): string | undefined {
  if (!answer) return undefined;
  if (decision.stance === 'soft_answer') {
    return `${answer}かもしれない。`;
  }
  if (decision.stance === 'answer') {
    return `${answer}と思う。`;
  }
  return `${answer}。`;
}

function buildNextStepLine(nextStep: string | undefined): string | undefined {
  if (!nextStep) return undefined;
  return `${nextStep}と思う。`;
}

function applyHoldFallback(decision: SignalDecision): string {
  if (decision.replyIntent === 'emotional_holding') {
    return 'そっか。それは大変だったね。\n少し、ゆっくり聞かせてもらえる？';
  }
  return 'なるほど、少し一緒に考えてみようか。';
}

export function renderSignalUtterance(
  plan: SignalSentencePlan,
  decision: SignalDecision,
  stimulus: StimulusPacket,
): string {
  if (decision.stance === 'hold') {
    return applyHoldFallback(decision);
  }

  const parts: (string | undefined)[] = [
    buildReactionLine(plan.reaction, decision),
    buildCoreLine(plan.core, decision),
    buildAnswerLine(plan.answer, decision),
    buildNextStepLine(plan.nextStep),
  ];

  let rendered = joinSentences(parts);

  // Fallback if rendered is empty
  if (!rendered || rendered.trim().length === 0) {
    if (stimulus.explicitQuestion) {
      rendered = '少し一緒に考えてみることはできると思う。';
    } else {
      rendered = 'そっか。';
    }
  }

  // Safety: strip any leaking internal terms
  if (hasInternalLeak(rendered)) {
    rendered = stimulus.explicitQuestion
      ? '少し一緒に考えてみることはできると思う。'
      : 'そっか、聞かせてくれてありがとう。';
  }

  return rendered;
}
