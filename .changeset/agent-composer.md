---
'@livekit/agents-ui': minor
---

Add `AgentComposer`, a text input for sending messages to an agent, with `AgentComposerInput`,
`AgentComposerActions`, and `AgentComposerSubmit` parts and a headless `useAgentComposer` hook.
It sends through the session's chat by default. Enter no longer sends while an input method editor
is composing, and you can keep typing while a message sends. `AgentControlBar` now uses it for its
chat input.
