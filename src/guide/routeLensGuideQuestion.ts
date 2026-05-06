/**
 * routeLensGuideQuestion.ts
 * v1.9: Lens-aware AI Guide
 *
 * Routes a user question string to the appropriate LensGuideMode.
 *
 * Design principles:
 * - Rule-based keyword matching only.
 * - No LLM / external API calls.
 * - Supports both Japanese and English keywords.
 * - Default mode is 'explain'.
 *
 * Reference: docs/lens-aware-ai-guide.md §4
 */

import type { LensGuideMode } from '../config/lensGuideConfig.ts';

/**
 * Route a user question to the appropriate LensGuideMode.
 * Checks patterns in priority order.
 *
 * @param question - Raw user question string
 * @returns LensGuideMode
 */
export function routeLensGuideQuestion(question: string): LensGuideMode {
  const q = question;
  const lower = q.toLowerCase();

  // nextObservation — checked first
  if (
    q.includes('次') ||
    q.includes('どこ見れば') ||
    q.includes('どこ見る') ||
    q.includes('どこを見') ||
    lower.includes('next') ||
    lower.includes('where') ||
    lower.includes('which layer')
  ) {
    return 'nextObservation';
  }

  // hypothesis
  if (
    q.includes('仮説') ||
    q.includes('どう考え') ||
    q.includes('どう解釈') ||
    lower.includes('hypothesis') ||
    lower.includes('hypothesize') ||
    lower.includes('why') ||
    q.includes('なぜ')
  ) {
    return 'hypothesis';
  }

  // compare
  if (
    q.includes('違い') ||
    q.includes('さっきと') ||
    q.includes('比較') ||
    q.includes('差分') ||
    lower.includes('compare') ||
    lower.includes('difference')
  ) {
    return 'compare';
  }

  // caution
  if (
    q.includes('意味ある') ||
    q.includes('証明') ||
    q.includes('本当に') ||
    lower.includes('causal') ||
    lower.includes('proof') ||
    lower.includes('真実')
  ) {
    return 'caution';
  }

  return 'explain';
}
