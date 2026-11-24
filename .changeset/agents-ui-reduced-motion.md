---
'@livekit/agents-ui': patch
---

Respect `prefers-reduced-motion` in Agents UI: the bar, radial and grid visualizers hold a static frame per agent state instead of cycling, the radial thinking spin and popup trigger's connecting spin are disabled, and `AgentChatIndicator` fades in without pulsing.
