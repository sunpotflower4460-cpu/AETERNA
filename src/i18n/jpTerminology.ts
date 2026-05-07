/**
 * jpTerminology.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Terminology Mapping
 *
 * Central repository of Japanese translations for all AETERNA UI terms.
 * English internal IDs / data attributes remain unchanged.
 *
 * Usage:
 *   import { JP } from '../../i18n/jpTerminology.ts';
 *   JP.panels.cellInspector  // → 'セル観測'
 *
 * Principles:
 * - Japanese is the primary display language.
 * - English labels remain available in detail/tooltip context.
 * - No semantic / consciousness / mystical claims in any label.
 */

// ── Panel titles ──────────────────────────────────────────────────────────────

export const JP_PANELS = {
    cellInspector:          'セル観測',
    metricSpotlight:        '観測レンズ',
    causalTrace:            '関連候補',
    layerCorrelation:       '層の相関',
    differenceView:         '差分表示',
    ratioInvolvement:       '観測比率',
    timeReplay:             '観測スナップショット再生',
    observationGuide:       '観測ガイド',
    nowSummary:             '今起きていること',
    observationRoute:       '見る順番',
    terminologyDictionary:  '観測用語辞典',
} as const;

// ── Tab labels ────────────────────────────────────────────────────────────────

export const JP_TABS = {
    // Mobile tabs
    field:       '見る',
    inspector:   '調べる',
    lens:        'レンズ',
    replay:      '時間',
    trace:       '関連',
    guide:       '聞く',
    // Inspector drawer tabs
    cell:        'セル',
    metric:      '観測値',
    events:      '履歴',
    warnings:    '警告',
} as const;

// ── Header labels ─────────────────────────────────────────────────────────────

export const JP_HEADER = {
    title:          'AETERNA-NATURAL',
    liveMode:       'ライブ',
    replayMode:     '再生',
    selectedCell:   'セル',
    noCell:         '（未選択）',
    activeLens:     'レンズ',
    noLens:         '（なし）',
    safetyMode:     '安全モード',
    researchMode:   '研究モード',
    experimentalMode: '実験モード',
    guideNote:      'このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。',
    replayNote:     '再生モードは記録された観測スナップショットを表示しています。runtime 自体が過去に戻ったわけではありません。',
} as const;

// ── Metric labels ─────────────────────────────────────────────────────────────

export const JP_METRICS = {
    // Geometry
    'geometry.gaussianCurvature':   'ガウス曲率',
    'geometry.areaElement':         '面積要素',
    'geometry.innerOuterBias':      '内外バイアス',
    'geometry.majorAngle':          '主角（u）',
    'geometry.minorAngle':          '副角（v）',
    'geometry.meanCurvature':       '平均曲率',
    // Field
    'field.amplitude':              '場の振幅',
    'field.phase':                  '場の位相',
    'field.phaseCoherenceLocal':    '局所位相コヒーレンス',
    'field.flowContinuityLocal':    '局所流れ連続性',
    'field.energyThroughputLocal':  '局所エネルギー通量',
    // Vortex
    'vortex.candidateConfidence':   '渦候補の強さ',
    'vortex.topologicalCharge':     'トポロジカル電荷',
    'vortex.phaseWinding':          '位相巻き数',
    // Membrane
    'membrane.deformation':         '膜の変形',
    'membrane.tension':             '膜の張力',
    'membrane.permeability':        '膜の透過性',
    'membrane.returnImprint':       '帰還刻印',
    'membrane.twoSidedness':        '二面性',
    // Plasticity
    'plasticity.accumulatedTrace':  '媒質履歴',
    'plasticity.resistanceScale':   '抵抗スケール',
    // Ratios
    'ratios.strongestMatchStrength': '観測比率',
} as const;

// ── Value kind labels ─────────────────────────────────────────────────────────

export const JP_VALUE_KINDS = {
    measured:    '直接測定値',
    derived:     '導出値',
    proxy:       '補助指標',
    reference:   '参照値',
    unavailable: '未観測',
} as const;

// ── Lens labels ───────────────────────────────────────────────────────────────

export const JP_LENSES = {
    gaussianCurvature:    'ガウス曲率レンズ',
    areaElement:          '面積要素レンズ',
    innerOuterBias:       '内外バイアスレンズ',
    fieldAmplitude:       '場の振幅レンズ',
    fieldPhase:           '位相レンズ',
    phaseCoherence:       '位相コヒーレンスレンズ',
    flowContinuity:       '流れ連続性レンズ',
    energyThroughput:     'エネルギー通量レンズ',
    vortexConfidence:     '渦候補レンズ',
    topologicalCharge:    'トポロジカル電荷レンズ',
    membraneDeformation:  '膜変形レンズ',
    membraneTension:      '膜張力レンズ',
    membranePermeability: '膜透過性レンズ',
    twoSidedness:         '二面性レンズ',
    plasticityTrace:      '媒質履歴レンズ',
    resistanceScale:      '抵抗スケールレンズ',
    observedRatioMatch:   '観測比率レンズ',
} as const;

// ── Guide button labels ───────────────────────────────────────────────────────

export const JP_GUIDE_BUTTONS = {
    whatIsThis:       'これなに？',
    whatIsHappening:  '何が起きてる？',
    howHypothesize:   'どう仮説できる？',
    whereNext:        '次どこを見る？',
    isThisProof:      'これは証明になる？',
} as const;

// ── Disclaimer messages ───────────────────────────────────────────────────────

export const JP_DISCLAIMERS = {
    notProof:              '因果証明ではありません',
    notCausalProof:        '相関は因果ではありません',
    proxyOnly:             '補助指標です。証明ではありません。',
    observationNote:       'ここで見えているものは、場の変化を観測しやすくしたものです。断定ではなく、観測と仮説のための手がかりとして見てください。',
    notConsciousness:      '意識・生命・知性・癒し・神秘的真理を証明するものではありません。',
    guideAuxiliary:        'このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。',
    safeMode:              '現在は安全な観測モードです。',
    replayIsNotTimeTavel:  '再生は記録されたスナップショットの表示です。シミュレーション自体が過去に戻るわけではありません。',
} as const;

// ── Navigation hint ───────────────────────────────────────────────────────────

export const JP_NAV_HINT = 'セルをタップ → セル観測 → 観測値 → レンズ → 時間 → 関連候補 → 観測ガイド';

// ── View mode labels ──────────────────────────────────────────────────────────

export const JP_VIEW_MODES = {
    beginner:   'はじめて見る',
    normal:     '通常観測',
    researcher: '研究者モード',
    developer:  '開発者モード',
} as const;

// ── Consolidated export ───────────────────────────────────────────────────────

export const JP = {
    panels:      JP_PANELS,
    tabs:        JP_TABS,
    header:      JP_HEADER,
    metrics:     JP_METRICS,
    valueKinds:  JP_VALUE_KINDS,
    lenses:      JP_LENSES,
    guide:       JP_GUIDE_BUTTONS,
    disclaimers: JP_DISCLAIMERS,
    navHint:     JP_NAV_HINT,
    viewModes:   JP_VIEW_MODES,
} as const;

export type JpMetricKey   = keyof typeof JP_METRICS;
export type JpLensKey     = keyof typeof JP_LENSES;
export type JpTabKey      = keyof typeof JP_TABS;
export type JpViewModeKey = keyof typeof JP_VIEW_MODES;
