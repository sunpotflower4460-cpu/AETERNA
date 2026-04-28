import type { MotherNewAppContext, MotherNewWorkingSet, MotherNewWorkingSetItem } from './downloadTypes';
import type {
  MotherNewCanonicalNode,
  MotherNewContribution,
  MotherNewSource,
  MotherNewIndexEntityType,
} from './motherNewBaseTypes';
import { searchMotherNewIndex } from './indexSearch';
import { shouldIncludeInDownloadPacket } from './packetSafety';
import {
  loadMotherNewCanonicalNodes,
  loadMotherNewContributions,
  loadMotherNewSources,
} from './motherNewRepository';

let wsCounter = 0;

export function buildMotherNewWorkingSet(context: MotherNewAppContext): MotherNewWorkingSet {
  const entityTypes: MotherNewIndexEntityType[] = context.desiredEntityTypes ?? [
    'canonical_node',
    ...(context.includeContributions ? ['contribution' as MotherNewIndexEntityType] : []),
    ...(context.includeSources ? ['source' as MotherNewIndexEntityType] : []),
  ];

  const searchResults = searchMotherNewIndex(context.query, {
    entityTypes,
    maxResults: context.maxItems * 4, // fetch more, then filter
  });

  const nodes = loadMotherNewCanonicalNodes();
  const contributions = loadMotherNewContributions();
  const sources = loadMotherNewSources();

  const excludedCounts = { quarantined: 0, rejected: 0, archived: 0, lowTrust: 0 };
  const items: MotherNewWorkingSetItem[] = [];

  for (const result of searchResults) {
    if (items.length >= context.maxItems) break;

    const { entry } = result;
    const safety = shouldIncludeInDownloadPacket({
      entityType: entry.entityType as 'canonical_node' | 'contribution' | 'source',
      entityId: entry.entityId,
      context,
    });

    if (!safety.include) {
      const reason = safety.reason ?? '';
      if (reason.includes('quarantine')) excludedCounts.quarantined++;
      else if (reason.includes('rejected')) excludedCounts.rejected++;
      else if (reason.includes('archived')) excludedCounts.archived++;
      else if (reason.includes('low-trust') || reason.includes('low_trust')) excludedCounts.lowTrust++;
      continue;
    }

    let item: MotherNewWorkingSetItem | null = null;

    if (entry.entityType === 'canonical_node') {
      const node = nodes.find((n: MotherNewCanonicalNode) => n.id === entry.entityId);
      if (node) {
        item = {
          type: 'canonical_node',
          id: node.id,
          label: node.label,
          description: node.description,
          score: result.score,
          matchedFields: result.matchedFields,
          reasons: result.reasons,
          sourceIds: node.sourceIds,
          contributionIds: node.contributionIds,
          confidence: node.confidence,
          status: node.status,
        };
      }
    } else if (entry.entityType === 'contribution') {
      const contrib = contributions.find((c: MotherNewContribution) => c.id === entry.entityId);
      if (contrib) {
        const src = sources.find((s: MotherNewSource) => s.id === contrib.sourceId);
        item = {
          type: 'contribution',
          id: contrib.id,
          label: contrib.proposedLabel ?? `Contribution from ${src?.name ?? 'unknown'}`,
          description: contrib.contextSummary,
          score: result.score,
          matchedFields: result.matchedFields,
          reasons: result.reasons,
          sourceIds: [contrib.sourceId],
          contributionIds: [],
          confidence: contrib.confidence,
          trustLevel: src?.trustLevel,
          status: contrib.status,
        };
      }
    } else if (entry.entityType === 'source') {
      const src = sources.find((s: MotherNewSource) => s.id === entry.entityId);
      if (src) {
        item = {
          type: 'source',
          id: src.id,
          label: src.name,
          description: src.description,
          score: result.score,
          matchedFields: result.matchedFields,
          reasons: result.reasons,
          sourceIds: [src.id],
          contributionIds: [],
          trustLevel: src.trustLevel,
          status: src.trustLevel,
        };
      }
    }

    if (item) items.push(item);
  }

  return {
    id: `ws-${Date.now()}-${++wsCounter}`,
    context,
    items,
    excludedCounts,
    createdAt: new Date().toISOString(),
  };
}
