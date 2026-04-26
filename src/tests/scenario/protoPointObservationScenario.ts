/**
 * Proto-Point Observation Scenario
 *
 * Phase 7: proto-point の観測導入
 *
 * Runs scenarios designed to test proto-point candidate observation:
 * - Whether candidates appear at appropriate times (not baseline spam)
 * - Whether repeated perturbation increases candidate confidence
 * - Whether replay/quiet phase re-confirms candidates
 * - Whether candidates survive collapse/recovery
 * - Whether observation is read-only (does not change organism dynamics)
 *
 * Purpose: Observe what structural node candidates naturally emerge from
 * the torus life-field under different conditions.
 * NOT to assign meaning, but to observe what is present.
 *
 * All scenario results are observer-side proxy observations only.
 * No semantic labels are attached.
 */

import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario.ts';

export interface ProtoPointObservationOutcome {
  name: string;
  result: ScenarioResult;
}

export async function runProtoPointObservationSuite(): Promise<ProtoPointObservationOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    {
      // Scenario 7A: no-input baseline proto-point absence
      // No perturbation: verify candidates do not mass-generate in silence.
      name: 'scenario-7a-no-input-baseline',
      totalFrames: 1200,
      metricsInterval: 10,
      touchScript: [],
      collectMetrics: true,
    },
    {
      // Scenario 7B: repeated local perturbation
      // Same region perturbed repeatedly: candidate confidence should rise.
      name: 'scenario-7b-repeated-local-perturbation',
      totalFrames: 1600,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.72,
        selfPreservationBias: 0.62,
        boundaryIntegrity: 0.80,
      },
      touchScript: [
        { frame: 150, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 350, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 550, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 750, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 950, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 1150, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
      ],
      collectMetrics: true,
    },
    {
      // Scenario 7C: replay-supported emergence
      // Perturbation then quiet: replay phase may re-confirm candidates.
      name: 'scenario-7c-replay-supported-emergence',
      totalFrames: 1800,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.75,
        selfPreservationBias: 0.65,
        boundaryIntegrity: 0.82,
      },
      touchScript: [
        { frame: 100, x: 0.5, y: 0.5, pressure: 1.1, duration: 5 },
        { frame: 300, x: 0.5, y: 0.5, pressure: 1.1, duration: 5 },
        { frame: 500, x: 0.5, y: 0.5, pressure: 1.1, duration: 5 },
        // Long quiet period for replay to occur (frames 600–1800)
      ],
      collectMetrics: true,
    },
    {
      // Scenario 7D: collapse and recovery persistence
      // Hard perturbation → collapse → recovery: do candidates survive?
      name: 'scenario-7d-collapse-recovery-persistence',
      totalFrames: 1600,
      metricsInterval: 10,
      touchScript: [
        // Repeated perturbation to build up candidates
        { frame: 100, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 250, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 400, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        // Then hard collapse
        { frame: 600, x: 0.5, y: 0.5, pressure: 1.4, duration: 100 },
        // Recovery observation period (frames 700–1600)
      ],
      collectMetrics: true,
    },
    {
      // Scenario 7E: read-only observation
      // Proto-point observation enabled (standard run): organism dynamics should
      // not differ significantly from what they would be without observation.
      // This is tested by comparing to baseline scenario 7A in behavioral tests.
      name: 'scenario-7e-read-only-verification',
      totalFrames: 1200,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.68,
        selfPreservationBias: 0.60,
        boundaryIntegrity: 0.78,
      },
      touchScript: [
        { frame: 200, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 500, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
        { frame: 800, x: 0.5, y: 0.5, pressure: 1.05, duration: 2 },
      ],
      collectMetrics: true,
    },
    {
      // Extra: high restoration scenario for basin-dominant candidate observation
      name: 'scenario-7f-high-restoration-basin-candidates',
      totalFrames: 1400,
      metricsInterval: 10,
      initialHomeostaticState: {
        restorationBias: 0.88,
        selfPreservationBias: 0.75,
        boundaryIntegrity: 0.90,
      },
      touchScript: [
        { frame: 200, x: 0.48, y: 0.52, pressure: 1.1, duration: 30 },
        { frame: 600, x: 0.52, y: 0.48, pressure: 1.1, duration: 30 },
        { frame: 1000, x: 0.50, y: 0.50, pressure: 1.1, duration: 30 },
      ],
      collectMetrics: true,
    },
  ];

  const outcomes: ProtoPointObservationOutcome[] = [];
  for (const config of scenarios) {
    outcomes.push({
      name: config.name,
      result: await runScenario(config),
    });
  }

  return outcomes;
}
