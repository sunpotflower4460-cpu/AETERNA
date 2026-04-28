import type {
  MotherNewIndexEntityType,
  MotherNewIndexField,
  MotherNewSourceTrustLevel,
  MotherNewSourceType,
} from './motherNewBaseTypes';

// --- App Context ---

export type MotherNewAppContextType =
  | "jibunkaigi"
  | "node_ai_z"
  | "self_research_lab"
  | "music_app"
  | "observation_app"
  | "generic_ai_app"
  | "manual_test";

export type MotherNewAppContext = {
  id: string;
  appType: MotherNewAppContextType;
  appId?: string;
  agentId?: string;
  query: string;
  purpose?: string;
  desiredEntityTypes?: MotherNewIndexEntityType[];
  maxItems: number;
  includeContributions: boolean;
  includeSources: boolean;
  includeLowTrust: boolean;
  includeArchived: boolean;
  includeRejected: boolean;
  includeQuarantined: boolean;
  createdAt: string;
};

// --- Working Set ---

export type MotherNewWorkingSetItemType =
  | "canonical_node"
  | "contribution"
  | "source";

export type MotherNewWorkingSetItem = {
  type: MotherNewWorkingSetItemType;
  id: string;
  label: string;
  description?: string;
  score: number;
  matchedFields: MotherNewIndexField[];
  reasons: {
    field: MotherNewIndexField;
    note: string;
    score: number;
  }[];
  sourceIds: string[];
  contributionIds: string[];
  confidence?: number;
  trustLevel?: MotherNewSourceTrustLevel;
  status?: string;
};

export type MotherNewWorkingSet = {
  id: string;
  context: MotherNewAppContext;
  items: MotherNewWorkingSetItem[];
  excludedCounts: {
    quarantined: number;
    rejected: number;
    archived: number;
    lowTrust: number;
  };
  createdAt: string;
};

// --- Download Packet ---

export type MotherNewAppDownloadPacket = {
  id: string;
  createdAt: string;
  source: "mother_new";
  appContext: {
    appType: MotherNewAppContextType;
    appId?: string;
    agentId?: string;
    query: string;
    purpose?: string;
  };
  summary: {
    itemCount: number;
    canonicalNodeCount: number;
    contributionCount: number;
    sourceCount: number;
    topLabels: string[];
  };
  nodes: {
    id: string;
    label: string;
    description?: string;
    aliases: string[];
    tags: string[];
    confidence?: number;
    score: number;
    provenanceSummary: string;
  }[];
  supportingContributions: {
    id: string;
    proposedLabel?: string;
    contextSummary?: string;
    evidenceSummary?: string;
    sourceName: string;
    status: string;
    score: number;
  }[];
  sources: {
    id: string;
    name: string;
    type: MotherNewSourceType;
    trustLevel: MotherNewSourceTrustLevel;
  }[];
  cautions: string[];
  readableSummary: string;
};

// --- Packet History ---

export type MotherNewPacketHistoryItem = {
  id: string;
  createdAt: string;
  appType: MotherNewAppContextType;
  query: string;
  itemCount: number;
  packet: MotherNewAppDownloadPacket;
};

export type MotherNewPacketHistoryState = {
  items: MotherNewPacketHistoryItem[];
  updatedAt: string;
};

export const MOTHER_NEW_PACKET_HISTORY_KEY =
  "node-mother:mother-new:packet-history";
