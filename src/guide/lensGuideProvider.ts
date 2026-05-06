/**
 * lensGuideProvider.ts
 * v1.9: Lens-aware AI Guide
 *
 * Defines LensGuideProviderAdapter and provider implementations.
 *
 * Design principles:
 * - Rule-based provider is always available.
 * - External LLM provider is a stub — disabled in this build.
 * - Public mode always uses rule-based provider.
 * - No real LLM / API calls made here.
 *
 * Reference: docs/lens-aware-ai-guide.md §5, §6
 */

import type { LensGuideRequest, LensGuideResponse } from './lensGuideTypes.ts';
import type { LensGuideConfig } from '../config/lensGuideConfig.ts';
import { answerLensGuideRequest } from './ruleBasedLensGuide.ts';

// ── LensGuideProviderAdapter ──────────────────────────────────────────────────

export interface LensGuideProviderAdapter {
  id: string;
  kind: 'ruleBased' | 'externalLlm';
  answer(request: LensGuideRequest): Promise<LensGuideResponse>;
}

// ── ruleBasedLensGuideProvider ────────────────────────────────────────────────

export const ruleBasedLensGuideProvider: LensGuideProviderAdapter = {
  id: 'ruleBased',
  kind: 'ruleBased',
  answer(request: LensGuideRequest): Promise<LensGuideResponse> {
    return Promise.resolve(answerLensGuideRequest(request));
  },
};

// ── externalLlmLensGuideProvider ──────────────────────────────────────────────

export const externalLlmLensGuideProvider: LensGuideProviderAdapter = {
  id: 'externalLlm',
  kind: 'externalLlm',
  answer(_request: LensGuideRequest): Promise<LensGuideResponse> {
    return Promise.reject(new Error('External LLM guide is not enabled in this build.'));
  },
};

// ── getLensGuideProvider ──────────────────────────────────────────────────────

/**
 * Return the appropriate LensGuideProviderAdapter for the given config.
 *
 * External LLM is disabled in public mode and by default.
 * Rule-based provider is always returned in this build.
 *
 * @param config - LensGuideConfig
 * @returns LensGuideProviderAdapter
 */
export function getLensGuideProvider(config: LensGuideConfig): LensGuideProviderAdapter {
  // External LLM is never enabled: not in public mode, and allowExternalApi is false by default
  if (
    config.provider === 'llmInterfaceOnly' &&
    config.allowExternalApi &&
    !config.allowInPublicMode
  ) {
    return externalLlmLensGuideProvider;
  }
  return ruleBasedLensGuideProvider;
}
