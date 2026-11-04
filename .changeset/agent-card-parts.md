---
'@livekit/agents-ui': minor
---

Adds card parts for showing what an agent is working on in the conversation, such as an order, a
booking, or a form it's filling in.

- `AgentCard` is a labeled container. Its label names it for screen readers.
- `AgentCardRows`, `AgentCardRow`, and `AgentCardTotal` show label and value rows, with an optional
  check or pending mark, a quantity, a badge, and a total. A `current` row highlights the field the
  conversation is on.
- `AgentCardDetail` is a quiet line with an icon, such as a delivery address.
- `AgentStatusLine` is a one-line status card with a mark, a status, and a small line under it.
  `AgentStatusChange` shows a value changing, such as a rescheduled time.

Screen reader text for the marks can be reworded or translated with `labels`.
