/**
 * guidedDemoConfig.ts
 * AETERNA-NATURAL v2.5 — Guided Demo Configuration
 */

export interface GuidedDemoStep {
  stepNumber: number;
  titleJa: string;
  descriptionJa: string;
  actionLabelJa: string;
  targetPanel: 'landing' | 'field' | 'lens' | 'replay' | 'guide' | 'export';
}

export interface GuidedDemoConfig {
  steps: GuidedDemoStep[];
  disclaimerJa: string;
}

export const DEFAULT_GUIDED_DEMO_CONFIG: GuidedDemoConfig = {
  steps: [
    {
      stepNumber: 1,
      titleJa: 'Safe Baseline を始める',
      descriptionJa: 'Quiet Baseline プリセット・seed 1000 で観測を開始します。',
      actionLabelJa: '開始する',
      targetPanel: 'landing',
    },
    {
      stepNumber: 2,
      titleJa: 'Quiet Baseline を実行する',
      descriptionJa: '2000 tick 程度実行して場が安定するまで待ちます。',
      actionLabelJa: '待つ',
      targetPanel: 'field',
    },
    {
      stepNumber: 3,
      titleJa: 'セルを 1 つ選ぶ',
      descriptionJa: '場の中で気になるセルをタップします。',
      actionLabelJa: 'タップする',
      targetPanel: 'field',
    },
    {
      stepNumber: 4,
      titleJa: '位相または曲率を見る',
      descriptionJa: 'Cell Inspector で phase または curvature 値を確認し、レンズを開きます。',
      actionLabelJa: 'レンズを開く',
      targetPanel: 'lens',
    },
    {
      stepNumber: 5,
      titleJa: 'Replay で前後を見る',
      descriptionJa: 'スナップショットをスクラブして変化を観測します。',
      actionLabelJa: 'Replay を開く',
      targetPanel: 'replay',
    },
    {
      stepNumber: 6,
      titleJa: '観測ガイドに聞く',
      descriptionJa: '「どう仮説できる？」と聞いてみてください。',
      actionLabelJa: 'ガイドに聞く',
      targetPanel: 'guide',
    },
    {
      stepNumber: 7,
      titleJa: 'Markdown で保存する',
      descriptionJa: '観測結果を Markdown でエクスポートします。',
      actionLabelJa: 'エクスポートする',
      targetPanel: 'export',
    },
  ],
  disclaimerJa: 'これは結果を保証するデモではありません。観測候補が出ないことも有効な結果です。',
};
