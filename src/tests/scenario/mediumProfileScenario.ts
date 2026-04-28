import { deriveMediumProfileState } from '../../closure/deriveMediumProfileState.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { BodySurfaceState } from '../../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { MediumProfileState } from '../../types/mediumProfileState.ts';
import type { ReafferenceComparisonState } from '../../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../../types/worldMediumState.ts';

export interface MediumProfileScenarioOutcome {
  name: string;
  profile: MediumProfileState;
  inputSignature: string;
  postSignature: string;
}

interface MediumProfileFixture {
  closure: BodyWorldClosureState;
  reafference: ReafferenceComparisonState;
  world: WorldMediumState;
  bodySurface: BodySurfaceState;
  pulse: ActuationPulse | null;
  returns: SensoryReturnPacket[];
  viability: DynamicViabilityState;
  dt: number;
}

function createBodySurface(overrides: Partial<BodySurfaceState> = {}): BodySurfaceState {
  return {
    timestamp: 100,
    boundaryIntegrity: 0.72,
    surfaceSensitivity: 0.56,
    permeability: 0.52,
    contactReadiness: 0.6,
    outputReadiness: 0.64,
    localIrritability: 0.18,
    recoveryShielding: 0.24,
    surfaceTension: 0.34,
    surfaceFatigue: 0.12,
    protectiveClosure: 0.18,
    externalContactLoad: 0.3,
    ...overrides,
  };
}

function createPulse(overrides: Partial<ActuationPulse> = {}): ActuationPulse {
  return {
    timestamp: 100,
    channel: 'visual',
    intensity: 0.62,
    coherence: 0.66,
    rhythm: 0.48,
    locality: 0.44,
    recoveryLinked: 0.22,
    boundaryLinked: 0.42,
    traceLinked: 0.34,
    outputReadiness: 0.64,
    durationTicks: 3,
    decayRate: 0.26,
    ...overrides,
  };
}

function createReturns(overrides: Array<Partial<SensoryReturnPacket>> = [{}]): SensoryReturnPacket[] {
  return overrides.map((override, index) => ({
    timestamp: 100 + index,
    channel: 'simulatedLight',
    intensity: 0.42,
    novelty: 0.24,
    locality: 0.4,
    rhythm: 0.36,
    worldOriginStrength: 0.74,
    returnDelayHint: 0.32,
    mediumStabilityHint: 0.7,
    returnReadiness: 0.58,
    echoLinked: 0.18,
    ...override,
  }));
}

function createWorld(overrides: Partial<WorldMediumState> = {}): WorldMediumState {
  return {
    timestamp: 100,
    ambientLight: 0.52,
    ambientNoise: 0.28,
    surfaceResistance: 0.46,
    echoLevel: 0.3,
    motionDrift: 0.2,
    fieldTemperature: 0.42,
    feedbackDelay: 0.34,
    lastPulseImpact: 0.48,
    mediumStability: 0.74,
    visualResidue: 0.24,
    forceResidue: 0.18,
    worldTurbulence: 0.2,
    returnReadiness: 0.6,
    ...overrides,
  };
}

function createReafference(overrides: Partial<ReafferenceComparisonState> = {}): ReafferenceComparisonState {
  return {
    timestamp: 100,
    expectedReturn: 0.52,
    actualReturn: 0.44,
    returnDelay: 0.34,
    returnMismatch: 0.08,
    selfCausedMatch: 0.62,
    worldCausedDifference: 0.16,
    unresolvedReturn: 0.12,
    comparisonConfidence: 0.72,
    pulseReturnCorrelation: 0.68,
    returnAttenuation: 0.08,
    returnAmplification: 0,
    delayedEchoScore: 0.1,
    ...overrides,
  };
}

function createClosure(overrides: Partial<BodyWorldClosureState> = {}): BodyWorldClosureState {
  return {
    timestamp: 100,
    loopGain: 0.9,
    roundTripDelay: 0.34,
    returnStrength: 0.44,
    selfCausedMatch: 0.62,
    worldMismatch: 0.18,
    closureStability: 0.68,
    closureDrift: 0.14,
    unresolvedReturn: 0.12,
    feedbackSaturationRisk: 0.22,
    comparisonConfidence: 0.72,
    returnMismatch: 0.08,
    ...overrides,
  };
}

function createViability(overrides: Partial<DynamicViabilityState> = {}): DynamicViabilityState {
  return {
    timestamp: 100,
    flowContinuity: 0.62,
    energyThroughput: 0.56,
    dissipationBalance: 0.58,
    resistanceBalance: 0.56,
    delayCoherence: 0.6,
    boundaryExchange: 0.6,
    underCouplingRisk: 0.22,
    overCouplingRisk: 0.2,
    saturationRisk: 0.24,
    extinctionRisk: 0.18,
    viabilityConfidence: 0.68,
    returnContinuity: 0.54,
    traceContinuity: 0.48,
    mediumExchangeBalance: 0.56,
    closureViability: 0.62,
    ...overrides,
  };
}

export function createMediumProfileFixture(overrides: Partial<MediumProfileFixture> = {}): MediumProfileFixture {
  return {
    closure: createClosure(),
    reafference: createReafference(),
    world: createWorld(),
    bodySurface: createBodySurface(),
    pulse: createPulse(),
    returns: createReturns(),
    viability: createViability(),
    dt: 1 / 60,
    ...overrides,
  };
}

function runSequence(name: string, sequence: MediumProfileFixture[]): MediumProfileScenarioOutcome {
  const inputSignature = JSON.stringify(sequence);
  let previousProfile: MediumProfileState | null = null;
  for (const fixture of sequence) {
    previousProfile = deriveMediumProfileState({
      closure: fixture.closure,
      reafference: fixture.reafference,
      world: fixture.world,
      bodySurface: fixture.bodySurface,
      pulse: fixture.pulse,
      returns: fixture.returns,
      viability: fixture.viability,
      previousProfile,
      dt: fixture.dt,
    });
  }
  const postSignature = JSON.stringify(sequence);
  return {
    name,
    profile: previousProfile as MediumProfileState,
    inputSignature,
    postSignature,
  };
}

export function runMediumProfileScenarioSuite(): MediumProfileScenarioOutcome[] {
  const stableDelayProfile = runSequence('S4-A-stable-delay-profile', [0.31, 0.32, 0.33, 0.31, 0.32].map((delay, index) =>
    createMediumProfileFixture({
      closure: createClosure({ timestamp: 100 + index, roundTripDelay: delay }),
      reafference: createReafference({ timestamp: 100 + index, returnDelay: delay }),
      world: createWorld({ timestamp: 100 + index, feedbackDelay: delay }),
      returns: createReturns([{ timestamp: 100 + index, returnDelayHint: delay }]),
    })
  ));

  const unstableDelayProfile = runSequence('S4-B-unstable-delay-profile', [0.12, 0.86, 0.22, 0.78, 0.42].map((delay, index) =>
    createMediumProfileFixture({
      closure: createClosure({ timestamp: 110 + index, roundTripDelay: delay, closureDrift: 0.36 }),
      reafference: createReafference({ timestamp: 110 + index, returnDelay: delay, delayedEchoScore: delay > 0.6 ? 0.72 : 0.18 }),
      world: createWorld({ timestamp: 110 + index, feedbackDelay: delay, mediumStability: 0.54 }),
      returns: createReturns([{ timestamp: 110 + index, returnDelayHint: delay, echoLinked: delay > 0.6 ? 0.62 : 0.14 }]),
    })
  ));

  const echoDecayProfile = runSequence('S4-C-echo-decay-profile', [
    { echoLevel: 0.82, impact: 0.8, visual: 0.72, force: 0.66 },
    { echoLevel: 0.58, impact: 0.54, visual: 0.44, force: 0.36 },
    { echoLevel: 0.34, impact: 0.28, visual: 0.18, force: 0.12 },
  ].map((step, index) => createMediumProfileFixture({
    world: createWorld({
      timestamp: 120 + index,
      echoLevel: step.echoLevel,
      lastPulseImpact: step.impact,
      visualResidue: step.visual,
      forceResidue: step.force,
    }),
    returns: createReturns([{ timestamp: 120 + index, channel: 'simulatedEcho', intensity: step.echoLevel * 0.7, echoLinked: step.echoLevel }]),
    closure: createClosure({ timestamp: 120 + index, returnStrength: step.echoLevel * 0.62 }),
  })));

  const echoSaturationRisk = runSequence('S4-D-echo-saturation-risk', [0.92, 0.94, 0.95, 0.94].map((echoLevel, index) =>
    createMediumProfileFixture({
      world: createWorld({ timestamp: 130 + index, echoLevel, lastPulseImpact: 0.9, visualResidue: 0.86, forceResidue: 0.82 }),
      closure: createClosure({ timestamp: 130 + index, feedbackSaturationRisk: 0.86, returnStrength: 0.88 }),
      pulse: createPulse({ timestamp: 130 + index, intensity: 0.84, decayRate: 0.04 }),
      returns: createReturns([{ timestamp: 130 + index, channel: 'simulatedEcho', intensity: 0.9, echoLinked: 0.9 }]),
    })
  ));

  const passThroughResistanceRisk = runSequence('S4-E-pass-through-resistance-risk', [
    createMediumProfileFixture({
      world: createWorld({ surfaceResistance: 0.08, mediumStability: 0.82, worldTurbulence: 0.08 }),
      bodySurface: createBodySurface({ boundaryIntegrity: 0.28, permeability: 0.9, recoveryShielding: 0.08 }),
      pulse: createPulse({ intensity: 0.88 }),
      closure: createClosure({ returnStrength: 0.84, loopGain: 1.08 }),
      reafference: createReafference({ actualReturn: 0.84, returnAttenuation: 0.04 }),
      returns: createReturns([{ intensity: 0.9, worldOriginStrength: 0.96, returnDelayHint: 0.28 }]),
    }),
  ]);

  const blockedResistanceRisk = runSequence('S4-F-blocked-resistance-risk', [
    createMediumProfileFixture({
      world: createWorld({ surfaceResistance: 0.92, mediumStability: 0.28, worldTurbulence: 0.66, lastPulseImpact: 0.82 }),
      bodySurface: createBodySurface({ boundaryIntegrity: 0.92, permeability: 0.08, recoveryShielding: 0.82, surfaceTension: 0.9 }),
      pulse: createPulse({ intensity: 0.92 }),
      closure: createClosure({ returnStrength: 0.06, loopGain: 0.14 }),
      reafference: createReafference({ actualReturn: 0.05, returnAttenuation: 0.86 }),
      returns: createReturns([{ intensity: 0.06, worldOriginStrength: 0.8, returnDelayHint: 0.52 }]),
      viability: createViability({ underCouplingRisk: 0.68, resistanceBalance: 0.24 }),
    }),
  ]);

  const noCommandFeedback = runSequence('S4-G-no-command-feedback', [createMediumProfileFixture()]);
  const noSemanticLeak = runSequence('S4-H-no-semantic-leak', [createMediumProfileFixture()]);

  return [
    stableDelayProfile,
    unstableDelayProfile,
    echoDecayProfile,
    echoSaturationRisk,
    passThroughResistanceRisk,
    blockedResistanceRisk,
    noCommandFeedback,
    noSemanticLeak,
  ];
}
