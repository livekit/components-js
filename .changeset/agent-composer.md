---
'@livekit/agents-ui': minor
---

Add `AgentComposer`, a text input for sending messages to an agent, with `AgentComposerField`,
`AgentComposerInput`, `AgentComposerActions`, `AgentComposerMicrophone`, `AgentComposerSubmit`,
and `AgentComposerCharacterCount` parts and a headless `useAgentComposer` hook. It sends through
the session's chat by default and clears as soon as you send, so you can send the next message
right away. Its microphone button turns the session's microphone on so the agent can hear you and
shows the microphone's level while it's on, and the input's placeholder changes to "Listening…".
With `onSend`, pass `listening`, `onListeningChange`, and `microphoneTrack` to use it. With
`maxLength`, a count like "12/200" sits beside the buttons in a row below the input; typing past
the limit is allowed, the count turns red, and sending waits until the message fits. Enter no
longer sends while an input method editor is composing. `AgentControlBar` now uses it for its chat
input.

`AgentChatTranscript` marks messages that failed to send, and shows a "Try again" button when you
pass `onResend`. A retried message shows that it's sending until it goes through or fails again.
Your own messages show as plain text, so line breaks from Shift+Enter stay as you typed them.
`AgentSessionView_01` passes `resend` from `useSessionMessages`.

`AgentTrackToggle` has a new `ghost` variant with no background until hovered.
