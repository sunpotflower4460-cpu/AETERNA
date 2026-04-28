import type {
  MotherNewSource,
  MotherNewContribution,
  MotherNewCanonicalNode,
  MotherNewIndexState,
} from './motherNewBaseTypes';

const KEYS = {
  sources: 'node-mother:mother-new:sources',
  contributions: 'node-mother:mother-new:contributions',
  canonicalNodes: 'node-mother:mother-new:canonical-nodes',
  index: 'node-mother:mother-new:index',
} as const;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadMotherNewSources(): MotherNewSource[] {
  return loadJson<MotherNewSource[]>(KEYS.sources, []);
}

export function loadMotherNewContributions(): MotherNewContribution[] {
  return loadJson<MotherNewContribution[]>(KEYS.contributions, []);
}

export function loadMotherNewCanonicalNodes(): MotherNewCanonicalNode[] {
  return loadJson<MotherNewCanonicalNode[]>(KEYS.canonicalNodes, []);
}

export function loadMotherNewIndexState(): MotherNewIndexState {
  return loadJson<MotherNewIndexState>(KEYS.index, { entries: [], updatedAt: new Date().toISOString() });
}
