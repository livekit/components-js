---
'@livekit/agents-ui': patch
---

Small fixes across Agents UI:

- Focus the chat input when the control bar's chat opens.
- Have the Aura visualizer follow changes to the page's `dark` class, and keep its light-mode color
  consistent across agent states. Resting states no longer wash out to a lighter blue, and pulses
  fade lighter toward the background.
- Jump `AgentChatTranscript` to the end when you send a message after scrolling up, unless
  `autoScroll` is off or `scrollAnchor` already anchors your messages.
- Remove an unreachable `inert` check from the `AgentPopup_01` error overlay.
