export function computeIntegrationProxy(network: any) {
  const N = network.numNodes;
  let tAll = 0;
  let tYin = 0;
  let cYin = 0;
  let tYang = 0;
  let cYang = 0;
  let tL0 = 0;
  let cL0 = 0;
  let tL1 = 0;
  let cL1 = 0;
  let tHalf1 = 0;
  let tHalf2 = 0;

  for (let i = 0; i < N; i++) {
    const f = network.spikeTrace[i];
    tAll += f;
    if (network.nodeType[i] === 1) {
      tYin += f;
      cYin++;
    } else {
      tYang += f;
      cYang++;
    }
    if (network.nodeLayer[i] === 0) {
      tL0 += f;
      cL0++;
    } else {
      tL1 += f;
      cL1++;
    }
    if (i < N / 2) tHalf1 += f;
    else tHalf2 += f;
  }

  const hWhole = tAll / N;
  const hParts = (((tYin / cYin + tYang / cYang) / 2) + ((tL0 / cL0 + tL1 / cL1) / 2) + ((tHalf1 / (N / 2) + tHalf2 / (N / 2)) / 2)) / 3;
  return Math.max(0, hWhole - hParts);
}

export function computePhaseCoherence(network: any) {
  let rCos = 0;
  let rSin = 0;
  for (let i = 0; i < network.numNodes; i++) {
    const wPhase = network.nodeLayer[i] === 1 ? network.nodePhase[i] : network.nodePhase[i] * 0.5;
    const wLocal = network.w_up[i] + network.w_down[i] + network.w_left[i] + network.w_right[i];
    const amp = Math.max(0.1, Math.min(wLocal, 1.0));
    rCos += amp * Math.cos(wPhase);
    rSin += amp * Math.sin(wPhase);
  }
  return Math.sqrt(rCos * rCos + rSin * rSin) / network.numNodes;
}

export function computeMeanPredictionError(network: any) {
  let sum = 0;
  for (let i = 0; i < network.numNodes; i++) sum += network.predictionHistory[i];
  return sum / network.numNodes;
}

export function computeLargestCluster(network: any) {
  const S = network.segments;
  const N = network.numNodes;
  const parent = new Int32Array(N);
  const rank = new Uint8Array(N);
  for (let i = 0; i < N; i++) parent[i] = i;
  const find = (x: number) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else {
      parent[rb] = ra;
      rank[ra]++;
    }
  };

  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const idx = i * S + j;
      if (network.spikeTrace[idx] <= 0.5) continue;
      const right = i * S + ((j + 1) % S);
      const down = ((i + 1) % S) * S + j;
      if (network.spikeTrace[right] > 0.5) union(idx, right);
      if (network.spikeTrace[down] > 0.5) union(idx, down);
    }
  }

  const sizeMap = new Map<number, number>();
  let maxRoot = -1;
  let maxSize = 0;
  for (let i = 0; i < N; i++) {
    if (network.spikeTrace[i] <= 0.5) continue;
    const root = find(i);
    const size = (sizeMap.get(root) || 0) + 1;
    sizeMap.set(root, size);
    if (size > maxSize) {
      maxSize = size;
      maxRoot = root;
    }
  }

  network.largestClusterNodes.fill(0);
  if (maxRoot !== -1) {
    for (let i = 0; i < N; i++) {
      if (network.spikeTrace[i] > 0.5 && find(i) === maxRoot) network.largestClusterNodes[i] = 1;
    }
  }
  return maxSize;
}

export function computeMeanLocalPredError(network: any) {
  let sum = 0;
  for (let i = 0; i < network.numNodes; i++) sum += Math.abs(network.predictionError[i]);
  return sum / network.numNodes;
}

export function updateDerivedStateCaches(network: any, freqRatio: number) {
  network.phaseSpeed = 0.015 + 0.025 * freqRatio;
  for (let i = 0; i < network.numNodes; i++) {
    network.nodePhase[i] = (network.nodePhase[i] + network.phaseSpeed) % (Math.PI * 2);
  }
  if (network.simTime % 4 === 0) {
    network.cachedMaxClusterSize = computeLargestCluster(network);
    network.cachedPhiApprox = computeIntegrationProxy(network);
    network.cachedPhaseCoherence = computePhaseCoherence(network);
  }
}
