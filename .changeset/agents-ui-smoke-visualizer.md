---
'@livekit/agents-ui': minor
---

Add `AgentAudioVisualizerSmoke`, a shader visualizer that renders a ball of swirling smoke with a
glowing core. It reacts to agent state and audio volume, follows the page theme, and breaks up into
thin, see-through wisps when the agent is idle, failed, or disconnected.

Fix `ReactShaderToy` drawing every frame twice. Both its setup code and its visibility observer
started a draw loop, so all shader visualizers (Aura, Wave, Smoke) did double the GPU work.
