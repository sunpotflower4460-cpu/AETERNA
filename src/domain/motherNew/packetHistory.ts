import type {
  MotherNewAppDownloadPacket,
  MotherNewPacketHistoryItem,
  MotherNewPacketHistoryState,
} from './downloadTypes';
import { MOTHER_NEW_PACKET_HISTORY_KEY } from './downloadTypes';

export function loadPacketHistory(): MotherNewPacketHistoryState {
  try {
    const raw = localStorage.getItem(MOTHER_NEW_PACKET_HISTORY_KEY);
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as MotherNewPacketHistoryState;
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

export function savePacketToHistory(packet: MotherNewAppDownloadPacket): void {
  const history = loadPacketHistory();
  const newItem: MotherNewPacketHistoryItem = {
    id: `hist-${Date.now()}`,
    createdAt: packet.createdAt,
    appType: packet.appContext.appType,
    query: packet.appContext.query,
    itemCount: packet.summary.itemCount,
    packet,
  };
  const updated: MotherNewPacketHistoryState = {
    items: [newItem, ...history.items].slice(0, 50), // keep last 50
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(MOTHER_NEW_PACKET_HISTORY_KEY, JSON.stringify(updated));
}

export function clearPacketHistory(): void {
  localStorage.removeItem(MOTHER_NEW_PACKET_HISTORY_KEY);
}
