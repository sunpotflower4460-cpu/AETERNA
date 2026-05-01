import { PHI } from '../constants/aeternaConstants.js';

export type TorusMetricMode = 'flat' | 'curved';

export interface TorusMetricRuntimeConfig {
  metricMode: TorusMetricMode;
  majorRadius: number;
  minorRadius: number;
  curvatureInfluence: number;
  areaNormalizationEnabled: boolean;
}

export const defaultTorusMetricConfig: TorusMetricRuntimeConfig = {
  metricMode: 'flat',
  majorRadius: PHI,
  minorRadius: 1.0,
  curvatureInfluence: 0,
  areaNormalizationEnabled: false,
};

export const curvedTorusMetricPreviewConfig: TorusMetricRuntimeConfig = {
  metricMode: 'curved',
  majorRadius: 2.0,
  minorRadius: 0.7,
  curvatureInfluence: 0.05,
  areaNormalizationEnabled: true,
};

export function normalizeTorusMetricConfig(
  config?: Partial<TorusMetricRuntimeConfig> | null,
): TorusMetricRuntimeConfig {
  return {
    ...defaultTorusMetricConfig,
    ...config,
  };
}
