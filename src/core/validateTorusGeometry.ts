import type { TorusGeometry, TorusGeometryConfig } from './torusGeometry.ts';

const UNIT_VECTOR_TOLERANCE = 1e-5;
const MIN_RADIUS_DELTA = 1e-3;

function vectorMagnitude([x, y, z]: [number, number, number]): number {
  return Math.hypot(x, y, z);
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Torus geometry validation failed: ${label} must be finite.`);
  }
}

export function sanitizeTorusGeometryConfig(config: TorusGeometryConfig): {
  config: TorusGeometryConfig;
  warnings: string[];
} {
  if (!Number.isFinite(config.segments) || config.segments <= 2) {
    throw new Error('Torus geometry validation failed: segments must be greater than 2.');
  }
  if (!Number.isFinite(config.majorRadius) || config.majorRadius <= 0) {
    throw new Error('Torus geometry validation failed: majorRadius must be greater than 0.');
  }
  if (!Number.isFinite(config.minorRadius) || config.minorRadius <= 0) {
    throw new Error('Torus geometry validation failed: minorRadius must be greater than 0.');
  }

  const warnings: string[] = [];
  let majorRadius = config.majorRadius;
  if (majorRadius <= config.minorRadius) {
    majorRadius = config.minorRadius + Math.max(config.minorRadius * 0.1, MIN_RADIUS_DELTA);
    warnings.push(
      `majorRadius (${config.majorRadius}) must be greater than minorRadius (${config.minorRadius}); using ${majorRadius.toFixed(6)} instead.`,
    );
  }

  return {
    config: {
      segments: Math.floor(config.segments),
      majorRadius,
      minorRadius: config.minorRadius,
    },
    warnings,
  };
}

export function validateTorusGeometry(geometry: TorusGeometry): void {
  const { config, cells } = geometry;

  if (cells.length !== config.segments * config.segments) {
    throw new Error('Torus geometry validation failed: unexpected cell count.');
  }

  assertFiniteNumber(geometry.minAreaElement, 'minAreaElement');
  assertFiniteNumber(geometry.maxAreaElement, 'maxAreaElement');
  assertFiniteNumber(geometry.minGaussianCurvature, 'minGaussianCurvature');
  assertFiniteNumber(geometry.maxGaussianCurvature, 'maxGaussianCurvature');
  assertFiniteNumber(geometry.minMeanCurvature, 'minMeanCurvature');
  assertFiniteNumber(geometry.maxMeanCurvature, 'maxMeanCurvature');

  for (const cell of cells) {
    assertFiniteNumber(cell.areaElement, `cell[${cell.index}].areaElement`);
    assertFiniteNumber(cell.gaussianCurvature, `cell[${cell.index}].gaussianCurvature`);
    assertFiniteNumber(cell.meanCurvature, `cell[${cell.index}].meanCurvature`);

    const vectorLabels = [
      ['normal', cell.normal],
      ['majorTangent', cell.majorTangent],
      ['minorTangent', cell.minorTangent],
    ] as const;

    for (const [label, vector] of vectorLabels) {
      const magnitude = vectorMagnitude(vector);
      if (Math.abs(magnitude - 1) > UNIT_VECTOR_TOLERANCE) {
        throw new Error(
          `Torus geometry validation failed: cell[${cell.index}].${label} must be normalized.`,
        );
      }
    }
  }
}
