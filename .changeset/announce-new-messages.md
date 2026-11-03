---
'@livekit/agents-ui': minor
---

`AgentChatTranscript` announces new messages from the agent and other participants to screen
readers. It waits until a message stops changing, so streaming replies aren't read word by word,
and a reply that keeps going after a pause announces only the new part. Each message waits for its
own pause, so a long reply doesn't hold back others, and a rewritten message is announced again in
full. Your own messages and history aren't announced: what's on screen at mount, messages that
arrive together, and messages loaded above the conversation. Markdown is read as plain text, and an
unfinished link or code span waits a moment to finish.

- `announceMessages` chooses what's announced: `'all'` (the default), `'typed'` to skip spoken
  transcripts, or `'none'`. `AgentSessionView_01` uses `'typed'`, since the agent's voice already
  says its transcripts aloud.
- `labels.messageAnnouncement` gets the text and its message, and says who's speaking: "Agent" for
  agents, and the participant's name for anyone else.
