import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario';

export interface ReafferenceComparisonScenarioOutcome {
  name: string;
  result: ScenarioResult;
}

export async function runReafferenceComparisonScenarioSuite(): Promise<ReafferenceComparisonScenarioOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    // W5-A: Matched return
    // When pulse is sent and return comes back with appropriate delay,
    // selfCausedMatch should be high
    {
      name: 'W5-A-matched-return',
      totalFrames: 700,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 150, x: 0.5, y: 0.5, pressure: 0.9, duration: 30 },
        { frame: 320, x: 0.52, y: 0.48, pressure: 0.85, duration: 25 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.78,
        restorationBias: 0.62,
        selfPreservationBias: 0.48,
      },
      initialWorldMediumState: {
        mediumStability: 0.75,
        feedbackDelay: 0.3,
        fieldTemperature: 0.4,
      },
    },

    // W5-B: No pulse, world return
    // When no pulse but return is strong, worldCausedDifference should be high
    {
      name: 'W5-B-no-pulse-world-return',
      totalFrames: 650,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [],
      initialHomeostaticState: {
        boundaryIntegrity: 0.35,
        restorationBias: 0.25,
        selfPreservationBias: 0.8,
        collapseRisk: 0.65,
      },
      initialWorldMediumState: {
        mediumStability: 0.35,
        motionDrift: 0.7,
        fieldTemperature: 0.75,
        ambientNoise: 0.6,
        ambientLight: 0.5,
      },
    },

    // W5-C: Delayed return
    // When return is delayed, returnDelay and unresolvedReturn should be high
    {
      name: 'W5-C-delayed-return',
      totalFrames: 800,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 140, x: 0.45, y: 0.55, pressure: 1.0, duration: 35 },
        { frame: 290, x: 0.48, y: 0.52, pressure: 0.92, duration: 28 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.72,
        restorationBias: 0.58,
        selfPreservationBias: 0.54,
      },
      initialWorldMediumState: {
        mediumStability: 0.68,
        feedbackDelay: 0.8,
        surfaceResistance: 0.65,
        echoLevel: 0.55,
      },
    },

    // W5-D: Amplified return
    // When return is much stronger than expected, returnMismatch should be high
    {
      name: 'W5-D-amplified-return',
      totalFrames: 750,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 160, x: 0.5, y: 0.5, pressure: 1.15, duration: 50 },
        { frame: 340, x: 0.52, y: 0.48, pressure: 1.2, duration: 45 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.68,
        restorationBias: 0.55,
        selfPreservationBias: 0.62,
      },
      initialWorldMediumState: {
        mediumStability: 0.45,
        feedbackDelay: 0.35,
        fieldTemperature: 0.82,
        surfaceResistance: 0.25,
        echoLevel: 0.7,
      },
    },

    // W5-E: Weak return
    // When return is much weaker than expected, returnMismatch and
    // returnAttenuation should be high
    {
      name: 'W5-E-weak-return',
      totalFrames: 720,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 155, x: 0.5, y: 0.5, pressure: 0.88, duration: 32 },
        { frame: 325, x: 0.48, y: 0.52, pressure: 0.82, duration: 28 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.74,
        restorationBias: 0.6,
        selfPreservationBias: 0.5,
      },
      initialWorldMediumState: {
        mediumStability: 0.72,
        feedbackDelay: 0.4,
        surfaceResistance: 0.85,
        echoLevel: 0.2,
        fieldTemperature: 0.28,
      },
    },

    // W5-F: Weak feedback only
    // Verify that reafference comparison does not overwhelm organism dynamics
    {
      name: 'W5-F-weak-feedback-only',
      totalFrames: 900,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 120, x: 0.5, y: 0.5, pressure: 0.95, duration: 30 },
        { frame: 270, x: 0.48, y: 0.52, pressure: 0.9, duration: 28 },
        { frame: 420, x: 0.52, y: 0.48, pressure: 0.88, duration: 25 },
        { frame: 570, x: 0.5, y: 0.5, pressure: 0.92, duration: 27 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.76,
        restorationBias: 0.58,
        selfPreservationBias: 0.52,
      },
      initialWorldMediumState: {
        mediumStability: 0.7,
        feedbackDelay: 0.38,
        fieldTemperature: 0.5,
      },
    },

    // W5-G: No semantic self claim
    // Verify that no semantic "I", "self awareness", labels, or meanings
    // are present in packets or outputs
    {
      name: 'W5-G-no-semantic-self-claim',
      totalFrames: 600,
      metricsInterval: 5,
      collectMetrics: true,
      touchScript: [
        { frame: 180, x: 0.5, y: 0.5, pressure: 0.9, duration: 25 },
      ],
      initialHomeostaticState: {
        boundaryIntegrity: 0.78,
        restorationBias: 0.62,
        selfPreservationBias: 0.5,
      },
      initialWorldMediumState: {
        mediumStability: 0.73,
        feedbackDelay: 0.35,
      },
    },
  ];

  const outcomes: ReafferenceComparisonScenarioOutcome[] = [];
  for (const config of scenarios) {
    const result = await runScenario(config);
    outcomes.push({ name: config.name, result });
  }
  return outcomes;
}
