export type ValueKind =
    | 'raw'
    | 'measured'
    | 'derived'
    | 'proxy'
    | 'check'
    | 'presentation-smoothed'
    | 'reference';

export interface ValueKindDefinition {
    kind: ValueKind;
    label: string;
    tooltip: string;
}

export const VALUE_KIND_DEFINITIONS: Record<ValueKind, ValueKindDefinition> = {
    raw: {
        kind: 'raw',
        label: 'Raw',
        tooltip: 'ほぼ加工前の値です。',
    },
    measured: {
        kind: 'measured',
        label: 'Measured',
        tooltip: '観測バッファから直接読んだ値です。',
    },
    derived: {
        kind: 'derived',
        label: 'Derived',
        tooltip: '実測・内部状態から計算された導出値です。',
    },
    proxy: {
        kind: 'proxy',
        label: 'Proxy',
        tooltip: '直接証明ではなく、状態を推定するための補助指標です。',
    },
    check: {
        kind: 'check',
        label: 'Check',
        tooltip: '破綻や整合性を確認するための検査値です。',
    },
    'presentation-smoothed': {
        kind: 'presentation-smoothed',
        label: 'Presentation-smoothed',
        tooltip: '表示の読みやすさのために平滑化された値です。',
    },
    reference: {
        kind: 'reference',
        label: 'Reference',
        tooltip: '比較用の参照値であり、core dynamics の因果成分ではありません。',
    },
};

export interface ValueKindRowMeta {
    kind: ValueKind;
    tooltip?: string;
}

export const NATURAL_VALUE_KIND_ROW_MAP: Record<string, ValueKindRowMeta> = {
    'row-gaussian-range': {
        kind: 'derived',
        tooltip: 'Gaussian curvature range は幾何から導出された観測値です。',
    },
    'row-mean-range': {
        kind: 'derived',
        tooltip: 'Mean curvature range は幾何から導出された観測値です。',
    },
    'row-curvature-asymmetry': {
        kind: 'proxy',
        tooltip: 'Curvature asymmetry は曲率偏りの proxy です。',
    },
    'row-area-element-range': {
        kind: 'derived',
        tooltip: 'Area element range はトーラス幾何から導出された観測値です。',
    },
    'row-curvature-regions': {
        kind: 'derived',
        tooltip: 'Inner / outer rim region counts は幾何学的な領域集計です。',
    },
    'row-geometry-confidence': {
        kind: 'check',
        tooltip: 'Geometry confidence は有限性と正規化の check です。',
    },
    'row-complex-max-amplitude': {
        kind: 'derived',
    },
    'row-complex-average-amplitude': {
        kind: 'derived',
    },
    'row-complex-phase-coherence': {
        kind: 'derived',
        tooltip: 'Phase は数学的位相であり、感情や意味ではありません。',
    },
    'row-complex-vortex-count': {
        kind: 'proxy',
        tooltip: 'Vortex candidate は observer-side の位相欠陥候補です。',
    },
    'row-complex-positive-charge': {
        kind: 'proxy',
    },
    'row-complex-negative-charge': {
        kind: 'proxy',
    },
    'row-complex-total-charge': {
        kind: 'check',
        tooltip: 'Signed total charge は topological check です。',
    },
    'row-complex-charge-deviation': {
        kind: 'check',
    },
    'row-complex-average-vortex-confidence': {
        kind: 'proxy',
    },
    'row-complex-average-vortex-lifetime': {
        kind: 'proxy',
    },
    'row-complex-curvature-vortex-correlation': {
        kind: 'proxy',
    },
    'row-complex-nan': {
        kind: 'check',
    },
    'row-complex-amplitude-clamp': {
        kind: 'check',
    },
    'row-complex-phase-unwrap': {
        kind: 'check',
    },
    'row-membrane-average-permeability': {
        kind: 'derived',
    },
    'row-membrane-average-tension': {
        kind: 'derived',
    },
    'row-membrane-average-deformation': {
        kind: 'derived',
    },
    'row-membrane-average-actuation-imprint': {
        kind: 'derived',
    },
    'row-membrane-average-return-imprint': {
        kind: 'derived',
    },
    'row-membrane-average-two-sidedness': {
        kind: 'proxy',
    },
    'row-membrane-overlap': {
        kind: 'proxy',
    },
    'row-membrane-recovery-balance': {
        kind: 'proxy',
    },
    'row-membrane-integrity': {
        kind: 'check',
    },
    'row-membrane-high-deformation-count': {
        kind: 'derived',
    },
    'row-membrane-nan': {
        kind: 'check',
    },
};

export function getValueKindDefinition(kind: ValueKind): ValueKindDefinition {
    return VALUE_KIND_DEFINITIONS[kind];
}

export function formatValueKindLabel(kind: ValueKind | string): string {
    return VALUE_KIND_DEFINITIONS[kind as ValueKind]?.label
        ?? `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
}
