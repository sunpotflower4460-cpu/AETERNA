import React from 'react';

export default function DownloadPolicyCard() {
  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid #2d2d4e',
      borderRadius: 8,
      padding: '16px 20px',
      marginBottom: 24,
      color: '#c8c8e0',
    }}>
      <h3 style={{ margin: '0 0 10px', color: '#a0a0ff', fontSize: 15 }}>
        📋 App Download Packet Policy
      </h3>
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 13 }}>
        <li>App Download Packet は、ノードマザー(新)から外部アプリへ必要情報だけを渡す <strong>read-only packet</strong> です。</li>
        <li>repository 全体や raw data を渡すものではありません。</li>
        <li><strong>quarantined / rejected</strong> 情報はデフォルトで除外されます。</li>
        <li>packet に含まれる情報を絶対の真実として扱わないでください。</li>
        <li>この packet を ノードマザー(旧) や New Crystal に自動書き込みしないでください。</li>
        <li>外部アプリへの実接続はまだ未実装です（MVP段階）。</li>
      </ul>
    </div>
  );
}
