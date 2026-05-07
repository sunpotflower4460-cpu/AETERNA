/**
 * htmlEsc.ts
 * v2.4: AETERNA-NATURAL — shared HTML escape utility
 *
 * XSS-safe HTML escaping for pure-HTML-string rendering components.
 */

/**
 * Escape a value for safe HTML output.
 * Handles undefined / null gracefully.
 */
export function esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
