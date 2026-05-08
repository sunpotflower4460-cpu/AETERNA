import type {
  FlowAttributionItem,
  FlowAttributionReport,
  ObservationTimelineFrame,
} from '../types/observation.ts';

const EPSILON = 1e-9;

function finite(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function classifyDirection(delta: number): FlowAttributionItem['direction'] {
  if (delta > EPSILON) return 'increase';
  if (delta < -EPSILON) return 'decrease';
  return 'unchanged';
}

function makeItem(input: Omit<FlowAttributionItem, 'metricKind'>): FlowAttributionItem {
  return { ...input, metricKind: 'derived' };
}

function pushKnownItem(
  items: FlowAttributionItem[],
  tick: number,
  fieldName: string,
  kind: FlowAttributionItem['kind'],
  direction: FlowAttributionItem['direction'],
  amount: number,
  reason: string,
): void {
  if (Math.abs(amount) <= EPSILON) return;
  items.push(makeItem({
    tick,
    fieldName,
    kind,
    direction,
    amount: Math.abs(amount),
    reason,
    confidence: 'high',
  }));
}

function pushUnknownItem(
  items: FlowAttributionItem[],
  tick: number,
  fieldName: string,
  delta: number,
  reason: string,
): void {
  if (Math.abs(delta) <= EPSILON) return;
  items.push(makeItem({
    tick,
    fieldName,
    kind: 'unknownChange',
    direction: classifyDirection(delta),
    amount: Math.abs(delta),
    reason,
    confidence: 'low',
  }));
}

export function deriveFlowAttribution(
  previous: ObservationTimelineFrame | null | undefined,
  current: ObservationTimelineFrame,
): FlowAttributionReport {
  const items: FlowAttributionItem[] = [];
  const warnings: string[] = [];

  if (!previous) {
    return {
      tick: current.tick,
      items: [makeItem({
        tick: current.tick,
        fieldName: 'ObservationTimeline',
        kind: 'storageCarry',
        direction: 'unchanged',
        amount: 0,
        reason: 'No previous frame is available, so this frame is treated as the observation baseline.',
        confidence: 'medium',
      })],
      unknownChangeCount: 0,
      summaryLine: `tick ${current.tick}: baseline frame recorded`,
      warnings,
      metricKind: 'derived',
    };
  }

  const externalDelta = finite(current.externalDriveTotal) - finite(previous.externalDriveTotal);
  const mediumDelta = finite(current.mediumStorageTotal) - finite(previous.mediumStorageTotal);
  const dissipationDelta = finite(current.dissipationTotal) - finite(previous.dissipationTotal);
  const residueDelta = finite(current.residueTotal) - finite(previous.residueTotal);
  const outflowDelta = finite(current.outflowTotal) - finite(previous.outflowTotal);
  const membraneDelta = finite(current.membraneExchangeTotal) - finite(previous.membraneExchangeTotal);
  const transferEnergy = finite(current.transferEnergy);

  if (transferEnergy > EPSILON && current.pairLedgerStatus === 'closed') {
    pushKnownItem(
      items,
      current.tick,
      'ExternalDriveField',
      'transfer',
      'decrease',
      transferEnergy,
      'ExternalDriveField decreased because transfer source out matched SpatialWorldMedium destination input.',
    );
    pushKnownItem(
      items,
      current.tick,
      'SpatialWorldMedium',
      'transfer',
      'increase',
      transferEnergy,
      'SpatialWorldMedium increased because transfer destination input matched ExternalDriveField source out.',
    );
  } else if (transferEnergy > EPSILON) {
    warnings.push('Transfer energy was present but pair ledger was not closed; transfer attribution confidence is low.');
    pushUnknownItem(
      items,
      current.tick,
      'Transfer',
      transferEnergy,
      'Transfer energy was present without a closed pair ledger.',
    );
  }

  pushKnownItem(items, current.tick, 'Dissipation', 'dissipation', 'increase', dissipationDelta, 'Dissipation field increased because named dissipation storage accumulated.');
  pushKnownItem(items, current.tick, 'Residue', 'residue', 'increase', residueDelta, 'Residue field increased because named residue storage accumulated.');
  pushKnownItem(items, current.tick, 'Outflow', 'outflow', 'increase', outflowDelta, 'Outflow field increased because measured outflow accumulated.');
  pushKnownItem(items, current.tick, 'MembraneExchange', 'boundaryExchange', 'increase', membraneDelta, 'MembraneExchange field increased because boundary-side exchange accumulated.');

  const namedMediumDestinations =
    Math.max(0, dissipationDelta) +
    Math.max(0, residueDelta) +
    Math.max(0, outflowDelta) +
    Math.max(0, membraneDelta);

  if (namedMediumDestinations > EPSILON) {
    pushKnownItem(
      items,
      current.tick,
      'SpatialWorldMedium',
      'dissipation',
      'decrease',
      Math.max(0, dissipationDelta),
      'SpatialWorldMedium decreased into named dissipation destination.',
    );
    pushKnownItem(
      items,
      current.tick,
      'SpatialWorldMedium',
      'residue',
      'decrease',
      Math.max(0, residueDelta),
      'SpatialWorldMedium decreased into named residue destination.',
    );
    pushKnownItem(
      items,
      current.tick,
      'SpatialWorldMedium',
      'outflow',
      'decrease',
      Math.max(0, outflowDelta),
      'SpatialWorldMedium decreased into named outflow destination.',
    );
    pushKnownItem(
      items,
      current.tick,
      'SpatialWorldMedium',
      'boundaryExchange',
      'decrease',
      Math.max(0, membraneDelta),
      'SpatialWorldMedium decreased into named boundary exchange destination.',
    );
  }

  const expectedExternalDelta = current.pairLedgerStatus === 'closed' ? -transferEnergy : 0;
  const externalUnexplained = externalDelta - expectedExternalDelta;
  pushUnknownItem(
    items,
    current.tick,
    'ExternalDriveField',
    externalUnexplained,
    'ExternalDriveField changed by an amount not explained by closed transfer attribution.',
  );

  const expectedMediumDelta = (current.pairLedgerStatus === 'closed' ? transferEnergy : 0) - namedMediumDestinations;
  const mediumUnexplained = mediumDelta - expectedMediumDelta;
  pushUnknownItem(
    items,
    current.tick,
    'SpatialWorldMedium',
    mediumUnexplained,
    'SpatialWorldMedium changed by an amount not explained by transfer or named destination fields.',
  );

  const unknownChangeCount = items.filter((item) => item.kind === 'unknownChange').length;
  if (unknownChangeCount > 0) {
    warnings.push(`${unknownChangeCount} unexplained field change(s) detected.`);
  }

  return {
    tick: current.tick,
    items,
    unknownChangeCount,
    summaryLine: `tick ${current.tick}: ${items.length} attribution item(s), unknown=${unknownChangeCount}`,
    warnings,
    metricKind: 'derived',
  };
}
