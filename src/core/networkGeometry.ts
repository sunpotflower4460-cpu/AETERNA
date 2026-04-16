/* eslint-disable @typescript-eslint/no-explicit-any */
export function generateNetworkGeometry(network: any) {
  let index = 0;
  const S = network.segments;
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const u = (i / S) * Math.PI * 2;
      const v = (j / S) * Math.PI * 2;
      const x = (network.R + network.r * Math.cos(v)) * Math.cos(u);
      const y = (network.R + network.r * Math.cos(v)) * Math.sin(u);
      const z = network.r * Math.sin(v);
      const idx3 = index * 3;
      network.basePositions[idx3] = x;
      network.basePositions[idx3 + 1] = y;
      network.basePositions[idx3 + 2] = z;
      network.vertexPositions[idx3] = x;
      network.vertexPositions[idx3 + 1] = y;
      network.vertexPositions[idx3 + 2] = z;
      network.normals[idx3] = Math.cos(v) * Math.cos(u);
      network.normals[idx3 + 1] = Math.cos(v) * Math.sin(u);
      network.normals[idx3 + 2] = Math.sin(v);

      if (Math.sin(u + v) > 0) {
        network.nodeType[index] = 0;
        network.nodeSign[index] = 1.0;
      } else {
        network.nodeType[index] = 1;
        network.nodeSign[index] = -1.2;
      }

      network.nodeLayer[index] = Math.abs(Math.cos(v)) > 0.7 ? 1 : 0;
      if ((i === Math.floor(S * 0.25) && j === Math.floor(S * 0.75)) || (i === Math.floor(S * 0.75) && j === Math.floor(S * 0.25))) {
        network.nodeType[index] = 2;
        network.nodeSign[index] = 0.0;
        network.isEyeNode[index] = 1;
      }
      network.nodePhase[index] = (i / S) * Math.PI * 2;
      index++;
    }
  }

  const hubDefs = [
    { i: 0, j: 0, modality: 'visual-relay' },
    { i: Math.floor(S / 2), j: 0, modality: 'auditory-relay' },
    { i: 0, j: Math.floor(S / 4), modality: 'semantic-hub' },
    { i: 0, j: Math.floor((3 * S) / 4), modality: 'motor-hub' },
    { i: Math.floor(S / 4), j: Math.floor(S / 2), modality: 'interoceptive' },
    { i: Math.floor((3 * S) / 4), j: Math.floor(S / 2), modality: 'contextual' },
  ];

  hubDefs.forEach((hub) => {
    const idx = hub.i * S + hub.j;
    (hub as any).nodeIndex = idx;
    network.nodeType[idx] = 3;
    network.nodeSign[idx] = 1.5;
    network.isEyeNode[idx] = 1;
    network.octahedronHubs.push(hub);
    for (let di = -3; di <= 3; di++) {
      for (let dj = -3; dj <= 3; dj++) {
        const nidx = ((hub.i + di + S) % S) * S + ((hub.j + dj + S) % S);
        network.w_up[nidx] = Math.min(network.w_up[nidx] * 1.15, 2.5);
        network.w_down[nidx] = Math.min(network.w_down[nidx] * 1.15, 2.5);
        network.w_left[nidx] = Math.min(network.w_left[nidx] * 1.15, 2.5);
        network.w_right[nidx] = Math.min(network.w_right[nidx] * 1.15, 2.5);
      }
    }
  });
}

export function updateNetworkRadius(network: any, newR: number) {
  network.r = newR;
  let index = 0;
  const S = network.segments;
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const u = (i / S) * Math.PI * 2;
      const v = (j / S) * Math.PI * 2;
      const x = (network.R + newR * Math.cos(v)) * Math.cos(u);
      const y = (network.R + newR * Math.cos(v)) * Math.sin(u);
      const z = newR * Math.sin(v);
      const idx3 = index * 3;
      network.basePositions[idx3] = x;
      network.basePositions[idx3 + 1] = y;
      network.basePositions[idx3 + 2] = z;
      network.normals[idx3] = Math.cos(v) * Math.cos(u);
      network.normals[idx3 + 1] = Math.cos(v) * Math.sin(u);
      network.normals[idx3 + 2] = Math.sin(v);
      index++;
    }
  }
}

export function updateRenderBuffers(network: any, diskNodeIdx: number) {
  for (let i = 0; i < network.numNodes; i++) {
    const val = network.currentBuffer[i];
    const trace = network.spikeTrace[i];
    const idx3 = i * 3;
    let r = 0;
    let g = 0;
    let b = 0;
    if (i === diskNodeIdx) {
      r = 1.0;
    } else {
      if (network.nodeType[i] === 1) {
        r = 0.3 + trace * 1.5;
        b = 0.1 + trace * 0.2;
      } else if (val > 0) {
        r = val * 0.3 + trace;
        g = 0.1 + val * 0.7 + trace;
        b = 0.4 + val * 0.8 + trace;
      } else {
        r = -val * 0.4 + trace;
        g = trace * 0.5;
        b = 0.3 - val * 0.7 + trace;
      }
      if (network.largestClusterNodes[i] === 1) b += 0.5;
    }
    network.colors[idx3] = Math.min(Math.max(r, 0), 1.0);
    network.colors[idx3 + 1] = Math.min(Math.max(g, 0), 1.0);
    network.colors[idx3 + 2] = Math.min(Math.max(b, 0), 1.0);
    const d = val * 0.04 + trace * 0.06;
    network.vertexPositions[idx3] = network.basePositions[idx3] + network.normals[idx3] * d;
    network.vertexPositions[idx3 + 1] = network.basePositions[idx3 + 1] + network.normals[idx3 + 1] * d;
    network.vertexPositions[idx3 + 2] = network.basePositions[idx3 + 2] + network.normals[idx3 + 2] * d;
  }
}
