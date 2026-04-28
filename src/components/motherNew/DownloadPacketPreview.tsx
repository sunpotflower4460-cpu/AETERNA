import React from 'react';
import type { MotherNewAppDownloadPacket } from '../../domain/motherNew/downloadTypes';
import PacketCautionList from './PacketCautionList';

type Props = {
  packet: MotherNewAppDownloadPacket;
  onCopyJson: () => void;
};

const sectionStyle: React.CSSProperties = {
  background: '#16162e',
  border: '1px solid #2d2d4e',
  borderRadius: 6,
  padding: '12px 16px',
  marginBottom: 12,
};

export default function DownloadPacketPreview({ packet, onCopyJson }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#a0a0ff', fontSize: 15 }}>Download Packet Preview</h3>
        <button
          onClick={onCopyJson}
          style={{
            background: '#2d4e2d',
            border: '1px solid #407040',
            borderRadius: 4,
            color: '#90e090',
            padding: '4px 10px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Copy Download Packet JSON
        </button>
      </div>

      <PacketCautionList cautions={packet.cautions} />

      <div style={sectionStyle}>
        <div style={{ fontSize: 13, color: '#8080c0', marginBottom: 6, fontWeight: 600 }}>Summary</div>
        <div style={{ fontSize: 13, color: '#b0b0d0', lineHeight: 1.6 }}>
          {packet.readableSummary}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            ['Items', packet.summary.itemCount],
            ['Nodes', packet.summary.canonicalNodeCount],
            ['Contributions', packet.summary.contributionCount],
            ['Sources', packet.summary.sourceCount],
          ].map(([lbl, val]) => (
            <span key={String(lbl)} style={{ fontSize: 12, color: '#7070a0', background: '#12122a', border: '1px solid #2d2d4e', borderRadius: 3, padding: '2px 8px' }}>
              {lbl}: {val}
            </span>
          ))}
        </div>
        {packet.summary.topLabels.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#7070a0' }}>
            Top: {packet.summary.topLabels.join(', ')}
          </div>
        )}
      </div>

      {packet.nodes.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, color: '#8080c0', marginBottom: 8, fontWeight: 600 }}>Canonical Nodes ({packet.nodes.length})</div>
          {packet.nodes.map(node => (
            <div key={node.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #2a2a40' }}>
              <div style={{ fontWeight: 600, color: '#c0c0f0', fontSize: 13 }}>{node.label}</div>
              {node.description && <div style={{ fontSize: 12, color: '#9090b0', marginTop: 2 }}>{node.description}</div>}
              <div style={{ fontSize: 11, color: '#5050a0', marginTop: 4 }}>
                {node.aliases.length > 0 && <span>aliases: {node.aliases.join(', ')} · </span>}
                {node.tags.length > 0 && <span>tags: {node.tags.join(', ')} · </span>}
                score: {node.score.toFixed(2)}
                {node.confidence != null && <span> · confidence: {node.confidence.toFixed(2)}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#606080', marginTop: 2 }}>
                Provenance: {node.provenanceSummary}
              </div>
            </div>
          ))}
        </div>
      )}

      {packet.supportingContributions.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, color: '#8080c0', marginBottom: 8, fontWeight: 600 }}>
            Supporting Contributions ({packet.supportingContributions.length})
          </div>
          {packet.supportingContributions.map(c => (
            <div key={c.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #2a2a40' }}>
              <div style={{ fontWeight: 600, color: '#c0c0e0', fontSize: 13 }}>
                {c.proposedLabel ?? '(no label)'}
              </div>
              {c.contextSummary && <div style={{ fontSize: 12, color: '#9090b0', marginTop: 2 }}>{c.contextSummary}</div>}
              <div style={{ fontSize: 11, color: '#5050a0', marginTop: 2 }}>
                source: {c.sourceName} · status: {c.status} · score: {c.score.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      {packet.sources.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, color: '#8080c0', marginBottom: 8, fontWeight: 600 }}>
            Sources ({packet.sources.length})
          </div>
          {packet.sources.map(s => (
            <div key={s.id} style={{ fontSize: 12, color: '#9090b0', marginBottom: 4 }}>
              <span style={{ color: '#c0c0e0' }}>{s.name}</span>
              <span style={{ color: '#6060a0', marginLeft: 8 }}>{s.type} · trust: {s.trustLevel}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#4040a0', marginTop: 8, textAlign: 'right' }}>
        Packet ID: {packet.id} · {new Date(packet.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
