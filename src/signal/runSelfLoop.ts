import type { StimulusPacket, Signal, SignalActivationKind } from './types.js';

// ── Self Substrate (fixed initial self-state) ──
// Represents the continuous self-side substrate that exists
// independently of any single external stimulus.
const SELF_SUBSTRATE = {
  baseline_care: 0.55,
  baseline_curiosity: 0.40,
  baseline_hesitation: 0.30,
  baseline_answer_pull: 0.35,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function classifyKind(activation: number): SignalActivationKind {
  if (activation >= 0.7) return 'dominant';
  if (activation >= 0.45) return 'coactive';
  if (activation >= 0.2) return 'background';
  return 'suppressed';
}

export function runSelfLoop(stimulus: StimulusPacket, signals: Signal[]): Signal[] {
  const updated = signals.map(s => ({ ...s }));

  const getAct = (id: string) => updated.find(s => s.id === id)?.activation ?? 0;

  const externalPressure = stimulus.emotionalCharge;
  const otherFatigue = getAct('other_fatigue_signal');
  const otherQuestion = getAct('other_question_signal');

  // ── self_care_response: rises with external emotional charge and fatigue ──
  const careIdx = updated.findIndex(s => s.id === 'self_care_response');
  if (careIdx >= 0) {
    const delta = (SELF_SUBSTRATE.baseline_care + externalPressure * 0.2 + otherFatigue * 0.15) - updated[careIdx].activation;
    updated[careIdx].activation = clamp(updated[careIdx].activation + delta * 0.5);
    updated[careIdx].kind = classifyKind(updated[careIdx].activation);
    updated[careIdx].reasons.push('selfLoop: baseline_care補正');
  }

  // ── self_answer_pull: rises when other asks a question ──
  const answerIdx = updated.findIndex(s => s.id === 'self_answer_pull');
  if (answerIdx >= 0) {
    const delta = (SELF_SUBSTRATE.baseline_answer_pull + otherQuestion * 0.25) - updated[answerIdx].activation;
    updated[answerIdx].activation = clamp(updated[answerIdx].activation + delta * 0.5);
    updated[answerIdx].kind = classifyKind(updated[answerIdx].activation);
    updated[answerIdx].reasons.push('selfLoop: answer_pull補正');
  }

  // ── self_hesitation: rises when emotional charge is high (slow down before pushing) ──
  const hesIdx = updated.findIndex(s => s.id === 'self_hesitation');
  if (hesIdx >= 0) {
    const delta = (SELF_SUBSTRATE.baseline_hesitation + externalPressure * 0.3) - updated[hesIdx].activation;
    updated[hesIdx].activation = clamp(updated[hesIdx].activation + delta * 0.5);
    updated[hesIdx].kind = classifyKind(updated[hesIdx].activation);
    updated[hesIdx].reasons.push('selfLoop: hesitation補正');
  }

  // ── self_curiosity: rises with novelty, independent of stimulus content ──
  const curIdx = updated.findIndex(s => s.id === 'self_curiosity');
  if (curIdx >= 0) {
    const delta = (SELF_SUBSTRATE.baseline_curiosity + stimulus.novelty * 0.2) - updated[curIdx].activation;
    updated[curIdx].activation = clamp(updated[curIdx].activation + delta * 0.4);
    updated[curIdx].kind = classifyKind(updated[curIdx].activation);
    updated[curIdx].reasons.push('selfLoop: curiosity補正');
  }

  return updated;
}
