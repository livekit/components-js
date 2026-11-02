---
'@livekit/components-core': minor
'@livekit/components-react': minor
---

Show sent chat messages right away. `send` now adds the message as soon as it's called, with a
`status` of `sending`, then `sent` or `failed`, and keeps a failed message in place. Use the new
`resend` from `useChat` or `useSessionMessages` to send it again. Messages sent from this client now
keep a local id for their whole lifetime instead of taking the text stream id once sent.
