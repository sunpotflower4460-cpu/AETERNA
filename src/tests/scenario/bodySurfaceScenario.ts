/**
 * Body Surface Scenario Suite
 *
 * W1: Body Surface Introduction
 *
 * These scenarios test the derivation of BodySurfaceState under
 * various organism conditions. They validate that the Body Surface
 * behaves as a pre-semantic boundary layer — not as a UI or semantic node.
 *
 * Scenarios:
 *   W1-A: stable quiet surface (no perturbation, stable state)
 *   W1-B: overload protective closure (collapseRisk → permeability↓, recoveryShielding↑)
 *   W1-C: moderate contact readiness (stable + open → contactReadiness moderate)
 *   W1-D: repeated perturbation irritability (repeated perturbation → localIrritability↑)
 *   W1-E: read-only derivation (Body Surface does not significantly alter dynamics)
 */

import { runScenario, type ScenarioConfig, type ScenarioResult } from '../../experiments/runScenario';

export interface BodySurfaceScenarioOutcome {
  name: string;
  result: ScenarioResult;
}

export async function runBodySurfaceScenarioSuite(): Promise<BodySurfaceScenarioOutcome[]> {
  const scenarios: ScenarioConfig[] = [
    // W1-A: Stable quiet surface
    // No external perturbation, strong boundary, moderate restoration
    // Expected: boundaryIntegrity moderate-high, surfaceSensitivity low,
    //           permeability moderate, localIrritability low
    {
      name: 'W1-A-stable-quiet-surface',
      totalFrames: 600,
      metricsInterval: 5,
      touchScript: [],
      collectMetrics: true,
      initialHomeostaticState: {
        boundaryIntegrity: 0.82,
        restorationBias: 0.68,
        selfPreservationBias: 0.62,
      },
    },

    // W1-B: Overload protective closure
    // Sustained overload: permeability should decrease, recoveryShielding should increase
    {
      name: 'W1-B-overload-protective-closure',
      totalFrames: 800,
      metricsInterval: 5,
      touchScript: [
        { frame: 80, x: 0.5, y: 0.5, pressure: 1.25, duration: 120 },
        { frame: 280, x: 0.4, y: 0.6, pressure: 1.25, duration: 100 },
      ],
      collectMetrics: true,
      initialHomeostaticState: {
        boundaryIntegrity: 0.62,
        restorationBias: 0.44,
        selfPreservationBias: 0.58,
      },
    },

    // W1-C: Moderate contact readiness
    // Stable and moderately open: contactReadiness should be in [0.2, 0.8]
    {
      name: 'W1-C-moderate-contact-readiness',
      totalFrames: 500,
      metricsInterval: 5,
      touchScript: [
        { frame: 150, x: 0.5, y: 0.5, pressure: 0.7, duration: 1 },
        { frame: 320, x: 0.5, y: 0.5, pressure: 0.7, duration: 1 },
      ],
      collectMetrics: true,
      initialHomeostaticState: {
        boundaryIntegrity: 0.76,
        restorationBias: 0.60,
        selfPreservationBias: 0.55,
      },
    },

    // W1-D: Repeated perturbation irritability
    // Many repeated perturbations → localIrritability should rise
    {
      name: 'W1-D-repeated-perturbation-irritability',
      totalFrames: 1000,
      metricsInterval: 5,
      touchScript: [
        { frame: 80, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 160, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 240, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 320, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 400, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 480, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 560, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
        { frame: 640, x: 0.5, y: 0.5, pressure: 1.0, duration: 1 },
      ],
      collectMetrics: true,
    },

    // W1-E: Read-only derivation
    // Body Surface derivation should not cause collapse or NaN.
    // Run is identical to W1-A but checks the simulation remains stable.
    {
      name: 'W1-E-read-only-derivation',
      totalFrames: 400,
      metricsInterval: 5,
      touchScript: [
        { frame: 100, x: 0.5, y: 0.5, pressure: 0.9, duration: 1 },
      ],
      collectMetrics: true,
    },
  ];

  const outcomes: BodySurfaceScenarioOutcome[] = [];
  for (const config of scenarios) {
    const result = await runScenario(config);
    outcomes.push({ name: config.name, result });
  }
  return outcomes;
}
