import type { MotherNewWorkingSet, MotherNewAppDownloadPacket } from './downloadTypes';

export function selectWorkingSetNodeCount(ws: MotherNewWorkingSet): number {
  return ws.items.filter(i => i.type === 'canonical_node').length;
}

export function selectWorkingSetContributionCount(ws: MotherNewWorkingSet): number {
  return ws.items.filter(i => i.type === 'contribution').length;
}

export function selectWorkingSetSourceCount(ws: MotherNewWorkingSet): number {
  return ws.items.filter(i => i.type === 'source').length;
}

export function selectTotalExcluded(ws: MotherNewWorkingSet): number {
  const { quarantined, rejected, archived, lowTrust } = ws.excludedCounts;
  return quarantined + rejected + archived + lowTrust;
}

export function selectHasWarnings(ws: MotherNewWorkingSet): boolean {
  return (
    ws.context.includeQuarantined ||
    ws.context.includeRejected ||
    ws.context.includeLowTrust
  );
}

export function selectPacketNodeCount(pkt: MotherNewAppDownloadPacket): number {
  return pkt.nodes.length;
}

export function selectPacketContributionCount(pkt: MotherNewAppDownloadPacket): number {
  return pkt.supportingContributions.length;
}
