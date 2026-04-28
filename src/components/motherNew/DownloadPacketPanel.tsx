import React from 'react';

type Props = {
  onBuild: () => void;
  isBuilding: boolean;
  hasWorkingSet: boolean;
};

export default function DownloadPacketPanel({ onBuild, isBuilding, hasWorkingSet }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: '#16162e',
      border: '1px solid #2d2d4e',
      borderRadius: 8,
      marginBottom: 20,
    }}>
      <button
        onClick={onBuild}
        disabled={isBuilding}
        style={{
          background: isBuilding ? '#2d2d4e' : '#3030a0',
          border: '1px solid #4040c0',
          borderRadius: 6,
          color: isBuilding ? '#6060a0' : '#e0e0ff',
          padding: '8px 20px',
          fontSize: 14,
          fontWeight: 600,
          cursor: isBuilding ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {isBuilding ? 'Building...' : '🔨 Build Packet'}
      </button>
      <div style={{ fontSize: 13, color: '#6060a0' }}>
        {hasWorkingSet
          ? 'Working set ready. You can build the download packet.'
          : 'Enter a query and click Build Packet to create a working set and download packet.'}
      </div>
    </div>
  );
}
