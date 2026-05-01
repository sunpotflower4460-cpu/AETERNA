/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TorusMetricMode } from '../config/torusMetricConfig.ts';
import {
  defaultTorusMetricConfig,
  normalizeTorusMetricConfig,
} from '../config/torusMetricConfig.ts';
import {
  sanitizeTorusGeometryConfig,
  validateTorusGeometry,
} from './validateTorusGeometry.ts';
import {
  generateNetworkGeometry as generateLegacyNetworkGeometry,
  updateNetworkRadius as updateLegacyNetworkRadius,
  updateRenderBuffers,
} from './networkGeometry.ts';

export interface TorusGeometryConfig {
  segments: number;
  majorRadius: number;
  minorRadius: number;
}

export interface TorusGeometryCell {
  index: number;
  i: number;
  j: number;
  majorAngle: number;
  minorAngle: number;
  position3D: [number, number, number];
  x: number;
  y: number;
  z: number;
  areaElement: number;
  gaussianCurvature: number;
  meanCurvature: number;
  normal: [number, number, number];
  majorTangent: [number, number, number];
  minorTangent: [number, number, number];
  innerOuterBias: number;
}

export interface TorusGeometry {
  config: TorusGeometryConfig;
  cells: TorusGeometryCell[];
  minAreaElement: number;
  maxAreaElement: number;
  minGaussianCurvature: number;
  maxGaussianCurvature: number;
  minMeanCurvature: number;
  maxMeanCurvature: number;
  validationWarnings?: string[];
}

type Vec3 = [number, number, number];

const TWO_PI = Math.PI * 2;

function normalizeVector([x, y, z]: Vec3): Vec3 {
  const magnitude = Math.hypot(x, y, z);
  if (!Number.isFinite(magnitude) || magnitude <= Number.EPSILON) {
    return [0, 0, 0];
  }

  return [x / magnitude, y / magnitude, z / magnitude];
}

export function createTorusGeometry(config: TorusGeometryConfig): TorusGeometry {
  const { config: safeConfig, warnings } = sanitizeTorusGeometryConfig(config);
  const { segments, majorRadius: R, minorRadius: r } = safeConfig;
  const cells: TorusGeometryCell[] = [];

  let minAreaElement = Number.POSITIVE_INFINITY;
  let maxAreaElement = Number.NEGATIVE_INFINITY;
  let minGaussianCurvature = Number.POSITIVE_INFINITY;
  let maxGaussianCurvature = Number.NEGATIVE_INFINITY;
  let minMeanCurvature = Number.POSITIVE_INFINITY;
  let maxMeanCurvature = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const majorAngle = TWO_PI * i / segments;
      const minorAngle = TWO_PI * j / segments;
      const cosU = Math.cos(majorAngle);
      const sinU = Math.sin(majorAngle);
      const cosV = Math.cos(minorAngle);
      const sinV = Math.sin(minorAngle);
      const ringRadius = R + r * cosV;
      const x = ringRadius * cosU;
      const y = ringRadius * sinU;
      const z = r * sinV;
      const areaElement = r * ringRadius;
      const gaussianCurvature = cosV / (r * ringRadius);
      const meanCurvature = (R + 2 * r * cosV) / (2 * r * ringRadius);
      const normal = normalizeVector([cosU * cosV, sinU * cosV, sinV]);
      const majorTangent = normalizeVector([-sinU, cosU, 0]);
      const minorTangent = normalizeVector([-cosU * sinV, -sinU * sinV, cosV]);

      minAreaElement = Math.min(minAreaElement, areaElement);
      maxAreaElement = Math.max(maxAreaElement, areaElement);
      minGaussianCurvature = Math.min(minGaussianCurvature, gaussianCurvature);
      maxGaussianCurvature = Math.max(maxGaussianCurvature, gaussianCurvature);
      minMeanCurvature = Math.min(minMeanCurvature, meanCurvature);
      maxMeanCurvature = Math.max(maxMeanCurvature, meanCurvature);

      cells.push({
        index: i * segments + j,
        i,
        j,
        majorAngle,
        minorAngle,
        position3D: [x, y, z],
        x,
        y,
        z,
        areaElement,
        gaussianCurvature,
        meanCurvature,
        normal,
        majorTangent,
        minorTangent,
        innerOuterBias: cosV,
      });
    }
  }

  const geometry: TorusGeometry = {
    config: safeConfig,
    cells,
    minAreaElement,
    maxAreaElement,
    minGaussianCurvature,
    maxGaussianCurvature,
    minMeanCurvature,
    maxMeanCurvature,
    validationWarnings: warnings.length > 0 ? warnings : undefined,
  };

  validateTorusGeometry(geometry);
  return geometry;
}

export function createFlatTorusMetricGeometry(curvedGeometry: TorusGeometry): TorusGeometry {
  const cells = curvedGeometry.cells.map((cell) => ({
    ...cell,
    areaElement: 1,
    gaussianCurvature: 0,
    meanCurvature: 0,
    innerOuterBias: 0,
  }));

  const geometry: TorusGeometry = {
    config: { ...curvedGeometry.config },
    cells,
    minAreaElement: 1,
    maxAreaElement: 1,
    minGaussianCurvature: 0,
    maxGaussianCurvature: 0,
    minMeanCurvature: 0,
    maxMeanCurvature: 0,
    validationWarnings: curvedGeometry.validationWarnings,
  };

  validateTorusGeometry(geometry);
  return geometry;
}

export function selectTorusMetricGeometry(
  curvedGeometry: TorusGeometry,
  metricMode: TorusMetricMode,
): TorusGeometry {
  return metricMode === 'curved'
    ? curvedGeometry
    : createFlatTorusMetricGeometry(curvedGeometry);
}

function assignTorusMetricGeometry(network: any): void {
  const torusMetricConfig = normalizeTorusMetricConfig({
    ...defaultTorusMetricConfig,
    ...network.torusMetricConfig,
    metricMode: network.torusMetricMode ?? network.torusMetricConfig?.metricMode ?? defaultTorusMetricConfig.metricMode,
    majorRadius: Number.isFinite(network.torusMetricConfig?.majorRadius)
      ? network.torusMetricConfig.majorRadius
      : network.R,
    minorRadius: Number.isFinite(network.torusMetricConfig?.minorRadius)
      ? network.torusMetricConfig.minorRadius
      : network.r,
  });
  const curvedTorusGeometry = createTorusGeometry({
    segments: network.segments,
    majorRadius: torusMetricConfig.majorRadius,
    minorRadius: torusMetricConfig.minorRadius,
  });

  network.torusMetricConfig = torusMetricConfig;
  network.torusMetricMode = torusMetricConfig.metricMode;
  network.majorRadius = torusMetricConfig.majorRadius;
  network.minorRadius = torusMetricConfig.minorRadius;
  network.curvedTorusGeometry = curvedTorusGeometry;
  network.torusGeometry = selectTorusMetricGeometry(curvedTorusGeometry, torusMetricConfig.metricMode);
}

export function generateNetworkGeometry(network: any) {
  generateLegacyNetworkGeometry(network);
  assignTorusMetricGeometry(network);
}

export function updateNetworkRadius(network: any, newR: number) {
  updateLegacyNetworkRadius(network, newR);
  network.torusMetricConfig = {
    ...network.torusMetricConfig,
    minorRadius: newR,
  };
  assignTorusMetricGeometry(network);
}

export function setNetworkTorusMetricMode(network: any, metricMode: TorusMetricMode) {
  network.torusMetricMode = metricMode;
  assignTorusMetricGeometry(network);
  return network.torusMetricConfig;
}
