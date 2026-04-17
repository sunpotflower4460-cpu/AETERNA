import { describe, expect, it } from 'vitest';
import {
  createInitialSoundObservationState,
  updateSoundObservationState,
} from '../perception/soundSensory.ts';

describe('sound sensory observation', () => {
  it('raises novelty when sound arrives', () => {
    let sound = createInitialSoundObservationState();
    sound = updateSoundObservationState(sound, { level: 0, bandLow: 0, bandMid: 0, bandHigh: 0 });
    const before = sound.packet.novelty;

    sound = updateSoundObservationState(sound, {
      level: 0.45,
      bandLow: 0.38,
      bandMid: 0.14,
      bandHigh: 0.05,
    });

    expect(sound.packet.active).toBe(true);
    expect(sound.packet.novelty).toBeGreaterThan(before);
  });

  it('raises persistence under sustained sound', () => {
    let sound = createInitialSoundObservationState();
    sound = updateSoundObservationState(sound, {
      level: 0.24,
      bandLow: 0.12,
      bandMid: 0.18,
      bandHigh: 0.08,
    });
    const before = sound.packet.persistence;

    for (let frame = 0; frame < 12; frame++) {
      sound = updateSoundObservationState(sound, {
        level: 0.24,
        bandLow: 0.12,
        bandMid: 0.18,
        bandHigh: 0.08,
      });
    }

    expect(sound.packet.active).toBe(true);
    expect(sound.packet.persistence).toBeGreaterThan(before);
  });

  it('drops sound activity during quiet frames', () => {
    let sound = createInitialSoundObservationState();
    sound = updateSoundObservationState(sound, {
      level: 0.28,
      bandLow: 0.16,
      bandMid: 0.2,
      bandHigh: 0.09,
    });
    expect(sound.packet.active).toBe(true);

    sound = updateSoundObservationState(sound, {
      level: 0.004,
      bandLow: 0.002,
      bandMid: 0.003,
      bandHigh: 0.002,
    });

    expect(sound.packet.active).toBe(false);
  });

  it('observes recurrence when a similar sound returns', () => {
    let sound = createInitialSoundObservationState();
    const returningSound = {
      level: 0.26,
      bandLow: 0.14,
      bandMid: 0.17,
      bandHigh: 0.05,
    };

    for (let frame = 0; frame < 6; frame++) {
      sound = updateSoundObservationState(sound, returningSound);
    }
    sound = updateSoundObservationState(sound, { level: 0, bandLow: 0, bandMid: 0, bandHigh: 0 });
    sound = updateSoundObservationState(sound, returningSound);

    expect(sound.packet.active).toBe(true);
    expect(sound.packet.recurrence).toBeGreaterThan(0);
  });
});
