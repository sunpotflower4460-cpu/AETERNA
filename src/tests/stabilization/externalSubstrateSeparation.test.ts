/**
 * AETERNA-NATURAL v2.6.5 Current State Audit / Core Boundary Freeze
 * External Substrate Separation Guard Tests
 *
 * Purpose: Verify that LBM/NCA/distributed torus/materiality candidates
 * have NOT been added to core implementation files.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const CORE_DIR = join(__dirname, '../../core');
const ORGANISM_DIR = join(__dirname, '../../organism');
const PERCEPTION_DIR = join(__dirname, '../../perception');
const WORLD_DIR = join(__dirname, '../../world');

describe('v2.6.5 External Substrate Separation Guard', () => {
  it('dynamicCore.ts does not contain LBM implementation', () => {
    const path = join(CORE_DIR, 'dynamicCore.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for Lattice Boltzmann Method keywords
    expect(content).not.toMatch(/lattice.*boltzmann/i);
    expect(content).not.toMatch(/\blbm\b/i);
    expect(content).not.toMatch(/velocity.*field/i);
    expect(content).not.toMatch(/density.*field/i);
    expect(content).not.toMatch(/collision.*operator/i);
    expect(content).not.toMatch(/streaming.*step/i);
  });

  it('dynamicCore.ts does not contain NCA implementation', () => {
    const path = join(CORE_DIR, 'dynamicCore.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for Neural Cellular Automata keywords
    expect(content).not.toMatch(/neural.*cellular.*automata/i);
    expect(content).not.toMatch(/\bnca\b/i);
    expect(content).not.toMatch(/differentiable.*physics/i);
    expect(content).not.toMatch(/learned.*update.*rule/i);
    expect(content).not.toMatch(/gradient.*based.*optimization/i);
  });

  it('dynamicCore.ts does not contain materiality / collapse law', () => {
    const path = join(CORE_DIR, 'dynamicCore.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for materiality / collapse keywords
    expect(content).not.toMatch(/materiality.*probability/i);
    expect(content).not.toMatch(/irreversible.*collapse/i);
    expect(content).not.toMatch(/collapse.*law/i);
    expect(content).not.toMatch(/collapse.*history/i);
    expect(content).not.toMatch(/recovery.*probability/i);
  });

  it('dynamicCore.ts does not contain distributed torus implementation', () => {
    const path = join(CORE_DIR, 'dynamicCore.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for distributed torus keywords
    expect(content).not.toMatch(/distributed.*torus/i);
    expect(content).not.toMatch(/multi.*scale.*torus/i);
    expect(content).not.toMatch(/nested.*tori/i);
    expect(content).not.toMatch(/cross.*scale.*coupling/i);
    expect(content).not.toMatch(/hierarchical.*dynamics/i);
  });

  it('dynamicCore.ts does not contain energy ledger implementation', () => {
    const path = join(CORE_DIR, 'dynamicCore.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for energy ledger keywords
    expect(content).not.toMatch(/energy.*ledger/i);
    expect(content).not.toMatch(/dissipation.*cost/i);
    expect(content).not.toMatch(/recovery.*cost/i);
    expect(content).not.toMatch(/energy.*throughput.*balance/i);
    expect(content).not.toMatch(/energy.*dependent.*threshold/i);
  });

  it('AeternaNetwork.js does not contain LBM implementation', () => {
    const path = join(CORE_DIR, 'AeternaNetwork.js');
    const content = readFileSync(path, 'utf-8');

    // Check for LBM keywords
    expect(content).not.toMatch(/lattice.*boltzmann/i);
    expect(content).not.toMatch(/\blbm\b/i);
    expect(content).not.toMatch(/velocity.*field/i);
    expect(content).not.toMatch(/density.*field/i);
  });

  it('AeternaNetwork.js does not contain NCA implementation', () => {
    const path = join(CORE_DIR, 'AeternaNetwork.js');
    const content = readFileSync(path, 'utf-8');

    // Check for NCA keywords
    expect(content).not.toMatch(/neural.*cellular.*automata/i);
    expect(content).not.toMatch(/\bnca\b/i);
    expect(content).not.toMatch(/learned.*update.*rule/i);
  });

  it('AeternaNetwork.js does not contain materiality / collapse law', () => {
    const path = join(CORE_DIR, 'AeternaNetwork.js');
    const content = readFileSync(path, 'utf-8');

    // Check for materiality / collapse keywords
    expect(content).not.toMatch(/materiality.*probability/i);
    expect(content).not.toMatch(/irreversible.*collapse/i);
    expect(content).not.toMatch(/collapse.*law/i);
  });

  it('AeternaNetwork.js does not contain distributed torus implementation', () => {
    const path = join(CORE_DIR, 'AeternaNetwork.js');
    const content = readFileSync(path, 'utf-8');

    // Check for distributed torus keywords
    expect(content).not.toMatch(/distributed.*torus/i);
    expect(content).not.toMatch(/multi.*scale.*torus/i);
    expect(content).not.toMatch(/nested.*tori/i);
  });

  it('torusDynamics.ts does not contain LBM implementation', () => {
    const path = join(CORE_DIR, 'torusDynamics.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for LBM keywords
    expect(content).not.toMatch(/lattice.*boltzmann/i);
    expect(content).not.toMatch(/\blbm\b/i);
  });

  it('torusDynamics.ts does not contain NCA implementation', () => {
    const path = join(CORE_DIR, 'torusDynamics.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for NCA keywords
    expect(content).not.toMatch(/neural.*cellular.*automata/i);
    expect(content).not.toMatch(/\bnca\b/i);
  });

  it('livingState.ts does not contain energy ledger', () => {
    const path = join(ORGANISM_DIR, 'livingState.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for energy ledger keywords
    expect(content).not.toMatch(/energy.*ledger/i);
    expect(content).not.toMatch(/dissipation.*cost/i);
    expect(content).not.toMatch(/recovery.*cost/i);
  });

  it('updateWorldMedium.ts does not contain LBM implementation', () => {
    const path = join(WORLD_DIR, 'updateWorldMedium.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for LBM keywords
    expect(content).not.toMatch(/lattice.*boltzmann/i);
    expect(content).not.toMatch(/\blbm\b/i);
  });
});

describe('v2.6.5 No Node Bridge / LLM / API Addition', () => {
  it('bridge.ts does not contain LLM integration', () => {
    const path = join(__dirname, '../../bridge/bridge.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for LLM integration keywords
    expect(content).not.toMatch(/openai/i);
    expect(content).not.toMatch(/anthropic/i);
    expect(content).not.toMatch(/claude/i);
    expect(content).not.toMatch(/gpt/i);
    expect(content).not.toMatch(/llm.*api/i);
    expect(content).not.toMatch(/fetch.*api/i);
  });

  it('bridge.ts applySignalFeedback remains stub', () => {
    const path = join(__dirname, '../../bridge/bridge.ts');
    const content = readFileSync(path, 'utf-8');

    // applySignalFeedback should remain a stub (only console.debug)
    const functionMatch = content.match(/export\s+function\s+applySignalFeedback[\s\S]*?\n\}/);
    expect(functionMatch).toBeTruthy();

    if (functionMatch) {
      const functionBody = functionMatch[0];
      // Should only contain console.debug, no actual feedback logic
      expect(functionBody).toMatch(/console\.debug/);
      expect(functionBody).not.toMatch(/network\./);
      expect(functionBody).not.toMatch(/feedback\..*\s*=\s*/);
    }
  });

  it('bridge.ts does not contain Node bridge integration', () => {
    const path = join(__dirname, '../../bridge/bridge.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for Node bridge keywords
    expect(content).not.toMatch(/node.*bridge/i);
    expect(content).not.toMatch(/semantic.*memory/i);
    expect(content).not.toMatch(/knowledge.*graph/i);
    expect(content).not.toMatch(/concept.*graph/i);
  });
});

describe('v2.6.5 No Consciousness / Life / Intelligence Proof Claims', () => {
  it('dynamicCore.ts does not contain proof claims', () => {
    const path = join(CORE_DIR, 'dynamicCore.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for proof claim keywords
    expect(content).not.toMatch(/consciousness.*proved/i);
    expect(content).not.toMatch(/life.*proved/i);
    expect(content).not.toMatch(/intelligence.*proved/i);
    expect(content).not.toMatch(/is\s+alive/i);
    expect(content).not.toMatch(/is\s+conscious/i);
    expect(content).not.toMatch(/\bfeels\b/i);
    expect(content).not.toMatch(/\bwants\b/i);
  });

  it('livingState.ts does not contain proof claims', () => {
    const path = join(ORGANISM_DIR, 'livingState.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for proof claim keywords
    expect(content).not.toMatch(/consciousness.*proved/i);
    expect(content).not.toMatch(/life.*proved/i);
    expect(content).not.toMatch(/intelligence.*proved/i);
    expect(content).not.toMatch(/is\s+alive/i);
    expect(content).not.toMatch(/is\s+conscious/i);
  });

  it('bridge.ts does not contain proof claims', () => {
    const path = join(__dirname, '../../bridge/bridge.ts');
    const content = readFileSync(path, 'utf-8');

    // Check for proof claim keywords
    expect(content).not.toMatch(/consciousness.*proved/i);
    expect(content).not.toMatch(/life.*proved/i);
    expect(content).not.toMatch(/intelligence.*proved/i);
    expect(content).not.toMatch(/is\s+alive/i);
    expect(content).not.toMatch(/is\s+conscious/i);
  });
});
