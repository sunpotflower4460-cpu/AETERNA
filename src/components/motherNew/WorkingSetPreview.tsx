import React from 'react';
import type { MotherNewWorkingSet } from '../../domain/motherNew/downloadTypes';
import PacketResultList from './PacketResultList';
import {
  selectWorkingSetNodeCount,
  selectWorkingSetContributionCount,
  selectTotalExcluded,
} from '../../domain/motherNew/packetSelectors';

type Props = {
  workingSet: MotherNewWorkingSet;
  onCopyJson: () => void;
};

export default function WorkingSetPreview({ workingSet, onCopyJson }: Props) {
  const nodeCount = selectWorkingSetNodeCount(workingSet);
  const contribCount = selectWorkingSetContributionCount(workingSet);
  const totalExcluded = selectTotalExcluded(workingSet);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#a0a0ff', fontSize: 15 }}>Working Set Preview</h3>
        <button
          onClick={onCopyJson}
          style={{
            background: '#2d2d4e',
            border: '1px solid #4040a0',
            borderRadius: 4,
            color: '#9090e0',
            padding: '4px 10px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Copy Working Set JSON
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          ['Total Items', workingSet.items.length],
          ['Nodes', nodeCount],
          ['Contributions', contribCount],
          ['Excluded', totalExcluded],
        ].map(([label, val]) => (
          <div key={String(label)} style={{
            background: '#12122a',
            border: '1px solid #2d2d4e',
            borderRadius: 4,
            padding: '6px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, color: '#a0a0ff', fontWeight: 600 }}>{val}</div>
            <div style={{ fontSize: 11, color: '#6060a0' }}>{label}</div>
          </div>
        ))}
      </div>

      {totalExcluded > 0 && (
        <div style={{ fontSize: 12, color: '#cc8060', background: '#2a1a10', border: '1px solid #3a2a10', borderRadius: 4, padding: '6px 12px', marginBottom: 12 }}>
          Excluded: {workingSet.excludedCounts.quarantined} quarantined,{' '}
          {workingSet.excludedCounts.rejected} rejected,{' '}
          {workingSet.excludedCounts.archived} archived,{' '}
          {workingSet.excludedCounts.lowTrust} low-trust
        </div>
      )}

      <PacketResultList items={workingSet.items} />
    </div>
  );
}
