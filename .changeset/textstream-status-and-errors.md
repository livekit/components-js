---
'@livekit/components-core': patch
'@livekit/components-react': patch
---

Surface text stream lifecycle and stop uncaught `DataStreamError`s. `TextStreamData` now carries a `status` of `'pending' | 'complete' | 'failed'`, and failed entries expose the `error` that ended the read. Previously a sender disconnecting mid-stream errored the open reader and, because `setupTextStream` subscribed without an `error` handler, RxJS rethrew it globally from a timer — surfacing as an uncaught `DataStreamError` that no application code could catch. The error is now handled: the stream is marked `failed` (keeping whatever text arrived), a clean close marks it `complete`, and consumers like `useTranscriptions` can decide what a partial or failed stream means.
