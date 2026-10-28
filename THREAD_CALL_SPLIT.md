# Thread / Call split — proposal

**Status:** draft for review · **Scope:** `@livekit/components-react` session API (`packages/react`)
· **Does not change wire protocol or `livekit-client`.**

## 1. Summary

Today `useSession(tokenSource, options)` does double duty: it owns both a durable, text-mode
conversation (A2A thread, history, message store) **and** a transient voice/room connection (the
`Room`, `start()`/`end()`, `connectionState`). That conflation produces API that lies in text mode —
`start`/`end`/`connectionState`/`isConnected` only make sense for a call.

This proposal splits the surface into two layers that match the backend's own domain model:

- **`useThread`** — the durable conversation. One A2A thread (`contextId` / `AT_…`), its history, its
  message store, its text transport, its agent identity. This is where a text-only chat UI lives.
- **`useCall`** — a transient voice/room connection *attached to a thread*. Owns the `Room`,
  `start()`/`end()`, `connectionState`, local tracks, and agent-connect timeout. A call is, in
  backend terms, "a job dispatch" onto a thread.

`useSession` is **kept** as a thin backwards-compatible wrapper that composes `useThread` + `useCall`,
and — critically — **its public interface matches `20aa613f` (the branch's merge-base with `main`)
byte-for-byte wherever possible.** See §4 and §8.

```
                ┌─────────────────────────────────────────┐
  useThread ──▶ │ Thread (durable)                         │
                │  • TextTransport (A2A text)              │
                │  • message store  ◀── transcripts ──┐    │
                │  • threadId / contextId             │    │
                │  • agent identity                   │    │
                └─────────────────────────────────────┼────┘
                                │ attaches 0..1        │ writes
                                ▼                      │
                ┌─────────────────────────────────────┴────┐
   useCall ──▶  │ Call (transient)                          │
                │  • Room, connectionState, local tracks    │
                │  • start() / end()                        │
                │  • agent-connect timeout                  │
                │  • room token + agent dispatch            │
                └───────────────────────────────────────────┘

  useSession(tokenSource, opts)  ≡  useThread(...) + useCall(thread, ...)   (back-compat composite)
```

## 2. Why do this (and why now)

**The two rough edges we'd otherwise paper over with deprecations.**

1. `session.start()` / `session.end()` read as "start/hang-up call," so in a dual-duty hook they'd
   need renaming (`startCall`/`hangUp`) with deprecated aliases kept forever.
2. `session.connectionState` / `session.isConnected` are meaningless in text mode and would likewise
   need call-specific renames.

Renaming alone keeps the structural debt: a "session" still builds a `Room` for text-only users,
`useAgent` still hangs off the call object, and a text UI still imports a call-shaped thing. You pay
the deprecation tax **and** keep the conflation. The layering pays a one-time cost and removes it.

**It mirrors the backend.** In agents-2.0 the *thread* is the durable primitive (the A2A `contextId`,
one lane per agent holding history/state) and *"a call is a job dispatch"* onto it. The client
vocabulary ends up matching the server's, which pays off every time someone reads both.

**Competitive validation.**
- **OpenAI Agents API** independently split the same way: a durable `session` container managed over
  HTTP (`sessions.list/retrieve/delete`), with messages/turns a *separate* surface ("Fetch items and
  turns"), and realtime handled elsewhere. Durable state ≠ live connection; container control ≠
  items/history. That maps onto `useThread` / `useThreadMessages` / `useCall`.
- **ElevenLabs** is the counter-example: one `useConversation` hook, `startSession()`/`endSession()`
  for both modes, text-vs-voice as a `textOnly` flag, a 3-value *connection* `status`. It's the
  dual-duty hook — and it has **no thread concept and no documented conversation resume**. That
  resumable-thread capability (the thing `loadThreadMessages` already implements here) is precisely
  what we'd be giving up by copying their shape.

**Timing.** The entire session surface is `@beta`. Deprecation cost is near-zero now and only grows.
This is the cheapest moment to get the shape right.

## 3. Naming

| Concept | Name | Rationale |
|---|---|---|
| Durable conversation | **`useThread`** | Matches the backend's own term (`contextId`, `AT_…` ids). Unambiguous. |
| Transient voice/room connection | **`useCall`** | Matches *"a call is a job dispatch"*. "Session" is the most overloaded word in the space (OpenAI = durable container; ElevenLabs = live connection; LiveKit backend = `LiveSession` runtime), so we avoid it for the new layer. |
| Back-compat composite | **`useSession`** | Unchanged name, unchanged public interface (§8). Deprecated in docs in favor of the two layers, but never removed. |

> `useSession` is **not** made polymorphic on its first argument. It keeps its exact `tokenSource`
> signature and becomes a composition internally. No shape-shifting hook.

## 4. Layer assignment of every existing hook / symbol

"Revert to `20aa613f`" below means: restore that symbol to its merge-base form so the diff against
`main` approaches zero; the new behavior this branch added moves into a **new file** instead.

### → Thread layer (new or moved)

| Symbol | Today | Target |
|---|---|---|
| `useThread(tokenSource, opts)` | — | **NEW**. Owns `TextTransport`, the message store, `threadId`/`contextId`, thread-history load (`loadThreadMessages`), the text/A2A credential fetch, and the `threadStarted` event. The signature the user sketched: `useThread(tokenSource, { threadId, agentName, …tokenOptions })`. |
| `useThreadMessages(thread?)` | `useSessionMessages` (augmented on this branch) | **RENAME** to `useThreadMessages`; `useSessionMessages` becomes an alias (§8). Reads the shared store (chat + transcripts) and sends text via the thread's `TextTransport`. See transcription note in §6.2. |
| `useThreadMessageStore()` | `useSessionMessageStore` (`@internal`) | **RENAME** (internal). Exported type names `MessagesEvent` / `MessagesCallbacks` are kept as-is to avoid a public break. |
| `ThreadProvider` | — | **NEW**. Provides `ThreadContext`. |
| `ThreadContext`, `useThreadContext`, `useMaybeThreadContext`, `useEnsureThread` | `SessionContext` + `useEnsureSession` / `useMaybeSessionContext` (`@internal`) | **MOVE/RENAME**. These are what `useAgent` and `useThreadMessages` actually read. The old `Session*` context helpers are kept as thin deprecated shims (§8). |
| `ThreadEvent.ThreadStarted` + `ThreadCallbacks` | `SessionEvent.ThreadStarted` (added on this branch) | **MOVE** onto a `ThreadEvent` enum, emitted via `UseThreadReturn.internal.emitter` (a `TypedEventEmitter<ThreadCallbacks>`). `SessionEvent` reverts to its `20aa613f` members (see below). |
| `TextTransport`, `TextTransportBaseUrl`, `TEXT_CHAT_ROLE_ATTRIBUTE` | `packages/react/src/text-transport/` | Unchanged location; now owned by `useThread`. (Future home is `livekit-client`; keep protocol knowledge here.) |

### → Call layer (mostly a revert + promote)

| Symbol | Today | Target |
|---|---|---|
| `useCall(thread?, opts?)` | internal `useSessionMedia(tokenSource, options, messageStore, threadId)` in `useSession.ts:406` | **PROMOTE to public**. **The `thread` argument is optional**: when omitted, resolve it from `ThreadContext` via `useEnsureThread()`, and throw the same way as today's `useEnsureSession` if there is no provider. Overloads: `useCall(options?)` and `useCall(thread, options?)`. Owns `Room`, local tracks, `start()`/`end()`, `waitUntilConnected/Disconnected`, `prepareConnection`, `setEncryptionEnabled`, E2EE options, `room`-passthrough option. Returns **`UseCallReturn`** (§4a). |
| `SessionConnectOptions` (`tracks`, `roomConnectOptions`, `signal`) | `useSession.ts` | **MOVE** to the call layer (rename to `CallConnectOptions`, keep `SessionConnectOptions` as a deprecated alias). |
| `SessionEvent` (`ConnectionStateChanged`, `MediaDevicesError`, `EncryptionError`) | `useSession.ts` | **REVERT** to `20aa613f` members on a `CallEvent` enum; `SessionEvent` kept as a deprecated alias union for the composite. (`ThreadStarted` leaves — see thread layer.) |
| `useAgentTimeoutIdStore` (`@internal`) | `useAgent.ts` | Call layer — agent-connect timeout is a call concern. |
| `useTranscriptions` | rtc / room | Call layer. Feeds the write-back into the thread store (§6.2). Hook itself unchanged. |
| `useVoiceAssistant` | legacy rtc | Call layer (unchanged; legacy). |
| `useAgentExpression` | rtc | Call layer (unchanged). |
| `withThreadIdMetadata(...)` | `useSession.ts` | Call layer — it injects `thread.threadId` into the **room token's** agent-dispatch metadata (§6.1). |
| `CallProvider` (optional) | — | Optional thin provider that publishes the call's `Room` into `RoomContext`. `SessionProvider` already does the `RoomContext` part; see §8. |

### → Spans both / unchanged

| Symbol | Note |
|---|---|
| `useAgent(hostOrThread?)` | Conceptually belongs to the thread (agent identity is per-thread). **Today it is room-derived** (`agentParticipant`/`workerParticipant`) and its hooks (`useRemoteParticipants`, `useParticipantTracks`) **require a `Room`**. Near-term: `useAgent` accepts an **`AgentHost`** (a call or the composite session — anything with `room` + `connectionState` + the agent-timeout `internal`) directly, **or** a `thread`, from which it resolves the host via `thread.internal.activeCall` (the call `useCall` registers onto the thread). A text-only thread that never had a call has no room → that case (a unified text/idle agent status) is **explicit follow-up** (§7), per your call. Back-compat `useAgent(session)` / `useAgent()` under `SessionProvider` is unchanged (a session is an `AgentHost`). |
| `useChat`, `useTextStream`, `useDataChannel` | Pre-session data-channel chat hooks, independent of this surface. Left as-is. |
| `isUseSessionReturn` | Kept for the composite; add `isUseThreadReturn` / `isUseCallReturn`. |

## 4a. Return-type shapes

Both new layers return **discriminated unions**, built the same way `UseSessionReturn` is today (a
union of per-phase object shapes narrowed by a discriminant), plus a set of actions. `useThread`
discriminates on a lowercase `status` (readiness); `useCall` discriminates on `connectionState` (the
`ConnectionState` enum) exactly as `useSession` does today.

- **`UseThreadReturn`** — discriminated on `status` with a **readiness model** (a thread has no
  persistent socket; text is request/response per turn):
  **`status: 'idle' | 'loadingHistory' | 'ready'`** (thread id / loaded history available at
  `'ready'`). Carries the thread id, `textTransport`, and an **`internal`** key with the message store
  **and a `TypedEventEmitter<ThreadCallbacks>` emitter** that fires **`ThreadEvent.ThreadStarted`**
  (the event that lives on `SessionEvent` today — it moves here and is emitted from the thread's
  emitter when the transport first establishes a `threadId`). Plus thread actions.
- **`UseCallReturn`** — discriminated **exactly like today's `UseSessionReturn`**: on `connectionState`
  (the `livekit-client` `ConnectionState` enum) plus `isConnected`. The three branches are identical to
  the current session union:
  - `connectionState: ConnectionState.Connecting`, `isConnected: false`
  - `connectionState: ConnectionState.Connected | ConnectionState.Reconnecting | ConnectionState.SignalReconnecting`, `isConnected: true`
  - `connectionState: ConnectionState.Disconnected`, `isConnected: false`

  Carries `room`, local tracks, an `internal` emitter for the call events, and the call actions
  (`start`/`end`/…). **`useCall` does not use a lowercase `status` discriminant** — only `useThread`
  does.

**`UseSessionReturn` is reverted to its `20aa613f` shape and is defined independently — it does NOT
reference `UseCallReturn` or `UseThreadReturn`.** This is a deliberate, accepted duplication: freezing
`UseSessionReturn` as its own standalone type is what guarantees the public interface does not drift.
Because `UseCallReturn` carries the identical `connectionState` / `isConnected` shape, the composite
`useSession` maps it through to the frozen `UseSessionReturn` with no translation.

## 5. What the API looks like

**New idiom — text only:**
```tsx
const thread = useThread(tokenSource, { threadId: 'AT_…', agentName: 'dentist' });
thread.status;   // 'idle' | 'loadingHistory' | 'ready'
useEvents(thread, ThreadEvent.ThreadStarted, (id) => {/* new thread established */});
// <ThreadProvider thread={thread}> … </ThreadProvider>
const { messages, send, isSending } = useThreadMessages(thread);
const { status } = useAgent(thread);
```

**New idiom — add a voice call to that thread:**
```tsx
const call = useCall(thread, { /* tracks, roomConnectOptions, encryption… */ });
// or, under a <ThreadProvider>, omit the thread and it is read from context:
//   const call = useCall({ /* tracks… */ });
await call.start();     // connects the room + dispatches the agent against thread.threadId
await call.end();       // disconnects the room; the thread (and its history) survive
call.connectionState;   // ConnectionState enum + call.isConnected (identical to useSession today)
```

**Back-compat — unchanged from today / `main`:**
```tsx
const session = useSession(tokenSource, { threadId, textBaseUrl, agentName, /* tracks… */ });
const { messages, send } = useSessionMessages();   // alias → useThreadMessages
await session.start();                             // alias → call.start()
session.connectionState;                           // call connection state
```

## 6. Design details the split forces (each an improvement)

### 6.1 Token-fetch split (thread text token vs. call room token + dispatch)

Today `useSession`'s options are a grab-bag that mixes thread concerns (`threadId`, `textBaseUrl`)
with call/dispatch concerns (`agentName`, `deployment`, `roomConfig`, `tracks`). The layering gives
each option a home:

- **Thread** needs a credential to call the A2A **text** endpoint (the `agentEndpoint`-claim token)
  and the `textBaseUrl`; it uses `threadId` as the A2A `contextId`.
- **Call** needs the **room** token carrying the agent dispatch (`roomConfig.agents = [{ agentName,
  deployment, metadata }]`), where `metadata` carries `thread_id` so the dispatched agent joins the
  **same** thread. `useCall(thread)` injects `thread.threadId` via `withThreadIdMetadata(...)`.

> This is the exact seam we just debugged: the dispatch is a *call* artifact that needs the *thread's*
> id. The layering makes that dependency explicit instead of incidental.

**Minimize-diff note:** today a single minted token carries *both* the `video` grant and
`agentEndpoint`, and one `tokenSourceFetch` serves both the `TextTransport` credential and
`room.connect`. To keep behavior identical and the diff small, the thread owns that one
`tokenSourceFetch` and the call borrows it (via `thread.internal`), with dispatch options layered on
for the room token. A later cleanup can mint two scoped tokens; not required for this change.

### 6.2 Transcription write-back (keep "all messages in one place")

Room data-channel transcripts are a **call** artifact but belong in the **thread's** history. So:

- The **call** layer runs `useTranscriptions({ room })` and **upserts** the derived messages into
  `thread`'s message store.
- `useThreadMessages` becomes a store **reader** + text **sender** — it does not reach into a room.
  That keeps it room-free (so text-only works with no call) while the store still contains chat **and**
  transcripts, preserving today's "all messages in one place" behavior.

This moves the transcription-derivation that currently lives in `useSessionMessages` into the call
layer. It is new-file work; `useThreadMessages` is a new file and `useCall` gains a small write effect.

### 6.3 Message store ownership

The store (`useSessionMessageStore` → `useThreadMessageStore`) moves wholesale to the thread. It is
unchanged internally (dedupe/sort/emit). The thread exposes it on `internal`; the call writes to it;
`useThreadMessages` reads it.

### 6.4 Providers & context (your `SessionProvider` idea)

- `useAgent` and `useThreadMessages` are repointed to read **`ThreadContext`**.
- `ThreadProvider` (new) publishes `ThreadContext`. A thread with a call also needs the `Room` in
  `RoomContext`; the call publishes that (an optional `CallProvider`, or `SessionProvider` as below).
- **`SessionProvider` is kept and deprecated.** Per your suggestion, the composite `session` carries a
  back-reference to its thread, and `SessionProvider` reads it and publishes `ThreadContext` (and
  `RoomContext`, as it already does) behind the scenes — so existing `useSessionMessages()` /
  `useAgent()` calls under a `SessionProvider` keep working with zero changes.
- **On the back-reference:** a plain reference on `session.internal.thread` is sufficient and simplest
  — the session and its thread share a lifetime, so there is no leak to avoid. A `WeakRef` adds
  ceremony without benefit here; recommend a plain reference unless a concrete cycle shows up.
  (`internal` is unstable, so adding this field does not affect the byte-for-byte *public* interface.)

## 7. Explicitly out of scope (follow-ups)

- **Unified `useAgent` status across text + rtc.** Today agent state is room-derived. A single status
  machine that is coherent whether or not a call is active needs its own design pass (text-mode agent
  progress comes from A2A `statusUpdate`s, not a room participant). `useAgent(thread)` ships now with
  room-derived state via the active call; the unified machine is a later change. *(Per your note:
  "eventually yes … save this for a follow-up.")*
- Minting two separately-scoped tokens (text vs room) instead of one dual-grant token (§6.1).

## 8. Backwards-compatibility contract (hard requirement)

**`useSession`'s public interface MUST match `20aa613f` byte-for-byte wherever possible**, to keep the
eventual diff against `main` minimal. Concretely:

- Restore the exported `UseSessionReturn`, `SessionActions`, `SessionConnectOptions`,
  `SwitchActiveDeviceOptions`, the `SessionEvent` enum members, `isUseSessionReturn`, and the
  `useSession` overload signatures to their `20aa613f` text. The text-mode members this branch added
  to `useSession` (`textTransport` on the return; `threadId` / `textBaseUrl` options;
  `messageStore` on `internal`; `ThreadStarted` on `SessionEvent`) are **removed from `useSession`**
  and live on `useThread` instead.
  - *Allowed deviation:* `internal` is explicitly unstable and may gain a `thread` back-reference
    (§6.4). Keep public (non-`internal`) fields identical.
  - `UseSessionReturn` is defined standalone and does **not** reference `UseCallReturn` /
    `UseThreadReturn` (§4a). The duplication is intentional and is what freezes the interface.
- `useSession`'s **implementation** changes (it becomes `useThread` + `useCall` composed and returns
  the `20aa613f`-shaped object), but that is implementation, not interface.
- `useSessionMessages()` → **alias** of `useThreadMessages()`; resolves its thread from context (works
  under a `SessionProvider` via the back-reference).
- `useSessionMessageStore`, `SessionProvider`, `SessionEvent`, `SessionConnectOptions`,
  `useEnsureSession` / `useMaybeSessionContext` / `useSessionContext` are kept as deprecated aliases
  / shims. Nothing exported today is removed.

> Net effect for a `main` reader: `useSession.ts` and `useSessionMessages.ts` diffs shrink toward
> their merge-base; all genuinely new behavior lands in **new files** (`useThread.ts`, `useCall.ts`,
> `useThreadMessages.ts`, `ThreadProvider.tsx`, `thread-context.ts`), which are pure additions.

## 9. Implementation plan (ordered to keep each step reviewable)

> **One git commit per numbered step below**, each self-contained and (where possible) type-checking +
> tests-green on its own.

> **Build order note:** `useThread` is built first because `useCall(thread)` consumes
> `thread.internal.tokenSourceFetch` / `messageStore` / `threadId`. Steps 1–2 are purely **additive**
> (new files + a backward-compatible broadening of `useAgent`'s parameter); `useSession` is not touched
> until step 3, so the tree keeps building and behaving as today throughout 1–2.

1. **Add `useThread` + thread infrastructure (additive).** New `useThread.ts` owning `TextTransport`,
   the message store, `threadId` state, the shared `tokenSourceFetch`, `loadThreadMessages` seeding,
   the `status` readiness union, and the `internal.emitter` firing `ThreadEvent.ThreadStarted`. Add
   `ThreadProvider` + `thread-context.ts`, and rename `useSessionMessageStore` → `useThreadMessageStore`
   (keep the `MessagesEvent` / `MessagesCallbacks` exports). Also holds `internal.activeCall` +
   `registerCall` so `useAgent(thread)` can resolve a host. Does not touch `useSession`.
2. **Add `useCall` (additive) + broaden `useAgent`.** New `useCall.ts` extracting the
   `useSessionMedia` logic, retargeted to `useCall(thread?, opts?)` (thread from arg or
   `useEnsureThread()`): owns the `Room` (+encryption), `connectionState`, local tracks,
   `start`/`end`/`waitUntil*`/`prepareConnection`/`setEncryptionEnabled`, `useAgentTimeoutIdStore`,
   `withThreadIdMetadata`, the reconnect-on-`threadId` effect, the transcription write-back into
   `thread`'s store, and registering itself as `thread.internal.activeCall`. Returns `UseCallReturn`
   (the `connectionState`/`isConnected` union + `CallConnectOptions` + `CallEvent`). Broaden
   `useAgent` to accept an `AgentHost` or a `thread` (back-compat preserved). Does not touch
   `useSession`.
3. **Rebuild `useSession` as the composite**, restoring its `20aa613f` public interface exactly
   (§8), implemented over `useThread` + `useCall`, with the `internal.thread` back-reference.
4. **Aliases & shims.** `useSessionMessages` → `useThreadMessages`; repoint `SessionProvider` to
   publish `ThreadContext` via the back-reference; keep the `Session*` context helpers as deprecated
   shims.
5. **Tests.** Port the message-store tests; add thread-only (no call), call-attached-to-thread, and
   back-compat (`useSession` still returns the `20aa613f` shape; transcripts land in the store) cases.
6. **Example.** Update `examples/nextjs/pages/agent.tsx` to the new idiom (`useThread` + optional
   `useCall`), demonstrating text-only and text+voice. Back-compat path stays exercised by a second
   example or a test.

## 10. Risks / open questions

- **Provider nesting.** `ThreadProvider` ⊃ call. The `SessionProvider` back-reference keeps old code
  working; new code needs the nesting right. Documented in §6.4.
- **Faithful composite.** The composite must reproduce today's behaviors exactly: reconnect-on-
  `threadId`-change, token refetch-on-disconnect (the "agents won't rejoin a prior room" workaround),
  and the shared store. These are the highest-risk lines; they move largely intact from
  `useSessionMedia` + the current `useSession` effects.
- **Single vs. dual token (§6.1).** Resolved for now as "keep one shared token"; revisit later.
- **`useAgent` unification (§7).** Deferred; `useAgent(thread)` ships room-derived.
- **Store rename blast radius.** `useSessionMessageStore` → `useThreadMessageStore` is `@internal`;
  the exported `MessagesEvent` / `MessagesCallbacks` names are preserved to avoid any public break.
