/**
 * shellFeatureFlag.ts
 *
 * Opt-in gate for the new Observatory Shell (src/app/AppShell.ts).
 * Off by default — checked via ?newShell=1 query param or a
 * localStorage flag, so the default app experience is byte-for-byte
 * unchanged until the Shell has real panel content and its own
 * Playwright coverage proves it's ready to become the default
 * (master spec §0: don't delete legacy before new UI E2E is complete —
 * this flag is the "before" state that makes that eventual cutover safe).
 */

const QUERY_PARAM = 'newShell';
const STORAGE_KEY = 'aeterna_newShell';

export function isNewShellEnabled(location: Location = window.location): boolean {
  const params = new URLSearchParams(location.search);
  if (params.get(QUERY_PARAM) === '1') return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // localStorage can throw in restricted contexts (private browsing, etc.)
    return false;
  }
}
