/**
 * observationRoute.ts
 * AETERNA-NATURAL v2.5 — Observation Route Types
 */

export type ObservationRouteStepId =
  | 'intro'
  | 'startSafeObservation'
  | 'lookAtField'
  | 'selectCell'
  | 'inspectCell'
  | 'openLens'
  | 'useReplay'
  | 'checkRelatedSignals'
  | 'askGuide'
  | 'exportResult';

export interface ObservationRouteStep {
  id: ObservationRouteStepId;
  titleJa: string;
  shortDescriptionJa: string;
  actionLabelJa: string;
  targetPanel?:
    | 'landing'
    | 'field'
    | 'inspector'
    | 'lens'
    | 'replay'
    | 'trace'
    | 'guide'
    | 'export';
  completionCondition:
    | 'manual'
    | 'appStarted'
    | 'safeObservationStarted'
    | 'cellSelected'
    | 'metricSelected'
    | 'lensOpened'
    | 'replayOpened'
    | 'traceOpened'
    | 'guideAsked'
    | 'exportOpened';
  beginnerVisible: boolean;
  cautionJa?: string;
}
