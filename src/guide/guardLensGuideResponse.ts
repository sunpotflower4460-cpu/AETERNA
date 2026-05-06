/**
 * guardLensGuideResponse.ts
 * v1.9: Lens-aware AI Guide
 *
 * Guards a LensGuideResponse by checking for and replacing forbidden claims.
 *
 * Design principles:
 * - Uses existing hasForbiddenClaim / sanitizeClaim from guideClaimGuard.
 * - Adds v1.9-specific forbidden claims for lens guide context.
 * - Records blocked claims and sets claimGuardPassed accordingly.
 * - No LLM / external API calls.
 *
 * Reference: docs/lens-aware-ai-guide.md §7
 */

import type { LensGuideResponse } from './lensGuideTypes.ts';
import { hasForbiddenClaim, sanitizeClaim } from '../ui/guide/guideClaimGuard.ts';

// ── Additional v1.9 forbidden claims ─────────────────────────────────────────

const FORBIDDEN_V19_EN: readonly string[] = [
  'AETERNA is conscious',
  'AETERNA feels',
  'AETERNA wants',
  'life is proven',
  'intelligence is proven',
  'vortex is mind',
  'plasticity is memory',
  'ratio proves truth',
  'mystical proof',
  'healing proof',
] as const;

const FORBIDDEN_V19_JA: readonly string[] = [
  'AETERNA は意識を持った',
  'AETERNA は感じている',
  'AETERNA は欲している',
  '生命が証明された',
  '知性が証明された',
  '渦は心',
  '可塑性は記憶',
  '比率が真理を証明',
  '神秘の証明',
  '癒しの証明',
] as const;

const GUARD_REPLACEMENT = '[claim guard: observation-only wording applied]';

// ── Check helpers ─────────────────────────────────────────────────────────────

function hasV19Forbidden(text: string): boolean {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_V19_EN) {
    if (lower.includes(term.toLowerCase())) return true;
  }
  for (const term of FORBIDDEN_V19_JA) {
    if (text.includes(term)) return true;
  }
  return false;
}

function findV19Matches(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_V19_EN) {
    if (lower.includes(term.toLowerCase())) found.push(term);
  }
  for (const term of FORBIDDEN_V19_JA) {
    if (text.includes(term)) found.push(term);
  }
  return found;
}

function sanitizeV19(text: string): string {
  let result = text;
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_V19_EN) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx !== -1) {
      result = result.slice(0, idx) + GUARD_REPLACEMENT + result.slice(idx + term.length);
    }
  }
  for (const term of FORBIDDEN_V19_JA) {
    result = result.replaceAll(term, GUARD_REPLACEMENT);
  }
  return result;
}

function guardText(text: string, blockedClaims: string[]): { text: string; blocked: boolean } {
  let t = text;
  let blocked = false;

  // Check v1.9-specific first so matched phrases are recorded in blockedClaims
  // and replaced with the [claim guard: ...] prefix before the existing guard runs.
  if (hasV19Forbidden(t)) {
    const matches = findV19Matches(t);
    for (const m of matches) {
      if (!blockedClaims.includes(m)) blockedClaims.push(m);
    }
    t = sanitizeV19(t);
    blocked = true;
  }

  // Existing guard as an additional safety layer.
  if (hasForbiddenClaim(t)) {
    const sanitized = sanitizeClaim(t);
    if (sanitized !== t) {
      blocked = true;
      t = sanitized;
    }
  }

  return { text: t, blocked };
}

function guardArray(arr: string[], blockedClaims: string[]): { arr: string[]; blocked: boolean } {
  let anyBlocked = false;
  const result = arr.map((item) => {
    const { text, blocked } = guardText(item, blockedClaims);
    if (blocked) anyBlocked = true;
    return text;
  });
  return { arr: result, blocked: anyBlocked };
}

// ── guardLensGuideResponse ────────────────────────────────────────────────────

/**
 * Guard a LensGuideResponse by checking for and replacing forbidden claims.
 *
 * @param response - LensGuideResponse to guard
 * @returns Guarded LensGuideResponse
 */
export function guardLensGuideResponse(response: LensGuideResponse): LensGuideResponse {
  const blockedClaims: string[] = [...response.blockedClaims];
  let anyBlocked = false;

  const { text: answer, blocked: answerBlocked } = guardText(response.answer, blockedClaims);
  if (answerBlocked) anyBlocked = true;

  const { arr: observationFacts, blocked: ofBlocked } = guardArray(response.observationFacts, blockedClaims);
  if (ofBlocked) anyBlocked = true;

  const { arr: hypothesisCandidates, blocked: hcBlocked } = guardArray(response.hypothesisCandidates, blockedClaims);
  if (hcBlocked) anyBlocked = true;

  const { arr: comparisonNotes, blocked: cnBlocked } = guardArray(response.comparisonNotes, blockedClaims);
  if (cnBlocked) anyBlocked = true;

  const { arr: cautionNotes, blocked: cautBlocked } = guardArray(response.cautionNotes, blockedClaims);
  if (cautBlocked) anyBlocked = true;

  return {
    ...response,
    answer,
    observationFacts,
    hypothesisCandidates,
    comparisonNotes,
    cautionNotes,
    claimGuardPassed: !anyBlocked,
    blockedClaims,
  };
}
