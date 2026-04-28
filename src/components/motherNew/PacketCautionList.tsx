import React from 'react';

type Props = {
  cautions: string[];
};

export default function PacketCautionList({ cautions }: Props) {
  if (cautions.length === 0) return null;

  return (
    <div style={{
      background: '#2a1a1a',
      border: '1px solid #4a2a2a',
      borderRadius: 6,
      padding: '12px 16px',
      marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, color: '#cc8080', fontWeight: 600, marginBottom: 8 }}>
        ⚠ Cautions
      </div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {cautions.map((c, i) => (
          <li key={i} style={{ fontSize: 12, color: '#c09090', lineHeight: 1.6 }}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
