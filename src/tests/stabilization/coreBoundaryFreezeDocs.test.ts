/**
 * AETERNA-NATURAL v2.6.5 Current State Audit / Core Boundary Freeze
 * Docs Guard Tests
 *
 * Purpose: Verify that all required audit documentation exists.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(__dirname, '../../../docs');

describe('v2.6.5 Core Boundary Freeze Docs', () => {
  it('aeterna-current-state-audit.md exists', () => {
    const path = join(DOCS_DIR, 'aeterna-current-state-audit.md');
    expect(existsSync(path)).toBe(true);
  });

  it('core-boundary-freeze.md exists', () => {
    const path = join(DOCS_DIR, 'core-boundary-freeze.md');
    expect(existsSync(path)).toBe(true);
  });

  it('current-update-flow-map.md exists', () => {
    const path = join(DOCS_DIR, 'current-update-flow-map.md');
    expect(existsSync(path)).toBe(true);
  });

  it('v2-7-now-summary-inputs.md exists', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    expect(existsSync(path)).toBe(true);
  });

  it('external-substrate-experiment-candidates.md exists', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    expect(existsSync(path)).toBe(true);
  });
});

describe('v2.6.5 Current State Audit Content', () => {
  it('audit doc contains Inner Torus Life Field section', () => {
    const path = join(DOCS_DIR, 'aeterna-current-state-audit.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 4. Inner Torus Life Field');
  });

  it('audit doc contains Vital Stem section', () => {
    const path = join(DOCS_DIR, 'aeterna-current-state-audit.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 5. Vital Stem / Proto-Organism');
  });

  it('audit doc contains Observer System section', () => {
    const path = join(DOCS_DIR, 'aeterna-current-state-audit.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 7. Observer System');
  });

  it('audit doc contains Bridge Status section', () => {
    const path = join(DOCS_DIR, 'aeterna-current-state-audit.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 9. Bridge Status');
  });

  it('audit doc contains Do-Not-Touch Areas section', () => {
    const path = join(DOCS_DIR, 'aeterna-current-state-audit.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 13. Do-Not-Touch Areas');
  });

  it('audit doc contains What Belongs to AETERNA-MEDIUM section', () => {
    const path = join(DOCS_DIR, 'aeterna-current-state-audit.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 15. What Belongs to AETERNA-MEDIUM Instead');
  });
});

describe('v2.6.5 Core Boundary Freeze Content', () => {
  it('boundary doc contains Inner Torus Life Field section', () => {
    const path = join(DOCS_DIR, 'core-boundary-freeze.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 3. Inner Torus Life Field');
  });

  it('boundary doc contains Proto-Organism / Vital Stem section', () => {
    const path = join(DOCS_DIR, 'core-boundary-freeze.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 4. Proto-Organism / Vital Stem');
  });

  it('boundary doc contains Observer / Super Observation section', () => {
    const path = join(DOCS_DIR, 'core-boundary-freeze.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 5. Observer / Super Observation');
  });

  it('boundary doc contains Bridge / Signal Runtime section', () => {
    const path = join(DOCS_DIR, 'core-boundary-freeze.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 6. Bridge / Signal Runtime');
  });

  it('boundary doc contains What Must Not Be Changed section', () => {
    const path = join(DOCS_DIR, 'core-boundary-freeze.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 7. What Must Not Be Changed Casually');
  });

  it('boundary doc contains What Belongs to AETERNA-MEDIUM section', () => {
    const path = join(DOCS_DIR, 'core-boundary-freeze.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## 9. What Belongs to AETERNA-MEDIUM Instead');
  });
});

describe('v2.6.5 Update Flow Map Content', () => {
  it('flow map doc contains Update Sequence section', () => {
    const path = join(DOCS_DIR, 'current-update-flow-map.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## Update Sequence');
  });

  it('flow map doc contains Baseline & Residue stage', () => {
    const path = join(DOCS_DIR, 'current-update-flow-map.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 1. Baseline & Residue');
  });

  it('flow map doc contains Torus Dynamics stage', () => {
    const path = join(DOCS_DIR, 'current-update-flow-map.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 13. Torus Dynamics');
  });

  it('flow map doc contains Observer stage', () => {
    const path = join(DOCS_DIR, 'current-update-flow-map.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 14. Observer');
  });

  it('flow map doc contains Dependency Diagram', () => {
    const path = join(DOCS_DIR, 'current-update-flow-map.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## Dependency Diagram');
  });
});

describe('v2.6.5 v2.7 Now Summary Inputs Content', () => {
  it('v2.7 inputs doc contains Torus Life Field metrics', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## A. トーラス生命場 (Torus Life Field)');
  });

  it('v2.7 inputs doc contains Vital Stem metrics', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## B. 生命幹 (Vital Stem)');
  });

  it('v2.7 inputs doc contains Body-World Closure metrics', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## C. 閉ループ (Body-World Closure)');
  });

  it('v2.7 inputs doc contains History metrics', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## D. 履歴 (History)');
  });

  it('v2.7 inputs doc contains Emergent Candidates metrics', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## E. 創発候補 (Emergent Candidates)');
  });

  it('v2.7 inputs doc contains Risk metrics', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## F. リスク (Risk)');
  });

  it('v2.7 inputs doc contains Summary Table', () => {
    const path = join(DOCS_DIR, 'v2-7-now-summary-inputs.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## Summary Table');
  });
});

describe('v2.6.5 External Substrate Candidates Content', () => {
  it('external substrate doc contains AETERNA-MEDIUM Candidate section', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## AETERNA-MEDIUM Candidate');
  });

  it('external substrate doc contains LBM candidate', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 1. Lattice Boltzmann Method (LBM)');
  });

  it('external substrate doc contains Energy as First-Class Citizen candidate', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 2. Energy as First-Class Citizen');
  });

  it('external substrate doc contains Materiality Probability candidate', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 3. Materiality Probability / Irreversible Collapse Law');
  });

  it('external substrate doc contains NCA candidate', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 4. Differentiable Physics / Neural Cellular Automata (NCA)');
  });

  it('external substrate doc contains Distributed Torus Field candidate', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('### 5. Distributed Torus Field / Multi-Scale Toroidal Topology');
  });

  it('external substrate doc contains Separation Rule', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## Separation Rule');
  });

  it('external substrate doc contains Comparison Protocol', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## Comparison Protocol');
  });

  it('external substrate doc contains Integration Checklist', () => {
    const path = join(DOCS_DIR, 'external-substrate-experiment-candidates.md');
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('## Integration Checklist');
  });
});
