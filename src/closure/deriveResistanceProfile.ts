import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import type { ResistanceProfileState } from '../types/resistanceProfileState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + clamp01(value), 0) / values.length;
}

function balanceScore(value: number, target = 0.5, tolerance = 0.5): number {
  if (!Number.isFinite(value)) return 0;
  if (tolerance <= 0) return value === target ? 1 : 0;
  return clamp01(1 - Math.abs(value - target) / tolerance);
}

function latestTimestamp(values: Array<number | undefined>): number {
  const finiteValues = values.filter((value): value is number => Number.isFinite(value));
  return finiteValues.length > 0 ? Math.max(...finiteValues) : 0;
}

export function deriveResistanceProfile(params: {
  world: WorldMediumState | null;
  bodySurface: BodySurfaceState | null;
  pulse: ActuationPulse | null;
  returns: SensoryReturnPacket[];
  closure: BodyWorldClosureState | null;
  viability?: DynamicViabilityState | null;
  previousProfile?: ResistanceProfileState | null;
  dt: number;
}): ResistanceProfileState {
  const {
    world,
    bodySurface,
    pulse,
    returns,
    closure,
    viability = null,
    previousProfile = null,
    dt,
  } = params;

  const timestamp = latestTimestamp([
    world?.timestamp,
    bodySurface?.timestamp,
    pulse?.timestamp,
    closure?.timestamp,
    viability?.timestamp,
    returns[returns.length - 1]?.timestamp,
    previousProfile?.timestamp,
  ]);

  const pulseIntensity = clamp01(pulse?.intensity ?? 0);
  const averageReturnIntensity = average(
    returns.map((packet) => clamp01(packet.intensity * packet.worldOriginStrength)),
  );
  const transmissionRatio = pulseIntensity > 0.001
    ? clamp01(averageReturnIntensity / pulseIntensity)
    : clamp01(average([closure?.returnStrength ?? 0, averageReturnIntensity]));
  const returnAttenuation = clamp01(
    closure?.returnStrength != null && pulseIntensity > 0.001
      ? Math.max(0, 1 - clamp01((closure.returnStrength ?? 0) / pulseIntensity))
      : 1 - transmissionRatio,
  );

  const worldResistance = clamp01(average([
    world?.surfaceResistance ?? 0.5,
    1 - (world?.mediumStability ?? 0.5),
    world?.worldTurbulence ?? 0,
  ]));
  const boundaryResistance = clamp01(average([
    bodySurface?.boundaryIntegrity ?? 0.5,
    1 - (bodySurface?.permeability ?? 0.5),
    bodySurface?.recoveryShielding ?? 0.3,
  ]));

  const mediumAbsorption = clamp01(average([
    worldResistance,
    boundaryResistance,
    returnAttenuation,
    clamp01((world?.lastPulseImpact ?? 0) - averageReturnIntensity + 0.5),
  ]));

  const resistanceBalance = clamp01(average([
    balanceScore(worldResistance, 0.5, 0.5),
    balanceScore(boundaryResistance, 0.5, 0.5),
    balanceScore(returnAttenuation, 0.45, 0.45),
    balanceScore(transmissionRatio, 0.45, 0.45),
    viability?.resistanceBalance ?? 0.5,
  ]));

  const resistanceVariance = clamp01(average([
    Math.abs(worldResistance - boundaryResistance),
    Math.abs(returnAttenuation - mediumAbsorption),
    Math.abs(transmissionRatio - (1 - returnAttenuation)),
    previousProfile == null
      ? 0
      : average([
          Math.abs(previousProfile.worldResistance - worldResistance),
          Math.abs(previousProfile.boundaryResistance - boundaryResistance),
          Math.abs(previousProfile.transmissionRatio - transmissionRatio),
        ]),
  ]));

  const resistanceProfileConfidence = clamp01(
    (world ? 0.25 : 0) +
      (bodySurface ? 0.2 : 0) +
      (pulse ? 0.15 : 0) +
      (returns.length > 0 ? 0.15 : 0) +
      (closure ? 0.15 : 0) +
      (viability ? 0.05 : 0) +
      clamp01(dt / 0.12) * 0.05,
  );

  return {
    timestamp,
    worldResistance,
    boundaryResistance,
    returnAttenuation,
    mediumAbsorption,
    transmissionRatio,
    resistanceBalance,
    resistanceVariance,
    resistanceProfileConfidence,
    surfaceImpedance: clamp01(average([
      world?.surfaceResistance ?? 0.5,
      bodySurface?.surfaceTension ?? bodySurface?.boundaryIntegrity ?? 0.5,
    ])),
    pulseAbsorptionRatio: pulseIntensity > 0.001
      ? clamp01(Math.max(0, pulseIntensity - averageReturnIntensity) / pulseIntensity)
      : mediumAbsorption,
    returnAbsorptionRatio: clamp01(average([
      mediumAbsorption,
      clamp01(1 - (closure?.loopGain != null ? clamp01(closure.loopGain / 1.2) : transmissionRatio)),
    ])),
  };
}
