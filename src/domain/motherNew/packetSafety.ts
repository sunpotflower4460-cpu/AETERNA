import type { MotherNewAppContext, MotherNewWorkingSetItemType } from './downloadTypes';
import type {
  MotherNewContribution,
  MotherNewCanonicalNode,
  MotherNewSource,
} from './motherNewBaseTypes';
import {
  loadMotherNewContributions,
  loadMotherNewCanonicalNodes,
  loadMotherNewSources,
} from './motherNewRepository';

export type SafetyCheckResult = {
  include: boolean;
  reason?: string;
};

export function shouldIncludeInDownloadPacket(input: {
  entityType: MotherNewWorkingSetItemType;
  entityId: string;
  context: MotherNewAppContext;
}): SafetyCheckResult {
  const { entityType, entityId, context } = input;

  if (entityType === 'canonical_node') {
    const nodes = loadMotherNewCanonicalNodes();
    const node = nodes.find((n: MotherNewCanonicalNode) => n.id === entityId);
    if (!node) return { include: false, reason: 'Entity not found' };

    if (node.status === 'archived' && !context.includeArchived) {
      return { include: false, reason: 'archived (excluded by default)' };
    }
    if (node.status === 'merged') {
      return { include: false, reason: 'merged into another node' };
    }
    return { include: true };
  }

  if (entityType === 'contribution') {
    if (!context.includeContributions) {
      return { include: false, reason: 'contributions excluded by context' };
    }
    const contributions = loadMotherNewContributions();
    const contrib = contributions.find((c: MotherNewContribution) => c.id === entityId);
    if (!contrib) return { include: false, reason: 'Entity not found' };

    if (contrib.status === 'quarantined' && !context.includeQuarantined) {
      return { include: false, reason: 'quarantined (excluded by default)' };
    }
    if (contrib.status === 'rejected' && !context.includeRejected) {
      return { include: false, reason: 'rejected (excluded by default)' };
    }
    if (contrib.status === 'archived' && !context.includeArchived) {
      return { include: false, reason: 'archived (excluded by default)' };
    }

    // Check source trust level
    if (!context.includeLowTrust) {
      const sources = loadMotherNewSources();
      const source = sources.find((s: MotherNewSource) => s.id === contrib.sourceId);
      if (source && (source.trustLevel === 'low' || source.trustLevel === 'unverified')) {
        return { include: false, reason: `low-trust source "${source.name}" (excluded by default)` };
      }
    }
    return { include: true };
  }

  if (entityType === 'source') {
    if (!context.includeSources) {
      return { include: false, reason: 'sources excluded by context' };
    }
    const sources = loadMotherNewSources();
    const source = sources.find((s: MotherNewSource) => s.id === entityId);
    if (!source) return { include: false, reason: 'Entity not found' };

    if (!context.includeLowTrust && (source.trustLevel === 'low' || source.trustLevel === 'unverified')) {
      return { include: false, reason: 'low-trust source (excluded by default)' };
    }
    return { include: true };
  }

  return { include: false, reason: 'Unknown entity type' };
}
