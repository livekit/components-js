---
'@livekit/components-react': patch
---

Fix the agent-connect timeout leaking when a session ends early, which could fail the next session before its agent had a chance to connect.
