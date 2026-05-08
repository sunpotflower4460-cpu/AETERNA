import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import { deriveEnergyLedgerScenarioMetrics } from '../observer/deriveEnergyLedgerScenarioMetrics.ts';
import type { EnergyLedgerScenarioMetricsReport } from '../observer/deriveEnergyLedgerScenarioMetrics.ts';
import { runScenario, type ScenarioConfig, type ScenarioResult } from './runScenario.ts';

export interface ScenarioResultWithEnergyLedgerVisibility extends ScenarioResult {
  energyLedgerVisibility: EnergyLedgerScenarioMetricsReport;
}

/**
 * deriveRunScenarioEnergyLedgerVisibility
 *
 * Minimal v2.9.4 connection from existing scenario metrics to the Energy Ledger
 * visibility layer.
 *
 * This deliberately does not infer input/dissipation/actuation/residue terms from
 * visual activity or proxy metrics. Until those terms are explicitly
 * instrumented, each sampled frame should surface as insufficient. That is the
 * point of this wiring: visible motion must not be mistaken for verified modeled
 * energy flow.
 */
export function deriveRunScenarioEnergyLedgerVisibility(
  result: ScenarioResult,
): EnergyLedgerScenarioMetricsReport {
  const frames = result.metrics.map((metric) => ({
    frame: metric.frame,
    ledger: deriveEnergyLedger({
      timestamp: metric.frame,
      source: 'runScenario-ledger-visibility-minimal-wiring',
    }),
  }));

  return deriveEnergyLedgerScenarioMetrics(frames);
}

/**
 * runScenarioWithEnergyLedgerVisibility
 *
 * Observer-side wrapper only. It does not modify AETERNA runtime dynamics and
 * does not add external drive, spatial medium, pulse, or periodic input.
 */
export async function runScenarioWithEnergyLedgerVisibility(
  config: ScenarioConfig,
): Promise<ScenarioResultWithEnergyLedgerVisibility> {
  const result = await runScenario(config);
  const energyLedgerVisibility = deriveRunScenarioEnergyLedgerVisibility(result);

  return {
    ...result,
    energyLedgerVisibility,
  };
}
