import { describe, expect, it } from 'vitest';
import {
  createInitialLightObservationState,
  updateLightObservationState,
} from '../perception/lightSensory.ts';
import {
  createInitialMotionObservationState,
  updateMotionObservationState,
} from '../perception/motionSensory.ts';
import {
  createInitialTimeObservationState,
  updateTimeObservationState,
} from '../perception/timeSensory.ts';

// ── light sensory ────────────────────────────────────────────────────────────

describe('light sensory observation', () => {
  it('remains inactive in darkness', () => {
    let light = createInitialLightObservationState();
    light = updateLightObservationState(light, { level: 0 });
    expect(light.packet.active).toBe(false);
    expect(light.packet.level).toBe(0);
  });

  it('becomes active when brightness crosses threshold', () => {
    let light = createInitialLightObservationState();
    light = updateLightObservationState(light, { level: 0.6 });
    expect(light.packet.active).toBe(true);
  });

  it('raises novelty when brightness arrives from dark', () => {
    let light = createInitialLightObservationState();
    light = updateLightObservationState(light, { level: 0 });
    const before = light.packet.novelty;

    light = updateLightObservationState(light, { level: 0.5 });

    expect(light.packet.active).toBe(true);
    expect(light.packet.novelty).toBeGreaterThan(before);
  });

  it('raises persistence under sustained brightness', () => {
    let light = createInitialLightObservationState();
    light = updateLightObservationState(light, { level: 0.4 });
    const before = light.packet.persistence;

    for (let frame = 0; frame < 12; frame++) {
      light = updateLightObservationState(light, { level: 0.4 });
    }

    expect(light.packet.active).toBe(true);
    expect(light.packet.persistence).toBeGreaterThan(before);
  });

  it('drops activity when brightness returns to near-zero', () => {
    let light = createInitialLightObservationState();
    light = updateLightObservationState(light, { level: 0.5 });
    expect(light.packet.active).toBe(true);

    light = updateLightObservationState(light, { level: 0.01 });
    expect(light.packet.active).toBe(false);
  });

  it('raises recurrence when similar brightness returns after gap', () => {
    let light = createInitialLightObservationState();
    const brightFrame = { level: 0.55 };

    for (let frame = 0; frame < 5; frame++) {
      light = updateLightObservationState(light, brightFrame);
    }
    // gap
    light = updateLightObservationState(light, { level: 0 });
    // return
    light = updateLightObservationState(light, brightFrame);

    expect(light.packet.active).toBe(true);
    expect(light.packet.recurrence).toBeGreaterThan(0);
  });
});

// ── motion sensory ───────────────────────────────────────────────────────────

describe('motion sensory observation', () => {
  it('remains inactive when device is still', () => {
    let motion = createInitialMotionObservationState();
    motion = updateMotionObservationState(motion, { accelerationMagnitude: 0, gyroDelta: 0 });
    expect(motion.packet.active).toBe(false);
    expect(motion.packet.level).toBe(0);
  });

  it('becomes active when acceleration exceeds threshold', () => {
    let motion = createInitialMotionObservationState();
    motion = updateMotionObservationState(motion, { accelerationMagnitude: 0.5, gyroDelta: 0 });
    expect(motion.packet.active).toBe(true);
  });

  it('raises novelty on sudden movement', () => {
    let motion = createInitialMotionObservationState();
    motion = updateMotionObservationState(motion, { accelerationMagnitude: 0, gyroDelta: 0 });
    const before = motion.packet.novelty;

    motion = updateMotionObservationState(motion, { accelerationMagnitude: 0.6, gyroDelta: 0.2 });

    expect(motion.packet.novelty).toBeGreaterThan(before);
  });

  it('raises persistence during sustained motion', () => {
    let motion = createInitialMotionObservationState();
    motion = updateMotionObservationState(motion, { accelerationMagnitude: 0.3, gyroDelta: 0 });
    const before = motion.packet.persistence;

    for (let frame = 0; frame < 12; frame++) {
      motion = updateMotionObservationState(motion, { accelerationMagnitude: 0.3, gyroDelta: 0 });
    }

    expect(motion.packet.active).toBe(true);
    expect(motion.packet.persistence).toBeGreaterThan(before);
  });

  it('drops activity when motion stops', () => {
    let motion = createInitialMotionObservationState();
    motion = updateMotionObservationState(motion, { accelerationMagnitude: 0.5, gyroDelta: 0 });
    expect(motion.packet.active).toBe(true);

    motion = updateMotionObservationState(motion, { accelerationMagnitude: 0, gyroDelta: 0 });
    expect(motion.packet.active).toBe(false);
  });
});

// ── time sensory ─────────────────────────────────────────────────────────────

describe('time sensory observation', () => {
  it('is always active', () => {
    const time = createInitialTimeObservationState();
    expect(time.packet.active).toBe(true);
  });

  it('phase increases over time', () => {
    const state = createInitialTimeObservationState();
    const t0 = 0;
    const t1 = 3600 * 1000; // +1 hour

    const s0 = updateTimeObservationState(state, t0);
    const s1 = updateTimeObservationState(state, t1);

    expect(s1.packet.phase).toBeGreaterThan(s0.packet.phase);
  });

  it('level reflects circadian rhythm shape', () => {
    const state = createInitialTimeObservationState();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Midnight = phase 0 → trough
    const midnight = updateTimeObservationState(state, 0);
    // Midday = phase 0.5 → peak
    const midday = updateTimeObservationState(state, DAY_MS * 0.5);

    expect(midday.packet.level).toBeGreaterThan(midnight.packet.level);
  });

  it('persistence builds over repeated updates', () => {
    let time = createInitialTimeObservationState();
    const start = performance.now();
    time = updateTimeObservationState(time, start);
    const before = time.packet.persistence;

    for (let i = 1; i <= 20; i++) {
      time = updateTimeObservationState(time, start + i * 60_000);
    }

    expect(time.packet.persistence).toBeGreaterThan(before);
  });

  it('directionality is stable positive value', () => {
    let time = createInitialTimeObservationState();
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      time = updateTimeObservationState(time, now + i * 1000);
    }
    expect(time.packet.directionality).toBeGreaterThan(0);
  });
});
