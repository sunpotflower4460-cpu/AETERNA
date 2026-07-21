/**
 * cellInspectorPanel.test.ts
 *
 * Confirms:
 * - renderCellInspectorPanelHTML shows an empty-state message when no cell selected
 * - renderCellInspectorPanelHTML shows the cell id and both real values when selected
 * - renderCellInspectorPanelHTML marks exactly the active lens's row (PR8c)
 * - each row carries a data-lens attribute matching its metric, for AppShell's click routing
 * - getCellValue returns null when network isn't constructed yet
 * - getCellValue returns null for an out-of-range cellId
 * - getCellValue reads the real currentBuffer/spikeTrace values for a valid cellId,
 *   without mutating them (read-only — master spec §10 Inspect Mode)
 */

import { describe, it, expect, vi } from 'vitest';
import { renderCellInspectorPanelHTML } from '../../ui/shell/CellInspectorPanel.js';

vi.stubGlobal('document', { getElementById: () => null });
vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });

const { getCellValue } = await import('../../app/runtime/RuntimeAdapter.js');
const { state } = await import('../../organism/state.js');

describe('renderCellInspectorPanelHTML', () => {
  it('shows an empty-state message when no cell is selected', () => {
    const html = renderCellInspectorPanelHTML(null, null);
    expect(html).toContain('セルが選択されていません');
  });

  it('shows the cell id and both values when a cell is selected', () => {
    const html = renderCellInspectorPanelHTML({ cellId: 42, currentValue: 1.2345, spikeTrace: 0.5 }, null);
    expect(html).toContain('#42');
    expect(html).toContain('1.2345');
    expect(html).toContain('0.5000');
  });

  it('carries data-lens attributes matching each metric', () => {
    const html = renderCellInspectorPanelHTML({ cellId: 1, currentValue: 1, spikeTrace: 1 }, null);
    expect(html).toContain('data-lens="currentValue"');
    expect(html).toContain('data-lens="spikeTrace"');
  });

  it('marks exactly the active lens row', () => {
    const html = renderCellInspectorPanelHTML({ cellId: 1, currentValue: 1, spikeTrace: 1 }, 'spikeTrace');
    const activeCount = (html.match(/cell-inspector-panel__row--active/g) ?? []).length;
    expect(activeCount).toBe(1);
    const spikeRow = html.match(/<li[^>]*data-lens="spikeTrace"[^>]*>/)?.[0] ?? '';
    expect(spikeRow).toContain('cell-inspector-panel__row--active');
    expect(spikeRow).toContain('aria-pressed="true"');
    const currentRow = html.match(/<li[^>]*data-lens="currentValue"[^>]*>/)?.[0] ?? '';
    expect(currentRow).not.toContain('cell-inspector-panel__row--active');
    expect(currentRow).toContain('aria-pressed="false"');
  });

  it('marks no row active when activeLensId is null', () => {
    const html = renderCellInspectorPanelHTML({ cellId: 1, currentValue: 1, spikeTrace: 1 }, null);
    expect(html).not.toContain('cell-inspector-panel__row--active');
  });

  it('hides the raw array accessor source by default (PR9)', () => {
    const html = renderCellInspectorPanelHTML({ cellId: 3, currentValue: 1, spikeTrace: 1 }, null);
    expect(html).not.toContain('AeternaNetwork.currentBuffer');
    expect(html).not.toContain('AeternaNetwork.spikeTrace');
  });

  it('shows the real raw array accessor source when showRawDiagnostics is true', () => {
    const html = renderCellInspectorPanelHTML({ cellId: 3, currentValue: 1, spikeTrace: 1 }, null, true);
    expect(html).toContain('AeternaNetwork.currentBuffer[3]');
    expect(html).toContain('AeternaNetwork.spikeTrace[3]');
  });
});

describe('getCellValue', () => {
  it('returns null when the network is not constructed yet', () => {
    state.network = null;
    expect(getCellValue(0)).toBeNull();
  });

  it('returns null for an out-of-range cellId', () => {
    state.network = { numNodes: 4, currentBuffer: new Float32Array(4), spikeTrace: new Float32Array(4) };
    expect(getCellValue(-1)).toBeNull();
    expect(getCellValue(4)).toBeNull();
  });

  it('reads the real currentBuffer/spikeTrace values without mutating them', () => {
    const currentBuffer = new Float32Array([0, 0, 0.75, 0]);
    const spikeTrace = new Float32Array([0, 0, 0.1, 0]);
    state.network = { numNodes: 4, currentBuffer, spikeTrace };

    const result = getCellValue(2);

    expect(result?.cellId).toBe(2);
    expect(result?.currentValue).toBeCloseTo(0.75, 5);
    expect(result?.spikeTrace).toBeCloseTo(0.1, 5);
    // Read-only: the underlying arrays must be untouched.
    expect(currentBuffer[2]).toBeCloseTo(0.75, 5);
    expect(spikeTrace[2]).toBeCloseTo(0.1, 5);
  });
});
