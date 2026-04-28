# Phase 24: App Download Packet / Working Set Builder

## Overview

Phase 24 implements the App Download Packet system for ノードマザー(新) — a safe, read-only mechanism to pass curated subsets of the Node Mother repository to external applications.

## What Was Built

### New React SPA (`mother-new.html`)
- Entry point at `mother-new.html` → `src/motherNew/main.tsx` → `src/motherNew/App.tsx`
- Sidebar navigation with stubs for all planned sections (Overview, Sources, Contributions, Guardian, Quarantine/Review, Dedup/Alias/Merge, Canonical, Index)
- Phase 24: **Download Packet** section fully implemented

### Domain Layer (`src/domain/motherNew/`)

| File | Purpose |
|------|---------|
| `motherNewBaseTypes.ts` | Base types: Source, Contribution, CanonicalNode, IndexEntry (Phase 1–23 infrastructure stubs) |
| `motherNewRepository.ts` | localStorage-backed read functions for all repository data |
| `indexSearch.ts` | Full-text search over the index with field-weighted scoring |
| `downloadTypes.ts` | Types for AppContext, WorkingSet, DownloadPacket, PacketHistory |
| `appContext.ts` | Default context factory + app type labels |
| `packetSafety.ts` | Safety filter — checks quarantine/rejection/trust before including in packet |
| `workingSetBuilder.ts` | Builds a filtered, scored working set from index search results |
| `packetBuilder.ts` | Converts a working set into a structured, caution-annotated download packet |
| `packetHistory.ts` | localStorage-backed packet history (last 50 packets) |
| `packetSelectors.ts` | Pure selector functions for derived state from working sets and packets |

### UI Layer

**Components (`src/components/motherNew/`)**
- `DownloadPolicyCard` — policy reminder displayed at top of page
- `AppContextForm` — form to configure query, app type, filters
- `DownloadPacketPanel` — build button with status text
- `WorkingSetPreview` — shows items with type badges, scores, exclusion counts
- `DownloadPacketPreview` — structured packet view with cautions, nodes, contributions, sources
- `PacketResultList` — reusable list of working set items
- `PacketCautionList` — caution/warning display component
- `PacketHistoryList` — browsable history of past packets

**Page (`src/pages/MotherNewDownloadPage.tsx`)**
- Two-tab layout: Builder and History
- Builder: left column (form + build button) + right column (working set preview + packet preview)
- History: list of past packets with view/copy actions

## Safety Design

- Quarantined, rejected, archived, and low-trust records are excluded by default
- Each exclusion is tracked and reported in the packet's `cautions` section
- The packet is explicitly read-only and annotated with cautions against writing to Crystal
- External app connections are not yet implemented (MVP stage)

## localStorage Keys Used

- `node-mother:mother-new:sources`
- `node-mother:mother-new:contributions`
- `node-mother:mother-new:canonical-nodes`
- `node-mother:mother-new:index`
- `node-mother:mother-new:packet-history`

No keys containing "crystal" are written.
