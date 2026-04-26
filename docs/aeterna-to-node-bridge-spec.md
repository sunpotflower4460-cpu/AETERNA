# AETERNA → Node Bridge Specification

**Phase 8: AETERNA → Node bridge 最小版**

This document defines the boundary between AETERNA (torus life-field observation side)
and a future Node receiver. It serves as the formal spec for packet exchange.

---

## Purpose

AETERNA observes structural candidates and field tendencies in a pre-semantic form.
This bridge carries those observations to a Node side that may, in the future, apply
structural interpretation, pattern recognition, or meaning-making.

**AETERNA does not assign meaning.**  
**AETERNA passes observations.**  
**Node side handles any later structural work.**

---

## Packet Direction

```
AETERNA (observation) ──→ Node (future structural side)
```

This is a **one-way bridge** in Phase 8.

**Node → AETERNA feedback is NOT implemented in this phase.**  
Feedback in the reverse direction, if ever introduced, belongs to a future separate phase.

---

## What AETERNA Sends

### Summary Packet: `AeternaObservationPacket`

| Group | Fields | Description |
|---|---|---|
| `fieldState` | `ongoingness`, `stability`, `volatility`, `boundaryIntegrity`, `recoveryPressure`, `collapseRisk` | Current life-field state (all proxy values) |
| `patternCandidates` | `knotCount`, `pathCount`, `recurrenceLocusCount`, `basinCount`, `longLivedAnomalyCount`, `protoPointCandidateCount` | Structural candidate counts from Phase 5/7 observers |
| `pressureState` | `safetyPressure`, `restorationPressure`, `noveltyPressure`, `repetitionPressure`, `explorationPressure`, `withdrawalPressure` | Pre-semantic pressure tendencies from Phase 6 observer |
| `traceState` | `traceStrength`, `replayReadiness`, `recurrenceWeight`, `salienceResidue` | Residue / replay indicators from Phase 4 observer |
| (optional) | `confidence` | Observation stability proxy (NOT semantic confidence) |
| (optional) | `longCycleCoherenceShift` | Slow coherence drift (proxy) |
| (optional) | `packetVersion` | Format version string |

### Detailed Packet: `AeternaPatternCandidatePacket` (optional)

When summary counts are insufficient, a separate detailed packet may be generated
containing per-candidate records:

- `protoPointCandidates[]` — per-slot: `candidateId`, `regionId`, `persistence`, `recurrenceScore`, `traceAffinity`, `replayAffinity`, `localContrast`, `confidence`
- `knotCandidates[]` — optional per-knot records

---

## What AETERNA Does NOT Send

The following are **forbidden** in any AETERNA → Node packet:

| Forbidden Field | Reason |
|---|---|
| `label` | Semantic labeling is not AETERNA's responsibility |
| `meaning` | Meaning-making belongs to the Node side |
| `concept` | Concepts are post-semantic; AETERNA observes pre-semantic |
| `category` | Category assignment is semantic |
| `sameObject` | Object identity / same-object detection is Node-side |
| `objectId` | Object identity belongs to Node |
| `teacherVerdict` | No teacher binding in AETERNA |
| `language` | Natural language is not produced here |
| `utterance` | AETERNA does not produce utterances |
| `semanticNode` | No semantic nodes in AETERNA |
| `objectLabel` | No object labels in AETERNA |
| `teacherBinding` | No teacher binding |
| `nodeBridge` | Not a semantic node bridge |
| `naturalLanguage` | No natural language production |
| `interpretation` | Interpretation belongs to the Node side |

The sanitizer (`sanitizeAeternaObservationPacket`) strips any of these if found and
records the event as a semantic leak (target: 0 leaks).

---

## Packet Properties

### Read-Only Rule

Packets are exported for observation. They must NOT:
- Be written back to AETERNA organism state
- Modify organism core dynamics
- Trigger any feedback loop into AETERNA

### No Semantic Guarantee

Packets contain pre-semantic proxy observations. They do NOT guarantee:
- That the named structural candidates truly exist
- That counts are accurate measurements
- That pattern names correspond to real structures
- That field state values are precise measurements

All values are proxy-derived. The Node side must treat them accordingly.

### No Direct Feedback Rule

Node → AETERNA feedback is reserved for a future phase and must not be
implemented by connecting the packet receiver back into AETERNA state updates.

---

## Observation Vocabulary (sent by AETERNA)

These terms are **observer-side shorthand**, not semantic claims:

| Term | Observer meaning |
|---|---|
| `knot candidate` | Locally recurring activity cluster in the life-field |
| `path candidate` | Flow-path candidate — activity propagation channel |
| `recurrence locus` | Area that re-activates across events |
| `basin candidate` | Stable-return zone candidate |
| `long-lived anomaly` | Persistent deviation surviving recovery |
| `proto-point candidate` | Region accumulating multiple observation criteria |
| `recovery pressure` | Field tendency toward settling / recovery |
| `stability` | Concentration of dominant pressure tendency |
| `volatility` | Temporal variability / fluctuation level |
| `long-cycle coherence shift` | Slow drift in phase coherence |

---

## Node Side — Future Responsibilities

The Node side will, in a future phase, be responsible for:

1. **Receiving packets** from AETERNA (via exporter, not direct state access)
2. **Evaluating pattern candidates** — deciding whether to treat them as node-candidate structures
3. **Structural interpretation** — any conversion of observation into structural memory is Node-side work
4. **Potential Mother storage** — if candidates are worthy of longer-term storage, Node side handles that
5. **Semantic meaning assignment** — AETERNA packets must NOT be treated as semantic nodes directly
6. **Natural language interface** — any human-facing description of AETERNA state is Node-side work
7. **Same-object detection** — not AETERNA's role

The Node side must NOT:
- Treat AETERNA packet fields as confirmed facts
- Immediately convert `protoPointCandidateCount > 0` to a semantic node
- Write observations back into AETERNA dynamics

---

## Mock Receiver Interface (Placeholder)

The following interface describes what a Node receiver would accept.
It is NOT implemented in Phase 8 — it is a placeholder for future integration.

```typescript
// NOT implemented in Phase 8 — placeholder only

interface NodeObservationReceiver {
  /**
   * Receive a pre-semantic observation packet from AETERNA.
   * Node side decides what to do with it.
   * Must NOT write back to AETERNA state.
   */
  receiveObservationPacket(packet: AeternaObservationPacket): void;

  /**
   * Optionally receive detailed candidate packet.
   */
  receivePatternCandidatePacket?(packet: AeternaPatternCandidatePacket): void;
}
```

---

## Sanitizer Guarantee

Before any packet reaches the Node boundary, it must be processed by
`sanitizeAeternaObservationPacket`. The sanitizer guarantees:

1. All forbidden semantic fields are stripped
2. All numeric values are finite (NaN / Infinity → 0)
3. Values are within valid ranges
4. `packetVersion` is set
5. `source` is `'aeterna'`

Semantic leak count is tracked per-packet and must remain **0** in normal operation.

---

## File Locations

| File | Role |
|---|---|
| `src/types/aeternaObservationPacket.ts` | Main packet type definition |
| `src/types/aeternaPatternCandidatePacket.ts` | Detailed candidate packet type |
| `src/types/aeternaToNodeBridgeBoundary.ts` | Boundary constants and type |
| `src/bridge/exportAeternaObservationPacket.ts` | Packet assembly (pure function) |
| `src/bridge/sanitizeAeternaObservationPacket.ts` | Packet sanitizer and forbidden-field check |
| `src/tests/scenario/aeternaObservationPacketScenario.ts` | Headless scenario for packet export |
| `src/tests/behavioral/aeternaToNodePacketBoundary.test.ts` | Semantic leak and boundary tests |
| `docs/aeterna-to-node-bridge-spec.md` | This file |
