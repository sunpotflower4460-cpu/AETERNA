import { describe, expect, it } from 'vitest';
import { buildTorusStatePacket } from '../bridge';

describe('bridge — mode packet fields', () => {
  it('includes optional mode data in the torus packet', () => {
    const packet = buildTorusStatePacket({
      now: 1234,
      dyn: {
        arousal: 0.12,
        sigmaDisplay: 1.01,
        phiApprox: 0.004,
        ignitionRatio: 0.08,
        modeState: 'dream',
        wakeDrive: 0.21,
        sleepPressure: 0.38,
        dreamPressure: 0.57,
      },
      engineState: 'NEUTRAL',
      tension: 0.14,
      activeTouches: new Map(),
    });

    expect(packet.mode_state).toBe('dream');
    expect(packet.wake_drive).toBeCloseTo(0.21);
    expect(packet.sleep_pressure).toBeCloseTo(0.38);
    expect(packet.dream_pressure).toBeCloseTo(0.57);
  });
});
