/**
 * valueKindLabelsJa.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Value Kind Badge Labels
 *
 * Japanese translations for ValueKind badges.
 * Each kind includes: Japanese label, English label, tooltip description.
 *
 * Principles:
 * - Japanese-first labels.
 * - No consciousness / life / intelligence proof claims.
 * - No fake visual / fake result.
 */

// ── Type ──────────────────────────────────────────────────────────────────────

export type ValueKind =
    | 'Raw'
    | 'Measured'
    | 'Derived'
    | 'Proxy'
    | 'Check'
    | 'Reference'
    | 'Presentation-smoothed';

export interface ValueKindLabel {
    kind: ValueKind;
    jaLabel: string;
    enLabel: string;
    tooltipJa: string;
}

// ── Value Kind Labels ─────────────────────────────────────────────────────────

export const VALUE_KIND_LABELS_JA: ValueKindLabel[] = [
    {
        kind: 'Raw',
        jaLabel: '生値',
        enLabel: 'Raw',
        tooltipJa:
            'ランタイムから直接取得された未加工の値です。加工・平滑化はされていません。',
    },
    {
        kind: 'Measured',
        jaLabel: '測定値',
        enLabel: 'Measured',
        tooltipJa:
            '場から直接測定された観測値です。計算によって導出されたものではありません。',
    },
    {
        kind: 'Derived',
        jaLabel: '導出値',
        enLabel: 'Derived',
        tooltipJa:
            '他の観測値を組み合わせて計算によって導出された値です。元の観測値の品質に依存します。',
    },
    {
        kind: 'Proxy',
        jaLabel: '補助指標',
        enLabel: 'Proxy',
        tooltipJa:
            '直接の証明ではなく、状態を読みやすくするための観測補助値です。因果証明ではありません。',
    },
    {
        kind: 'Check',
        jaLabel: '確認値',
        enLabel: 'Check',
        tooltipJa:
            '破綻や整合性を確認するための値です。観測値そのものの重要性を示すものではありません。',
    },
    {
        kind: 'Reference',
        jaLabel: '参照値',
        enLabel: 'Reference',
        tooltipJa:
            '比較のために使う値です。core dynamics の因果成分ではありません。',
    },
    {
        kind: 'Presentation-smoothed',
        jaLabel: '表示用に平滑化',
        enLabel: 'Presentation-smoothed',
        tooltipJa:
            '表示を見やすくするために平滑化処理が加えられた値です。生値とは異なる場合があります。',
    },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Get label info by ValueKind */
export function getValueKindLabel(kind: ValueKind): ValueKindLabel | undefined {
    return VALUE_KIND_LABELS_JA.find((v) => v.kind === kind);
}

/** Get Japanese label for a ValueKind */
export function getValueKindJaLabel(kind: ValueKind): string {
    return getValueKindLabel(kind)?.jaLabel ?? kind;
}

/** Get tooltip text for a ValueKind */
export function getValueKindTooltip(kind: ValueKind): string {
    return getValueKindLabel(kind)?.tooltipJa ?? '';
}

/** All value kinds */
export const ALL_VALUE_KINDS: ValueKind[] = [
    'Raw',
    'Measured',
    'Derived',
    'Proxy',
    'Check',
    'Reference',
    'Presentation-smoothed',
];
