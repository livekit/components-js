---
'@livekit/agents-ui': patch
---

Focus the chat input when the control bar's chat opens, and have the Aura visualizer follow
changes to the page's `dark` class. `AgentSessionView_01` now jumps its transcript to the end when
you send a message after scrolling up, through a new `scrollToEndOnLocalMessage` prop on
`AgentChatTranscript`. Remove an unreachable `inert` check from the `AgentPopup_01` error overlay.
