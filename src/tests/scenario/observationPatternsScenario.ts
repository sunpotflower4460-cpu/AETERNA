/**
 * Observation Patterns Scenario
 *
 * Phase 5: Observation Layer Purification
 *
 * Runs scenarios designed to allow natural observation of knot / path /
 * recurrence locus / basin / anomaly / proto-point candidates emerging in
 * the life-field over time.
 *
 * Purpose: See what structural patterns arise naturally after long runs —
 * not to assign meaning, but to observe what is present.
 */

import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario.ts';

export interface ObservationPatternsOutcome {
  name: string;
  result: ScenarioResult;
}

export async function runObservationPatternsSuite(): Promise<ObservationPatternsOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    {
      // Long quiet run — observe what emerges without perturbation
      name: 'long-quiet-baseline-observation',
      totalFrames: 1200,
      metricsInterval: 10,
      touchScript: [],
      collectMetrics: true,
    },
    {
      // Repeated perturbation — observe knot / path candidates forming
      name: 'repeated-perturbation-pattern-emergence',
      totalFrames: 1400,
      metricsInterval: 10,
      touchScript: [
        { frame: 200, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 400, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 600, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 800, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 1000, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
      ],
      collectMetrics: true,
    },
    {
      // Strong restoration bias — observe basin / attractor candidates
      name: 'strong-restoration-basin-observation',
      totalFrames: 1200,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.85,
        selfPreservationBias: 0.72,
        boundaryIntegrity: 0.88,
      },
      touchScript: [
        { frame: 200, x: 0.48, y: 0.52, pressure: 1.1, duration: 40 },
        { frame: 600, x: 0.52, y: 0.48, pressure: 1.1, duration: 40 },
      ],
      collectMetrics: true,
    },
    {
      // Weak boundary — observe long-lived anomaly persistence
      name: 'weak-boundary-anomaly-persistence',
      totalFrames: 1400,
      metricsInterval: 10,
      initialHomeostaticState: {
        boundaryIntegrity: 0.52,
        selfPreservationBias: 0.40,
        restorationBias: 0.45,
      },
      touchScript: [
        { frame: 160, x: 0.2, y: 0.2, pressure: 1.2, duration: 12 },
        { frame: 320, x: 0.8, y: 0.2, pressure: 1.2, duration: 12 },
        { frame: 480, x: 0.2, y: 0.8, pressure: 1.2, duration: 12 },
        { frame: 640, x: 0.8, y: 0.8, pressure: 1.2, duration: 12 },
      ],
      collectMetrics: true,
    },
    {
      // Proto-point candidate emergence — multi-criteria overlap scenario
      name: 'proto-point-candidate-emergence',
      totalFrames: 1600,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.78,
        selfPreservationBias: 0.65,
        boundaryIntegrity: 0.80,
      },
      touchScript: [
        { frame: 150, x: 0.5, y: 0.5, pressure: 1.05, duration: 1 },
        { frame: 400, x: 0.5, y: 0.5, pressure: 1.05, duration: 1 },
        { frame: 650, x: 0.5, y: 0.5, pressure: 1.05, duration: 1 },
        { frame: 900, x: 0.5, y: 0.5, pressure: 1.05, duration: 1 },
        { frame: 1150, x: 0.5, y: 0.5, pressure: 1.05, duration: 1 },
      ],
      collectMetrics: true,
    },
    {
      // Recovery profile observation — collapse then return, observe profile
      name: 'collapse-recovery-profile-observation',
      totalFrames: 1400,
      metricsInterval: 10,
      touchScript: [
        { frame: 150, x: 0.5, y: 0.5, pressure: 1.3, duration: 120 },
        { frame: 500, x: 0.5, y: 0.5, pressure: 1.3, duration: 80 },
      ],
      collectMetrics: true,
    },
  ];

  const outcomes: ObservationPatternsOutcome[] = [];
  for (const config of scenarios) {
    outcomes.push({
      name: config.name,
      result: await runScenario(config),
    });
  }

  return outcomes;
}
