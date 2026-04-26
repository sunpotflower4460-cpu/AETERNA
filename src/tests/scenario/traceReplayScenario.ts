import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario.ts';

export interface TraceReplayOutcome {
  name: string;
  result: ScenarioResult;
}

export async function runTraceReplayScenarioSuite(): Promise<TraceReplayOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    {
      name: 'quiet-replay-after-single-perturbation',
      totalFrames: 820,
      metricsInterval: 5,
      touchScript: [{ frame: 120, x: 0.52, y: 0.48, pressure: 1.0, duration: 1 }],
      collectMetrics: true,
    },
    {
      name: 'repeated-perturbation-then-quiet',
      totalFrames: 980,
      metricsInterval: 5,
      touchScript: [
        { frame: 120, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 180, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 240, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 300, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
      ],
      collectMetrics: true,
    },
    {
      name: 'recovery-linked-replay',
      totalFrames: 1100,
      metricsInterval: 5,
      initialHomeostaticState: {
        restorationBias: 0.74,
        selfPreservationBias: 0.68,
      },
      touchScript: [
        { frame: 120, x: 0.48, y: 0.52, pressure: 1.15, duration: 90 },
      ],
      collectMetrics: true,
    },
    {
      name: 'high-input-replay-suppression',
      totalFrames: 820,
      metricsInterval: 5,
      touchScript: [
        { frame: 100, x: 0.5, y: 0.5, pressure: 1.0, duration: 80 },
        { frame: 240, x: 0.55, y: 0.45, pressure: 1.0, duration: 80 },
        { frame: 380, x: 0.45, y: 0.55, pressure: 1.0, duration: 80 },
        { frame: 520, x: 0.52, y: 0.52, pressure: 1.0, duration: 80 },
      ],
      collectMetrics: true,
    },
    {
      name: 'weak-boundary-residue-persistence',
      totalFrames: 960,
      metricsInterval: 5,
      initialHomeostaticState: {
        boundaryIntegrity: 0.54,
        selfPreservationBias: 0.44,
        restorationBias: 0.48,
      },
      touchScript: [
        { frame: 140, x: 0.2, y: 0.2, pressure: 1.15, duration: 10 },
        { frame: 260, x: 0.8, y: 0.2, pressure: 1.15, duration: 10 },
        { frame: 380, x: 0.2, y: 0.8, pressure: 1.15, duration: 10 },
      ],
      collectMetrics: true,
    },
    {
      name: 'same-perturbation-repeated-over-time',
      totalFrames: 1200,
      metricsInterval: 5,
      touchScript: [
        { frame: 120, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 360, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 600, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 840, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
      ],
      collectMetrics: true,
    },
  ];

  const outcomes: TraceReplayOutcome[] = [];
  for (const config of scenarios) {
    outcomes.push({
      name: config.name,
      result: await runScenario(config),
    });
  }

  return outcomes;
}
