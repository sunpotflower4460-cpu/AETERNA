// Base types representing the Node Mother New repository
// These stubs represent infrastructure from earlier phases (Phase 1-23)

export type MotherNewSourceType =
  | "personal_journal"
  | "conversation_log"
  | "research_note"
  | "audio_transcript"
  | "observation_record"
  | "external_reference"
  | "unknown";

export type MotherNewSourceTrustLevel =
  | "high"
  | "medium"
  | "low"
  | "unverified";

export type MotherNewContributionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "quarantined"
  | "archived";

export type MotherNewCanonicalNodeStatus =
  | "active"
  | "deprecated"
  | "merged"
  | "archived";

export type MotherNewSource = {
  id: string;
  name: string;
  type: MotherNewSourceType;
  trustLevel: MotherNewSourceTrustLevel;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type MotherNewContribution = {
  id: string;
  sourceId: string;
  proposedLabel?: string;
  rawExcerpt?: string;
  contextSummary?: string;
  evidenceSummary?: string;
  tags: string[];
  status: MotherNewContributionStatus;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
};

export type MotherNewCanonicalNode = {
  id: string;
  label: string;
  description?: string;
  aliases: string[];
  tags: string[];
  confidence?: number;
  status: MotherNewCanonicalNodeStatus;
  provenanceSummary: string;
  contributionIds: string[];
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
};

// Index types (from Phase 23)
export type MotherNewIndexEntityType =
  | "canonical_node"
  | "contribution"
  | "source";

export type MotherNewIndexField =
  | "label"
  | "description"
  | "aliases"
  | "tags"
  | "proposedLabel"
  | "contextSummary"
  | "evidenceSummary"
  | "name"
  | "rawExcerpt";

export type MotherNewIndexEntry = {
  entityType: MotherNewIndexEntityType;
  entityId: string;
  label: string;
  fields: Partial<Record<MotherNewIndexField, string>>;
  tags: string[];
  status?: string;
  trustLevel?: MotherNewSourceTrustLevel;
  confidence?: number;
  updatedAt: string;
};

export type MotherNewIndexState = {
  entries: MotherNewIndexEntry[];
  updatedAt: string;
};
