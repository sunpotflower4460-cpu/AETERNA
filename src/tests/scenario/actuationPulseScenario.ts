import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario';

export interface ActuationPulseScenarioOutcome {
  name: string;
  result: ScenarioResult;
}

export async function runActuationPulseScenarioSuite(): Promise<ActuationPulseScenarioOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    {
      name: 'W2-A-quiet-no-forced-output',
      totalFrames: 600,
      metricsInterval: 5,
      touchScript: [],
      collectMetrics: true,
      initialHomeostaticState: {
        boundaryIntegrity: 0.84,
        restorationBias: 0.62,
        selfPreservationBias: 0.44,
      },
    },
    {
      name: 'W2-B-recovery-linked-pulse',
      totalFrames: 800,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 110, x: 0.5, y: 0.5, pressure: 1.0, duration: 40 },
        { frame: 240, x: 0.48, y: 0.52, pressure: 0.85, duration: 24 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.74,
        restorationBias: 0.7,
        selfPreservationBias: 0.58,
      },
    },
    {
      name: 'W2-C-boundary-linked-force-pulse',
      totalFrames: 850,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 90, x: 0.22, y: 0.22, pressure: 1.2, duration: 70 },
        { frame: 210, x: 0.78, y: 0.18, pressure: 1.15, duration: 60 },
        { frame: 360, x: 0.2, y: 0.8, pressure: 1.25, duration: 60 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.58,
        restorationBias: 0.46,
        selfPreservationBias: 0.72,
      },
      initialLivingState: {
        coherenceMemory: 0.42,
        overloadMemory: 0.18,
      },
    },
    {
      name: 'W2-D-low-output-readiness-suppression',
      totalFrames: 650,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [],
      initialHomeostaticState: {
        boundaryIntegrity: 0.28,
        restorationBias: 0.18,
        selfPreservationBias: 0.82,
        collapseRisk: 0.72,
      },
      initialLivingState: {
        fatigue: 0.62,
        coherenceMemory: 0.3,
      },
      initialEnergyState: {
        energyReserve: 0.18,
        structuralIntegrity: 0.42,
        recoveryDrive: 0.72,
      },
    },
    {
      name: 'W2-E-no-semantic-output',
      totalFrames: 500,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 180, x: 0.5, y: 0.5, pressure: 0.92, duration: 20 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.76,
        restorationBias: 0.58,
        selfPreservationBias: 0.52,
      },
    },
  ];

  const outcomes: ActuationPulseScenarioOutcome[] = [];
  for (const config of scenarios) {
    const result = await runScenario(config);
    outcomes.push({ name: config.name, result });
  }
  return outcomes;
}
