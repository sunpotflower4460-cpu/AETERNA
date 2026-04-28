import type {
  MotherNewWorkingSet,
  MotherNewAppDownloadPacket,
} from './downloadTypes';
import type {
  MotherNewCanonicalNode,
  MotherNewContribution,
  MotherNewSource,
} from './motherNewBaseTypes';
import {
  loadMotherNewCanonicalNodes,
  loadMotherNewContributions,
  loadMotherNewSources,
} from './motherNewRepository';

let packetCounter = 0;

const DEFAULT_CAUTIONS: string[] = [
  "This packet is read-only.",
  "Do not treat repository records as absolute truth.",
  "Quarantined and rejected records are excluded by default.",
  "Do not write this packet into Old Crystal or New Crystal automatically.",
  "This packet represents a point-in-time snapshot and may become outdated.",
  "Source trust levels are approximate and should be interpreted with care.",
];

export function buildMotherNewAppDownloadPacket(
  workingSet: MotherNewWorkingSet
): MotherNewAppDownloadPacket {
  const { context, items } = workingSet;

  const nodes = loadMotherNewCanonicalNodes();
  const contributions = loadMotherNewContributions();
  const sources = loadMotherNewSources();

  const nodeItems = items.filter(i => i.type === 'canonical_node');
  const contribItems = items.filter(i => i.type === 'contribution');
  const sourceItems = items.filter(i => i.type === 'source');

  // Collect all referenced source IDs
  const referencedSourceIds = new Set<string>();
  for (const item of items) {
    for (const sid of item.sourceIds) referencedSourceIds.add(sid);
  }

  // Build nodes section
  const packetNodes = nodeItems.map(item => {
    const node = nodes.find((n: MotherNewCanonicalNode) => n.id === item.id);
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      aliases: node?.aliases ?? [],
      tags: node?.tags ?? [],
      confidence: item.confidence,
      score: item.score,
      provenanceSummary: node?.provenanceSummary ?? 'No provenance information available.',
    };
  });

  // Build supporting contributions section
  const packetContributions = contribItems.map(item => {
    const contrib = contributions.find((c: MotherNewContribution) => c.id === item.id);
    const src = sources.find((s: MotherNewSource) => s.id === contrib?.sourceId);
    return {
      id: item.id,
      proposedLabel: contrib?.proposedLabel,
      contextSummary: contrib?.contextSummary,
      evidenceSummary: contrib?.evidenceSummary,
      sourceName: src?.name ?? 'Unknown source',
      status: contrib?.status ?? 'unknown',
      score: item.score,
    };
  });

  // Build sources section (referenced sources + source items)
  const allSourceIds = new Set([
    ...referencedSourceIds,
    ...sourceItems.map(i => i.id),
  ]);
  const packetSources = Array.from(allSourceIds)
    .map(sid => sources.find((s: MotherNewSource) => s.id === sid))
    .filter((s): s is MotherNewSource => s != null)
    .map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      trustLevel: s.trustLevel,
    }));

  // Build cautions
  const cautions = [...DEFAULT_CAUTIONS];
  if (context.includeQuarantined) {
    cautions.push("WARNING: This packet includes quarantined records as explicitly requested.");
  }
  if (context.includeRejected) {
    cautions.push("WARNING: This packet includes rejected records as explicitly requested.");
  }
  if (context.includeLowTrust) {
    cautions.push("WARNING: This packet includes low-trust source records as explicitly requested.");
  }
  if (context.includeArchived) {
    cautions.push("NOTE: This packet includes archived records as explicitly requested.");
  }
  if (workingSet.excludedCounts.quarantined > 0) {
    cautions.push(`${workingSet.excludedCounts.quarantined} quarantined record(s) were excluded.`);
  }
  if (workingSet.excludedCounts.rejected > 0) {
    cautions.push(`${workingSet.excludedCounts.rejected} rejected record(s) were excluded.`);
  }

  // Top labels
  const topLabels = items.slice(0, 5).map(i => i.label);

  // Readable summary
  const queryDisplay = context.query || '(no query)';
  const avgTrust = packetSources.length > 0
    ? summarizeTrust(packetSources.map(s => s.trustLevel))
    : 'unknown';

  const readableSummary =
    `This packet contains ${items.length} Mother New record(s) related to "${queryDisplay}", ` +
    `including ${nodeItems.length} canonical node(s) and ${contribItems.length} supporting contribution(s). ` +
    `${packetSources.length > 0 ? `Sources are ${avgTrust} trust overall.` : 'No sources referenced.'}` +
    (workingSet.excludedCounts.quarantined + workingSet.excludedCounts.rejected > 0
      ? ` Some records were excluded due to safety filters.`
      : '');

  return {
    id: `pkt-${Date.now()}-${++packetCounter}`,
    createdAt: new Date().toISOString(),
    source: 'mother_new',
    appContext: {
      appType: context.appType,
      appId: context.appId,
      agentId: context.agentId,
      query: context.query,
      purpose: context.purpose,
    },
    summary: {
      itemCount: items.length,
      canonicalNodeCount: nodeItems.length,
      contributionCount: contribItems.length,
      sourceCount: packetSources.length,
      topLabels,
    },
    nodes: packetNodes,
    supportingContributions: packetContributions,
    sources: packetSources,
    cautions,
    readableSummary,
  };
}

function summarizeTrust(levels: string[]): string {
  const counts = levels.reduce<Record<string, number>>((acc, l) => {
    acc[l] = (acc[l] ?? 0) + 1;
    return acc;
  }, {});
  if (counts['high'] && counts['high'] > levels.length / 2) return 'high';
  if (counts['medium'] && counts['medium'] > levels.length / 2) return 'medium';
  if (counts['low'] || counts['unverified']) return 'mixed/low';
  return 'medium';
}
