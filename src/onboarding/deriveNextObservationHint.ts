/**
 * deriveNextObservationHint.ts
 * AETERNA-NATURAL v2.5 — Derive Next Observation Hint
 */

export interface NextObservationHint {
  titleJa: string;
  descriptionJa: string;
  actionLabelJa: string;
  targetPanel?: string;
}

export function deriveNextObservationHint(params: {
  selectedCellIndex?: number | null;
  activeLensId?: string | null;
  isReplayMode?: boolean;
  traceOpened?: boolean;
  guideAsked?: boolean;
  exportOpened?: boolean;
  beginnerMode?: boolean;
}): NextObservationHint | null {
  const { selectedCellIndex, activeLensId, isReplayMode, traceOpened, guideAsked } = params;

  if (selectedCellIndex == null) {
    return {
      titleJa: 'まず場を見る',
      descriptionJa: '気になる場所をタップしてみる',
      actionLabelJa: 'セルをタップ',
      targetPanel: 'field',
    };
  }
  if (!activeLensId) {
    return {
      titleJa: 'レンズで見る',
      descriptionJa: '気になる値を押してレンズで見る',
      actionLabelJa: 'レンズを開く',
      targetPanel: 'lens',
    };
  }
  if (!isReplayMode) {
    return {
      titleJa: '時間を見る',
      descriptionJa: '時間を戻して変化を見る',
      actionLabelJa: 'Replay を開く',
      targetPanel: 'replay',
    };
  }
  if (!traceOpened) {
    return {
      titleJa: '関連候補を見る',
      descriptionJa: '関連候補を見る',
      actionLabelJa: '関連を見る',
      targetPanel: 'trace',
    };
  }
  if (!guideAsked) {
    return {
      titleJa: 'ガイドに聞く',
      descriptionJa: '観測ガイドに「これはどう仮説できる？」と聞く',
      actionLabelJa: 'ガイドに聞く',
      targetPanel: 'guide',
    };
  }
  return null;
}
