import { describe, expect, it, afterEach } from 'vitest';
import WebSocket from 'ws';
import { startObservationApi, type ObservationApiHandle } from '../../pure/runtime/observationApi.ts';
import type { ObservationSnapshot } from '../../pure/runtime/observationState.ts';

function fakeSnapshot(tick: number): ObservationSnapshot {
  return {
    tick,
    psiDensity: [1, 2],
    psiPhase: [0, 0.5],
    psiNu: [0.2, 0.2],
    chiDensity: [3, 4],
    chiPhase: [0.1, 0.2],
    chiNu: [0.3, 0.3],
    ledger: {
      nBeforeExchangePsi: 0,
      nAfterExchangePsi: 0,
      hBeforeExchangePsi: 0,
      hAfterExchangePsi: 0,
      nBeforeExchangeChi: 0,
      nAfterExchangeChi: 0,
      hBeforeExchangeChi: 0,
      hAfterExchangeChi: 0,
      exchangeWorkNPsi: 0,
      exchangeWorkHPsi: 0,
      exchangeWorkNChi: 0,
      exchangeWorkHChi: 0,
    },
    vortexCandidateCount: 0,
    structureIndicatorLargestBlob: 0,
  };
}

let handle: ObservationApiHandle | undefined;

afterEach(async () => {
  if (handle) {
    await handle.close();
    handle = undefined;
  }
});

function waitForMessage(ws: WebSocket): Promise<ObservationSnapshot> {
  return new Promise((resolve, reject) => {
    ws.once('message', (data) => {
      resolve(JSON.parse(data.toString()) as ObservationSnapshot);
    });
    ws.once('error', reject);
  });
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
}

describe('pure core K15 observationApi: a real WebSocket client receives the latest snapshot', () => {
  it('broadcasts JSON matching what getLatestSnapshot returns', async () => {
    const latest: ObservationSnapshot = fakeSnapshot(1);
    handle = await startObservationApi({ port: 0, getLatestSnapshot: () => latest, broadcastIntervalMs: 10 });

    const client = new WebSocket(`ws://localhost:${handle.port}`);
    await waitForOpen(client);
    const received = await waitForMessage(client);
    expect(received).toEqual(latest);
    client.close();
  });

  it('reflects an updated snapshot on the next broadcast tick', async () => {
    let latest: ObservationSnapshot = fakeSnapshot(1);
    handle = await startObservationApi({ port: 0, getLatestSnapshot: () => latest, broadcastIntervalMs: 10 });

    const client = new WebSocket(`ws://localhost:${handle.port}`);
    await waitForOpen(client);
    await waitForMessage(client); // first broadcast (tick 1)

    latest = fakeSnapshot(2);
    const second = await waitForMessage(client);
    expect(second.tick).toBe(2);
    client.close();
  });

  it('sends nothing before the first tick (getLatestSnapshot returning undefined)', async () => {
    handle = await startObservationApi({ port: 0, getLatestSnapshot: () => undefined, broadcastIntervalMs: 10 });
    const client = new WebSocket(`ws://localhost:${handle.port}`);
    await waitForOpen(client);

    let received = false;
    client.on('message', () => {
      received = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(received).toBe(false);
    client.close();
  });

  it('tracks connected client count', async () => {
    handle = await startObservationApi({ port: 0, getLatestSnapshot: () => fakeSnapshot(1), broadcastIntervalMs: 1000 });
    expect(handle.clientCount()).toBe(0);
    const client = new WebSocket(`ws://localhost:${handle.port}`);
    await waitForOpen(client);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(handle.clientCount()).toBe(1);
    client.close();
  });

  it('throws synchronously for a non-positive broadcastIntervalMs, before ever binding a port', () => {
    expect(() => startObservationApi({ port: 0, getLatestSnapshot: () => undefined, broadcastIntervalMs: 0 })).toThrow();
  });
});
