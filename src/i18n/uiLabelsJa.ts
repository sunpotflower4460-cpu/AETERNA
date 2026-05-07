/**
 * uiLabelsJa.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — General UI Labels
 *
 * Japanese labels for all major UI elements: buttons, actions, states,
 * panel headers, status indicators, and common copy.
 *
 * Principles:
 * - Japanese-first display labels.
 * - English aria-labels and data attributes remain for accessibility.
 * - No consciousness / life / intelligence proof claims.
 */

// ── Action buttons ────────────────────────────────────────────────────────────

export const UI_ACTIONS_JA = {
    select:          '選択',
    deselect:        '選択解除',
    open:            '開く',
    close:           '閉じる',
    expand:          '展開',
    collapse:        '折りたたむ',
    confirm:         '確認',
    cancel:          'キャンセル',
    save:            '保存',
    export:          '書き出す',
    reset:           'リセット',
    refresh:         '更新',
    next:            '次へ',
    previous:        '前へ',
    back:            '戻る',
    search:          '検索',
    filter:          '絞り込み',
    sort:            '並べ替え',
    copy:            'コピー',
    viewDetails:     '詳細を見る',
    hideDetails:     '詳細を隠す',
    showMore:        'もっと見る',
    showLess:        '閉じる',
} as const;

// ── Status labels ─────────────────────────────────────────────────────────────

export const UI_STATUS_JA = {
    loading:         '読み込み中...',
    error:           'エラー',
    notAvailable:    '利用不可',
    notObserved:     '未観測',
    active:          '稼働中',
    paused:          '一時停止',
    stopped:         '停止',
    live:            'ライブ',
    replay:          '再生中',
    ready:           '準備完了',
    computing:       '計算中...',
    noData:          'データなし',
    insufficient:    '十分なデータがありません',
} as const;

// ── Panel descriptions ────────────────────────────────────────────────────────

export const UI_PANEL_DESCRIPTIONS_JA = {
    cellInspector:
        '選択したセルで、今どんな値が観測されているかを表示します。\n' +
        '気になる値を押すと、その値を見やすくする観測レンズに切り替わります。',

    metricSpotlight:
        '選択した値を、トーラス場の上で見やすく表示します。\n' +
        'これは実際の観測値を可視化したもので、存在しない現象を演出するものではありません。',

    timeReplay:
        '記録された観測スナップショットを表示します。\n' +
        'runtime 自体が過去へ戻るわけではありません。',

    causalTrace:
        '近い時間・場所・層で一緒に変化した観測値を表示します。\n' +
        'これは因果証明ではなく、関連候補です。',

    layerCorrelation:
        '異なる観測層の間で、同時に変化した度合いを表示します。\n' +
        '相関は因果ではありません。',

    differenceView:
        '2つのスナップショット間で観測値がどれだけ変化したかを比較します。',

    observedRatioInvolvement:
        '観測比率の計算に関与している観測値を表示します。\n' +
        '神秘的な数値との一致を主張するものではありません。',

    observationGuide:
        '観測ガイドに、今見ている値やレンズについて質問できます。\n' +
        'ガイドは観測補助であり、AETERNA 本体の発話ではありません。',

    terminologyDictionary:
        'AETERNA で使われる観測用語の一覧です。\n' +
        '各用語の意味・何を見る値か・何ではないかを確認できます。',

    nowSummary:
        '今のトーラス場で起きている変化を、短くまとめて表示します。\n' +
        '断定ではなく、観測の手がかりとして見てください。',

    observationRoute:
        '観測を進める順番の目安を表示します。\n' +
        '必ずしもこの順でなくても問題ありません。',
} as const;

// ── Mode labels ───────────────────────────────────────────────────────────────

export const UI_MODES_JA = {
    beginner:    'はじめて見る',
    normal:      '通常観測',
    researcher:  '研究者モード',
    developer:   '開発者モード',
} as const;

// ── Tab labels (main navigation) ──────────────────────────────────────────────

export const UI_TABS_JA = {
    field:       '見る',
    inspector:   '調べる',
    lens:        'レンズ',
    replay:      '時間',
    trace:       '関連',
    guide:       '聞く',
    export:      '保存',
    diagnostics: '状態確認',
    research:    '研究',
    advanced:    '詳細',
} as const;

// ── Common disclaimer copy ────────────────────────────────────────────────────

export const UI_DISCLAIMERS_JA = {
    notProof:           '因果証明ではありません',
    notCausalProof:     '相関は因果ではありません',
    proxyOnly:          '補助指標です。証明ではありません。',
    notConsciousness:   '意識・生命・知性・癒し・神秘的真理を証明するものではありません。',
    observationNote:    'ここで見えているものは、場の変化を観測しやすくしたものです。断定ではなく、観測と仮説のための手がかりとして見てください。',
    guideNote:          'このガイドは観測結果を読む補助です。AETERNA 本体の発話ではありません。',
    replayNote:         '再生は記録されたスナップショットの表示です。シミュレーション自体が過去に戻るわけではありません。',
    insufficientData:   '十分なデータがありません。',
    candidateOnly:      '観測候補です。確定ではありません。',
} as const;

// ── InternalId display labels ─────────────────────────────────────────────────

export const UI_INTERNAL_ID_JA = {
    internalId:     '内部ID',
    valueKind:      '種別',
    enLabel:        '英語名',
    description:    '説明',
    whatItShows:    '何を見る値か',
    whatItIsNot:    '何ではないか',
    nextToLook:     '次に見るもの',
} as const;

// ── Consolidated export ───────────────────────────────────────────────────────

export const UI_JA = {
    actions:           UI_ACTIONS_JA,
    status:            UI_STATUS_JA,
    panelDescriptions: UI_PANEL_DESCRIPTIONS_JA,
    modes:             UI_MODES_JA,
    tabs:              UI_TABS_JA,
    disclaimers:       UI_DISCLAIMERS_JA,
    internalId:        UI_INTERNAL_ID_JA,
} as const;
