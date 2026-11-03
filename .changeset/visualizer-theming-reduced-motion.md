---
'@livekit/agents-ui': minor
---

The audio visualizers accept any CSS color for `color`, including theme variables such as
`var(--primary)`, instead of only hex values. Aura and Wave read a theme variable again when the
page theme changes, so they follow light and dark mode.

The visualizers respect reduced motion. When the system asks for less motion, they hold still
between states instead of looping, Radial stops spinning while thinking, and Aura and Wave stop
drifting and pulsing. They still follow the agent's voice while it speaks.

Aura and Wave now list `motion` as a registry dependency, which they already needed.
