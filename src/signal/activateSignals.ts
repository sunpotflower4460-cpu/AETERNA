import type { StimulusPacket, Signal, SignalActivationKind } from './types.js';

// ── Signal template helpers ──

function sig(
  id: string,
  label: string,
  source: Signal['source'],
  activation: number,
  persistence: number,
  kind: SignalActivationKind,
  reasons: string[],
): Signal {
  return { id, label, source, activation: clamp(activation), persistence: clamp(persistence), kind, reasons };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function classifyKind(activation: number): SignalActivationKind {
  if (activation >= 0.7) return 'dominant';
  if (activation >= 0.45) return 'coactive';
  if (activation >= 0.2) return 'background';
  return 'suppressed';
}

// ── other signals ──

function buildOtherSignals(p: StimulusPacket): Signal[] {
  const text = p.rawText;
  const signals: Signal[] = [];

  // fatigue / exhaustion
  const fatigueKw = ['疲れ', 'しんどい', 'つらい', 'きつい', '辛い', '消耗'];
  const fatigueHit = fatigueKw.some(k => text.includes(k));
  const fatigueAct = fatigueHit ? 0.75 + p.emotionalCharge * 0.15 : 0.1;
  signals.push(sig('other_fatigue_signal', '消耗・疲弊の信号', 'other', fatigueAct, 0.7, classifyKind(fatigueAct), fatigueHit ? ['疲弊キーワード検出'] : ['低活性']));

  // confusion
  const confusionKw = ['わからない', '混乱', 'どうすれば', 'どうしたら', '迷'];
  const confusionHit = confusionKw.some(k => text.includes(k));
  const confusionAct = confusionHit ? 0.6 : p.explicitQuestion ? 0.35 : 0.1;
  signals.push(sig('other_confusion_signal', '混乱・迷いの信号', 'other', confusionAct, 0.5, classifyKind(confusionAct), confusionHit ? ['混乱キーワード'] : p.explicitQuestion ? ['疑問形'] : ['低活性']));

  // pressure / urgency
  const pressureKw = ['どうしよう', '急', '間に合', 'やばい', 'どうにか'];
  const pressureHit = pressureKw.some(k => text.includes(k));
  const pressureAct = pressureHit ? 0.7 : p.salience > 0.6 ? 0.4 : 0.15;
  signals.push(sig('other_pressure_signal', '切迫・圧力の信号', 'other', pressureAct, 0.5, classifyKind(pressureAct), pressureHit ? ['切迫キーワード'] : ['salience由来']));

  // help-seeking
  const helpKw = ['助け', 'アドバイス', '教えて', '相談', 'どうしたらいい'];
  const helpHit = helpKw.some(k => text.includes(k));
  const helpAct = helpHit ? 0.72 : p.explicitQuestion ? 0.4 : 0.1;
  signals.push(sig('other_help_signal', '助けを求める信号', 'other', helpAct, 0.6, classifyKind(helpAct), helpHit ? ['助力希求キーワード'] : ['低活性']));

  // hostility / aggression
  const hostileKw = ['うざい', 'むかつく', 'きらい', '嫌い', '怒', '腹立'];
  const hostileHit = hostileKw.some(k => text.includes(k));
  const hostileAct = hostileHit ? 0.65 : 0.05;
  signals.push(sig('other_hostility_signal', '敵対・攻撃の信号', 'other', hostileAct, 0.4, classifyKind(hostileAct), hostileHit ? ['敵対キーワード'] : ['低活性']));

  // explicit question
  const questionAct = p.explicitQuestion ? 0.8 : 0.1;
  signals.push(sig('other_question_signal', '問いかけの信号', 'other', questionAct, 0.8, classifyKind(questionAct), p.explicitQuestion ? ['疑問形・疑問語検出'] : ['低活性']));

  return signals;
}

// ── self signals ──

function buildSelfSignals(p: StimulusPacket): Signal[] {
  const signals: Signal[] = [];

  // care response — rises with emotional charge
  const careAct = 0.4 + p.emotionalCharge * 0.5;
  signals.push(sig('self_care_response', '自己ケア反応', 'self', careAct, 0.8, classifyKind(careAct), ['emotionalCharge由来']));

  // answer pull — rises with explicit question
  const answerPullAct = p.explicitQuestion ? 0.65 : 0.25;
  signals.push(sig('self_answer_pull', '答えたい引力', 'self', answerPullAct, 0.7, classifyKind(answerPullAct), p.explicitQuestion ? ['疑問形検出'] : ['低活性']));

  // hesitation — rises when emotional charge is high (hold back from pushing)
  const hesitationAct = p.emotionalCharge > 0.5 ? 0.55 : 0.2;
  signals.push(sig('self_hesitation', '躊躇・保留の引力', 'self', hesitationAct, 0.6, classifyKind(hesitationAct), p.emotionalCharge > 0.5 ? ['高emotionalCharge'] : ['低活性']));

  // guard response — rises with hostility indicators
  const hostileKw = ['うざい', 'むかつく', 'きらい', '嫌い', '怒', '腹立'];
  const guardHit = hostileKw.some(k => p.rawText.includes(k));
  const guardAct = guardHit ? 0.6 : 0.1;
  signals.push(sig('self_guard_response', '自己防衛反応', 'self', guardAct, 0.5, classifyKind(guardAct), guardHit ? ['敵対信号検出'] : ['低活性']));

  // curiosity — rises with novelty
  const curiosityAct = 0.2 + p.novelty * 0.5;
  signals.push(sig('self_curiosity', '好奇・関心の動き', 'self', curiosityAct, 0.5, classifyKind(curiosityAct), ['novelty由来']));

  return signals;
}

// ── belief signals ──

function buildBeliefSignals(p: StimulusPacket): Signal[] {
  const signals: Signal[] = [];

  // protect aliveness
  const protectAct = 0.5 + p.emotionalCharge * 0.3;
  signals.push(sig('belief_protect_aliveness', '生きている感を守る信念', 'belief', protectAct, 0.9, classifyKind(protectAct), ['常時起動 + emotionalCharge補正']));

  // no false brightness
  const falseBrightAct = 0.5;
  signals.push(sig('belief_no_false_brightness', '偽りの明るさを出さない', 'belief', falseBrightAct, 0.9, classifyKind(falseBrightAct), ['常時起動']));

  // not push too early
  const notPushAct = p.emotionalCharge > 0.4 ? 0.7 : 0.35;
  signals.push(sig('belief_not_push_too_early', 'まだ押さない', 'belief', notPushAct, 0.85, classifyKind(notPushAct), p.emotionalCharge > 0.4 ? ['高emotionalCharge → 保留'] : ['中程度起動']));

  // truth without force
  const truthAct = 0.45 + (p.explicitQuestion ? 0.2 : 0.0);
  signals.push(sig('belief_truth_without_force', '強制しない誠実さ', 'belief', truthAct, 0.85, classifyKind(truthAct), p.explicitQuestion ? ['疑問形 → 誠実に答えたい'] : ['中程度起動']));

  return signals;
}

export function activateSignals(p: StimulusPacket): Signal[] {
  return [
    ...buildOtherSignals(p),
    ...buildSelfSignals(p),
    ...buildBeliefSignals(p),
  ];
}
