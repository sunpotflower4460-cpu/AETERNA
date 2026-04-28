import React from 'react';
import type { MotherNewPacketHistoryItem } from '../../domain/motherNew/downloadTypes';
import { APP_CONTEXT_TYPE_LABELS } from '../../domain/motherNew/appContext';

type Props = {
  items: MotherNewPacketHistoryItem[];
  onView: (item: MotherNewPacketHistoryItem) => void;
  onCopy: (item: MotherNewPacketHistoryItem) => void;
  onClear: () => void;
};

export default function PacketHistoryList({ items, onView, onCopy, onClear }: Props) {
  if (items.length === 0) {
    return <p style={{ color: '#4040a0', fontSize: 13 }}>No packet history yet.</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={onClear}
          style={{
            background: 'transparent',
            border: '1px solid #4a2a2a',
            borderRadius: 4,
            color: '#cc8080',
            padding: '3px 10px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Clear History
        </button>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{
            background: '#16162e',
            border: '1px solid #2d2d4e',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#c0c0e0', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{item.query || '(no query)'}"
              </div>
              <div style={{ fontSize: 11, color: '#6060a0', marginTop: 2 }}>
                {APP_CONTEXT_TYPE_LABELS[item.appType] ?? item.appType} ·{' '}
                {item.itemCount} items ·{' '}
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => onView(item)}
                style={{
                  background: '#2d2d4e',
                  border: '1px solid #4040a0',
                  borderRadius: 4,
                  color: '#9090e0',
                  padding: '3px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                View
              </button>
              <button
                onClick={() => onCopy(item)}
                style={{
                  background: '#2d4e2d',
                  border: '1px solid #407040',
                  borderRadius: 4,
                  color: '#90e090',
                  padding: '3px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
