export type Phase0MechanismId =
  | 'w0_w8_loop'
  | 'dynamic_viability_metrics'
  | 'vortex_candidates'
  | 'cell_structures'
  | 'weak_plasticity_trace'
  | 'reafference_comparison'
  | 'proto_network_proto_neuron'
  | 'vital_pulse_breath_wave';

export interface MechanismWritebackFlag {
  mechanismId: Phase0MechanismId;
  writeback_enabled: false;
  requires_writeback_review: boolean;
  note: string;
}

export const PHASE0_MECHANISM_WRITEBACK_FLAGS: readonly MechanismWritebackFlag[] = [
  {
    mechanismId: 'w0_w8_loop',
    writeback_enabled: false,
    requires_writeback_review: false,
    note: 'Loop execution is treated as core dynamics; observer outputs remain read-only.',
  },
  {
    mechanismId: 'dynamic_viability_metrics',
    writeback_enabled: false,
    requires_writeback_review: false,
    note: 'flowContinuity / energyThroughput / dissipationBalance are observer-facing measurements.',
  },
  {
    mechanismId: 'vortex_candidates',
    writeback_enabled: false,
    requires_writeback_review: false,
    note: 'Vortex candidates are derived from phase/amplitude snapshots only.',
  },
  {
    mechanismId: 'cell_structures',
    writeback_enabled: false,
    requires_writeback_review: false,
    note: 'CellObservation / CellRegionLabel / Cell Inspector are observer/UI layers.',
  },
  {
    mechanismId: 'weak_plasticity_trace',
    writeback_enabled: false,
    requires_writeback_review: true,
    note: 'Weak plasticity has potential runtime coupling paths and requires explicit Phase 2 review.',
  },
  {
    mechanismId: 'reafference_comparison',
    writeback_enabled: false,
    requires_writeback_review: true,
    note: 'Reafference comparison is derived inside the closure/core loop and requires explicit Phase 2 review before any writeback path is allowed.',
  },
  {
    mechanismId: 'proto_network_proto_neuron',
    writeback_enabled: false,
    requires_writeback_review: false,
    note: 'Proto-neuron and proto-network are observer candidate derivations only.',
  },
  {
    mechanismId: 'vital_pulse_breath_wave',
    writeback_enabled: false,
    requires_writeback_review: true,
    note: 'Waveform vocabulary and semantics require ongoing guard review for non-claim compliance.',
  },
] as const;
