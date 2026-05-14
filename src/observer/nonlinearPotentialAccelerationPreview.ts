import type {
  NonlinearPotentialAccelerationPreviewConfig,
  NonlinearPotentialAccelerationPreviewReport,
} from '../types/nonlinearPotentialField.ts';
import type { WaveCapableMediumState } from '../types/waveCapableMedium.ts';
import { deriveNonlinearPotentialForcePreview } from './nonlinearPotentialForcePreview.ts';

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizePreviewMass(value: number | undefined): {
  requestedPreviewMass: number;
  effectivePreviewMass: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  const requestedPreviewMass = finiteNumber(value, 1);
  let effectivePreviewMass = requestedPreviewMass;

  if (value !== undefined && !Number.isFinite(value)) {
    warnings.push('Non-finite preview mass was treated as 1.');
  }

  if (effectivePreviewMass <= 0) {
    warnings.push('Non-positive preview mass was clamped to 1.');
    effectivePreviewMass = 1;
  }

  return {
    requestedPreviewMass,
    effectivePreviewMass,
    warnings,
  };
}

export function deriveNonlinearPotentialAccelerationPreview(input: {
  mediumState: WaveCapableMediumState;
  config: NonlinearPotentialAccelerationPreviewConfig;
}): NonlinearPotentialAccelerationPreviewReport {
  const mass = normalizePreviewMass(input.config.previewMass);
  const forcePreview = deriveNonlinearPotentialForcePreview({
    mediumState: input.mediumState,
    config: input.config,
  });

  const size = input.mediumState.width * input.mediumState.height;
  const previewAccelerationRealField = new Float64Array(size);
  const previewAccelerationImagField = new Float64Array(size);

  let maxPreviewAccelerationMagnitude = 0;
  let previewAccelerationEnergyProxy = 0;

  for (let i = 0; i < size; i++) {
    const accelerationReal = forcePreview.previewForceRealField[i] / mass.effectivePreviewMass;
    const accelerationImag = forcePreview.previewForceImagField[i] / mass.effectivePreviewMass;

    previewAccelerationRealField[i] = accelerationReal;
    previewAccelerationImagField[i] = accelerationImag;

    const magnitude = Math.sqrt(accelerationReal * accelerationReal + accelerationImag * accelerationImag);
    maxPreviewAccelerationMagnitude = Math.max(maxPreviewAccelerationMagnitude, magnitude);
    previewAccelerationEnergyProxy += 0.5 * (accelerationReal * accelerationReal + accelerationImag * accelerationImag);
  }

  return {
    source: 'nonlinear-potential-acceleration-preview',
    mediumTick: input.mediumState.tick,
    forcePreview,
    requestedPreviewMass: mass.requestedPreviewMass,
    effectivePreviewMass: mass.effectivePreviewMass,
    previewAccelerationRealField,
    previewAccelerationImagField,
    maxPreviewAccelerationMagnitude,
    previewAccelerationEnergyProxy,
    finiteCellCount: forcePreview.finiteCellCount,
    nonFiniteCellCount: forcePreview.nonFiniteCellCount,
    mediumChangedFieldCount: 0,
    warnings: [...forcePreview.warnings, ...mass.warnings],
    metricKind: 'derived',
  };
}
