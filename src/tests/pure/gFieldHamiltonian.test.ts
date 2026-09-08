import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { computeHamiltonian } from '../../pure/field/invariants.ts';

function randomishField(N: number): ComplexField {
  const size = N * N;
  return {
    real: Float64Array.from({ length: size }, (_, k) => 0.5 + 0.3 * Math.sin(k * 1.3)),
    imag: Float64Array.from({ length: size }, (_, k) => 0.2 * Math.cos(k * 0.7)),
  };
}

describe('pure core K12: computeHamiltonian with g(x) (docs/vessel/K12-memory-channel-adr.md Choice 3)', () => {
  it('a uniform Float64Array g(x) gives the SAME H as the equivalent scalar g to floating-point precision (not necessarily bit-identical - see floors)', () => {
    // NOT bit-identical by design: the scalar path factors g out and multiplies
    // the summed quartic term once ((g/2)*sum(x_i)), while the g(x) path must
    // multiply INSIDE the sum (sum((g[i]/2)*x_i)) since g can vary per cell -
    // floating-point addition is not associative, so these two summation orders
    // can differ in the last bit even when every g[i] equals the same scalar.
    // This is exactly the module doc's own stated floor: the scalar path is
    // preserved bit-for-bit from before g(x) existed; the array path is a
    // genuinely different (not just reordered) computation.
    const N = 6;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const psi = randomishField(N);
    const alpha = 1.3;
    const gValue = 2.1;

    const hScalar = computeHamiltonian(psi, operator, geometry, alpha, gValue);
    const hArray = computeHamiltonian(psi, operator, geometry, alpha, new Float64Array(N * N).fill(gValue));

    expect(hArray).toBeCloseTo(hScalar, 12);
  });

  it('matches an independently-computed sum((g(x)/2)*|psi|^4*dA) for a non-uniform g(x)', () => {
    const N = 6;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const psi = randomishField(N);
    const alpha = 1.3;
    const gField = Float64Array.from({ length: N * N }, (_, k) => 1 + 0.1 * k);

    const h = computeHamiltonian(psi, operator, geometry, alpha, gField);

    // Independent reference: alpha*kinetic computed the same way computeHamiltonian
    // does internally is not re-derived here (that's covered by the scalar-g tests
    // elsewhere); this test isolates the quartic term's g(x) handling by computing
    // H at g=0 (isolating the kinetic term) and subtracting it out.
    const hKineticOnly = computeHamiltonian(psi, operator, geometry, alpha, 0);
    const kinetic = hKineticOnly; // alpha*kinetic + 0
    let expectedQuartic = 0;
    for (let i = 0; i < psi.real.length; i++) {
      const amplitudeSquared = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
      expectedQuartic += (gField[i] / 2) * amplitudeSquared * amplitudeSquared * geometry.cellArea[i];
    }
    expect(h - kinetic).toBeCloseTo(expectedQuartic, 9);
  });

  it('a g(x) that varies has a DIFFERENT H than the uniform-g case with the same mean g (the quartic term is not linear in g when |psi|^4 varies spatially)', () => {
    const N = 6;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const psi = randomishField(N);
    const alpha = 1.0;

    const gUniform = 2;
    const gVarying = Float64Array.from({ length: N * N }, (_, k) => (k % 2 === 0 ? 1 : 3)); // mean = 2

    const hUniform = computeHamiltonian(psi, operator, geometry, alpha, gUniform);
    const hVarying = computeHamiltonian(psi, operator, geometry, alpha, gVarying);

    expect(hVarying).not.toBeCloseTo(hUniform, 6);
  });

  it('throws when g(x) length does not match psi length', () => {
    const N = 4;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const psi = randomishField(N);
    expect(() => computeHamiltonian(psi, operator, geometry, 1, new Float64Array(3))).toThrow();
  });
});
