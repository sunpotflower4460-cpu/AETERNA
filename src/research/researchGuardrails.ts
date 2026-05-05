const PROHIBITED_RESEARCH_EXPORT_PHRASES_EN = [
    'consciousness proved',
    'life proved',
    'intelligence emerged',
    'soul resonance',
    'mystical proof',
    'healing proof',
    'memory formed',
    'learned meaning',
] as const;

const PROHIBITED_RESEARCH_EXPORT_PHRASES_JA = [
    '意識が証明',
    '生命が証明',
    '知性が生まれた',
    '魂の共鳴',
    '神秘の証明',
    '癒しの証明',
    '記憶しました',
    '意味を学習',
] as const;

export const RESEARCH_INTERPRETATION_GUARDRAILS_EN = [
    'These results are observation metrics, not proof of consciousness.',
    'Vortex candidates are phase-defect candidates, not minds or memories.',
    'Weak plasticity traces are medium-history proxies, not semantic memory.',
    'Observed ratio matches are reference comparisons, not causal or mystical proof.',
    'No emergence is a valid observation.',
] as const;

export const RESEARCH_INTERPRETATION_GUARDRAILS_JA = [
    'これらの結果は観測指標であり、意識の証明ではありません。',
    '渦候補は位相欠陥候補であり、心や記憶ではありません。',
    '弱可塑性痕跡は媒質履歴 proxy であり、意味記憶ではありません。',
    '観測比率と参照値の近接は比較であり、因果証明や神秘的証明ではありません。',
    '創発候補が出ないことも有効な観測結果です。',
] as const;

export const DEFAULT_RESEARCH_LIMITATIONS = [
    'No consciousness proof.',
    'No life proof.',
    'No semantic memory proof.',
    'Seed/scenario dependent observation.',
] as const;

export function containsResearchProhibitedClaim(text: string): boolean {
    const lower = text.toLowerCase();
    return PROHIBITED_RESEARCH_EXPORT_PHRASES_EN.some((term) => lower.includes(term))
        || PROHIBITED_RESEARCH_EXPORT_PHRASES_JA.some((term) => text.includes(term));
}

export function sanitizeResearchText(text: string): string {
    let sanitized = text;
    for (const term of PROHIBITED_RESEARCH_EXPORT_PHRASES_EN) {
        sanitized = sanitized.replace(new RegExp(term, 'gi'), '[observation-only wording applied]');
    }
    for (const term of PROHIBITED_RESEARCH_EXPORT_PHRASES_JA) {
        sanitized = sanitized.replaceAll(term, '[観測表現に置換]');
    }
    return sanitized;
}

export function sanitizeResearchTextLines(lines: readonly string[] | undefined): string[] {
    return (lines ?? [])
        .map((line) => sanitizeResearchText(String(line ?? '')).trim())
        .filter((line) => line.length > 0 && !containsResearchProhibitedClaim(line));
}
