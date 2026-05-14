import type {
  NonlinearPotentialFieldConfig,
  NonlinearPotentialFieldPreparationReport,
} from '../types/nonlinearPotentialField.ts';
import type { WaveCapableMediumState } from '../types/waveCapableMedium.ts';

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function finiteSample(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function finiteCoefficient(value: number | undefined): number {
  return finiteNumber(value, 0);
}

function normalizeConfig(config: NonlinearPotentialFieldConfig): NonlinearPotentialFieldConfig {
  return {
    ...config,
    width: Math.max(1, Math.floor(config.width)),
    height: Math.max(1, Math.floor(config.height)),
    localQuadraticCoefficient: finiteCoefficient(config.localQuadraticCoefficient),
    localQuarticCoefficient: finiteCoefficient(config.localQuarticCoefficient),
    tolerance: Math.max(1e-9, Math.abs(finiteNumber(config.tolerance, 1e-9))),
  };
}

function countChangedSamples(before: Float64Array, after: Float64Array): number {
  const count = Math.min(before.length, after.length);
  let changed = before.length === after.length ? 0 : Math.abs(before.length - after.length);
  for (let i = 0; i < count; i++) {
    if (!Object.is(before[i], after[i])) changed += 1;
  }
  return changed;
}

function countMediumChanges(before: WaveCapableMediumState, after: WaveCapableMediumState): number {
  return (
    countChangedSamples(before.mediumRealField, after.mediumRealField) +
    countChangedSamples(before.mediumImagField, after.mediumImagField) +
    countChangedSamples(before.mediumRealVelocityField, after.mediumRealVelocityField) +
    countChangedSamples(before.mediumImagVelocityField, after.mediumImagVelocityField) +
    countChangedSamples(before.waveEnergyDissipationField, after.waveEnergyDissipationField) +
    countChangedSamples(before.waveEnergyResidueField, after.waveEnergyResidueField) +
    countChangedSamples(before.waveEnergyOutflowField, after.waveEnergyOutflowField) +
    (before.tick === after.tick ? 0 : 1)
  );
}

export function deriveNonlinearPotentialFieldPreparation(input: {
  mediumState: WaveCapableMediumState;
  config: NonlinearPotentialFieldConfig;
}): NonlinearPotentialFieldPreparationReport {
  const config = normalizeConfig(input.config);
  const warnings: string[] = [];

  if (input.mediumState.width !== config.width || input.mediumState.height !== config.height) {
    throw new Error('NonlinearPotentialField config size must match medium state size.');
  }

  if (input.mediumState.boundaryMode !== config.boundaryMode) {
    warnings.push('Nonlinear potential field boundary mode differs from medium state boundary mode.');
  }

  if (config.localQuadraticCoefficient < 0) {
    warnings.push('Local quadratic coefficient is negative; potential energy may be locally unbounded without a stabilizing higher-order term.');
  }

  if (config.localQuarticCoefficient < 0) {
    warnings.push('Local quartic coefficient is negative; this preparation does not treat it as a stability target.');
  }

  const size = config.width * config.height;
  const potentialEnergyField = new Float64Array(size);
  const gradientRealField = new Float64Array(size);
  const gradientImagField = new Float64Array(size);

  let potentialEnergyTotal = 0;
  let potentialEnergyMax = 0;
  let maxGradientMagnitude = 0;
  let gradientEnergyProxy = 0;
  let finiteCellCount = 0;
  let nonFiniteCellCount = 0;

  for (let i = 0; i < size; i++) {
    const realRaw = input.mediumState.mediumRealField[i];
    const imagRaw = input.mediumState.mediumImagField[i];
    const cellFinite = Number.isFinite(realRaw) && Number.isFinite(imagRaw);
    if (cellFinite) finiteCellCount += 1;
    else nonFiniteCellCount += 1;

    const real = finiteSample(realRaw);
    const imag = finiteSample(imagRaw);
    const amplitudeSquared = real * real + imag * imag;
    const potentialEnergy =
      0.5 * config.localQuadraticCoefficient * amplitudeSquared +
      0.25 * config.localQuarticCoefficient * amplitudeSquared * amplitudeSquared;
    const gradientScale =
      config.localQuadraticCoefficient + config.localQuarticCoefficient * amplitudeSquared;
    const gradientReal = gradientScale * real;
    const gradientImag = gradientScale * imag;

    potentialEnergyField[i] = potentialEnergy;
    gradientRealField[i] = gradientReal;
    gradientImagField[i] = gradientImag;

    potentialEnergyTotal += potentialEnergy;
    potentialEnergyMax = Math.max(potentialEnergyMax, potentialEnergy);
    const gradientMagnitude = Math.sqrt(gradientReal * gradientReal + gradientImag * gradientImag);
    maxGradientMagnitude = Math.max(maxGradientMagnitude, gradientMagnitude);
    gradientEnergyProxy += 0.5 * (gradientReal * gradientReal + gradientImag * gradientImag);
  }

  if (nonFiniteCellCount > 0) {
    warnings.push(`${nonFiniteCellCount} non-finite nonlinear-potential cell(s) were treated as zero.`);
  }

  return {
    source: 'nonlinear-potential-field-preparation',
    mediumTick: input.mediumState.tick,
    potentialEnergyTotal,
    potentialEnergyMax,
    potentialEnergyField,
    gradientRealField,
    gradientImagField,
    maxGradientMagnitude,
    gradientEnergyProxy,
    finiteCellCount,
    nonFiniteCellCount,
    mediumChangedFieldCount: countMediumChanges(input.mediumState, input.mediumState),
    warnings,
    metricKind: 'derived',
  };
}
