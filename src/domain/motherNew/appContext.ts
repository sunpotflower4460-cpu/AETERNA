import type { MotherNewAppContext, MotherNewAppContextType } from './downloadTypes';

let contextCounter = 0;

export function createDefaultAppContext(): MotherNewAppContext {
  return {
    id: `ctx-${Date.now()}-${++contextCounter}`,
    appType: 'manual_test',
    query: '',
    maxItems: 8,
    includeContributions: true,
    includeSources: true,
    includeLowTrust: false,
    includeArchived: false,
    includeRejected: false,
    includeQuarantined: false,
    createdAt: new Date().toISOString(),
  };
}

export const APP_CONTEXT_TYPE_LABELS: Record<MotherNewAppContextType, string> = {
  jibunkaigi: 'じぶん会議 (Jibunkaigi)',
  node_ai_z: 'Node-AI-Z',
  self_research_lab: 'Self Research Lab',
  music_app: 'Music App',
  observation_app: 'Observation App',
  generic_ai_app: 'Generic AI App',
  manual_test: 'Manual Test',
};
