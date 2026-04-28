import React from 'react';
import type { MotherNewAppContext, MotherNewAppContextType } from '../../domain/motherNew/downloadTypes';
import { APP_CONTEXT_TYPE_LABELS } from '../../domain/motherNew/appContext';

type Props = {
  context: MotherNewAppContext;
  onChange: (ctx: MotherNewAppContext) => void;
};

const inputStyle: React.CSSProperties = {
  background: '#12122a',
  border: '1px solid #2d2d4e',
  borderRadius: 4,
  color: '#e8e8f0',
  padding: '6px 10px',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#9090b0',
  fontSize: 12,
  marginBottom: 4,
  marginTop: 12,
};

const checkRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: '#c0c0d8',
  marginTop: 8,
};

export default function AppContextForm({ context, onChange }: Props) {
  const set = <K extends keyof MotherNewAppContext>(key: K, value: MotherNewAppContext[K]) => {
    onChange({ ...context, [key]: value });
  };

  return (
    <div style={{
      background: '#16162e',
      border: '1px solid #2d2d4e',
      borderRadius: 8,
      padding: '16px 20px',
    }}>
      <h3 style={{ margin: '0 0 12px', color: '#a0a0ff', fontSize: 15 }}>App Context</h3>

      <label style={labelStyle}>App Type *</label>
      <select
        value={context.appType}
        onChange={e => set('appType', e.target.value as MotherNewAppContextType)}
        style={inputStyle}
      >
        {(Object.entries(APP_CONTEXT_TYPE_LABELS) as [MotherNewAppContextType, string][]).map(([val, lbl]) => (
          <option key={val} value={val}>{lbl}</option>
        ))}
      </select>

      <label style={labelStyle}>Query *</label>
      <input
        type="text"
        value={context.query}
        onChange={e => set('query', e.target.value)}
        placeholder="e.g. 焦り, inner pressure, self-doubt..."
        style={inputStyle}
      />

      <label style={labelStyle}>Purpose (optional)</label>
      <input
        type="text"
        value={context.purpose ?? ''}
        onChange={e => set('purpose', e.target.value || undefined)}
        placeholder="e.g. session preparation, self-reflection"
        style={inputStyle}
      />

      <label style={labelStyle}>App ID (optional)</label>
      <input
        type="text"
        value={context.appId ?? ''}
        onChange={e => set('appId', e.target.value || undefined)}
        placeholder="e.g. jibun-app-001"
        style={inputStyle}
      />

      <label style={labelStyle}>Agent ID (optional)</label>
      <input
        type="text"
        value={context.agentId ?? ''}
        onChange={e => set('agentId', e.target.value || undefined)}
        placeholder="e.g. agent-xyz"
        style={inputStyle}
      />

      <label style={labelStyle}>Max Items</label>
      <input
        type="number"
        value={context.maxItems}
        min={1}
        max={50}
        onChange={e => set('maxItems', Math.max(1, Math.min(50, parseInt(e.target.value) || 8)))}
        style={{ ...inputStyle, width: 100 }}
      />

      <div style={{ marginTop: 16, borderTop: '1px solid #2d2d4e', paddingTop: 12 }}>
        <div style={{ fontSize: 12, color: '#7070a0', marginBottom: 8 }}>Include Options</div>
        {[
          ['includeContributions', 'Include Contributions'],
          ['includeSources', 'Include Sources'],
        ].map(([key, label]) => (
          <label key={key} style={checkRowStyle}>
            <input
              type="checkbox"
              checked={context[key as keyof MotherNewAppContext] as boolean}
              onChange={e => set(key as keyof MotherNewAppContext, e.target.checked as MotherNewAppContext[keyof MotherNewAppContext])}
            />
            {label}
          </label>
        ))}
        <div style={{ marginTop: 12, fontSize: 12, color: '#aa5050', marginBottom: 6 }}>
          ⚠ Warning — normally excluded:
        </div>
        {[
          ['includeLowTrust', 'Include Low-Trust Sources'],
          ['includeArchived', 'Include Archived Records'],
          ['includeRejected', 'Include Rejected Records'],
          ['includeQuarantined', 'Include Quarantined Records'],
        ].map(([key, label]) => (
          <label key={key} style={{ ...checkRowStyle, color: '#cc8080' }}>
            <input
              type="checkbox"
              checked={context[key as keyof MotherNewAppContext] as boolean}
              onChange={e => set(key as keyof MotherNewAppContext, e.target.checked as MotherNewAppContext[keyof MotherNewAppContext])}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
