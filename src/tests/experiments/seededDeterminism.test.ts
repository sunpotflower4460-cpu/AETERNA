/**
 * K1 (docs/vessel/vessel-roadmap.md): a headless scenario run with an
 * explicit seed must be bit-exactly reproducible. Before this, seed was a
 * type-only field on ScenarioConfig that never reached the dynamics
 * (src/core/hardwareRandom.ts pulled crypto-backed randomness directly),
 * so identical config could still produce different results run to run.
 */
import { describe, expect, it } from 'vitest';
import { runScenario, type ScenarioConfig } from '../../experiments/runScenario.ts';

const baseConfig: ScenarioConfig = {
  name: 'K1-determinism-probe',
  seed: 4242,
  totalFrames: 200,
  segments: 12,
  metricsInterval: 5,
  collectMetrics: true,
  touchScript: [{ frame: 40, x: 0.5, y: 0.5, pressure: 1.0, duration: 20 }],
};

describe('seeded determinism (K1)', () => {
  it('produces a bit-identical ScenarioResult across two runs with the same seed', async () => {
    const first = await runScenario({ ...baseConfig });
    const second = await runScenario({ ...baseConfig });

    expect(first.succeeded).toBe(true);
    expect(second.succeeded).toBe(true);
    expect(JSON.stringify(second.summary)).toBe(JSON.stringify(first.summary));
    expect(JSON.stringify(second.metrics)).toBe(JSON.stringify(first.metrics));
  });

  it('produces a different result for a different seed (sanity check against a no-op comparator)', async () => {
    const first = await runScenario({ ...baseConfig, seed: 1 });
    const second = await runScenario({ ...baseConfig, seed: 2 });

    // Not a strict requirement of determinism itself, but guards against the
    // comparator above passing merely because nothing in this scenario is
    // ever seed-sensitive (e.g. if the dormant-node RNG path were dead code).
    expect(JSON.stringify(second.summary)).not.toBe(JSON.stringify(first.summary));
  });

  it('leaves unseeded runs on the existing crypto-backed path (no behavior change to the default)', async () => {
    const { seed: _seed, ...unseeded } = baseConfig;
    const result = await runScenario({ ...unseeded });
    expect(result.succeeded).toBe(true);
  });
});
