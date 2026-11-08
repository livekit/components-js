---
'@livekit/components-core': patch
'@livekit/components-react': patch
---

Surface text stream lifecycle and stop uncaught `DataStreamError`s. `TextStreamData` now carries a `status` of `pending`/`complete`/`failed`, with the error exposed on failed entries. `useTextStream`'s stream handler now handles read errors (e.g. a sender disconnecting mid-stream) instead of letting RxJS rethrow them globally as uncaught exceptions, and the chat stream handler (`useChat`) does the same. Every error is treated equally — text streams surface it through `status`, and chat logs it.
