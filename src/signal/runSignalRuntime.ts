import type { SignalRuntimeResult, TouchPatternSeeds } from './types.js';
import { createStimulusPacket } from './createStimulusPacket.js';
import { activateSignals } from './activateSignals.js';
import { runSelfLoop } from './runSelfLoop.js';
import { runBoundaryLoop } from './runBoundaryLoop.js';
import { buildSignalField } from './buildSignalField.js';
import { bindSignals } from './bindSignals.js';
import { deriveProtoMeanings } from './deriveProtoMeanings.js';
import { decideSignalUtterance } from './decideSignalUtterance.js';
import { lexicalizeProtoMeanings } from './lexicalizeProtoMeanings.js';
import { bindSignalPhrases } from './bindSignalPhrases.js';
import { buildSignalSentencePlan } from './buildSignalSentencePlan.js';
import { renderSignalUtterance } from './renderSignalUtterance.js';
import { recordSignalMemory } from './memory.js';

export function runSignalRuntime(
  rawText: string,
  novelty = 0.5,
  touchSeeds?: TouchPatternSeeds | null,
): SignalRuntimeResult {
  const debugNotes: string[] = [];

  // 1. createStimulusPacket
  const stimulus = createStimulusPacket(rawText, novelty, touchSeeds);
  debugNotes.push(`stimulus: salience=${stimulus.salience.toFixed(2)}, emotionalCharge=${stimulus.emotionalCharge.toFixed(2)}, explicitQuestion=${stimulus.explicitQuestion}`);

  // 2. activateSignals
  let signals = activateSignals(stimulus);
  debugNotes.push(`activateSignals: ${signals.length} signals activated`);

  // 3. runSelfLoop
  signals = runSelfLoop(stimulus, signals);
  debugNotes.push(`runSelfLoop: self-substrate applied`);

  // 4. runBoundaryLoop
  const boundary = runBoundaryLoop(stimulus, signals);
  debugNotes.push(`boundary: permeability=${boundary.permeability.toFixed(2)}, externalPressure=${boundary.externalPressure.toFixed(2)}`);

  // 5. buildSignalField
  const field = buildSignalField(signals, boundary);
  debugNotes.push(`field: answerPressure=${field.answerPressure.toFixed(2)}, fragility=${field.fragility.toFixed(2)}, unfinishedness=${field.unfinishedness.toFixed(2)}`);

  // 6. bindSignals
  const bindings = bindSignals(signals);
  debugNotes.push(`bindSignals: ${bindings.length} bindings formed`);

  // 7. deriveProtoMeanings
  const protoMeanings = deriveProtoMeanings(signals, bindings, touchSeeds);
  debugNotes.push(`protoMeanings: ${protoMeanings.map(pm => pm.glossJa).join(' | ')}`);

  // 8. decideSignalUtterance
  const decision = decideSignalUtterance(stimulus, protoMeanings, field, signals);
  debugNotes.push(`decision: stance=${decision.stance}, replyIntent=${decision.replyIntent}, shouldAnswer=${decision.shouldAnswerQuestion}`);

  // 9. lexicalizeProtoMeanings
  const lexicalCandidates = lexicalizeProtoMeanings(protoMeanings);
  debugNotes.push(`lexical: ${lexicalCandidates.length} candidates produced`);

  // 10. bindSignalPhrases
  const phrases = bindSignalPhrases(lexicalCandidates, protoMeanings, decision);
  debugNotes.push(`phrases: reaction="${phrases.reaction ?? ''}", answer="${phrases.answer ?? ''}"`);

  // 11. buildSignalSentencePlan
  const sentencePlan = buildSignalSentencePlan(phrases, decision);
  debugNotes.push(`sentencePlan: keys=${Object.keys(sentencePlan).filter(k => sentencePlan[k as keyof typeof sentencePlan]).join(',')}`);

  // 12. renderSignalUtterance
  const utterance = renderSignalUtterance(sentencePlan, decision, stimulus);
  debugNotes.push(`utterance length: ${utterance.length} chars`);

  // PR8-B: touch seeds debug note
  if (touchSeeds) {
    const seeds = touchSeeds.protoMeaningSeeds;
    debugNotes.push(
      `touchSeeds: novelty=${touchSeeds.noveltyBias.toFixed(2)} recurrence=${touchSeeds.recurrenceBias.toFixed(2)} persistence=${touchSeeds.persistenceBias.toFixed(2)} directionality=${touchSeeds.directionalityBias.toFixed(2)} seeds=[${seeds.join(',')}]`,
    );
  }

  const result: SignalRuntimeResult = {
    stimulus,
    signals,
    boundary,
    field,
    bindings,
    protoMeanings,
    decision,
    lexicalCandidates,
    sentencePlan,
    utterance,
    debugNotes,
    touchSeeds: touchSeeds ?? null,
  };

  // revision / memory 記録
  recordSignalMemory(result);

  return result;
}
