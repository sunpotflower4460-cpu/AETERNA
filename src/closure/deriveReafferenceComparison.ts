import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';

/**
 * deriveReafferenceComparison
 *
 * W5: Reafference Comparison
 *
 * Compares AETERNA's Actuation Pulse (what was output) with Sensory Return
 * (what came back from World Medium) to derive pre-semantic comparison metrics.
 *
 * This is NOT self-awareness. This is NOT semantic interpretation.
 * This is a pre-semantic comparison of:
 * - What pulse was sent
 * - What return was received
 * - How they match or mismatch
 *
 * Design principles:
 * - Pure function (no side effects)
 * - Returns 0–1 continuous values
 * - No NaN or Infinity in output
 * - Safe when pulse is null or returns are empty
 * - selfCausedMatch / worldCausedDifference are proxy indicators, not semantic judgments
 * - No meaning assignment or semantic interpretation
 *
 * @param pulse - ActuationPulse from this frame (may be null)
 * @param returns - SensoryReturnPacket[] from this frame (may be empty)
 * @param world - WorldMediumState for context
 * @param dt - Time delta in seconds
 * @returns ReafferenceComparisonState
 */

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function safeAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + clamp01(v), 0);
  return sum / values.length;
}

/**
 * Derive expectedReturn from Actuation Pulse.
 * Estimates how much sensory return should come back based on the pulse sent.
 */
function deriveExpectedReturn(pulse: ActuationPulse | null): number {
  if (!pulse) return 0;

  // Expected return is a weighted combination of pulse properties
  // that predict how much the world should respond
  const intensityContribution = pulse.intensity * 0.4;
  const coherenceContribution = pulse.coherence * 0.2;
  const outputReadinessContribution = pulse.outputReadiness * 0.2;
  const localityContribution = pulse.locality * 0.2;

  return clamp01(
    intensityContribution +
    coherenceContribution +
    outputReadinessContribution +
    localityContribution
  );
}

/**
 * Derive actualReturn from Sensory Return packets.
 * Measures how much sensory return actually came back.
 */
function deriveActualReturn(returns: SensoryReturnPacket[]): number {
  if (returns.length === 0) return 0;

  // Actual return is intensity weighted by worldOriginStrength
  const returnStrengths = returns.map(
    r => r.intensity * r.worldOriginStrength
  );

  return clamp01(safeAverage(returnStrengths));
}

/**
 * Derive returnDelay from Sensory Return packets.
 * Measures how delayed the returns are.
 */
function deriveReturnDelay(returns: SensoryReturnPacket[]): number {
  if (returns.length === 0) return 0;

  const delayHints = returns.map(r => r.returnDelayHint);
  return clamp01(safeAverage(delayHints));
}

/**
 * Check if pulse channel corresponds to return channels.
 * Returns correlation score [0, 1].
 */
function derivePulseReturnChannelMatch(
  pulse: ActuationPulse | null,
  returns: SensoryReturnPacket[]
): number {
  if (!pulse || returns.length === 0) return 0;

  const pulseChannel = pulse.channel;
  let matchScore = 0;

  // Check correspondence between actuation and sensory channels
  for (const ret of returns) {
    if (pulseChannel === 'visual' && ret.channel === 'simulatedLight') {
      matchScore += 1.0;
    } else if (pulseChannel === 'visual' && ret.channel === 'simulatedEcho') {
      matchScore += 0.6; // Visual can cause echo
    } else if (pulseChannel === 'simulatedForce' && ret.channel === 'simulatedPressure') {
      matchScore += 1.0;
    } else if (pulseChannel === 'simulatedForce' && ret.channel === 'simulatedMotion') {
      matchScore += 0.8;
    } else if (pulseChannel === 'simulatedForce' && ret.channel === 'simulatedEcho') {
      matchScore += 0.6;
    } else {
      matchScore += 0.1; // Weak cross-modal correlation
    }
  }

  return clamp01(matchScore / returns.length);
}

/**
 * Derive selfCausedMatch: proxy for how much return appears self-caused.
 */
function deriveSelfCausedMatch(
  pulse: ActuationPulse | null,
  returns: SensoryReturnPacket[],
  expectedReturn: number,
  actualReturn: number,
  returnDelay: number,
  channelMatch: number,
  world: WorldMediumState
): number {
  if (!pulse || returns.length === 0) return 0;

  // Self-caused match is HIGH when:
  // 1. Pulse exists
  // 2. Channel correspondence is good
  // 3. Return delay is reasonable (not too high)
  // 4. Expected ≈ actual (low mismatch)
  // 5. Medium stability is not too low

  const channelMatchContribution = channelMatch * 0.35;

  const mismatch = Math.abs(expectedReturn - actualReturn);
  const matchQuality = 1 - mismatch;
  const matchContribution = matchQuality * 0.3;

  const delayReasonable = returnDelay < 0.7 ? 1 : (1 - returnDelay);
  const delayContribution = delayReasonable * 0.2;

  const mediumStability = world.mediumStability;
  const stabilityContribution = mediumStability * 0.15;

  return clamp01(
    channelMatchContribution +
    matchContribution +
    delayContribution +
    stabilityContribution
  );
}

/**
 * Derive worldCausedDifference: proxy for how much return appears world-caused.
 */
function deriveWorldCausedDifference(
  pulse: ActuationPulse | null,
  returns: SensoryReturnPacket[],
  expectedReturn: number,
  actualReturn: number,
  returnDelay: number,
  world: WorldMediumState
): number {
  if (returns.length === 0) return 0;

  // World-caused difference is HIGH when:
  // 1. No pulse but strong return
  // 2. Actual >> expected
  // 3. Return delay is unusual
  // 4. Medium stability is low
  // 5. Motion drift is high

  const noPulseStrongReturn = (!pulse && actualReturn > 0.2) ? 0.4 : 0;

  const amplification = actualReturn > expectedReturn
    ? (actualReturn - expectedReturn) * 0.3
    : 0;

  const unusualDelay = returnDelay > 0.65 ? returnDelay * 0.15 : 0;

  const instability = (1 - world.mediumStability) * 0.1;

  const drift = world.motionDrift * 0.05;

  return clamp01(
    noPulseStrongReturn +
    amplification +
    unusualDelay +
    instability +
    drift
  );
}

/**
 * Derive unresolvedReturn: ambiguous return attribution.
 */
function deriveUnresolvedReturn(
  pulse: ActuationPulse | null,
  returns: SensoryReturnPacket[],
  expectedReturn: number,
  actualReturn: number,
  returnDelay: number,
  channelMatch: number,
  selfCausedMatch: number,
  worldCausedDifference: number
): number {
  if (returns.length === 0) return 0;

  // Unresolved is HIGH when:
  // 1. Both self and world scores are low (ambiguous)
  // 2. Moderate mismatch (not extreme)
  // 3. Ambiguous channel correspondence
  // 4. Multiple returns (overlap)

  const ambiguousAttribution = Math.max(
    0,
    1 - selfCausedMatch - worldCausedDifference
  ) * 0.4;

  const moderateMismatch = Math.abs(expectedReturn - actualReturn);
  const mismatchInMiddle = moderateMismatch > 0.2 && moderateMismatch < 0.6
    ? moderateMismatch * 0.3
    : 0;

  const ambiguousChannel = channelMatch > 0.1 && channelMatch < 0.7
    ? (0.5 - Math.abs(channelMatch - 0.5)) * 0.2
    : 0;

  const multipleReturns = returns.length > 1
    ? Math.min(returns.length / 5, 0.1)
    : 0;

  return clamp01(
    ambiguousAttribution +
    mismatchInMiddle +
    ambiguousChannel +
    multipleReturns
  );
}

/**
 * Derive comparisonConfidence: how reliable this comparison is.
 */
function deriveComparisonConfidence(
  pulse: ActuationPulse | null,
  returns: SensoryReturnPacket[],
  returnDelay: number,
  channelMatch: number,
  world: WorldMediumState
): number {
  // Confidence is HIGH when:
  // 1. Clear pulse-return correspondence
  // 2. Stable world medium
  // 3. Unambiguous timing
  // 4. Good channel match

  const hasPulseAndReturn = (pulse !== null && returns.length > 0) ? 0.3 : 0;

  const stability = world.mediumStability * 0.25;

  const clearTiming = returnDelay < 0.5 ? 0.2 : (1 - returnDelay) * 0.2;

  const goodChannelMatch = channelMatch * 0.25;

  return clamp01(
    hasPulseAndReturn +
    stability +
    clearTiming +
    goodChannelMatch
  );
}

/**
 * Main derivation function.
 */
export function deriveReafferenceComparison(
  pulse: ActuationPulse | null,
  returns: SensoryReturnPacket[],
  world: WorldMediumState,
  _dt: number
): ReafferenceComparisonState {
  const timestamp = world.timestamp;

  // Derive basic metrics
  const expectedReturn = deriveExpectedReturn(pulse);
  const actualReturn = deriveActualReturn(returns);
  const returnDelay = deriveReturnDelay(returns);
  const returnMismatch = clamp01(Math.abs(expectedReturn - actualReturn));

  // Derive channel correspondence
  const pulseReturnCorrelation = derivePulseReturnChannelMatch(pulse, returns);

  // Derive proxy indicators
  const selfCausedMatch = deriveSelfCausedMatch(
    pulse,
    returns,
    expectedReturn,
    actualReturn,
    returnDelay,
    pulseReturnCorrelation,
    world
  );

  const worldCausedDifference = deriveWorldCausedDifference(
    pulse,
    returns,
    expectedReturn,
    actualReturn,
    returnDelay,
    world
  );

  const unresolvedReturn = deriveUnresolvedReturn(
    pulse,
    returns,
    expectedReturn,
    actualReturn,
    returnDelay,
    pulseReturnCorrelation,
    selfCausedMatch,
    worldCausedDifference
  );

  const comparisonConfidence = deriveComparisonConfidence(
    pulse,
    returns,
    returnDelay,
    pulseReturnCorrelation,
    world
  );

  // Optional metrics
  const returnAttenuation = actualReturn < expectedReturn
    ? clamp01(expectedReturn - actualReturn)
    : 0;

  const returnAmplification = actualReturn > expectedReturn
    ? clamp01(actualReturn - expectedReturn)
    : 0;

  const delayedEchoScore = returnDelay > 0.6
    ? clamp01(returnDelay * actualReturn)
    : 0;

  return {
    timestamp,
    expectedReturn,
    actualReturn,
    returnDelay,
    returnMismatch,
    selfCausedMatch,
    worldCausedDifference,
    unresolvedReturn,
    comparisonConfidence,
    pulseReturnCorrelation,
    returnAttenuation,
    returnAmplification,
    delayedEchoScore,
  };
}
