/**
 * Negation-aware forbidden-claim detection for guard tests.
 *
 * A bare substring check (`content.includes(claim)`) cannot distinguish an
 * actual affirmative claim from the same phrase appearing inside this
 * repo's own "❌ do not say this" documentation lists or "This does not
 * prove X" runtime disclaimers - both patterns quote the forbidden phrase
 * verbatim precisely because they are warning against it. Several guard
 * tests (energyRealityAuditDocs.test.ts, externalDriveField.test.ts) were
 * tripping on their own honest documentation/disclaimers for this reason.
 *
 * This does not weaken the check: a claim appearing without a nearby
 * negation cue, and outside a "these are bad examples" section, is still
 * flagged exactly as before.
 */

const NEGATIVE_SECTION_HEADING = /(❌|avoid|forbidden|prohibited|避ける|should not say|do not say)/i;
const NEGATION_CUE = /(not|avoid|avoided|prohibited|forbidden|never|❌|does not|do not|should not|must not|not:)[^.]{0,60}$/i;
const NEGATION_WINDOW = 80;

interface LineRange {
  start: number;
  end: number;
  underNegativeHeading: boolean;
  /** Offset right after the most recent heading line (0 if none yet). Sentence-level
   * negation context is never allowed to reach past this boundary, so a cue word
   * from a closed-off section (e.g. a previous "### Avoid" heading's own text)
   * cannot leak into an unrelated later section. */
  sectionStart: number;
}

function buildLineRanges(haystack: string): LineRange[] {
  const lines = haystack.split('\n');
  const ranges: LineRange[] = [];
  let underNegativeHeading = false;
  let sectionStart = 0;
  let offset = 0;
  for (const line of lines) {
    const headingMatch = /^#{1,6}\s+(.*)$/.exec(line);
    if (headingMatch) {
      underNegativeHeading = NEGATIVE_SECTION_HEADING.test(headingMatch[1]);
      sectionStart = offset + line.length + 1;
    }
    const start = offset;
    const end = offset + line.length;
    ranges.push({ start, end, underNegativeHeading, sectionStart });
    offset = end + 1;
  }
  return ranges;
}

/**
 * True if `claim` appears in `haystack` as what reads like an actual
 * affirmative statement - i.e. not under a "❌ / avoid saying this" style
 * Markdown heading, and not immediately preceded (within NEGATION_WINDOW
 * characters, same statement, not crossing a heading boundary) by a
 * negation cue.
 */
export function containsAffirmativeClaim(haystack: string, claim: string): boolean {
  const lineRanges = buildLineRanges(haystack);
  let searchFrom = 0;
  for (;;) {
    const idx = haystack.indexOf(claim, searchFrom);
    if (idx === -1) return false;
    const line = lineRanges.find((r) => idx >= r.start && idx <= r.end);
    if (line?.underNegativeHeading) {
      searchFrom = idx + claim.length;
      continue;
    }
    const contextStart = Math.max(line?.sectionStart ?? 0, idx - NEGATION_WINDOW);
    const context = haystack.slice(contextStart, idx);
    if (NEGATION_CUE.test(context)) {
      searchFrom = idx + claim.length;
      continue;
    }
    return true;
  }
}

/** Returns the first claim from `claims` that appears affirmatively in `haystack`, or undefined. */
export function findAffirmativeClaim(haystack: string, claims: readonly string[]): string | undefined {
  return claims.find((claim) => containsAffirmativeClaim(haystack, claim));
}
