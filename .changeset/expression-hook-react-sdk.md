---
'@livekit/components-react': patch
'@livekit/agents-ui': patch
---

Add `useExpression` to the React SDK, reading the mood the agent publishes on `lk.expression`. Removes the `agent-expression` registry item and its color utilities: mapping a mood to a color is example glue, not library code.
