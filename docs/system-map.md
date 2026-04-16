# System Map

- `src/core/` — torus core dynamics and physical disk.
- `src/perception/` — touch memory and live pointer/touch perception.
- `src/organism/` — shared runtime state, heartbeat, disk updates, organism action loop.
- `src/bridge/` — torus packetization and Signal Runtime bridge entry.
- `src/signal/` — current prediction / proto-meaning / utterance pipeline used by the bridge.
- `src/render/` — reality visual layer and scene-side visualization.
- `src/ui/` — guide panel, DOM cache, metrics UI, debug panels.
- `src/types/` — shared active TypeScript contracts.
- `src/utils/` — local UI and math helpers.
- `archive/` — inactive prototypes, preserved notes, and old references.
