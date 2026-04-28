import React, { useState, useCallback } from 'react';
import type { MotherNewAppContext, MotherNewWorkingSet, MotherNewAppDownloadPacket, MotherNewPacketHistoryItem } from '../domain/motherNew/downloadTypes';
import { createDefaultAppContext } from '../domain/motherNew/appContext';
import { buildMotherNewWorkingSet } from '../domain/motherNew/workingSetBuilder';
import { buildMotherNewAppDownloadPacket } from '../domain/motherNew/packetBuilder';
import { loadPacketHistory, savePacketToHistory, clearPacketHistory } from '../domain/motherNew/packetHistory';
import DownloadPolicyCard from '../components/motherNew/DownloadPolicyCard';
import AppContextForm from '../components/motherNew/AppContextForm';
import DownloadPacketPanel from '../components/motherNew/DownloadPacketPanel';
import WorkingSetPreview from '../components/motherNew/WorkingSetPreview';
import DownloadPacketPreview from '../components/motherNew/DownloadPacketPreview';
import PacketHistoryList from '../components/motherNew/PacketHistoryList';

type Tab = 'builder' | 'history';

export default function MotherNewDownloadPage() {
  const [context, setContext] = useState<MotherNewAppContext>(createDefaultAppContext);
  const [workingSet, setWorkingSet] = useState<MotherNewWorkingSet | null>(null);
  const [packet, setPacket] = useState<MotherNewAppDownloadPacket | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [tab, setTab] = useState<Tab>('builder');
  const [history, setHistory] = useState(loadPacketHistory);
  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleBuild = useCallback(() => {
    if (!context.query.trim()) {
      alert('Please enter a query.');
      return;
    }
    setIsBuilding(true);
    try {
      const ws = buildMotherNewWorkingSet(context);
      const pkt = buildMotherNewAppDownloadPacket(ws);
      setWorkingSet(ws);
      setPacket(pkt);
      savePacketToHistory(pkt);
      setHistory(loadPacketHistory());
    } finally {
      setIsBuilding(false);
    }
  }, [context]);

  const copyJson = useCallback((data: unknown, label: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopyStatus(`${label} copied!`);
      setTimeout(() => setCopyStatus(''), 2000);
    }).catch(() => {
      setCopyStatus('Copy failed — check browser permissions.');
      setTimeout(() => setCopyStatus(''), 3000);
    });
  }, []);

  const handleViewHistory = useCallback((item: MotherNewPacketHistoryItem) => {
    setPacket(item.packet);
    setWorkingSet(null);
    setTab('builder');
  }, []);

  const handleCopyHistory = useCallback((item: MotherNewPacketHistoryItem) => {
    copyJson(item.packet, 'Packet');
  }, [copyJson]);

  const handleClearHistory = useCallback(() => {
    if (confirm('Clear all packet history?')) {
      clearPacketHistory();
      setHistory(loadPacketHistory());
    }
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, color: '#e0e0f0' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px', color: '#c0c0ff', fontSize: 22, fontWeight: 700 }}>
          Download Packet
        </h1>
        <p style={{ margin: 0, color: '#7070a0', fontSize: 14 }}>
          Phase 24: App Download Packet / Working Set Builder — ノードマザー(新)から外部アプリへ安全な情報の小舟を
        </p>
      </div>

      <DownloadPolicyCard />

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {(['builder', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? '#2d2d4e' : 'transparent',
              border: '1px solid ' + (tab === t ? '#4040a0' : '#2d2d4e'),
              borderRadius: 4,
              color: tab === t ? '#a0a0ff' : '#6060a0',
              padding: '6px 16px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t === 'builder' ? 'Builder' : `History (${history.items.length})`}
          </button>
        ))}
        {copyStatus && (
          <span style={{ marginLeft: 16, fontSize: 12, color: '#70e070', alignSelf: 'center' }}>
            ✓ {copyStatus}
          </span>
        )}
      </div>

      {tab === 'builder' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
          {/* Left: Form */}
          <div>
            <AppContextForm context={context} onChange={setContext} />
            <div style={{ marginTop: 16 }}>
              <DownloadPacketPanel
                onBuild={handleBuild}
                isBuilding={isBuilding}
                hasWorkingSet={workingSet != null}
              />
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {workingSet && (
              <div style={{ marginBottom: 24 }}>
                <WorkingSetPreview
                  workingSet={workingSet}
                  onCopyJson={() => copyJson(workingSet, 'Working Set')}
                />
              </div>
            )}
            {packet && (
              <DownloadPacketPreview
                packet={packet}
                onCopyJson={() => copyJson(packet, 'Download Packet')}
              />
            )}
            {!workingSet && !packet && (
              <div style={{ color: '#4040a0', fontSize: 13, paddingTop: 20 }}>
                Results will appear here after building a packet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <PacketHistoryList
          items={history.items}
          onView={handleViewHistory}
          onCopy={handleCopyHistory}
          onClear={handleClearHistory}
        />
      )}
    </div>
  );
}
