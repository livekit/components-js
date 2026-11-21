# Session startup experience benchmark

The useful UX gain is early feedback while the microphone is starting. Authentication and the local Connected indicator barely change. When capture is late, prepared publications make the microphone-ready state faster and let a join-triggered agent greet the user much earlier. Fast capture shows little consistent improvement once ICE/DTLS and media latency are included.

This is a controlled **feature A/B**, not a production login, page-load, or AI model benchmark. The baseline is the original `useSession` implementation from `87c7326ebf320efbccdcb29655d1ca8d7f1b79a9`, while the candidate is the implementation in this PR. Both use the same companion SDK build to isolate prepared publication behavior. A minimal React UI renders immediately, then displays Connecting, Connected / microphone starting, and Ready to talk from actual Session state.

## Results

Every value below is milliseconds from the Connect click; **existing flow → prepared flow**. P50 is nearest rank over ten runs per variant per scenario. An extra pair per scenario is excluded as warmup; A/B order alternates. The final sweep completed 110 runs without failure: 10 warmups and 100 measured samples. No measured samples were retried or discarded.

P50:

| Scenario                    | Connected UI | Microphone-ready UI | First greeting audio | First response audio |
| --------------------------- | -----------: | ------------------: | -------------------: | -------------------: |
| Nearby, fast capture        |    249 → 255 |           249 → 261 |            372 → 346 |            487 → 459 |
| 150 ms RTT, fast capture    |    446 → 445 |           468 → 453 |            523 → 530 |            646 → 648 |
| 150 ms RTT, +800 ms capture |    443 → 442 |          1114 → 908 |           1161 → 538 |          1265 → 1138 |
| 150 ms RTT, 1 s credentials |  1378 → 1387 |         1401 → 1390 |          1469 → 1471 |          1583 → 1591 |
| 150 ms RTT, +2 s capture    |    451 → 451 |         2320 → 2112 |           2368 → 528 |          2472 → 2310 |

P95 (with only ten samples, this is each group's observed maximum; no production tail-latency claim):

| Scenario                    | Connected UI | Microphone-ready UI | First greeting audio | First response audio |
| --------------------------- | -----------: | ------------------: | -------------------: | -------------------: |
| Nearby, fast capture        |    486 → 266 |           486 → 279 |            590 → 370 |            703 → 484 |
| 150 ms RTT, fast capture    |    684 → 688 |           699 → 705 |            760 → 785 |            885 → 901 |
| 150 ms RTT, +800 ms capture |    666 → 668 |          1126 → 925 |           1193 → 731 |          1332 → 1160 |
| 150 ms RTT, 1 s credentials |  1734 → 1610 |         1734 → 1610 |          1803 → 1700 |          1926 → 1822 |
| 150 ms RTT, +2 s capture    |    462 → 706 |         2330 → 2124 |           2396 → 790 |          2531 → 2345 |

The credential HTTP response took about 82–84 ms in the 80 ms scenarios and **1,004 ms for both variants** in the one-second scenario. Initial UI feedback took about 24–81 ms in both variants; this is a frame-opportunity proxy, not an app bundle-load measurement.

For the 150 ms RTT cases:

- Fast capture: the Connected UI is 446 → 445 ms, microphone-ready UI 468 → 453 ms, and first response 646 → 648 ms. Publication overlaps transport establishment, so this is little observable UX gain. The greeting is also essentially unchanged at 523 → 530 ms.
- An added 800 ms capture delay: microphone-ready UI improves **1,114 → 908 ms**, the greeting **1,161 → 538 ms**, and the response **1,265 → 1,138 ms**.
- An added two-second capture/permission delay: microphone-ready UI improves **2,320 → 2,112 ms**, the greeting **2,368 → 528 ms**, and the response **2,472 → 2,310 ms**. The local Connected indicator remains **451 ms in both flows**.
- Slow credentials remain slow: the one-second credential stage is unchanged, with no meaningful median improvement to connection or first response.

These results support a UI that displays room connection separately from microphone readiness. Applications that hide the UI until `await session.start()` completes will still wait for microphone permission: its p50 is **2,295 → 2,100 ms** in the two-second case. The existing `session.isConnected` state can drive an earlier Connected UI at about **451 ms** in either flow; this does not require another public API.

## What the greeting improvement means

The warm fixture agent starts its greeting 50 ms after the user's `ParticipantConnected` event reaches the agent. Prepared publication advertises publisher intent during JOIN, so the remote side can discover the user while device access is pending. Ordinary publication can leave that notification waiting for publication or a batched participant update. The observed benefit is consistent with the SFU's publisher-update / subscriber-only batching policy; it is **not all a two-RTT saving**. A different server update policy or an agent that deliberately waits for microphone input before greeting can reduce this benefit.

The response tone starts 50 ms after the agent decodes the first live microphone samples. It measures transport readiness and a deterministic response, not speech recognition, reasoning, synthesis, or semantic conversation quality. Preconnect buffering remains enabled and its stream is drained by the fixture agent.

## Method

- Chrome 158.0.8127.36, macOS arm64, Node v22.22.0; LiveKit server 1.13.10. Single PC, microphone-only, mono capture, default Session preconnect buffering.
- Actual production `useSession` hook for both variants, a small React UI, a real local SFU, native ICE/DTLS/SRTP/RTCP/SCTP and Opus, and two running browser AudioContexts.
- The user's signaling TCP connection and **all RTC UDP packets** pass through delay relays with half the scenario's RTT in each direction. The warm browser-agent peer connects directly to the SFU, modeling an agent near the server. Every run verifies that the nominated ICE candidate uses the relay and checks the measured ICE RTT: approximately 21–22 ms or 152–159 ms.
- The SFU uses a fixed UDP mux port and loopback candidates. The relay rewrites the client's SFU candidates, routes STUN transactions back to their originating socket, and forwards DTLS and media over the selected socket. No packet loss, bandwidth cap, jitter, TURN, DNS or WSS/TLS handshake is modeled.
- Device permission/startup is modeled by delaying `getUserMedia`, then opening Chrome's fake input device. This does not measure an actual OS permission dialog, real device selection, camera initialization, or Bluetooth startup.
- Credential retrieval is a local HTTP endpoint with the declared delay; real OAuth/password authentication and token-service execution are not measured. The app and JS modules are already loaded before the click.
- The agent emits distinct real audio waveforms through the SFU. The client records the first non-silent decoded waveform reaching its WebAudio graph. The sink is muted; physical speaker / audio-driver latency and autoplay-policy failures are not measured. Agent cold start and STT/LLM/TTS are excluded.
- Ten runs per condition are useful for finding this critical-path difference, not for production p95 or statistical-significance claims. Raw data retains all measured samples, including outliers and cases with no improvement.

The SDK size CI reports the ESM bundle at 120.97 KB compressed, +2.16% (about 2.6 KB). These PRs should not be described as reducing initial JS download or login time.

## Reproduce

Build [SDK PR #2292](https://github.com/livekit/client-sdk-js/pull/2292), install this workspace and run `pnpm build:core`. Point `LIVEKIT_SDK_DIR` at that SDK checkout. Start a local SFU with the following configuration (dev keys only):

```yaml
port: 17880
rtc:
  tcp_port: 17881
  udp_port: 17882
  use_external_ip: false
  enable_loopback_candidate: true
keys:
  devkey: secret
```

```sh
livekit-server --dev --node-ip 127.0.0.1 --config /tmp/session-ux-server.yaml
LIVEKIT_SDK_DIR=../client-sdk-js \
LIVEKIT_URL=ws://127.0.0.1:17880 \
LIVEKIT_UDP_PORT=17882 \
BASELINE_REF=87c7326ebf320efbccdcb29655d1ca8d7f1b79a9 \
REPETITIONS=10 \
OUTPUT=/tmp/session-experience-results.json \
node scripts/benchmark-session-experience.mjs
```

Set `CHROMIUM_EXECUTABLE_PATH` for an installed Chrome, `BASELINE_REF` for another baseline Session revision, or `SCENARIO` to run one named condition. The default baseline is the merge base with `origin/main`. The default SFU keys are local `devkey` / `secret`. The runner owns and closes browser contexts, TCP/UDP relays, credential responses, timers and the temporary Vite server; the caller owns the SFU.

Sources: [runner](../../scripts/benchmark-session-experience.mjs), [browser fixture](../../scripts/session-experience-browser.ts). Data: [metadata and summaries](results.json), [all 100 samples](samples.csv). Source revisions and percentile definitions are recorded in the metadata.
