import type {
  BufferEnergyEstimate,
  EnergyLedgerInput,
  EnergyLedgerState,
  EnergyLedgerTerm,
} from '../types/energyLedger.ts';

const DEFAULT_TOLERANCE = 1e-6;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalize(value: number | undefined): number | null {
  return isFiniteNumber(value) ? value : null;
}

function normalizeNonNegativeTerm(
  value: number | undefined,
  id: string,
  warnings: string[],
): number | null {
  const normalized = normalize(value);
  if (normalized === null) return null;
  if (normalized < 0) {
    warnings.push(`${id} was negative and was not silently clamped into the ledger.`);
    return null;
  }
  return normalized;
}

function makeTerm(
  id: string,
  label: string,
  value: number | null,
  requiredForClosure: boolean,
  note: string,
): EnergyLedgerTerm {
  return {
    id,
    label,
    value,
    kind: id === 'conservationResidual' ? 'check' : 'raw',
    requiredForClosure,
    note,
  };
}

function deriveStatus(
  residual: number | null,
  tolerance: number,
  missingTermIds: string[],
): EnergyLedgerState['status'] {
  if (missingTermIds.length > 0 || residual === null) return 'insufficient';
  if (residual <= tolerance) return 'closed';
  if (residual <= tolerance * 10) return 'nearClosed';
  return 'open';
}

function deriveConfidence(status: EnergyLedgerState['status'], missingTermIds: string[]): EnergyLedgerState['confidence'] {
  if (missingTermIds.length > 0) return 'insufficient';
  if (status === 'closed') return 'high';
  if (status === 'nearClosed') return 'medium';
  if (status === 'open') return 'low';
  return 'insufficient';
}

/**
 * deriveEnergyLedger
 *
 * Observer-side Check-kind diagnostic.
 *
 * This does not modify runtime dynamics and does not claim that energy flow is
 * verified. It only checks whether the provided accounting terms close:
 *
 * input = internal accumulation + dissipation + actuation output
 *       + residue conversion + clamp/overflow loss + measured outflow ± tolerance
 */
export function deriveEnergyLedger(input: EnergyLedgerInput): EnergyLedgerState {
  const tolerance = Math.max(DEFAULT_TOLERANCE, Math.abs(input.tolerance ?? DEFAULT_TOLERANCE));
  const timestamp = input.timestamp ?? Date.now();
  const source = input.source ?? 'observer-diagnostic';
  const warnings: string[] = [];

  const inputEnergy = normalizeNonNegativeTerm(input.inputEnergy, 'inputEnergy', warnings);
  const internalEnergyBefore = normalizeNonNegativeTerm(input.internalEnergyBefore, 'internalEnergyBefore', warnings);
  const internalEnergyAfter = normalizeNonNegativeTerm(input.internalEnergyAfter, 'internalEnergyAfter', warnings);

  const derivedDelta = internalEnergyBefore !== null && internalEnergyAfter !== null
    ? internalEnergyAfter - internalEnergyBefore
    : null;
  const internalAccumulationDelta = derivedDelta !== null
    ? derivedDelta
    : normalize(input.internalAccumulationDelta);

  const dissipatedEnergy = normalizeNonNegativeTerm(input.dissipatedEnergy, 'dissipatedEnergy', warnings);
  const actuationOutputEnergy = normalizeNonNegativeTerm(input.actuationOutputEnergy, 'actuationOutputEnergy', warnings);
  const residueConvertedEnergy = normalizeNonNegativeTerm(input.residueConvertedEnergy, 'residueConvertedEnergy', warnings);
  const clampLossOrOverflow = normalizeNonNegativeTerm(input.clampLossOrOverflow, 'clampLossOrOverflow', warnings);
  const measuredOutflowEnergy = normalizeNonNegativeTerm(input.measuredOutflowEnergy, 'measuredOutflowEnergy', warnings);

  const requiredTerms = {
    inputEnergy,
    internalAccumulationDelta,
    dissipatedEnergy,
    actuationOutputEnergy,
    residueConvertedEnergy,
  };

  const missingTermIds = Object.entries(requiredTerms)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  const optionalClampLoss = clampLossOrOverflow ?? 0;
  const optionalOutflow = measuredOutflowEnergy ?? 0;

  const accountedEnergy = missingTermIds.length === 0
    ? (internalAccumulationDelta as number) +
      (dissipatedEnergy as number) +
      (actuationOutputEnergy as number) +
      (residueConvertedEnergy as number) +
      optionalClampLoss +
      optionalOutflow
    : null;

  const signedResidual = inputEnergy !== null && accountedEnergy !== null
    ? inputEnergy - accountedEnergy
    : null;
  const conservationResidual = signedResidual !== null
    ? Math.abs(signedResidual)
    : null;

  const status = deriveStatus(conservationResidual, tolerance, missingTermIds);
  const confidence = deriveConfidence(status, missingTermIds);
  const verifiedModeledFlow = status === 'closed' && confidence === 'high';

  const terms: EnergyLedgerTerm[] = [
    makeTerm('inputEnergy', 'Input energy', inputEnergy, true, 'Measured or diagnostic energy entering the accounting boundary.'),
    makeTerm('internalEnergyBefore', 'Internal energy before', internalEnergyBefore, false, 'Optional raw storage estimate before this tick.'),
    makeTerm('internalEnergyAfter', 'Internal energy after', internalEnergyAfter, false, 'Optional raw storage estimate after this tick.'),
    makeTerm('internalAccumulationDelta', 'Internal accumulation delta', internalAccumulationDelta, true, 'Storage change; derived from before/after when available.'),
    makeTerm('dissipatedEnergy', 'Dissipated energy', dissipatedEnergy, true, 'Energy transferred into a named dissipation destination.'),
    makeTerm('actuationOutputEnergy', 'Actuation output energy', actuationOutputEnergy, true, 'Energy leaving as modeled action/output.'),
    makeTerm('residueConvertedEnergy', 'Residue converted energy', residueConvertedEnergy, true, 'Energy converted into residue/storage-like traces.'),
    makeTerm('clampLossOrOverflow', 'Clamp loss or overflow', clampLossOrOverflow, false, 'Optional accounted overflow; must not be silently discarded.'),
    makeTerm('measuredOutflowEnergy', 'Measured outflow energy', measuredOutflowEnergy, false, 'Optional measured outflow not covered by other terms.'),
    makeTerm('conservationResidual', 'Conservation residual', conservationResidual, true, 'Check-kind residual; zero or near-zero means the supplied ledger terms close.'),
  ];

  if (missingTermIds.length > 0) {
    warnings.push('Energy flow is not yet verified. Required ledger terms are missing.');
  }
  if (status === 'open') {
    warnings.push('Energy ledger is open. Do not present this as modeled energy flow.');
  }
  if (clampLossOrOverflow === null) {
    warnings.push('Clamp/overflow accounting is unknown. Silent loss may still exist.');
  }

  const notes = [
    'Observer-side Check-kind diagnostic only.',
    'This does not modify runtime dynamics.',
    'This does not prove life, consciousness, intelligence, or selfhood.',
    verifiedModeledFlow
      ? 'Provided ledger terms close within tolerance.'
      : 'Energy flow is not yet verified. Current values are diagnostic/proxy readings.',
  ];

  return {
    timestamp,
    source,
    metricKind: 'check',
    tolerance,
    inputEnergy,
    internalEnergyBefore,
    internalEnergyAfter,
    internalAccumulationDelta,
    dissipatedEnergy,
    actuationOutputEnergy,
    residueConvertedEnergy,
    clampLossOrOverflow,
    measuredOutflowEnergy,
    accountedEnergy,
    signedResidual,
    conservationResidual,
    status,
    confidence,
    verifiedModeledFlow,
    missingTermIds,
    terms,
    warnings,
    notes,
  };
}

export function estimateBufferEnergy(
  buffer: ArrayLike<number> | null | undefined,
  mode: 'squared' | 'absolute' = 'squared',
): BufferEnergyEstimate {
  if (!buffer) {
    return { value: 0, mode, sampleCount: 0, finiteCount: 0, nonFiniteCount: 0 };
  }

  let value = 0;
  let finiteCount = 0;
  let nonFiniteCount = 0;

  for (let i = 0; i < buffer.length; i++) {
    const sample = buffer[i];
    if (!Number.isFinite(sample)) {
      nonFiniteCount += 1;
      continue;
    }
    finiteCount += 1;
    value += mode === 'squared' ? sample * sample : Math.abs(sample);
  }

  return {
    value,
    mode,
    sampleCount: buffer.length,
    finiteCount,
    nonFiniteCount,
  };
}
