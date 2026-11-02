---
'@livekit/agents-ui': minor
---

Add `AgentComposer`, a text input for sending messages to an agent, with `AgentComposerInput`,
`AgentComposerActions`, and `AgentComposerSubmit` parts and a headless `useAgentComposer` hook.
It sends through the session's chat by default and clears as soon as you send, so you can send the
next message right away. Enter no longer sends while an input method editor is composing.
`AgentControlBar` now uses it for its chat input.

`AgentChatTranscript` marks messages that failed to send, and shows a "Try again" button when you
pass `onResend`. A retried message shows that it's sending until it goes through or fails again.
`AgentSessionView_01` passes `resend` from `useSessionMessages`.
