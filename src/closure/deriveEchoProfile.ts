import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { EchoProfileState } from '../types/echoProfileState.ts';
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

function latestTimestamp(values: Array<number | undefined>): number {
  const finiteValues = values.filter((value): value is number => Number.isFinite(value));
  return finiteValues.length > 0 ? Math.max(...finiteValues) : 0;
}

export function deriveEchoProfile(params: {
  world: WorldMediumState | null;
  pulse: ActuationPulse | null;
  returns: SensoryReturnPacket[];
  closure: BodyWorldClosureState | null;
  previousProfile?: EchoProfileState | null;
  dt: number;
}): EchoProfileState {
  const {
    world,
    pulse,
    returns,
    closure,
    previousProfile = null,
    dt,
  } = params;

  const timestamp = latestTimestamp([
    world?.timestamp,
    pulse?.timestamp,
    closure?.timestamp,
    returns[returns.length - 1]?.timestamp,
    previousProfile?.timestamp,
  ]);

  const visualEchoResidue = clamp01(world?.visualResidue ?? 0);
  const forceEchoResidue = clamp01(world?.forceResidue ?? 0);
  const echoReturnStrength = average(
    returns.map((packet) => packet.channel === 'simulatedEcho' ? packet.intensity : packet.echoLinked ?? 0),
  );
  const returnEchoCoupling = clamp01(average([
    echoReturnStrength,
    closure?.returnStrength ?? 0,
    world?.lastPulseImpact ?? 0,
  ]));

  const echoStrength = clamp01(average([
    world?.echoLevel ?? 0,
    echoReturnStrength,
    visualEchoResidue,
    forceEchoResidue,
  ]));

  const previousStrength = clamp01(previousProfile?.echoStrength ?? echoStrength);
  const dtScale = Number.isFinite(dt) && dt > 0 ? Math.max(dt, 1 / 120) : 1 / 60;
  const rawDecay = (previousStrength - echoStrength) / dtScale;
  const echoDecayRate = clamp01(rawDecay * 0.12 + Math.max(0, previousStrength - echoStrength));

  const echoPersistence = clamp01(average([
    echoStrength,
    average([visualEchoResidue, forceEchoResidue]),
    world?.lastPulseImpact ?? 0,
  ]));

  const saturationAnchor = previousProfile?.echoSaturationRisk ?? 0;
  const noDecayRisk = echoPersistence > 0.55 && echoDecayRate < 0.08 ? 1 : 0;
  const pulseEchoDrive = pulse == null ? 0 : clamp01((pulse.intensity * (1 - (pulse.decayRate ?? 0.3))) * 0.8);
  const echoSaturationRisk = clamp01(average([
    echoStrength,
    echoPersistence,
    closure?.feedbackSaturationRisk ?? 0,
    noDecayRisk,
    pulseEchoDrive,
    saturationAnchor * 0.5,
  ]));

  const echoProfileConfidence = clamp01(
    clamp01((world ? 1 : 0) * 0.35 + (returns.length > 0 ? 0.2 : 0) + (closure ? 0.15 : 0) + (pulse ? 0.1 : 0)) +
      clamp01(dt / 0.12) * 0.05 +
      clamp01(1 - Math.abs(previousStrength - echoStrength)) * 0.15,
  );

  return {
    timestamp,
    echoStrength,
    echoDecayRate,
    echoPersistence,
    echoSaturationRisk,
    visualEchoResidue,
    forceEchoResidue,
    returnEchoCoupling,
    echoProfileConfidence,
    echoHalfLifeEstimate: echoDecayRate > 0.001 ? clamp01(0.693 / (echoDecayRate * 10)) : 1,
    echoStability: clamp01(1 - Math.abs(previousStrength - echoStrength)),
    echoBurstCount: returns.filter((packet) => clamp01(packet.echoLinked ?? 0) > 0.65 || packet.channel === 'simulatedEcho').length,
  };
}
