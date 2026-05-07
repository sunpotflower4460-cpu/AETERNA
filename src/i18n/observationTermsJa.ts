/**
 * observationTermsJa.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Observation Terms Dictionary
 *
 * Defines ObservationTermDefinition for every required term.
 * Each definition includes:
 *   - Japanese label (jaLabel)
 *   - English label for reference (enLabel)
 *   - Internal ID used in code (internalId)
 *   - Short and long Japanese descriptions
 *   - What it shows (whatItShowsJa)
 *   - What it is NOT (whatItIsNotJa)
 *   - Value kind (ValueKind from valueKindLabelsJa)
 *   - Caution note (cautionJa)
 *   - Visibility per mode (beginner / researcher / developer)
 *
 * Principles:
 * - No consciousness / life / intelligence / mystical proof claims.
 * - fake visual / fake result は追加しない.
 * - Runtime dynamics 未変更.
 */

import type { ValueKind } from './valueKindLabelsJa.ts';

// ── Type ──────────────────────────────────────────────────────────────────────

export interface ObservationTermDefinition {
    id: string;
    jaLabel: string;
    enLabel?: string;
    internalId?: string;
    shortDescriptionJa: string;
    longDescriptionJa: string;
    whatItShowsJa: string;
    whatItIsNotJa: string;
    highValueHintJa?: string;
    lowValueHintJa?: string;
    nextToLookJa?: string;
    valueKind?: ValueKind;
    cautionJa: string;
    beginnerVisible: boolean;
    researcherVisible: boolean;
    developerVisible: boolean;
}

// ── Term Dictionary ───────────────────────────────────────────────────────────

export const OBSERVATION_TERMS_JA: ObservationTermDefinition[] = [
    {
        id: 'field',
        jaLabel: '場',
        enLabel: 'Field',
        internalId: 'field',
        shortDescriptionJa: 'トーラス上に広がる複素スカラー場。各セルに振幅と位相を持ちます。',
        longDescriptionJa:
            'トーラス面をグリッド分割したすべてのセルにわたって定義される複素スカラー場です。' +
            '各セルの値は振幅（大きさ）と位相（角度）で構成されます。',
        whatItShowsJa: '場全体の流れ・パターン・変化を観測するための基盤となる値です。',
        whatItIsNotJa:
            '意識・知性・生命・感情の場ではありません。数学的な複素スカラー場の観測です。',
        nextToLookJa: '振幅レンズ、位相レンズ、渦候補レンズを見てください。',
        valueKind: 'Measured',
        cautionJa: 'この値は場の数学的状態を示すものであり、主観的経験の証明ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'cell',
        jaLabel: 'セル',
        enLabel: 'Cell',
        internalId: 'cell',
        shortDescriptionJa: 'トーラス場をグリッド分割した最小単位。各セルに観測値が格納されます。',
        longDescriptionJa:
            'トーラス場はu方向・v方向のグリッドで分割され、' +
            '各交点がセルです。セルをタップすると、その位置の観測値を詳しく調べられます。',
        whatItShowsJa: '特定の位置での振幅・位相・曲率・膜変形などの観測値です。',
        whatItIsNotJa: '生物細胞ではありません。数値グリッドの格子点です。',
        nextToLookJa: 'セル観測パネルで観測値の一覧を確認してください。',
        valueKind: 'Reference',
        cautionJa: 'セルは空間上のグリッド位置を示すものであり、自律的な単位ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'cellIndex',
        jaLabel: 'セル番号',
        enLabel: 'Cell Index',
        internalId: 'cellIndex',
        shortDescriptionJa: 'グリッド上のセルを一意に識別する番号。',
        longDescriptionJa:
            'u方向インデックスとv方向インデックスから計算される、各セルを識別する整数です。',
        whatItShowsJa: '選択されているセルの位置を特定します。',
        whatItIsNotJa: 'IDは内容の重要度を示しません。単なる位置番号です。',
        valueKind: 'Reference',
        cautionJa: 'セル番号はグリッド位置の参照値です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'uAngle',
        jaLabel: '主角（u）',
        enLabel: 'U Angle',
        internalId: 'uAngle',
        shortDescriptionJa: 'トーラスの主軸方向（大円方向）の角度。0〜2π。',
        longDescriptionJa:
            'トーラスの大円（外輪）に沿った角度位置です。グリッドのu方向インデックスに対応します。',
        whatItShowsJa: 'セルのトーラス上の主軸位置を示します。',
        whatItIsNotJa: '方位や感情の向きではありません。数学的な座標です。',
        valueKind: 'Reference',
        cautionJa: '座標値です。観測値ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'vAngle',
        jaLabel: '副角（v）',
        enLabel: 'V Angle',
        internalId: 'vAngle',
        shortDescriptionJa: 'トーラスの副軸方向（小円方向）の角度。0〜2π。',
        longDescriptionJa:
            'トーラスの小円（管）に沿った角度位置です。グリッドのv方向インデックスに対応します。',
        whatItShowsJa: 'セルのトーラス上の副軸位置を示します。',
        whatItIsNotJa: '方位や感情の向きではありません。数学的な座標です。',
        valueKind: 'Reference',
        cautionJa: '座標値です。観測値ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'innerRim',
        jaLabel: '内側リム',
        enLabel: 'Inner Rim',
        internalId: 'innerRim',
        shortDescriptionJa: 'トーラスの内側（穴側）にあるセルの領域。',
        longDescriptionJa:
            '副角v が π 付近のセル群。内側リムは曲率が負に大きく、膜張力が異なります。',
        whatItShowsJa: '内側リム付近での曲率・変形・流れの特性を観測します。',
        whatItIsNotJa: '価値の高低を示すものではありません。位置の分類です。',
        valueKind: 'Reference',
        cautionJa: '内外の区別は幾何学的分類です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'outerRim',
        jaLabel: '外側リム',
        enLabel: 'Outer Rim',
        internalId: 'outerRim',
        shortDescriptionJa: 'トーラスの外側（膨らんでいる側）にあるセルの領域。',
        longDescriptionJa:
            '副角v が 0 / 2π 付近のセル群。外側リムは曲率が正に大きく、面積要素が最大になります。',
        whatItShowsJa: '外側リム付近での曲率・変形・流れの特性を観測します。',
        whatItIsNotJa: '重要度の序列ではありません。位置の分類です。',
        valueKind: 'Reference',
        cautionJa: '内外の区別は幾何学的分類です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'areaElement',
        jaLabel: '面積要素',
        enLabel: 'Area Element',
        internalId: 'areaElement',
        shortDescriptionJa: 'トーラス上の各セルが実際に占める面積の大きさ。',
        longDescriptionJa:
            '曲面としてのトーラスで、各セルの実際の面積を示す値です。外側リムで大きく、内側リムで小さくなります。',
        whatItShowsJa: '曲面としての面積の不均一分布を観測します。',
        whatItIsNotJa: '重要度や活動量の大きさではありません。幾何学的な面積です。',
        valueKind: 'Measured',
        cautionJa: '幾何学的な測定値です。活動レベルとは無関係です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'gaussianCurvature',
        jaLabel: 'ガウス曲率',
        enLabel: 'Gaussian Curvature',
        internalId: 'gaussianCurvature',
        shortDescriptionJa: '曲面の曲がり具合を示す量。外側は正、内側は負になります。',
        longDescriptionJa:
            '2つの主曲率の積。トーラス外側は正（球面的）、内側は負（鞍点的）。' +
            '曲率が高い場所では場の振る舞いが変わります。',
        whatItShowsJa: 'トーラス上の位置ごとの曲面の曲がり方を観測します。',
        whatItIsNotJa:
            '精神的な曲がりや感情の複雑さではありません。数学的な曲面曲率です。',
        highValueHintJa: '外側リムに近い正の曲率が高い状態。',
        lowValueHintJa: '内側リムに近い負の曲率が大きい状態。',
        nextToLookJa: '膜変形レンズ、渦候補レンズとあわせて確認してください。',
        valueKind: 'Measured',
        cautionJa: '幾何学的測定値です。場の内容の意味とは別物です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'meanCurvature',
        jaLabel: '平均曲率',
        enLabel: 'Mean Curvature',
        internalId: 'meanCurvature',
        shortDescriptionJa: '2つの主曲率の平均値。曲面の平均的な曲がり方を示します。',
        longDescriptionJa:
            '主曲率2つの算術平均。膜の変形に関連する計算で使われます。',
        whatItShowsJa: 'トーラス面の各位置での平均的な曲がり方を観測します。',
        whatItIsNotJa: '平均的な感情・状態ではありません。幾何学的な曲率です。',
        valueKind: 'Measured',
        cautionJa: '幾何学的測定値です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'amplitude',
        jaLabel: '振幅',
        enLabel: 'Amplitude',
        internalId: 'amplitude',
        shortDescriptionJa: '複素スカラー場の大きさ（絶対値）。',
        longDescriptionJa:
            '各セルの複素数値の絶対値。エネルギー分布や場の強度パターンを見るのに使います。',
        whatItShowsJa: '場の強度・エネルギー分布を観測します。',
        whatItIsNotJa: '活性度・覚醒度・感情の強さではありません。場の値の大きさです。',
        highValueHintJa: '場の強度が高い状態。エネルギーが集中している可能性。',
        lowValueHintJa: '場が静止に近い状態。',
        nextToLookJa: '位相レンズ、渦候補レンズを確認してください。',
        valueKind: 'Measured',
        cautionJa: '振幅は場の強度の観測値であり、主観的経験の指標ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'phase',
        jaLabel: '位相',
        enLabel: 'Phase',
        internalId: 'phase',
        shortDescriptionJa: '複素スカラー場の複素数値の角度（−π〜+π）。',
        longDescriptionJa:
            '各セルの複素数値の偏角（argument）。位相の回り込みは渦候補の手がかりになります。',
        whatItShowsJa: '場の波の「向き」を観測します。',
        whatItIsNotJa: '感情・意識・時間ではありません。数学的な複素位相です。',
        highValueHintJa: '位相が +π に近い状態。',
        lowValueHintJa: '位相が −π に近い状態。',
        nextToLookJa: '渦候補レンズ、位相コヒーレンスレンズを確認してください。',
        valueKind: 'Measured',
        cautionJa: '位相は数学的な角度です。意味・方向性の象徴ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'phaseCoherence',
        jaLabel: '位相コヒーレンス',
        enLabel: 'Phase Coherence',
        internalId: 'phaseCoherence',
        shortDescriptionJa: '近隣セルとの位相の揃い具合。高いほど局所的に位相が揃っています。',
        longDescriptionJa:
            '近隣セルの位相と、選択セルの位相がどれだけ揃っているかを示す補助指標です。',
        whatItShowsJa: '位相の局所的な秩序度合いを観測します。',
        whatItIsNotJa: '意識・調和・秩序の証明ではありません。局所的な位相の揃い具合です。',
        highValueHintJa: '近隣と位相がよく揃っている状態。',
        lowValueHintJa: '近隣との位相がバラバラな状態。',
        nextToLookJa: '位相レンズ、渦候補を確認してください。',
        valueKind: 'Derived',
        cautionJa: '補助的な観測値です。因果証明ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'vortexCandidate',
        jaLabel: '渦候補',
        enLabel: 'Vortex Candidate',
        internalId: 'vortexCandidate',
        shortDescriptionJa: '位相の回り込みと振幅の谷から検出される、渦のような構造の候補。',
        longDescriptionJa:
            '位相が局所的に回り込み（位相巻き数が非ゼロ）、かつ振幅が極小になる場所を渦候補として検出します。' +
            'これは場の構造の観測候補であり、確定した渦ではありません。',
        whatItShowsJa: '場の中で位相が局所的に回り込んでいる可能性を観測します。',
        whatItIsNotJa: '意識・心・記憶・生命の中心ではありません。場の構造候補です。',
        highValueHintJa: '渦候補として検出される強さが高い状態。',
        lowValueHintJa: '渦候補が弱い、または検出されていない状態。',
        nextToLookJa: '渦候補の強さ、位相レンズ、振幅、Replayを確認してください。',
        valueKind: 'Derived',
        cautionJa: 'これは構造の候補を示す補助的な観測値です。確定した渦の証明ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'vortexCandidateConfidence',
        jaLabel: '渦候補の強さ',
        enLabel: 'Vortex Candidate Confidence',
        internalId: 'vortexCandidateConfidence',
        shortDescriptionJa: '渦候補として検出された構造の確からしさを示す補助指標。',
        longDescriptionJa:
            '位相の回り込みと振幅の谷から導出された渦候補の強さを0〜1の範囲で示します。' +
            '高い値は強い渦候補を示しますが、これは確定した渦の証明ではありません。',
        whatItShowsJa: '場の中の渦構造候補の強さを観測します。',
        whatItIsNotJa: '意識の強さ・確信度・証明の確からしさではありません。補助指標です。',
        highValueHintJa: '強い渦候補が検出されている状態。位相レンズで確認を。',
        lowValueHintJa: '渦候補が弱い状態。',
        nextToLookJa: '位相レンズ、振幅、トポロジカル電荷、前後のReplayを確認してください。',
        valueKind: 'Proxy',
        cautionJa: '補助指標です。直接の証明ではなく、状態を読みやすくするための観測補助値です。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'topologicalCharge',
        jaLabel: 'トポロジカル電荷',
        enLabel: 'Topological Charge',
        internalId: 'topologicalCharge',
        shortDescriptionJa: '位相の巻き数の整数値。+1 や −1 が渦候補の指標になります。',
        longDescriptionJa:
            '渦候補の周囲で位相が何回巻いているかを示す整数値（通常は 0、+1、−1）。' +
            '非ゼロの値は渦様構造の候補を示します。',
        whatItShowsJa: '渦候補の位相巻き数の整数的な特徴を観測します。',
        whatItIsNotJa: '電気的な電荷ではありません。トポロジカルな観測値です。',
        nextToLookJa: '渦候補の強さ、位相レンズを確認してください。',
        valueKind: 'Derived',
        cautionJa: '数学的なトポロジー指標です。物理的意味を超えて解釈しないでください。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'membrane',
        jaLabel: '膜',
        enLabel: 'Membrane',
        internalId: 'membrane',
        shortDescriptionJa: 'トーラス場の曲率・変形・張力を統合した観測層。',
        longDescriptionJa:
            'トーラス曲面を「膜」として扱い、曲率・変形・張力・透過性などを計算する観測モデルです。',
        whatItShowsJa: 'トーラス曲面の変形・張力・透過性の分布を観測します。',
        whatItIsNotJa: '生体膜・細胞膜・感情の境界ではありません。曲面の数学的モデルです。',
        nextToLookJa: '膜変形レンズ、膜張力、ガウス曲率を確認してください。',
        valueKind: 'Derived',
        cautionJa: '数学的なモデルであり、生体現象や意識の境界の証明ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'membraneDeformation',
        jaLabel: '膜の変形',
        enLabel: 'Membrane Deformation',
        internalId: 'membraneDeformation',
        shortDescriptionJa: '膜モデルにおける変形量の観測値。',
        longDescriptionJa:
            'トーラス曲面の膜モデルにおける、局所的な変形量を示す値です。' +
            'ガウス曲率と平均曲率から導出されます。',
        whatItShowsJa: '膜モデルとしての局所変形量を観測します。',
        whatItIsNotJa: '物理的な膜の破れや感情的な歪みではありません。数学的な変形量です。',
        highValueHintJa: '変形量が大きい状態。曲率が高い位置に近い可能性。',
        lowValueHintJa: '変形が少ない状態。',
        nextToLookJa: 'ガウス曲率レンズ、膜張力を確認してください。',
        valueKind: 'Derived',
        cautionJa: '導出値です。数学的モデルからの計算結果です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'actuationImprint',
        jaLabel: '起動刻印',
        enLabel: 'Actuation Imprint',
        internalId: 'actuationImprint',
        shortDescriptionJa: '膜モデルにおける起動（actuation）の刻印量。',
        longDescriptionJa:
            '膜の起動・アクチュエーション成分の刻印値。帰還刻印と組み合わせて膜動作を観測します。',
        whatItShowsJa: '膜モデルの起動成分の分布を観測します。',
        whatItIsNotJa: '意思・行動・目的ではありません。膜モデルの計算成分です。',
        valueKind: 'Derived',
        cautionJa: '膜モデルの計算成分です。生体的意味はありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'returnImprint',
        jaLabel: '帰還刻印',
        enLabel: 'Return Imprint',
        internalId: 'returnImprint',
        shortDescriptionJa: '膜モデルにおける帰還（return）の刻印量。',
        longDescriptionJa:
            '膜の帰還・復元成分の刻印値。起動刻印と組み合わせて膜の双方向性を観測します。',
        whatItShowsJa: '膜モデルの帰還成分の分布を観測します。',
        whatItIsNotJa: '記憶・思い出し・感情の返還ではありません。膜モデルの計算成分です。',
        valueKind: 'Derived',
        cautionJa: '膜モデルの計算成分です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'weakPlasticityTrace',
        jaLabel: '弱い媒質履歴',
        enLabel: 'Weak Plasticity Trace',
        internalId: 'weakPlasticityTrace',
        shortDescriptionJa: '流れが繰り返し通った場所に残る、ごく弱い痕跡の観測値。',
        longDescriptionJa:
            '媒質（場を伝わる媒体）が同じ場所を繰り返し通ることで生じる微弱な累積変化の観測値です。' +
            '累積に比例する弱いフィードバックがありますが、学習・記憶・知識ではありません。',
        whatItShowsJa: '場の中で同じ場所に変化が残りやすいかを観測します。',
        whatItIsNotJa:
            '意味記憶・学習済み知識・感情・強化学習ではありません。媒質の弱い累積変化です。',
        highValueHintJa: '繰り返し通過が多い場所。',
        lowValueHintJa: '通過が少ない、またはリセット後の状態。',
        nextToLookJa: '抵抗変化レンズ、Replay、関連候補を確認してください。',
        valueKind: 'Measured',
        cautionJa:
            'これは媒質の弱い履歴であり、意味記憶・学習・感情・知性の証明ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'plasticityTrace',
        jaLabel: '媒質履歴',
        enLabel: 'Plasticity Trace',
        internalId: 'plasticityTrace',
        shortDescriptionJa: '媒質の可塑的変化の累積を示す観測値。',
        longDescriptionJa:
            '媒質の変化が蓄積された量を示します。弱い媒質履歴よりも累積効果が大きいケースの観測値です。',
        whatItShowsJa: '媒質の可塑的変化の累積量を観測します。',
        whatItIsNotJa: '記憶・学習・感情の痕跡ではありません。媒質変化の累積値です。',
        valueKind: 'Measured',
        cautionJa: '媒質変化の累積値であり、意味的な記憶や学習ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'resistanceScale',
        jaLabel: '抵抗変化',
        enLabel: 'Resistance Scale',
        internalId: 'resistanceScale',
        shortDescriptionJa: '媒質履歴から導出される、流れへの抵抗変化を示す補助指標。',
        longDescriptionJa:
            '媒質履歴が高い場所は流れへの抵抗が変化します。この抵抗スケールの観測値です。',
        whatItShowsJa: '媒質履歴による場の通りやすさの変化を観測します。',
        whatItIsNotJa: '心理的な抵抗・意志の強さではありません。場の媒質変化の指標です。',
        highValueHintJa: '抵抗が高い状態。流れが変化しやすい場所。',
        lowValueHintJa: '抵抗変化が少ない状態。',
        nextToLookJa: '弱い媒質履歴レンズ、Replayを確認してください。',
        valueKind: 'Proxy',
        cautionJa: '補助指標です。直接の証明ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'observedRatio',
        jaLabel: '観測比率',
        enLabel: 'Observed Ratio',
        internalId: 'observedRatio',
        shortDescriptionJa: '場の内部から観測される比率パターン。参照値との比較に使います。',
        longDescriptionJa:
            '場内で計算された比率値と、参照比率セットとの一致度を観測します。' +
            '外部定数は使用せず、場の内部から導出された値同士の比較です。',
        whatItShowsJa: '場の内部パターンの比率的な特徴を観測します。',
        whatItIsNotJa: '黄金比・シューマン共振・神秘的比率の証明ではありません。内部比率の観測です。',
        nextToLookJa: '観測比率への関与パネルを確認してください。',
        valueKind: 'Derived',
        cautionJa: '内部比率の観測値です。外部の意味ある数値との一致を主張するものではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'observedRatioInvolvement',
        jaLabel: '観測比率への関与',
        enLabel: 'Observed Ratio Involvement',
        internalId: 'observedRatioInvolvement',
        shortDescriptionJa: 'どの観測値が観測比率に関与しているかを示す補助情報。',
        longDescriptionJa:
            '観測比率の計算に使われた主要な観測値を列挙した補助情報です。',
        whatItShowsJa: '観測比率を構成している観測値の関与を確認します。',
        whatItIsNotJa: '因果関係・重要度の序列ではありません。計算への関与情報です。',
        valueKind: 'Check',
        cautionJa: '関与情報です。因果の証明ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'referenceRatio',
        jaLabel: '参照比率',
        enLabel: 'Reference Ratio',
        internalId: 'referenceRatio',
        shortDescriptionJa: '場の内部比率と比較するための参照値セット。',
        longDescriptionJa:
            '観測比率と比較するために使う参照比率のセット。外部定数ではなく、場の内部から導出されます。',
        whatItShowsJa: '観測比率と比較するための参照基準を示します。',
        whatItIsNotJa: '真理の基準値・宇宙的定数ではありません。比較のための参照値です。',
        valueKind: 'Reference',
        cautionJa: '参照値です。この値自体が正しさを保証するものではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'causalTrace',
        jaLabel: '関連候補',
        enLabel: 'Causal Trace',
        internalId: 'causalTrace',
        shortDescriptionJa: '近い時間・場所・層で一緒に変化した観測値の候補一覧。',
        longDescriptionJa:
            '選択セルの観測値が変化した時に、近い時間・空間・層で一緒に変化した他の観測値を候補として列挙します。' +
            'これは相関の候補であり、因果を証明するものではありません。',
        whatItShowsJa: '関連して変化した可能性のある観測値の候補を観測します。',
        whatItIsNotJa: '因果関係の証明ではありません。相関の候補リストです。',
        nextToLookJa: '層の相関パネル、差分表示パネルも確認してください。',
        valueKind: 'Proxy',
        cautionJa: '相関は因果ではありません。関連候補として読んでください。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'possibleContributingSignals',
        jaLabel: '関与している可能性のある観測値',
        enLabel: 'Possible Contributing Signals',
        internalId: 'possibleContributingSignals',
        shortDescriptionJa: '変化に関与している可能性のある観測値シグナルの候補。',
        longDescriptionJa:
            '関連候補の中で、特定の変化に関与している可能性が高いとされる観測値シグナルの列挙です。',
        whatItShowsJa: '変化の候補シグナルを観測します。',
        whatItIsNotJa: '確定した原因・因果の証明ではありません。候補列挙です。',
        valueKind: 'Proxy',
        cautionJa: '候補です。確定した因果ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'layerCorrelation',
        jaLabel: '層の相関',
        enLabel: 'Layer Correlation',
        internalId: 'layerCorrelation',
        shortDescriptionJa: '異なる観測層間の相関を示す補助情報。',
        longDescriptionJa:
            '場の振幅・位相・曲率・膜・媒質履歴などの異なる層で、同時に変化が起きているかを示します。',
        whatItShowsJa: '異なる観測層の間の変化の相関を観測します。',
        whatItIsNotJa: '層間の因果・意味的な繋がりの証明ではありません。相関の観測です。',
        nextToLookJa: '関連候補パネル、差分表示パネルを確認してください。',
        valueKind: 'Derived',
        cautionJa: '相関は因果ではありません。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'differenceView',
        jaLabel: '変化の比較',
        enLabel: 'Difference View',
        internalId: 'differenceView',
        shortDescriptionJa: '2つの時点または状態の観測値の差分を比較表示します。',
        longDescriptionJa:
            '記録されたスナップショット間の差分を計算し、どの観測値がどれだけ変化したかを表示します。',
        whatItShowsJa: '観測値の時間的変化を比較します。',
        whatItIsNotJa: '意味や感情の変化ではありません。観測値の数値差分です。',
        valueKind: 'Derived',
        cautionJa: '差分は数値の変化量です。意味的な解釈は慎重に。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'timeReplay',
        jaLabel: '観測スナップショット再生',
        enLabel: 'Time Replay',
        internalId: 'timeReplay',
        shortDescriptionJa: '記録された観測スナップショットの時系列再生。',
        longDescriptionJa:
            '定期的に記録された観測スナップショットを時系列順に表示します。' +
            'runtime 自体が過去に戻るわけではありません。',
        whatItShowsJa: '記録された過去の観測状態を表示します。',
        whatItIsNotJa: 'タイムトラベルではありません。記録されたスナップショットの表示です。',
        nextToLookJa: '差分表示パネルで変化量を確認してください。',
        valueKind: 'Presentation-smoothed',
        cautionJa: '再生はスナップショットの表示であり、シミュレーション自体が過去に戻るわけではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'replaySnapshot',
        jaLabel: '観測スナップショット',
        enLabel: 'Replay Snapshot',
        internalId: 'replaySnapshot',
        shortDescriptionJa: '特定の時点での観測値全体を記録した1つのスナップショット。',
        longDescriptionJa:
            '観測時点での場・セル・膜・媒質履歴などの観測値を一括記録したデータです。',
        whatItShowsJa: '特定時点での観測状態の全体像を記録します。',
        whatItIsNotJa: 'ゲームのセーブデータや過去の復元ではありません。観測記録です。',
        valueKind: 'Reference',
        cautionJa: '記録された観測データです。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'lensContext',
        jaLabel: 'レンズコンテキスト',
        enLabel: 'Lens Context',
        internalId: 'lensContext',
        shortDescriptionJa: '現在アクティブな観測レンズとセルの文脈情報。',
        longDescriptionJa:
            '観測ガイドへ渡される、現在の観測状態（選択セル・アクティブレンズ・観測値）の文脈パケットです。',
        whatItShowsJa: '観測ガイドが応答するための文脈を構成します。',
        whatItIsNotJa: 'AIへの意識的な入力ではありません。観測補助のための文脈データです。',
        valueKind: 'Reference',
        cautionJa: '観測補助のための内部データ構造です。',
        beginnerVisible: false,
        researcherVisible: false,
        developerVisible: true,
    },
    {
        id: 'metricSpotlight',
        jaLabel: '観測レンズ',
        enLabel: 'Metric Spotlight',
        internalId: 'metricSpotlight',
        shortDescriptionJa: '選択した観測値をトーラス場全体で見やすく表示するパネル。',
        longDescriptionJa:
            '特定の観測値（振幅・位相・曲率など）を選択し、トーラス場全体でその分布を色で表示します。',
        whatItShowsJa: '選択した観測値の空間分布を観測します。',
        whatItIsNotJa: '存在しない現象を演出するものではありません。実際の観測値の可視化です。',
        nextToLookJa: '気になるセルをタップしてセル観測で詳細を確認してください。',
        valueKind: 'Presentation-smoothed',
        cautionJa: '表示用の可視化です。実際の観測値を表しますが、演出的な効果は含みません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'cellInspector',
        jaLabel: 'セル観測',
        enLabel: 'Cell Inspector',
        internalId: 'cellInspector',
        shortDescriptionJa: '選択したセルでの観測値の一覧と詳細を表示するパネル。',
        longDescriptionJa:
            '選択したセルで記録されている観測値（振幅・位相・曲率・膜変形など）を一覧表示します。' +
            '各値をタップするとその値を観測レンズで表示できます。',
        whatItShowsJa: '選択セルでの全観測値を確認します。',
        whatItIsNotJa: 'セルの状態を診断するものではありません。観測値の表示です。',
        nextToLookJa: '気になる値を選んで観測レンズで見てください。',
        valueKind: 'Reference',
        cautionJa: 'これは観測値の表示パネルです。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'visualLens',
        jaLabel: '可視レンズ',
        enLabel: 'Visual Lens',
        internalId: 'visualLens',
        shortDescriptionJa: '観測値をトーラス場の上で見やすく可視化するレンズ。',
        longDescriptionJa:
            '選択した観測値を色・強度・パターンでトーラス場に重ね表示します。実際の観測値の可視化です。',
        whatItShowsJa: '観測値の空間分布を視覚的に確認します。',
        whatItIsNotJa: '演出・エフェクトではありません。観測値の可視化です。',
        valueKind: 'Presentation-smoothed',
        cautionJa: '表示用の可視化です。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'observationGuide',
        jaLabel: '観測ガイド',
        enLabel: 'Observation Guide',
        internalId: 'observationGuide',
        shortDescriptionJa: '今見ている観測値について質問・説明を提供する補助ガイド。',
        longDescriptionJa:
            '現在の観測レンズ・選択セル・観測値を文脈として、観測の読み方・仮説の立て方を補助します。' +
            'AETERNA 本体の発話ではなく、観測補助です。',
        whatItShowsJa: '観測ガイドとしての応答を提供します。',
        whatItIsNotJa: 'AETERNA 本体の意思表示・証明ではありません。観測補助ガイドです。',
        nextToLookJa: 'ガイドの応答を参考に、位相レンズ・渦候補・Replayを確認してください。',
        valueKind: 'Reference',
        cautionJa: 'このガイドは観測補助です。AETERNA 本体の発話ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'proxy',
        jaLabel: '補助指標',
        enLabel: 'Proxy',
        internalId: 'proxy',
        shortDescriptionJa: '直接の証明ではなく、状態を読みやすくするための観測補助値。',
        longDescriptionJa:
            '直接測定が難しい状態を間接的に示す補助的な指標です。証明の代わりではありません。',
        whatItShowsJa: '状態の読みやすさを補助する間接的な指標を示します。',
        whatItIsNotJa: '直接の観測値・証明の代替ではありません。補助的な指標です。',
        valueKind: 'Proxy',
        cautionJa: '補助指標です。証明ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'derived',
        jaLabel: '導出値',
        enLabel: 'Derived',
        internalId: 'derived',
        shortDescriptionJa: '他の観測値を組み合わせて計算された値。',
        longDescriptionJa:
            '直接測定ではなく、複数の測定値から計算によって導出される値です。',
        whatItShowsJa: '計算によって得られた観測値を示します。',
        whatItIsNotJa: '独立した観測値ではありません。計算された導出値です。',
        valueKind: 'Derived',
        cautionJa: '導出値は計算結果です。元の観測値の品質に依存します。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'reference',
        jaLabel: '参照値',
        enLabel: 'Reference',
        internalId: 'reference',
        shortDescriptionJa: '比較のために使う値。core dynamics の因果成分ではありません。',
        longDescriptionJa:
            '他の値と比較するための基準として使われる値です。それ自体が原因や結果ではありません。',
        whatItShowsJa: '比較の基準を示します。',
        whatItIsNotJa: '因果の成分・真理の値ではありません。比較基準です。',
        valueKind: 'Reference',
        cautionJa: '参照値です。因果成分ではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'check',
        jaLabel: '確認値',
        enLabel: 'Check',
        internalId: 'check',
        shortDescriptionJa: '破綻や整合性を確認するための値。',
        longDescriptionJa:
            'ランタイムや観測の整合性・破綻の有無を確認するために使う指標です。',
        whatItShowsJa: '整合性や異常の有無を確認します。',
        whatItIsNotJa: '重要度・品質の証明ではありません。整合性確認です。',
        valueKind: 'Check',
        cautionJa: '整合性確認のための値です。',
        beginnerVisible: false,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'notObserved',
        jaLabel: '未観測',
        enLabel: 'Not Observed',
        internalId: 'notObserved',
        shortDescriptionJa: '現在の観測条件では値が取得できていない状態。',
        longDescriptionJa:
            '該当セルや状態でまだ値が記録・計算されていない、または観測条件が満たされていない場合に表示されます。',
        whatItShowsJa: '値が観測できていないことを示します。',
        whatItIsNotJa: '値がゼロであることや、存在しないことを確定するものではありません。',
        valueKind: 'Check',
        cautionJa: '観測されていないだけで、存在を否定するものではありません。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
    {
        id: 'notCausalProof',
        jaLabel: '因果証明ではありません',
        enLabel: 'Not Causal Proof',
        internalId: 'notCausalProof',
        shortDescriptionJa: '表示されている相関・候補・関連は、因果関係の証明ではありません。',
        longDescriptionJa:
            'AETERNA で表示されるすべての関連候補・相関・補助指標は、' +
            '因果関係を証明するものではありません。観測の手がかりとして使ってください。',
        whatItShowsJa: '観測値の読み方に関する注意事項を示します。',
        whatItIsNotJa: '観測結果の無効化ではありません。解釈の注意喚起です。',
        valueKind: 'Check',
        cautionJa: '因果の証明を求める場合は追加の検証が必要です。',
        beginnerVisible: true,
        researcherVisible: true,
        developerVisible: true,
    },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Look up a term by its id */
export function getTermById(id: string): ObservationTermDefinition | undefined {
    return OBSERVATION_TERMS_JA.find((t) => t.id === id);
}

/** Get all terms visible in beginner mode */
export function getBeginnerTerms(): ObservationTermDefinition[] {
    return OBSERVATION_TERMS_JA.filter((t) => t.beginnerVisible);
}

/** Get all terms visible in researcher mode */
export function getResearcherTerms(): ObservationTermDefinition[] {
    return OBSERVATION_TERMS_JA.filter((t) => t.researcherVisible);
}

/** Get all term IDs */
export function getAllTermIds(): string[] {
    return OBSERVATION_TERMS_JA.map((t) => t.id);
}
