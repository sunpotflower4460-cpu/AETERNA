/**
 * PUT-IN: a port, a `getLatestSnapshot` callback returning the current
 *   ObservationSnapshot (or undefined before the first tick), and a
 *   broadcast interval
 * EMERGED: a WebSocket server that pushes the latest snapshot, as JSON,
 *   to every connected client on that interval
 * claim-tier: C2 (see src/tests/pure/observationApi.test.ts: a real
 *   `ws` client connecting to a real server on an ephemeral port
 *   receives JSON matching what getLatestSnapshot returns)
 * floors (誠実な床): this module NEVER receives psi/chi/the tick loop's
 *   own mutable state directly - only a callback returning an already-
 *   built, already-copied ObservationSnapshot. It has no write path:
 *   incoming client messages, if any arrive, are ignored (this server
 *   never reads `message` events at all - see
 *   src/tests/pure/observationImportBoundary.test.ts's companion check
 *   that this file's imports never reach ../run/, ../field/step*.ts,
 *   ../drive/, ../ledger/, ../medium/, ../world/worldTick.ts,
 *   ../world/worldField.ts, ../world/distributedBoundary.ts,
 *   ../world/delayLineControl.ts, ../world/foreignFieldControl.ts,
 *   ../runtime/transducer.ts, ../runtime/inputLog.ts, or ../persist/).
 *   Broadcasting is push-only and interval-driven, not per-tick - a
 *   design choice to decouple the tick loop's own throughput from
 *   however many clients are connected (this is also part of why the
 *   decisive falsifier's "field bit-identical with the API connected
 *   vs disconnected" property holds structurally: the broadcast timer
 *   reads state, it never participates in producing it).
 */

import { WebSocketServer, type WebSocket } from 'ws';
import type { AddressInfo } from 'node:net';
import type { ObservationSnapshot } from './observationState.ts';

export interface ObservationApiConfig {
  /** 0 asks the OS for any free port - read the actual bound port back from the resolved handle. */
  port: number;
  getLatestSnapshot: () => ObservationSnapshot | undefined;
  broadcastIntervalMs: number;
}

export interface ObservationApiHandle {
  close: () => Promise<void>;
  clientCount: () => number;
  /** The ACTUAL bound port (resolved after listening), not necessarily config.port if that was 0. */
  port: number;
}

/**
 * Async because the real port (when config.port is 0, "any free port")
 * is only known once the underlying server has actually started
 * listening - Node's net.Server.address() returns null before that.
 */
export function startObservationApi(config: ObservationApiConfig): Promise<ObservationApiHandle> {
  if (!Number.isInteger(config.broadcastIntervalMs) || config.broadcastIntervalMs < 1) {
    throw new Error(`startObservationApi: broadcastIntervalMs must be a positive integer, got ${config.broadcastIntervalMs}`);
  }

  const server = new WebSocketServer({ port: config.port });

  const broadcast = (): void => {
    const snapshot = config.getLatestSnapshot();
    if (!snapshot) return;
    const payload = JSON.stringify(snapshot);
    for (const client of server.clients as Set<WebSocket>) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  };

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', () => {
      const address = server.address() as AddressInfo;
      const timer = setInterval(broadcast, config.broadcastIntervalMs);
      resolve({
        port: address.port,
        clientCount: () => server.clients.size,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            clearInterval(timer);
            server.close((error) => (error ? rejectClose(error) : resolveClose()));
          }),
      });
    });
  });
}
