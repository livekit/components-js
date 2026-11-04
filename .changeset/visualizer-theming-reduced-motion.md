---
'@livekit/agents-ui': minor
---

The audio visualizers accept any CSS color for `color`, including theme variables such as
`var(--primary)`, instead of only hex values. Aura and Wave read a theme variable again when the
page theme changes, so they follow light and dark mode.

The visualizers respect reduced motion. When the system asks for less motion, they hold still
between states instead of looping, Radial stops spinning while thinking, and Aura and Wave stop
drifting and pulsing, and their shaders draw only when something changes instead of every frame.
They still follow the agent's voice while it speaks.

Aura and Wave draw each frame once. Their shaders had been running two render loops at the same
time, doubling the work.

Aura's theme mode, when `themeMode` isn't set, also follows a `dark` theme attribute such as
`data-theme="dark"` and `color-scheme: dark`, along with the `dark` class.

Aura and Wave have a fallback for browsers without WebGL, where they used to render nothing. Aura
shows a still glow and Wave a flat line, in the same color, growing and fading with the agent's
state.

`ReactShaderToy` takes `paused`, which draws only when its uniforms change, and `onUnsupported`,
called when WebGL isn't available or the shader fails to compile.

Aura and Wave now list `motion` as a registry dependency, which they already needed.
