import { describe, it, expect } from 'vitest';
import { deriveNextObservationHint } from '../../onboarding/deriveNextObservationHint.js';

describe('deriveNextObservationHint: no cell selected', () => {
  it('returns hint to tap a cell', () => {
    const hint = deriveNextObservationHint({ selectedCellIndex: null });
    expect(hint).not.toBeNull();
    expect(hint!.targetPanel).toBe('field');
    expect(hint!.descriptionJa).toContain('タップ');
  });
});

describe('deriveNextObservationHint: cell selected but no lens', () => {
  it('returns hint to open lens', () => {
    const hint = deriveNextObservationHint({ selectedCellIndex: 5, activeLensId: null });
    expect(hint).not.toBeNull();
    expect(hint!.targetPanel).toBe('lens');
    expect(hint!.descriptionJa).toContain('レンズ');
  });
});

describe('deriveNextObservationHint: lens open but no replay', () => {
  it('returns hint to open replay', () => {
    const hint = deriveNextObservationHint({ selectedCellIndex: 5, activeLensId: 'flow', isReplayMode: false });
    expect(hint).not.toBeNull();
    expect(hint!.targetPanel).toBe('replay');
    expect(hint!.descriptionJa).toContain('時間');
  });
});

describe('deriveNextObservationHint: replay open but no trace', () => {
  it('returns hint to open trace', () => {
    const hint = deriveNextObservationHint({
      selectedCellIndex: 5,
      activeLensId: 'flow',
      isReplayMode: true,
      traceOpened: false,
    });
    expect(hint).not.toBeNull();
    expect(hint!.targetPanel).toBe('trace');
    expect(hint!.descriptionJa).toContain('関連');
  });
});

describe('deriveNextObservationHint: trace open but no guide', () => {
  it('returns hint to ask guide', () => {
    const hint = deriveNextObservationHint({
      selectedCellIndex: 5,
      activeLensId: 'flow',
      isReplayMode: true,
      traceOpened: true,
      guideAsked: false,
    });
    expect(hint).not.toBeNull();
    expect(hint!.targetPanel).toBe('guide');
    expect(hint!.descriptionJa).toContain('ガイド');
  });
});

describe('deriveNextObservationHint: all done', () => {
  it('returns null', () => {
    const hint = deriveNextObservationHint({
      selectedCellIndex: 5,
      activeLensId: 'flow',
      isReplayMode: true,
      traceOpened: true,
      guideAsked: true,
    });
    expect(hint).toBeNull();
  });
});
