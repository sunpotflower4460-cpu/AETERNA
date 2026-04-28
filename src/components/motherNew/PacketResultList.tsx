import React from 'react';
import type { MotherNewWorkingSetItem } from '../../domain/motherNew/downloadTypes';

type Props = {
  items: MotherNewWorkingSetItem[];
};

const TYPE_LABELS: Record<string, string> = {
  canonical_node: '🔵 Node',
  contribution: '🟡 Contribution',
  source: '⬜ Source',
};

export default function PacketResultList({ items }: Props) {
  if (items.length === 0) {
    return <p style={{ color: '#6060a0', fontSize: 13 }}>No items in working set.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li key={item.id} style={{
          background: '#16162e',
          border: '1px solid #2d2d4e',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, color: '#c8c8f0', fontSize: 14 }}>
              {i + 1}. {item.label}
            </span>
            <span style={{ fontSize: 11, color: '#6060a0' }}>score: {item.score.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 11, color: '#7070a0', marginTop: 2 }}>
            {TYPE_LABELS[item.type] ?? item.type}
            {item.status && <span style={{ marginLeft: 8 }}>status: {item.status}</span>}
            {item.confidence != null && <span style={{ marginLeft: 8 }}>confidence: {item.confidence.toFixed(2)}</span>}
          </div>
          {item.description && (
            <div style={{ fontSize: 12, color: '#9090b0', marginTop: 4 }}>{item.description}</div>
          )}
          {item.matchedFields.length > 0 && (
            <div style={{ fontSize: 11, color: '#5070a0', marginTop: 4 }}>
              matched: {item.matchedFields.join(', ')}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
