---
'@livekit/components-react': patch
---

Prevent crash when `settings` control is enabled in `ControlBar`.

Replace `useLayoutContext()` with `useMaybeLayoutContext()` in
`useSettingsToggle` to handle cases where `LayoutContext` is not provided,
preventing crashes when settings control is enabled in `ControlBar` component.
