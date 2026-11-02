---
'@livekit/agents-ui': minor
---

Add `AgentComposer`, a text input for sending messages to an agent, with `AgentComposerField`,
`AgentComposerInput`, `AgentComposerActions`, `AgentComposerSubmit`, and
`AgentComposerCharacterCount` parts and a headless `useAgentComposer` hook.
It sends through the session's chat by default and clears as soon as you send, so you can send the
next message right away. With `maxLength`, the character count below the field shows how many
characters are left; typing past the limit is allowed, the count goes negative, and sending waits
until the message fits. Enter no longer sends while an input method editor is composing.
`AgentControlBar` now uses it for its chat input.

`AgentChatTranscript` marks messages that failed to send, and shows a "Try again" button when you
pass `onResend`. A retried message shows that it's sending until it goes through or fails again.
Your own messages show as plain text, so line breaks
from Shift+Enter stay as you typed them. `AgentSessionView_01` passes `resend` from
`useSessionMessages`.
