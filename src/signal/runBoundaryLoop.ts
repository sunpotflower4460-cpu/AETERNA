import type { StimulusPacket, Signal, BoundaryState } from './types.js';

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function getActivation(signals: Signal[], id: string): number {
  return signals.find(s => s.id === id)?.activation ?? 0;
}

export function runBoundaryLoop(stimulus: StimulusPacket, signals: Signal[]): BoundaryState {
  const hostility = getActivation(signals, 'other_hostility_signal');
  const fatigue = getActivation(signals, 'other_fatigue_signal');
  const question = getActivation(signals, 'other_question_signal');
  const care = getActivation(signals, 'self_care_response');
  const hesitation = getActivation(signals, 'self_hesitation');

  // ── externalPressure: how forcefully the stimulus pushes against the boundary ──
  // Rises with emotional charge and hostility
  const externalPressure = clamp(
    stimulus.emotionalCharge * 0.6 + hostility * 0.3 + stimulus.salience * 0.1,
  );

  // ── shockAbsorption: self-protection buffer against hostile/aggressive input ──
  // Rises with hostility; also rises slightly when fatigue is high (need to protect more)
  const shockAbsorption = clamp(
    0.2 + hostility * 0.5 + fatigue * 0.2,
  );

  // ── permeability: how open the boundary is to letting stimulus in ──
  // Rises with care signal, drops with hostility and high shock
  // A genuine question with lower emotional overload slightly opens the boundary
  const permeability = clamp(
    0.4 + care * 0.2 - hostility * 0.3 - shockAbsorption * 0.15 + (question > 0.5 && stimulus.emotionalCharge < 0.6 ? 0.1 : 0),
  );

  // ── selfOuterSeparation: clarity of self/other distinction ──
  // Rises with care and hesitation (self maintains sense of distinct self)
  // Drops slightly when emotional charge is very high (boundary becomes blurry)
  const selfOuterSeparation = clamp(
    0.5 + care * 0.15 + hesitation * 0.1 - stimulus.emotionalCharge * 0.15,
  );

  return {
    permeability,
    selfOuterSeparation,
    shockAbsorption,
    externalPressure,
  };
}
