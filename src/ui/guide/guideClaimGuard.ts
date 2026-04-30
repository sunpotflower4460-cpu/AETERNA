/**
 * guideClaimGuard.ts
 * U6: Guide / Explanation System — Claim Guard
 *
 * Detects and replaces forbidden consciousness / emotion / intent expressions
 * before they reach the UI.
 *
 * Principles:
 * - Guide describes observation metrics, NOT emotion, consciousness, or intent.
 * - "AETERNA thinks / wants / feels / is lonely / is conscious" style claims
 *   are strictly forbidden.
 * - This guard is the last safety layer — primary enforcement is in the
 *   derivation functions themselves.
 * - No LLM / API dependency.
 *
 * Reference: docs/default-guide-principles.md §5.3
 * Reference: docs/scientific-ui-ux-principles.md
 */

// ── Forbidden pattern list ─────────────────────────────────────────────────────

/**
 * Forbidden English terms / phrases that imply consciousness, emotion, or intent.
 * Case-insensitive matching is applied.
 */
const FORBIDDEN_EN: readonly string[] = [
    'AETERNA thinks',
    'AETERNA wants',
    'AETERNA feels',
    'AETERNA is lonely',
    'AETERNA understands',
    'AETERNA remembered',
    'AETERNA is conscious',
    'AETERNA is aware',
    'AETERNA desires',
    'AETERNA is happy',
    'AETERNA is sad',
    'AETERNA is excited',
    'AETERNA is afraid',
    'AETERNA loves',
    'AETERNA hates',
    'is thinking',
    'is feeling',
    'wants to',
    'feels lonely',
    'feels unstable',
    'is self-aware',
    'has emotions',
    'has feelings',
    'has desires',
    'has consciousness',
    'is conscious',
    'is sentient',
    'is alive',
    'has a soul',
    'has awareness',
    'became aware',
    'is experiencing',
    'is suffering',
    'is happy',
    'is sad',
] as const;

/**
 * Forbidden Japanese terms / phrases that imply consciousness, emotion, or intent.
 */
const FORBIDDEN_JA: readonly string[] = [
    '考えています',
    '欲しがっています',
    '感じています',
    '寂しい',
    '意識があります',
    '意識を持',
    '自我があります',
    '理解しました',
    '覚えました',
    '感情',
    '欲求',
    '感じる',
    '思っている',
    '望んでいる',
    '生きている',
    '意識',
    '自覚',
    '喜んでいる',
    '悲しんでいる',
    '怖がっている',
    '愛している',
    '嫌っている',
] as const;

// ── Replacement phrase ─────────────────────────────────────────────────────────

/**
 * Neutral observation phrase used to replace any forbidden claim found in text.
 * This is a last-resort fallback — derivation functions should never produce
 * forbidden phrases in the first place.
 */
const NEUTRAL_REPLACEMENT = '[observation metric — no consciousness/emotion claim]';

// ── hasForbiddenClaim ─────────────────────────────────────────────────────────

/**
 * Returns true if the input text contains any forbidden consciousness / emotion
 * / intent claim.
 *
 * Case-insensitive for English terms; exact match for Japanese terms.
 *
 * @param text  Input string to check
 */
export function hasForbiddenClaim(text: string): boolean {
    const lower = text.toLowerCase();
    for (const term of FORBIDDEN_EN) {
        if (lower.includes(term.toLowerCase())) return true;
    }
    for (const term of FORBIDDEN_JA) {
        if (text.includes(term)) return true;
    }
    return false;
}

// ── sanitizeClaim ─────────────────────────────────────────────────────────────

/**
 * Replace any forbidden claims in the input text with a neutral placeholder.
 *
 * Should be called on all generated guide text before rendering.
 * A clean derivation pipeline will never trigger this replacement, but it
 * serves as a safety net.
 *
 * @param text  Input string
 * @returns     Sanitized string (forbidden phrases replaced)
 */
export function sanitizeClaim(text: string): string {
    let result = text;
    const lower = text.toLowerCase();
    for (const term of FORBIDDEN_EN) {
        const idx = lower.indexOf(term.toLowerCase());
        if (idx !== -1) {
            result = result.slice(0, idx) + NEUTRAL_REPLACEMENT + result.slice(idx + term.length);
        }
    }
    for (const term of FORBIDDEN_JA) {
        result = result.replaceAll(term, NEUTRAL_REPLACEMENT);
    }
    return result;
}

// ── sanitizeLines ─────────────────────────────────────────────────────────────

/**
 * Sanitize an array of text lines.
 * Removes any lines that contain forbidden claims after replacement attempt.
 *
 * @param lines  Array of text lines
 * @returns      Array of sanitized lines (forbidden lines removed)
 */
export function sanitizeLines(lines: string[]): string[] {
    return lines
        .map(sanitizeClaim)
        .filter(line => !hasForbiddenClaim(line));
}

// ── getForbiddenTerms ─────────────────────────────────────────────────────────

/**
 * Returns the full list of forbidden English and Japanese terms.
 * Exposed for testing purposes.
 */
export function getForbiddenTerms(): { en: readonly string[]; ja: readonly string[] } {
    return { en: FORBIDDEN_EN, ja: FORBIDDEN_JA };
}
