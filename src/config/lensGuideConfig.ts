/**
 * lensGuideConfig.ts
 * v1.9: Lens-aware AI Guide
 *
 * Configuration for the Lens-aware AI Guide system.
 *
 * Design principles:
 * - Default provider is rule-based (no LLM/API calls).
 * - External API is disabled by default.
 * - Claim guard is required by default.
 * - No consciousness / emotion / life-proof claims.
 *
 * Reference: docs/lens-aware-ai-guide.md
 */

export type LensGuideProvider = 'ruleBased' | 'llmInterfaceOnly';
export type LensGuideMode = 'explain' | 'hypothesis' | 'compare' | 'caution' | 'nextObservation';

export interface LensGuideConfig {
  enabled: boolean;
  provider: LensGuideProvider;
  allowExternalApi: boolean;
  allowInPublicMode: boolean;
  defaultMode: LensGuideMode;
  maxContextTokensApprox: number;
  includeCausalTrace: boolean;
  includeLayerCorrelation: boolean;
  includeDifferenceView: boolean;
  includeReplayContext: boolean;
  requireClaimGuard: boolean;
  requireCautionNotes: boolean;
}

export const defaultLensGuideConfig: LensGuideConfig = {
  enabled: true,
  provider: 'ruleBased',
  allowExternalApi: false,
  allowInPublicMode: true,
  defaultMode: 'explain',
  maxContextTokensApprox: 3000,
  includeCausalTrace: true,
  includeLayerCorrelation: true,
  includeDifferenceView: true,
  includeReplayContext: true,
  requireClaimGuard: true,
  requireCautionNotes: true,
};
