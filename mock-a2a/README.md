# mock-a2a

A mock LiveKit expert served over A2A, for developing a client SDK against the
**LiveKit Agent Session Extension for A2A** before the framework side of it ships.

The extension is plain A2A plus four metadata keys and two data-part payloads. It adds no
RPC methods and no task states. This mock implements both halves of that promise:

- **activate it** (`A2A-Extensions: https://livekit.io/a2a/ext/agent-session/v1`) and you
  get typed chat items, `lk/verbatim`, `lk/directive`, delegations with a conversation
  attached, and `close`;
- **don't**, and the same task streams as ordinary A2A — text parts on `WORKING` statuses
  and an `answer` artifact — which is what a stock `a2a-sdk` client sees.

Nothing here talks to LiveKit Cloud; the api key/secret only verify the tokens your client
presents.

## Quick start

```bash
cd mock-a2a
cp .env.example .env      # any dev key/secret pair; must match whatever mints your tokens
pnpm install
pnpm dev                  # http://localhost:8787
```

In another terminal:

```bash
pnpm smoke                # drives every behavior in the spec; exits non-zero on failure
pnpm token                # print a token to paste into curl
```

`pnpm install` needs no flags: this package carries its own `pnpm-workspace.yaml` with an
empty `packages:` list, which stops pnpm walking up to the repo root. There is no build
step — the server runs straight off TypeScript via `node --experimental-strip-types`.
`pnpm typecheck` runs `tsc --noEmit`.

## Routes

```
POST /<endpoint>/v1/message:stream        SendMessageRequest -> SSE of StreamResponse
POST /<endpoint>/v1/message:send          SendMessageRequest -> Task
GET  /<endpoint>/v1/tasks/<id>            -> Task
POST /<endpoint>/v1/tasks/<id>:cancel     CancelTaskRequest -> Task
GET  /<endpoint>/.well-known/agent-card.json    the card (no auth)
GET  /.well-known/agent-card.json               the card, host-rooted (no auth)
```

`<endpoint>` defaults to `fare-desk` (`MOCK_ENDPOINTS` to change). The card's interface url
is `<base>/<endpoint>/v1`, so an A2A client that reads the card and appends
`/message:stream` lands on the right path without knowing about the prefix.

There is no `tasks/{id}:subscribe` — the spec does not define one, so it 404s.

## What a run looks like

Activated, the default `full` scenario:

```
1. task            TASK_STATE_SUBMITTED
2. statusUpdate    WORKING  [verbatim]  item=message              "Fetching data, please wait"
3. statusUpdate    WORKING              item=function_call        (no text: a tool call)
4. statusUpdate    WORKING              item=function_call        (no text: a progress report)
5. statusUpdate    WORKING              item=message              "Checking Tuesday's seats now."
6. statusUpdate    WORKING              item=function_call_output (no text: a tool result)
7. statusUpdate    WORKING              item=message              "Tuesday 09:40 is open; ..."
8. artifactUpdate  name="answer" lastChunk=true
9. statusUpdate    COMPLETED            item=message (the answer), + lk/directive if any
```

The same task unactivated collapses to what a plain A2A client can use — frames 3, 4 and 6
carry no relayed text, so they are not sent at all:

```
1. task            TASK_STATE_SUBMITTED
2. statusUpdate    WORKING   "Fetching data, please wait"
3. statusUpdate    WORKING   "Checking Tuesday's seats now."
4. statusUpdate    WORKING   "Tuesday 09:40 is open; ..."
5. artifactUpdate  name="answer" lastChunk=true
6. statusUpdate    COMPLETED
```

Order is fixed: the `Task` first, zero or more `WORKING` statuses, the `answer` artifact
for `COMPLETED` and `INPUT_REQUIRED`, then the terminal status. A stream that ends without
a terminal status is a failure.

## The extension

| Key (`lk/…` is the URI + `/` + the name) | Rides on                                              | Value                   |
| ---------------------------------------- | ----------------------------------------------------- | ----------------------- |
| `lk/kind`                                | message metadata                                      | `delegation` \| `close` |
| `lk/kind`                                | part metadata, request                                | `chat_ctx`              |
| `lk/kind`                                | part metadata, event                                  | `chat_item`             |
| `lk/verbatim`                            | **status message** metadata, or **artifact** metadata | `true`                  |
| `lk/directive`                           | **event** metadata, `COMPLETED` only                  | `{kind, reason}`        |
| `lk/reason`                              | `CancelTaskRequest` metadata                          | string                  |

Three different carriers, which is the easiest thing to get wrong: `lk/verbatim` sits on
`statusUpdate.status.message.metadata` or on `artifactUpdate.artifact.metadata`, while
`lk/directive` sits on `statusUpdate.metadata` — a sibling of `status`, not inside it.

Activation is per request and strict. Send the URI in `A2A-Extensions`, and the server
echoes the header back; the extension is active only if it does. Unactivated, `lk/*` keys
and data parts are ignored on the way in and never sent on the way out — if you send a
`chat_ctx` part without the header, the server logs a warning, because a forgotten header
silently degrades a delegation into a plain text turn.

### Chat items

`chat_ctx` is `{"items": [...]}`; a `chat_item` part is one bare item.

```jsonc
{ "id": "item_9a", "type": "message", "role": "user",
  "content": ["my flight to Tokyo is delayed"], "created_at": 1789012345.1 }

{ "id": "item_c3", "type": "function_call", "call_id": "c-1", "name": "check_availability",
  "arguments": "{\"date\": \"2026-09-22\"}", "update_of": "c-1", "created_at": 1789012349.2 }

{ "id": "item_o1", "type": "function_call_output", "call_id": "c-1",
  "name": "check_availability", "output": "{\"open\": true}", "is_error": false }

{ "id": "item_h1", "type": "agent_handoff", "old_agent_id": "fare-desk",
  "new_agent_id": "baggage-desk" }
```

This is **not** the canonical JSON of `livekit.agent.ChatContext.ChatItem`, though the spec
says the protobuf will converge on it. Today they differ in every respect: a `type`
discriminator instead of a protobuf oneof, `"user"` instead of `"USER"`, `content` as plain
strings instead of `{text}` objects, and `created_at` as Unix **seconds** (fractional)
instead of an RFC3339 `createdAt`. `src/chat-items.ts` is what gets deleted when they
converge.

The expert **deduplicates by item id**: send the whole conversation every time, and only
the items it has not seen are added, in `created_at` order.

## Scenarios

Selection order: `?scenario=` → `"mockScenario"` in the request metadata → a keyword as the
first word of the text → `MOCK_SCENARIO` → `full`.

| keyword     | scenario             | what you get                                                                         |
| ----------- | -------------------- | ------------------------------------------------------------------------------------ |
| _(none)_    | `full`               | tool call, progress report, tool result, answer message, `COMPLETED`                 |
| `/plain`    | `plain`              | one answer message                                                                   |
| `/say`      | `verbatim`           | a `session.say()`-style message and a **verbatim answer artifact**                   |
| `/end`      | `directive-end`      | `COMPLETED` carrying `lk/directive` `{end_session, caller_done}`                     |
| `/escalate` | `directive-escalate` | `COMPLETED` carrying `lk/directive` `{escalate, …}`                                  |
| `/ask`      | `input-required`     | `INPUT_REQUIRED` — terminal, and it **does** carry an answer artifact (the question) |
| `/fail`     | `failed`             | `FAILED` — **no** artifact; the terminal status carries the reason as text           |
| `/slow`     | `slow`               | 2s between items, so a `CancelTask` has somewhere to land                            |
| `/handoff`  | `handoff`            | an `agent_handoff` item, which carries no text                                       |
| `/toolonly` | `tool-only`          | a call and a result, nothing said on the way                                         |
| `/chunks`   | `chunked`            | the answer artifact split across several `append` chunks                             |

`close` is not a scenario — it is `lk/kind: close` on the message.

Because the keyword is read from the text part, a delegation that wants an **empty**
instruction should select its scenario with `?scenario=` instead.

## Recipes

```bash
TOKEN=$(pnpm -s token)
EXT='https://livekit.io/a2a/ext/agent-session/v1'
V1=http://localhost:8787/fare-desk/v1

# a person's message, extension active (-i to see the echoed A2A-Extensions header)
curl -iN -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/a2a+json' \
     -H "A2A-Extensions: $EXT" -H 'A2A-Version: 1.0' \
     -d '{"message":{"messageId":"m1","contextId":"c1","role":"ROLE_USER",
          "parts":[{"text":"how much to SFO?"}]}}' \
     "$V1/message:stream"

# the same, unactivated: text parts and the answer artifact only
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/a2a+json' \
     -d '{"message":{"messageId":"m2","contextId":"c2","role":"ROLE_USER",
          "parts":[{"text":"how much to SFO?"}]}}' \
     "$V1/message:stream"

# a delegation: an instruction plus the caller's conversation
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/a2a+json' \
     -H "A2A-Extensions: $EXT" \
     -d "{\"message\":{\"messageId\":\"m3\",\"contextId\":\"c3\",\"role\":\"ROLE_USER\",
          \"metadata\":{\"$EXT/kind\":\"delegation\"},
          \"parts\":[{\"text\":\"find the change fee\"},
                     {\"data\":{\"items\":[{\"id\":\"item_9a\",\"type\":\"message\",
                        \"role\":\"user\",\"content\":[\"my flight is delayed\"],
                        \"created_at\":1789012345.1}]},
                      \"metadata\":{\"$EXT/kind\":\"chat_ctx\"}}]}}" \
     "$V1/message:stream"

# end the conversation
curl -N -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/a2a+json' \
     -H "A2A-Extensions: $EXT" \
     -d "{\"message\":{\"messageId\":\"m4\",\"contextId\":\"c3\",\"role\":\"ROLE_USER\",
          \"metadata\":{\"$EXT/kind\":\"close\"},\"parts\":[{\"text\":\"\"}]}}" \
     "$V1/message:stream"

# cancel a running task, with a reason
curl -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/a2a+json' \
     -d "{\"$EXT/reason\":\"the user interrupted\"}" \
     "$V1/tasks/TASK_ID:cancel"

curl -s http://localhost:8787/fare-desk/.well-known/agent-card.json | jq
```

## Environment

| variable                 | default                      | meaning                                                            |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------ |
| `LIVEKIT_API_KEY`        | _required_                   | verifies presented tokens                                          |
| `LIVEKIT_API_SECRET`     | _required_                   | verifies presented tokens                                          |
| `PORT`                   | `8787`                       |                                                                    |
| `MOCK_ENDPOINTS`         | `fare-desk`                  | comma-separated endpoint names to serve                            |
| `MOCK_AGENT_DESCRIPTION` | _(a fare-desk blurb)_        | the card's description and skill description                       |
| `MOCK_EVENT_DELAY_MS`    | `250`                        | pause between produced items                                       |
| `MOCK_SCENARIO`          | `full`                       | default scenario                                                   |
| `MOCK_A2A_GREETING`      | `Fetching data, please wait` | a `session.say()` message at the top of every task; empty disables |
| `MOCK_REQUIRE_GRANT`     | _(none)_                     | also require this `VideoGrant` field, e.g. `canManageAgentSession` |
| `MOCK_HEARTBEAT_MS`      | `20000`                      | SSE keepalive comment interval                                     |

Node's `--env-file` does **not** override variables already in your shell, so
`MOCK_SCENARIO=plain pnpm dev` beats the value in `.env`.

## Notes for whoever writes the client

- **`EventSource` is unusable** — it is GET-only and `message:stream` is a POST. Use `fetch`
  plus `response.body.getReader()`; `scripts/client.ts` has a frame parser that handles
  multi-line `data:`, CRLF, and the `: ping` keepalive.
- **`COMPLETED` does not guarantee an `answer` artifact.** A `close` task completes without
  one. Read the artifact if it arrives; do not wait for it.
- **`INPUT_REQUIRED` is terminal** and _does_ carry an artifact — the answer is the
  question. Nothing resumes; the reply is a new task, optionally naming the pending
  question in `referenceTaskIds`.
- **A second message queues, it never cancels.** The `Task` event for it arrives
  immediately — that is what lets a caller send it at all — but its work starts only once
  the running task has answered. For barge-in, send `CancelTask` first.
- **A cancelled task still reports what landed**, as a text part on the terminal status.
- **A progress report changes shape with the caller.** In a delegation the report's own
  words are the relayed text (one item). For a person's message the report carries no text
  and is followed by an ordinary assistant message with the phrased version (two items).
  A client that renders tool progress must handle both.
- **`lk/verbatim` means say it as written.** A chat client shows all relayed text as-is
  anyway; a voice agent phrases everything else in its own voice.
- Extension keys are full URIs, so build them once:
  `const key = (n) => 'https://livekit.io/a2a/ext/agent-session/v1/' + n`.

## Known limitations

- State is in memory: restarting forgets every conversation.
- No `tasks/{id}:subscribe`, no WebSocket binding, no queue bound — matching the spec's own
  status section.
- The card declares `securitySchemes` (bearer JWT), which the spec's example omits because
  it does not address auth. Everything else about the card follows §3.1.
- `referenceTaskIds` is accepted and tracked but not acted on; the spec makes it purely
  informational.
- Not a conformance suite. To check the plain-A2A half against a real implementation, point
  `@a2a-js/sdk`'s client at `/fare-desk/v1/message:stream` from a throwaway directory.

## A correction to earlier feedback

An earlier version of this mock served these routes **without** the `/v1` segment, and its
README argued the segment was stale A2A v0.3 vocabulary that v1.0 had removed. That was
wrong, and if that argument reached the spec's authors it should be withdrawn.

`/v1` belongs to the **interface base URL**, not to the method path. The card advertises
`supportedInterfaces[0].url = https://host/fare-desk/v1`, and an A2A v1.0 client appends
`/message:stream` to it — so the served path contains `/v1` while the client does exactly
what v1.0 prescribes. (In v0.3 the segment really was part of the spec-defined path; v1.0
moved it out. Both arrive at the same URL here, which is what made it easy to misread.)

## Layout

```
src/
  extension.ts      the extension URI, its keys and values, header activation
  chat-items.ts     the §3.7 item shapes, builders, dedup-by-id
  a2a-types.ts      A2A v1.0.1 wire types, from the normative proto
  agent-card.ts     the §3.1 card
  conversations.ts  contexts, their tasks, the FIFO queue, close
  engine.ts         a task: steps -> chat items + an outcome. Knows no A2A.
  scenarios.ts      the canned scripts and their triggers
  a2a.ts            request parsing, the §3.4 projection, the four routes
  server.ts         route mounting and startup
  auth.ts  config.ts  http.ts  sse.ts
scripts/
  token.ts          print an access token
  client.ts         the smoke suite, and the reference stream reader
```
