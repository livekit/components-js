# mock-a2a

A mock LiveKit agent-run endpoint, for developing a client SDK against the protocol in
_Delegation Model with A2A v2_ before the framework side of it exists.

It serves both bindings the design doc defines over one endpoint subtree, gated by a real
LiveKit access token, and answers every turn with a canned scripted response you can steer
from the chat box.

- **Native binding** — `POST /<endpoint>`, `RunRequest` in, server-sent `RunResponse`
  events out, terminated by exactly one `RunComplete`.
- **A2A binding** — the same engine projected onto **A2A v1.0.1**, so a third-party A2A
  client can drive the same agent.

Nothing here talks to LiveKit Cloud. The api key/secret are only used to verify the
tokens your client presents.

## Quick start

```bash
cd mock-a2a
cp .env.example .env      # any dev key/secret pair; must match whatever mints your tokens
pnpm install
pnpm dev                  # http://localhost:8787
```

In another terminal:

```bash
pnpm smoke                # drives both bindings and every error path; exits non-zero on failure
pnpm token                # print a token to paste into curl
```

`pnpm install` works here without `--ignore-workspace` because this package carries its own
`pnpm-workspace.yaml` with an empty `packages:` list, which stops pnpm walking up to the
repo root. Without it, `pnpm install` run from this directory reinstalls all 11 workspace
projects instead of this one.

There is no build step: the server runs straight off TypeScript source via
`node --experimental-strip-types`, the same way `packages/shadcn/scripts/*` do. Run
`pnpm typecheck` for `tsc --noEmit`.

## Routes

```
POST /<endpoint>                            ours: RunRequest -> SSE of RunResponse
POST /<endpoint>:cancel                     ours: CancelRunRequest -> 202
POST /<endpoint>/message:stream             A2A  SendMessageRequest -> SSE of StreamResponse
POST /<endpoint>/message:send               A2A  SendMessageRequest -> Task
POST /<endpoint>/tasks/<id>:cancel          A2A  CancelTask -> Task
GET  /<endpoint>/tasks/<id>:subscribe       A2A  501, not implemented
GET  /<endpoint>/.well-known/agent-card.json    the card, where the doc places it (no auth)
GET  /.well-known/agent-card.json               the card, host-rooted per RFC 8615 (no auth)
```

`<endpoint>` defaults to `fare-desk`; set `MOCK_ENDPOINTS` to change or add more. Anything
else 404s, so a typo in your client's URL fails loudly.

Both cards are served because RFC 8615 well-known URIs are host-rooted — a conformant A2A
client fetches the second — while the design doc places the card under the endpoint
subtree, so a client built to the doc asks for the first.

## Auth

`Authorization: Bearer <livekit-jwt>` on every route except the two card paths. The token's
signature and expiry are verified with `TokenVerifier` against `LIVEKIT_API_KEY` /
`LIVEKIT_API_SECRET`; a bad, wrong-key or expired token gets a 401. The card is
unauthenticated on purpose — it is what a client reads _before_ it has a token.

If the request body omits `sessionId`, the token's `video.room` grant stands in.

## Scenarios

Every response path is reachable without restarting the server. Precedence:

1. `?scenario=<name>` on the query string
2. `"mockScenario": "<name>"` inside the request's `metadata` JSON
3. a keyword as the first word of the input text
4. `MOCK_SCENARIO`, default `full`

| keyword     | scenario         | what you get                                                                     |
| ----------- | ---------------- | -------------------------------------------------------------------------------- |
| _(none)_    | `full`           | tool call, a progress report, the tool result, an assistant message, `COMPLETED` |
| `/plain`    | `plain`          | one assistant message, `COMPLETED`                                               |
| `/typing`   | `typing`         | repeated `message` events sharing one id with growing text, `COMPLETED`          |
| `/toolonly` | `tool-only`      | a tool call and result, no message, `COMPLETED`                                  |
| `/handoff`  | `handoff`        | message, `AgentHandoff`, message, `COMPLETED`                                    |
| `/slow`     | `slow`           | 2s between events, so a cancel has somewhere to land                             |
| `/fail`     | `failed`         | `FAILED` with `error.code = TEXT_HANDLER_ERROR`                                  |
| `/cancelme` | `canceled`       | `CANCELED` — the expert stopping its own work                                    |
| `/ask`      | `input-required` | `INPUT_REQUIRED` carrying the question                                           |
| `/stale`    | `stale`          | `FAILED` with `error.code = SESSION_STATE_NOT_FOUND`                             |
| —           | `bare-message`   | A2A only: replies with one `message` frame and opens no task                     |

```bash
TOKEN=$(pnpm -s token)

# a full turn
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"sessionId":"s1","requestId":"r1","agentName":"fare-desk","metadata":"{}","text":"how much to SFO?"}' \
  http://localhost:8787/fare-desk

# force a failure
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"sessionId":"s1","requestId":"r2","agentName":"fare-desk","metadata":"{}","text":"/fail"}' \
  http://localhost:8787/fare-desk

# a delegation instead of a text turn; an empty instruction means
# "answer the last thing the user asked", read out of chatCtx
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"sessionId":"s2","requestId":"r3","agentName":"fare-desk","metadata":"{}",
       "delegation":{"instruction":"","chatCtx":{"items":[
         {"message":{"id":"u1","role":"USER","content":[{"text":"how much to SFO?"}]}}]}}}' \
  http://localhost:8787/fare-desk

# cancel a run (best-effort; always 202, with a `stopped` flag)
curl -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"sessionId":"s1","requestId":"r1","reason":"user hung up"}' \
  http://localhost:8787/fare-desk:cancel

# the A2A binding
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/a2a+json' \
  -d '{"message":{"messageId":"m1","contextId":"s3","role":"ROLE_USER",
       "parts":[{"text":"how much to SFO?"}]},
       "metadata":{"livekit.request_id":"r4"}}' \
  http://localhost:8787/fare-desk/message:stream

curl -s http://localhost:8787/fare-desk/.well-known/agent-card.json | jq
```

## What `message:stream` sends

```
1. task            TASK_STATE_SUBMITTED
2. statusUpdate    TASK_STATE_WORKING   "Fetching data, please wait"    <- MOCK_A2A_GREETING
3. statusUpdate    TASK_STATE_WORKING   "Checking the fare table..."    <- a progress report
4. statusUpdate    TASK_STATE_WORKING   "Mock reply from fare-desk..."  <- the assistant message
5. artifactUpdate  name="answer" lastChunk=true                         <- RunComplete.text
6. statusUpdate    TASK_STATE_COMPLETED                                 <- ends the task
```

The greeting on frame 2 is a `TaskStatusUpdateEvent` carrying a message, **not** a bare
`Message` frame, and that is forced by the spec rather than a preference. A2A v1.0.1
s3.1.2 gives a stream exactly two mutually exclusive shapes:

> "If the agent returns a `Task`, the stream MUST begin with the Task object, followed by
> zero or more `TaskStatusUpdateEvent` or `TaskArtifactUpdateEvent` objects."
>
> "If the agent returns a `Message`, the stream MUST contain exactly one `Message` object
> and then close immediately."

So a `Message` frame cannot precede a task: emitting one commits the whole turn to the
taskless shape and requires the stream to end. The spec's own channel for an interim line
is the status event -- "Agents attach Messages to status update events to inform clients
about task progress, request additional input, or provide informational updates."

To see the taskless shape instead -- one `Message` frame, no task, stream closes:

```bash
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/a2a+json' \
  -d '{"message":{"messageId":"m1","contextId":"s1","role":"ROLE_USER",
       "parts":[{"text":"hi"}]}}' \
  'http://localhost:8787/fare-desk/message:stream?scenario=bare-message'
```

Note what the projection drops, per the doc's own list of what A2A cannot carry: the tool
call and its result do not appear above, only the _progress report_ does, because a
`FunctionCall` has no A2A equivalent while a report's text does. Frame 5 is the one place
`RunComplete.text` survives.

## Environment

| variable                 | default                      | meaning                                                                 |
| ------------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| `LIVEKIT_API_KEY`        | _required_                   | verifies presented tokens                                               |
| `LIVEKIT_API_SECRET`     | _required_                   | verifies presented tokens                                               |
| `PORT`                   | `8787`                       |                                                                         |
| `MOCK_ENDPOINTS`         | `fare-desk`                  | comma-separated endpoint names to serve                                 |
| `MOCK_AGENT_DESCRIPTION` | _(a fare-desk blurb)_        | published in the agent card                                             |
| `MOCK_EVENT_DELAY_MS`    | `250`                        | pause between streamed events                                           |
| `MOCK_SCENARIO`          | `full`                       | default scenario                                                        |
| `MOCK_OMIT_DEFAULTS`     | `0`                          | serialize strictly-canonical protobuf JSON (see below)                  |
| `MOCK_REQUIRE_GRANT`     | _(none)_                     | also require this `VideoGrant` field, e.g. `canManageAgentSession`      |
| `MOCK_A2A_GREETING`      | `Fetching data, please wait` | text sent as the first status event on `message:stream`; empty disables |
| `MOCK_HEARTBEAT_MS`      | `20000`                      | SSE keepalive comment interval                                          |

Note that Node's `--env-file` does **not** override variables already in your shell, so
`MOCK_SCENARIO=plain pnpm dev` wins over the value in `.env`.

## Notes for whoever writes the client

`src/protocol.ts` is the piece worth reading first — the client needs its mirror image, and
`decodeRunResponse()` there is the reference reader. The traps, all verified against
`@livekit/protocol@1.51.0` / `@bufbuild/protobuf@1.10.x`:

- **Canonical protobuf JSON omits default values.** `RunComplete.State.COMPLETED = 0`, so a
  strictly-canonical server sends **no `state` field at all** on the success path — and
  `ChatRole.DEVELOPER = 0` likewise. A reader must treat absent `state` as `COMPLETED` and
  absent `role` as `DEVELOPER`. This mock emits defaults explicitly by default because it
  is kinder to develop against; set `MOCK_OMIT_DEFAULTS=1` to get the strict form and prove
  your client handles it:

  ```
  MOCK_OMIT_DEFAULTS=0   "complete":{"state":"COMPLETED","text":"...","sessionState":{...}}
  MOCK_OMIT_DEFAULTS=1   "complete":{"text":"...","sessionState":{...}}
  ```

- **The generated agent types are namespaced.** `AgentSession.ChatMessage` is
  `livekit.agent.ChatMessage`; a top-level `import { ChatMessage } from '@livekit/protocol'`
  gives you `livekit.ChatMessage` (room chat), which is a different message and fails
  silently.
- **`ChatMessage.content[]`'s oneof group is named `payload`,** not `content`. Writing
  `{ content: [{ content: { case: 'text', value: 'hi' } }] }` serializes to
  `{"content":[{}]}` with no error. `ChatContext.items[]`'s group is `item`;
  `AgentSessionState`'s is `data`.
- **`fromJson` throws on unknown fields** unless you pass `{ ignoreUnknownFields: true }`.
- **`AgentSessionState.version` is a `uint64`** — a JSON string on the wire (`"2"`), a
  `bigint` in memory, so `JSON.stringify` on a raw message throws. Both string and number
  are accepted on read. `snapshot`/`delta` are base64; `createdAt` is an RFC3339 `Z` string.
- **`bufbuild` v1 and v2 differ.** v1 (what `@livekit/protocol` uses) has
  `msg.toJson({ emitDefaultValues })` and `Type.fromJson(json, { ignoreUnknownFields })`.
  v2 is functional and renames `emitDefaultValues` to `alwaysEmitImplicit`.
- **`EventSource` is unusable** for either binding — it is GET-only and both bindings POST.
  Use `fetch` plus `response.body.getReader()`; `scripts/client.ts` has a frame parser that
  handles multi-line `data:`, CRLF, and the `: ping` keepalive.
- **Errors before the stream opens are status codes; errors after it opens are in-band.**
  A malformed body is a 400, a duplicate live `requestId` is a 409, but anything that goes
  wrong once headers are out arrives as a `RunComplete` with `state: FAILED`.

The mock also enforces the rules the types do not carry, because your client has to be
built against them:

- exactly one `complete` event, and it is last;
- runs of one conversation are taken one at a time in arrival order, so the second ask
  sees what the first did;
- a `requestId` that is already live fails with 409;
- a cancel is best-effort, and a cancelled run still reports what it did.

## Gaps in the design doc, and what this mock assumed

Worth raising with the doc's authors rather than discovering later.

1. **The A2A routes are written with a `/v1` prefix**, which is A2A **v0.3.0** vocabulary.
   A2A v1.0.0 (2026-03-12) renumbered the REST binding and v1.0.1 (2026-05-28) is current.
   This mock serves v1.0.1 and drops the prefix — which is not a departure from the doc's
   design: v1.0.1 gives every RPC a tenant-prefixed additional binding
   (`post: "/{tenant}/message:stream"`), so `/fare-desk/message:stream` **is** the spec's
   `/{tenant}/message:stream` with `tenant` = the endpoint name, and `AgentInterface` has a
   `tenant` field to declare it. The doc's endpoint-owns-a-subtree design is conformant as
   written; only `/v1` was stale. The doc cites no A2A version and links no spec, which is
   what made this ambiguous.
2. **`RunComplete.State.COMPLETED = 0`**, so canonical JSON drops `state` exactly when a
   run succeeds. A2A deliberately avoids this by reserving 0 for `TASK_STATE_UNSPECIFIED`;
   the native protocol probably should too.
3. **The native cancel has no route.** s3's table lists only the bare `POST /<endpoint>`,
   the A2A paths and the card, while s2 defines `CancelRunRequest` and requires a cancel be
   a separate request. This mock serves `POST /<endpoint>:cancel`, mirroring A2A's own
   colon-verb style, and returns 202 with `{"stopped": bool}`.
4. **How the LiveKit token travels is undefined.** s3 only notes that an auth scheme needs
   a real `AgentCard`. Assumed `Authorization: Bearer`, and the published card declares an
   HTTP bearer JWT scheme to match. Which grant should gate a run is also unstated;
   `MOCK_REQUIRE_GRANT=canManageAgentSession` is available but off by default.
5. **`livekit.chat_ctx` is not a URI** and would not survive A2A extension negotiation.
   This mock keys the chat-context data part under
   `https://livekit.io/a2a/chat-ctx/v1` in the part's `metadata`, declares that URI in
   `Message.extensions` and in the card's `capabilities.extensions`, and accepts the bare
   `livekit.chat_ctx` key as an alias.
6. **Nothing mints the A2A task id**, and whether a `text` input should open a task or reply
   with a bare `Message` is unstated. This mock always opens a task, so status and artifact
   events are valid; use `?scenario=bare-message` to get the taskless shape.
7. **There is no delta field on `RunResponse`**, so whether a server may stream partial
   messages is undefined — and that decides whether a client can render incremental text at
   all. The `typing` scenario re-emits one `ChatMessage` id with growing content, which is
   an interpretation, not something the doc sanctions.
8. **`INPUT_REQUIRED` needs a resumption story.** A2A v1.0.1 removed the `final` flag, so
   the only signals are the state plus the stream closing. A follow-up
   `message:stream` carrying `taskId` continues the conversation here; native has no
   equivalent because it finds the conversation by `sessionId`.

## Known limitations

- State is in memory. Restarting the server forgets every conversation.
- `tasks/{id}:subscribe` (A2A resubscribe) returns 501. The doc says we need it "neither
  yet".
- The A2A projection drops what A2A cannot carry, deliberately and per the doc: the session
  state (no field for it — the conversation is found by `contextId`), function calls, and
  handoffs. A client that renders those uses the native binding.
- `REJECTED -> FAILED` and `AUTH_REQUIRED -> INPUT_REQUIRED` do not round-trip; the
  reverse mapping in `src/bindings/a2a-types.ts` is lossy by the doc's own design.
- Not a conformance suite. To check the A2A projection against a real implementation, point
  `@a2a-js/sdk`'s client at `/<endpoint>/message:stream` from a throwaway directory — not as
  a dependency here, since it pulls `@bufbuild/protobuf` v2 alongside
  `@livekit/protocol`'s v1.

## Layout

```
src/
  server.ts            express app, route order, listen
  config.ts            env parsing
  auth.ts              bearer verification
  protocol.ts          the native wire protocol -- read this first
  sse.ts               SSE framing, heartbeat, disconnect detection
  sessions.ts          conversations, the per-session FIFO, live-run registry
  engine.ts            RunRequest -> RunResponse events (binding-agnostic)
  scenarios.ts         the canned scripts and their triggers
  http.ts              shared endpoint/error helpers
  bindings/native.ts   POST /<endpoint> and :cancel
  bindings/a2a.ts      the A2A v1.0.1 projection
  bindings/a2a-types.ts   A2A wire types, transcribed from the normative proto
  bindings/agent-card.ts
scripts/
  token.ts             print an access token
  client.ts            smoke suite and reference stream reader
```
