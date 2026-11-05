---
'@livekit/agents-ui': minor
---

The audio visualizers accept any CSS color for `color`, including theme variables such as
`var(--primary)`, instead of only hex values. You can also color them with a text color class such
as `text-primary`. Aura and Wave read the resolved color again when it changes, so a theme variable
follows light and dark mode. They ignore alpha; set `opacity` on the visualizer instead.

The visualizers respect reduced motion. When the system asks for less motion, they hold still
between states instead of looping, Radial stops spinning while thinking, and Aura and Wave stop
drifting and pulsing, and their shaders draw only when something changes instead of every frame.
They still follow the agent's voice while it speaks.

Aura and Wave draw each frame once. Their shaders had been running two render loops at the same
time, doubling the work.

Aura and Wave have a fallback for browsers without WebGL, where they used to render nothing. Aura
shows a still glow and Wave a flat line, in the same color, growing and fading with the agent's
state.

`ReactShaderToy` takes `paused`, which draws only when its uniforms change, and `onUnsupported`,
called when WebGL isn't available or the shader fails to compile.

Aura and Wave now list `motion` as a registry dependency, which they already needed.
