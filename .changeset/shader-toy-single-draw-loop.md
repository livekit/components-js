---
'@livekit/agents-ui': patch
---

Fix `ReactShaderToy` drawing every frame twice. Its setup code and its visibility observer each
started a draw loop. All shader visualizers (Aura, Wave) did double the GPU work until the canvas
left the screen and came back.
