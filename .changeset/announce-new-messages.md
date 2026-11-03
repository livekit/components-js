---
'@livekit/agents-ui': minor
---

`AgentChatTranscript` announces new messages from the agent and other participants to screen
readers. It waits until a message stops changing, so streaming replies aren't read word by word,
and a reply that keeps going after a pause announces only the new part. Messages already on screen
and your own messages aren't announced, and Markdown is read as plain text.

- `announceMessages` chooses what's announced: `'all'` (the default), `'typed'` to skip spoken
  transcripts, or `'none'`. `AgentSessionView_01` uses `'typed'`, since the agent's voice already
  says its transcripts aloud.
- `labels.messageAnnouncement` gets the text and its message, and says who's speaking: "Agent" for
  agents, and the participant's name for anyone else.
