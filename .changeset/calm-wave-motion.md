---
'@livekit/agents-ui': patch
---

Respect reduced-motion preferences in the wave audio visualizer. Render still,
state-specific waves without pulsing or volume-driven deformation, respond to
preference changes without reloading, and pause shader rendering between updates.
