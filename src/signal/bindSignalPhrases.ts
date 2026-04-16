import type { LexicalCandidate, ProtoMeaning, SignalDecision } from './types.js';

export type PhrasePack = {
  reaction: string | undefined;
  core: string | undefined;
  answer: string | undefined;
  nextStep: string | undefined;
};

function pick(candidates: string[], index = 0): string {
  return candidates[Math.min(index, candidates.length - 1)];
}

function findCandidates(
  lexical: LexicalCandidate[],
  protoMeanings: ProtoMeaning[],
  glossJa: string,
): string[] {
  const pm = protoMeanings.find(p => p.glossJa === glossJa);
  if (!pm) return [];
  return lexical.find(lc => lc.protoMeaningId === pm.id)?.candidates ?? [];
}

export function bindSignalPhrases(
  lexical: LexicalCandidate[],
  protoMeanings: ProtoMeaning[],
  decision: SignalDecision,
): PhrasePack {
  // ── reaction ──
  // Picks from the most emotionally resonant proto-meaning
  const reactionCandidates = [
    ...findCandidates(lexical, protoMeanings, '消耗の気配'),
    ...findCandidates(lexical, protoMeanings, '守りたい引力'),
    ...findCandidates(lexical, protoMeanings, '何かを感じている'),
  ];
  const reaction = reactionCandidates.length > 0 ? pick(reactionCandidates) : undefined;

  // ── core ──
  // Picks from the unfinishedness / openness cluster
  const coreCandidates = [
    ...findCandidates(lexical, protoMeanings, 'まだ押せない'),
    ...findCandidates(lexical, protoMeanings, '開いたままでいたい'),
  ];
  const core = coreCandidates.length > 0 ? pick(coreCandidates) : undefined;

  // ── answer ──
  // Picks from the "wanting to answer" cluster when decision calls for it
  let answer: string | undefined;
  if (decision.shouldAnswerQuestion || decision.stance === 'answer' || decision.stance === 'soft_answer') {
    const answerCandidates = [
      ...findCandidates(lexical, protoMeanings, 'でも答えたい'),
      ...findCandidates(lexical, protoMeanings, '助けたい'),
    ];
    answer = answerCandidates.length > 0 ? pick(answerCandidates) : undefined;
  }

  // ── nextStep ──
  // Picks from practical / step-oriented candidates
  let nextStep: string | undefined;
  if (decision.shouldOfferStep) {
    const stepCandidates = [
      ...findCandidates(lexical, protoMeanings, '助けたい'),
      ...findCandidates(lexical, protoMeanings, 'でも答えたい'),
    ];
    nextStep = stepCandidates.length > 1 ? pick(stepCandidates, 1) : undefined;
  }

  return { reaction, core, answer, nextStep };
}
