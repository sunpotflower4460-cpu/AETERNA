import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario';

export interface RecoveryProfileOutcome {
  name: string;
  result: ScenarioResult;
}

export async function runRecoveryProfilesScenarioSuite(): Promise<RecoveryProfileOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    {
      name: 'single-perturbation-then-recovery',
      totalFrames: 700,
      metricsInterval: 5,
      touchScript: [{ frame: 120, x: 0.52, y: 0.48, pressure: 1.0, duration: 1 }],
      collectMetrics: true,
    },
    {
      name: 'repeated-perturbation-sufficient-restoration',
      totalFrames: 1000,
      metricsInterval: 5,
      touchScript: [
        { frame: 140, x: 0.5, y: 0.5, pressure: 0.9, duration: 1 },
        { frame: 300, x: 0.5, y: 0.5, pressure: 0.9, duration: 1 },
        { frame: 460, x: 0.5, y: 0.5, pressure: 0.9, duration: 1 },
        { frame: 620, x: 0.5, y: 0.5, pressure: 0.9, duration: 1 },
      ],
      collectMetrics: true,
    },
    {
      name: 'repeated-perturbation-weak-boundary',
      totalFrames: 1000,
      metricsInterval: 5,
      touchScript: [
        { frame: 140, x: 0.2, y: 0.2, pressure: 1.2, duration: 8 },
        { frame: 260, x: 0.8, y: 0.2, pressure: 1.2, duration: 8 },
        { frame: 380, x: 0.2, y: 0.8, pressure: 1.2, duration: 8 },
        { frame: 500, x: 0.8, y: 0.8, pressure: 1.2, duration: 8 },
        { frame: 620, x: 0.5, y: 0.5, pressure: 1.2, duration: 8 },
      ],
      collectMetrics: true,
    },
    {
      name: 'overload-then-quiet-recovery',
      totalFrames: 1200,
      metricsInterval: 5,
      touchScript: [
        { frame: 120, x: 0.5, y: 0.5, pressure: 1.15, duration: 100 },
        { frame: 300, x: 0.45, y: 0.55, pressure: 1.15, duration: 90 },
      ],
      collectMetrics: true,
    },
    {
      name: 'recovery-failure-slow-degradation',
      totalFrames: 1200,
      metricsInterval: 5,
      touchScript: [
        { frame: 120, x: 0.1, y: 0.9, pressure: 1.3, duration: 120 },
        { frame: 320, x: 0.9, y: 0.1, pressure: 1.3, duration: 120 },
        { frame: 520, x: 0.1, y: 0.1, pressure: 1.3, duration: 120 },
      ],
      collectMetrics: true,
    },
    {
      name: 'same-perturbation-strong-vs-weak-restoration-bias',
      totalFrames: 800,
      metricsInterval: 5,
      touchScript: [
        { frame: 140, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 420, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
      ],
      collectMetrics: true,
    },
  ];

  const outcomes: RecoveryProfileOutcome[] = [];
  for (const config of scenarios) {
    const result = await runScenario(config);
    outcomes.push({ name: config.name, result });
  }
  return outcomes;
}
