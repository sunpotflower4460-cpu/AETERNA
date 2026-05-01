import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AeternaNetwork } from '../../core/AeternaNetwork.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(SRC_ROOT, '..');

const dynamicCoreSource = readFileSync(path.join(SRC_ROOT, 'core', 'dynamicCore.ts'), 'utf8');
const aeternaNetworkSource = readFileSync(path.join(SRC_ROOT, 'core', 'AeternaNetwork.js'), 'utf8');
const protoNetworkTypeSource = readFileSync(path.join(SRC_ROOT, 'types', 'protoNetworkCandidate.ts'), 'utf8');
const repeatedFlowTypeSource = readFileSync(path.join(SRC_ROOT, 'types', 'repeatedFlowPath.ts'), 'utf8');
const localExcitabilityTypeSource = readFileSync(path.join(SRC_ROOT, 'types', 'localExcitabilityField.ts'), 'utf8');

describe('N0 geometry / dynamics audit snapshot', () => {
  it('keeps external constants visible in core dynamics', () => {
    expect(dynamicCoreSource).toContain('PHI_INV');
    expect(dynamicCoreSource).toContain('SCHUMANN_RES');
    expect(dynamicCoreSource).toContain('GAMMA_SYNC');
  });

  it('still uses a periodic 2D grid update without curved-metric terms', () => {
    expect(dynamicCoreSource).toContain('for (let i = 0; i < network.segments; i++)');
    expect(dynamicCoreSource).toContain('for (let j = 0; j < network.segments; j++)');
    expect(dynamicCoreSource).toContain('% network.segments');
    expect(dynamicCoreSource).not.toContain('areaElement');
    expect(dynamicCoreSource).not.toContain('gaussianCurvature');
    expect(dynamicCoreSource).not.toContain('meanCurvature');
  });

  it('still presents the runtime field as a single real scalar buffer with swap buffers', () => {
    const network = new AeternaNetwork(8);

    expect(network.currentBuffer).toBeInstanceOf(Float32Array);
    expect(network.prevBuffer).toBeInstanceOf(Float32Array);
    expect(network.nextBuffer).toBeInstanceOf(Float32Array);
    expect(network.currentBuffer).toHaveLength(64);
    expect('complexBuffer' in network).toBe(false);
    expect('realBuffer' in network).toBe(false);
    expect('imagBuffer' in network).toBe(false);
  });

  it('still exposes auxiliary runtime traces around the main scalar field', () => {
    const network = new AeternaNetwork(8);

    expect(network.baselineActivity).toBeInstanceOf(Float32Array);
    expect(network.activityResidue).toBeInstanceOf(Float32Array);
    expect(network.spikeTrace).toBeInstanceOf(Float32Array);
    expect(network.predictionError).toBeInstanceOf(Float32Array);
    expect(network.localPrediction).toBeInstanceOf(Float32Array);
  });

  it('keeps observer candidate layers out of the main runtime network class', () => {
    expect(aeternaNetworkSource).not.toContain('deriveLocalExcitabilityField');
    expect(aeternaNetworkSource).not.toContain('deriveRepeatedFlowPaths');
    expect(aeternaNetworkSource).not.toContain('deriveProtoNetworkCandidates');
    expect(aeternaNetworkSource).not.toContain('deriveProtoNeuronCandidates');
    expect(aeternaNetworkSource).not.toContain('createGraph');
    expect(aeternaNetworkSource).not.toContain('addEdge');
  });

  it('documents candidate layers as observer-side only', () => {
    expect(localExcitabilityTypeSource).toContain('observation field');
    expect(repeatedFlowTypeSource).toContain('Observer-side only');
    expect(protoNetworkTypeSource).toContain('Observer-side only');
  });

  it('keeps N1 and N2 as pending structural work', () => {
    expect(existsSync(path.join(SRC_ROOT, 'core', 'torusGeometry.ts'))).toBe(true);
    expect(dynamicCoreSource).not.toContain('majorRadius');
    expect(dynamicCoreSource).not.toContain('minorRadius');
    expect(dynamicCoreSource).not.toContain('phaseGradient');
    expect(dynamicCoreSource).not.toContain('topologicalCharge');
    expect(existsSync(path.join(REPO_ROOT, 'docs', 'aeterna-natural-roadmap.md'))).toBe(true);
  });
});
