// ── Signal Runtime v0 — Type Definitions ──

/**
 * PR8-B: Proto-meaning seeds derived from touch pattern scores.
 * These are bias/tendency values — not definitive emotional labels.
 */
export type TouchPatternSeeds = {
  /** Bias toward arrival / novelty / punctate-contact (tap-derived) */
  noveltyBias: number;
  /** Bias toward recurrence / return / repeated-contact (repeat-derived) */
  recurrenceBias: number;
  /** Bias toward persistence / sustained-contact (hold-derived) */
  persistenceBias: number;
  /** Bias toward directional traversal / passage (stroke-derived) */
  directionalityBias: number;
  /** Soft candidate tags (internal, not final language) */
  protoMeaningSeeds: string[];
};

export type StimulusPacket = {
  rawText: string;
  tokens: string[];
  salience: number;
  novelty: number;
  emotionalCharge: number;
  explicitQuestion: boolean;
  /** PR8-B: Optional touch-pattern-derived proto-meaning seeds */
  touchSeeds?: TouchPatternSeeds | null;
};

export type SignalSource = "other" | "self" | "belief" | "field";

export type SignalActivationKind = "dominant" | "coactive" | "background" | "suppressed";

export type Signal = {
  id: string;
  label: string;
  source: SignalSource;
  activation: number; // 0.0 - 1.0
  persistence: number; // 0.0 - 1.0
  kind: SignalActivationKind;
  reasons: string[];
};

export type BoundaryState = {
  permeability: number;
  selfOuterSeparation: number;
  shockAbsorption: number;
  externalPressure: number;
};

export type SignalField = {
  closeness: number;
  fragility: number;
  urgency: number;
  permission: number;
  answerPressure: number;
  unfinishedness: number;
};

export type SignalBinding = {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;
  reasons: string[];
};

export type ProtoMeaning = {
  id: string;
  glossJa: string;
  strength: number;
  sourceSignalIds: string[];
  sourceBindingIds: string[];
};

export type SignalDecision = {
  stance: "hold" | "answer" | "soft_answer" | "open_reflect";
  replyIntent: "emotional_holding" | "judgment_support" | "practical_advice" | "free_reflection";
  closeness: number;
  answerDepth: number;
  shouldAnswerQuestion: boolean;
  shouldOfferStep: boolean;
  shouldStayOpen: boolean;
  withheldBias: number;
};

export type LexicalCandidate = {
  protoMeaningId: string;
  candidates: string[];
};

export type SignalSentencePlan = {
  reaction?: string;
  core?: string;
  answer?: string;
  nextStep?: string;
};

export type SignalRuntimeResult = {
  stimulus: StimulusPacket;
  signals: Signal[];
  boundary: BoundaryState;
  field: SignalField;
  bindings: SignalBinding[];
  protoMeanings: ProtoMeaning[];
  decision: SignalDecision;
  lexicalCandidates: LexicalCandidate[];
  sentencePlan: SignalSentencePlan;
  utterance: string;
  debugNotes: string[];
  /** PR8-B: Touch-pattern-derived proto-meaning seeds forwarded from bridge */
  touchSeeds?: TouchPatternSeeds | null;
};
