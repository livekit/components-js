---
'@livekit/agents-ui': minor
---

Add `AgentComposer`, a text input for sending messages to an agent, with `AgentComposerField`,
`AgentComposerInput`, `AgentComposerActions`, `AgentComposerMicrophone`, `AgentComposerSubmit`,
and `AgentComposerCharacterCount` parts and a headless `useAgentComposer` hook.

- It sends through the session's chat by default and clears as soon as you send, so you can send
  the next message right away. While the session connects, it's disabled and says so.
- Its microphone button turns the session's microphone on so the agent can hear you, shows the
  microphone's level while it's on, and changes the placeholder to "Listening…". It shows a spinner
  while the microphone starts, and says when access is blocked or there's no microphone. With
  `onSend`, pass `listening`, `onListeningChange`, `microphoneTrack`, `microphonePending`, and
  `microphoneError` to use it.
- With `maxLength`, a count like "12/200" sits beside the buttons in a row below the input; typing
  past the limit is allowed, the count turns red, and sending waits until the message fits. Emoji
  and accented letters count as one character.
- Pass `responding` and `onStop` to turn the send button into a stop button while the agent
  replies.
- Pass `draftKey` to keep unsent text across reloads.
- Enter sends and Shift+Enter adds a new line; on touch screens, Return adds a new line. Enter no
  longer sends while an input method editor is composing.
- `labels` rewords or translates its text.
- Without `onSend`, the microphone button hides when the participant can't publish audio.
- Calling `preventDefault` in `onSubmit` cancels the send.

`AgentControlBar` now uses it for its chat input. A message that fails to send goes back in the
input, unless something new has been typed. `restoreFailedMessages={false}` turns this off for a
transcript that already offers a retry, as `AgentSessionView_01` does.

`AgentChatTranscript` marks messages that failed to send, announces them to screen readers, and
shows a "Try again" button when you pass `onResend`. A retried message shows that it's sending until
it goes through or fails again. Your own messages show as plain text, so line breaks from
Shift+Enter stay as you typed them. `labels` rewords or translates its text. `AgentSessionView_01`
passes `resend` from `useSessionMessages`.
