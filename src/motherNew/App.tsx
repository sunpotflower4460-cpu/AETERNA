import React, { useState } from 'react';
import MotherNewDownloadPage from '../pages/MotherNewDownloadPage';

type Route =
  | 'overview'
  | 'sources'
  | 'contributions'
  | 'guardian'
  | 'quarantine'
  | 'dedup'
  | 'canonical'
  | 'index'
  | 'download';

export default function App() {
  const [route, setRoute] = useState<Route>('download');

  const navItems: { id: Route; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sources', label: 'Sources' },
    { id: 'contributions', label: 'Contributions' },
    { id: 'guardian', label: 'Guardian' },
    { id: 'quarantine', label: 'Quarantine / Review' },
    { id: 'dedup', label: 'Dedup / Alias / Merge' },
    { id: 'canonical', label: 'Canonical' },
    { id: 'index', label: 'Index' },
    { id: 'download', label: 'Download Packet' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa' }}>
      {/* Sidebar */}
      <nav style={{ width: 220, background: '#1a1a2e', color: '#e8e8f0', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #2d2d4e' }}>
          <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 4 }}>ノードマザー(新)</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Node Mother New</div>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: '12px 0' }}>
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setRoute(item.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 20px',
                  background: route === item.id ? '#2d2d4e' : 'transparent',
                  color: route === item.id ? '#a0a0ff' : '#c0c0d0',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  borderLeft: route === item.id ? '3px solid #6060cc' : '3px solid transparent',
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {/* Main content */}
      <main style={{ flex: 1, padding: 0, overflow: 'auto' }}>
        {route === 'download' ? (
          <MotherNewDownloadPage />
        ) : (
          <div style={{ padding: 40, color: '#666' }}>
            <h2 style={{ marginTop: 0, color: '#333' }}>{navItems.find(n => n.id === route)?.label}</h2>
            <p style={{ color: '#888' }}>Coming soon — this section will be implemented in a future phase.</p>
          </div>
        )}
      </main>
    </div>
  );
}
