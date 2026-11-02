---
'@livekit/agents-ui': patch
---

Focus the chat input when the control bar's chat opens, and have the Aura visualizer follow
changes to the page's `dark` class. `AgentChatTranscript` now jumps to the end when you send a
message after scrolling up, unless `autoScroll` is off or `scrollAnchor` already anchors your
messages. Remove an unreachable `inert` check from the `AgentPopup_01` error overlay.
