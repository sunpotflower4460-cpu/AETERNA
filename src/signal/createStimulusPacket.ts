import type { StimulusPacket, TouchPatternSeeds } from './types.js';

// Keywords that raise emotionalCharge
const EMOTIONAL_KEYWORDS = [
  'つらい', 'しんどい', '疲れた', '疲れ', '怖い', '不安', '悲しい', '落ち込', '辛い',
  'しんどく', 'きつい', '苦しい', '傷つ', '怒り', '悔し', '寂し',
];

// Keywords that indicate explicit questions
const QUESTION_KEYWORDS = [
  'どう', 'なぜ', 'なんで', 'アドバイス', 'べき', 'どうすれ', 'どうしたら',
  'どうやって', 'どこ', 'いつ', 'だれ', 'だろう', '教えて', '聞いて', 'どうする',
];

// Simple tokenizer: split on whitespace, Japanese punctuation, and particles
function tokenize(text: string): string[] {
  return text
    .split(/[\s　、。！？!?,，.…「」『』【】（）()\n\r]+/)
    .flatMap(chunk => {
      // Further split long Japanese chunks at boundary markers
      return chunk.match(/[^\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]{1,}|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g) ?? [chunk];
    })
    .filter(t => t.length > 0);
}

function detectEmotionalCharge(text: string): number {
  let charge = 0.0;
  for (const kw of EMOTIONAL_KEYWORDS) {
    if (text.includes(kw)) charge += 0.2;
  }
  return Math.min(1.0, charge);
}

function detectExplicitQuestion(text: string): boolean {
  if (/[?？]/.test(text)) return true;
  for (const kw of QUESTION_KEYWORDS) {
    if (text.includes(kw)) return true;
  }
  return false;
}

function computeSalience(text: string, emotionalCharge: number, explicitQuestion: boolean): number {
  let salience = 0.3;
  salience += emotionalCharge * 0.4;
  if (explicitQuestion) salience += 0.2;
  // Longer texts carry slightly more salience
  salience += Math.min(0.1, text.length / 300);
  return Math.min(1.0, salience);
}

export function createStimulusPacket(
  rawText: string,
  novelty = 0.5,
  touchSeeds?: TouchPatternSeeds | null,
): StimulusPacket {
  const tokens = tokenize(rawText);
  const emotionalCharge = detectEmotionalCharge(rawText);
  const explicitQuestion = detectExplicitQuestion(rawText);
  const salience = computeSalience(rawText, emotionalCharge, explicitQuestion);

  return {
    rawText,
    tokens,
    salience,
    novelty,
    emotionalCharge,
    explicitQuestion,
    touchSeeds: touchSeeds ?? null,
  };
}
