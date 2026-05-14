import type {
  NonlinearPotentialForcePreviewConfig,
  NonlinearPotentialForcePreviewReport,
} from '../types/nonlinearPotentialField.ts';
import type { WaveCapableMediumState } from '../types/waveCapableMedium.ts';
import { deriveNonlinearPotentialFieldPreparation } from './nonlinearPotentialFieldPreparation.ts';

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizePreviewForceScale(value: number | undefined): {
  requestedPreviewForceScale: number;
  effectivePreviewForceScale: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  const requestedPreviewForceScale = finiteNumber(value, 0);
  let effectivePreviewForceScale = requestedPreviewForceScale;

  if (value !== undefined && !Number.isFinite(value)) {
    warnings.push('Non-finite preview force scale was treated as 0.');
  }

  if (effectivePreviewForceScale < 0) {
    warnings.push('Negative preview force scale was clamped to 0.');
    effectivePreviewForceScale = 0;
  }

  return {
    requestedPreviewForceScale,
    effectivePreviewForceScale,
    warnings,
  };
}

export function deriveNonlinearPotentialForcePreview(input: {
  mediumState: WaveCapableMediumState;
  config: NonlinearPotentialForcePreviewConfig;
}): NonlinearPotentialForcePreviewReport {
  const scale = normalizePreviewForceScale(input.config.previewForceScale);
  const preparation = deriveNonlinearPotentialFieldPreparation({
    mediumState: input.mediumState,
    config: input.config,
  });

  const size = input.mediumState.width * input.mediumState.height;
  const previewForceRealField = new Float64Array(size);
  const previewForceImagField = new Float64Array(size);

  let maxPreviewForceMagnitude = 0;
  let previewForceEnergyProxy = 0;

  for (let i = 0; i < size; i++) {
    const forceReal = -scale.effectivePreviewForceScale * preparation.gradientRealField[i];
    const forceImag = -scale.effectivePreviewForceScale * preparation.gradientImagField[i];

    previewForceRealField[i] = forceReal;
    previewForceImagField[i] = forceImag;

    const magnitude = Math.sqrt(forceReal * forceReal + forceImag * forceImag);
    maxPreviewForceMagnitude = Math.max(maxPreviewForceMagnitude, magnitude);
    previewForceEnergyProxy += 0.5 * (forceReal * forceReal + forceImag * forceImag);
  }

  return {
    source: 'nonlinear-potential-force-preview',
    mediumTick: input.mediumState.tick,
    preparation,
    requestedPreviewForceScale: scale.requestedPreviewForceScale,
    effectivePreviewForceScale: scale.effectivePreviewForceScale,
    previewForceRealField,
    previewForceImagField,
    maxPreviewForceMagnitude,
    previewForceEnergyProxy,
    finiteCellCount: preparation.finiteCellCount,
    nonFiniteCellCount: preparation.nonFiniteCellCount,
    mediumChangedFieldCount: 0,
    warnings: [...preparation.warnings, ...scale.warnings],
    metricKind: 'derived',
  };
}
