/**
 * cellInspectorPanel.test.ts
 *
 * Confirms:
 * - renderCellInspectorPanelHTML shows an empty-state message when no cell selected
 * - renderCellInspectorPanelHTML shows the cell id and both real values when selected
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
    const html = renderCellInspectorPanelHTML(null);
    expect(html).toContain('セルが選択されていません');
  });

  it('shows the cell id and both values when a cell is selected', () => {
    const html = renderCellInspectorPanelHTML({ cellId: 42, currentValue: 1.2345, spikeTrace: 0.5 });
    expect(html).toContain('#42');
    expect(html).toContain('1.2345');
    expect(html).toContain('0.5000');
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
