/**
 * lensGuideTypes.ts
 * v1.9: Lens-aware AI Guide
 *
 * Defines LensGuideRequest and LensGuideResponse types.
 *
 * Design principles:
 * - No LLM / external API dependency.
 * - All fields are observation-based.
 * - No consciousness / emotion / life-proof claims.
 *
 * Reference: docs/lens-aware-ai-guide.md
 */

import type { LensGuideMode } from '../config/lensGuideConfig.ts';
import type { LensContextPacket } from '../ui/lens/lensContextPacket.ts';
import type { LensGuideContext } from './buildLensGuideContext.ts';

export type { LensGuideMode };

// ── LensGuideRequest ──────────────────────────────────────────────────────────

export interface LensGuideRequest {
  mode: LensGuideMode;
  userQuestion: string;
  lensContext: LensContextPacket;
  guideContext?: LensGuideContext;
  locale?: 'ja' | 'en';
  publicMode?: boolean;
}

// ── LensGuideResponse ─────────────────────────────────────────────────────────

export interface LensGuideResponse {
  mode: LensGuideMode;
  answer: string;
  observationFacts: string[];
  hypothesisCandidates: string[];
  comparisonNotes: string[];
  cautionNotes: string[];
  suggestedNextLenses: string[];
  suggestedNextPanels: string[];
  confidence: number;
  usedContextKinds: string[];
  claimGuardPassed: boolean;
  blockedClaims: string[];
}
