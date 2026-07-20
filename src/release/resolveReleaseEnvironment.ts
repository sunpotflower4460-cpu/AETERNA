/**
 * resolveReleaseEnvironment.ts
 *
 * Resolves the ReleaseEnvironmentConfig actually used to gate the live app
 * (main.ts) at boot. Until this session, defaultReleaseEnvironmentConfig
 * existed only as an unconsumed type/default (see
 * docs/current-public-runtime-map.md) — this is the first place anything
 * in the running app reads it.
 *
 * There is currently only one build target (no separate "public" vs
 * "internal" build command — see docs/ui-runtime-inventory.md §1), so the
 * safe default here is the publicResearch channel for every build unless a
 * developer explicitly opts in locally via VITE_AETERNA_CHANNEL (e.g. in a
 * gitignored .env.local) when running `npm run dev`.
 */

import type { ReleaseChannel, ReleaseEnvironmentConfig } from '../config/releaseEnvironmentConfig.js';
import { defaultReleaseEnvironmentConfig } from '../config/releaseEnvironmentConfig.js';

const KNOWN_CHANNELS: ReleaseChannel[] = ['local', 'preview', 'publicResearch', 'internalResearch', 'experimental'];

function readChannelOverride(): ReleaseChannel | null {
  const raw = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_AETERNA_CHANNEL;
  if (raw && (KNOWN_CHANNELS as string[]).includes(raw)) {
    return raw as ReleaseChannel;
  }
  return null;
}

export function resolveReleaseEnvironment(): ReleaseEnvironmentConfig {
  const channel = readChannelOverride() ?? 'publicResearch';

  if (channel === 'publicResearch') {
    return defaultReleaseEnvironmentConfig;
  }

  // local / preview / internalResearch / experimental: an explicit,
  // developer-opted-in override. Still starts from the safe defaults and
  // only opens the specific gates this session wires up (external API,
  // node bridge, debug panels) — it does not touch anything else.
  return {
    ...defaultReleaseEnvironmentConfig,
    channel,
    externalApiEnabled: true,
    nodeBridgeEnabled: true,
    showDebugPanels: true,
    showRawDiagnostics: true,
  };
}
