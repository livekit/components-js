# Session publication browser check

Build the companion JS SDK branch that supplies the internal Session publication bridge, install this workspace, and start a local `livekit-server --dev`. Then run from this repo:

```sh
LIVEKIT_SDK_DIR=../client-sdk-js \
LIVEKIT_URL=ws://127.0.0.1:7880 \
node scripts/test-session-publication.mjs
# Additional audio/video, dual-PC, legacy-SDK and cancellation coverage:
LIVEKIT_SDK_DIR=../client-sdk-js node scripts/test-session-publication-lifecycle.mjs
# Compile the private protocol contract against the companion SDK (also run by lifecycle checks):
LIVEKIT_SDK_DIR=../client-sdk-js node scripts/check-session-publication-contract.mjs
```

The runner uses Playwright and `livekit-server-sdk` from the companion SDK's development dependencies, and serves the production Session startup helper through this workspace's Vite. Set `CHROMIUM_EXECUTABLE_PATH` to use an installed Chrome. Keys default to the local dev server's `devkey`/`secret`; another server requires `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.

It checks both delayed capture (JOIN finishes first) and early capture (microphone samples are buffered while JOIN proceeds). An agent peer must receive microphone audio and decoded camera video, and its preconnect stream must finish, carrying samples in the early-capture case. Microphone attachment may not register another track. Camera uses ordinary publication and can emit AddTrack and an offer. The lifecycle matrix additionally tests rotated capture dimensions and an injected trackless-sender failure, checking that the rebuilt PC retains its state callback and delivers audio. Both browser contexts and the temporary Vite server are closed by the runner.

Preparation has no public Room method, exported types or connect option; a versioned internal symbol connects the two packages. Ordinary `useSession().start()` options remain unchanged. Components detects the SDK preparation capability at runtime; SDKs without it retain the existing enable-track methods. Only microphones are automatically prepared; cameras retain ordinary publication until reservation mismatch performance is validated. The SDK decides whether a prepared microphone can use JOIN or needs ordinary publication. Screen sharing keeps its existing user-gesture path.

# Click-to-ready experience benchmark

`benchmark-session-experience.mjs` exercises the actual React `useSession` hook and a small status UI, with a warm agent peer and a real SFU. Its TCP/UDP relays delay signaling, ICE, DTLS and media for the user, while the agent connects directly to the SFU. The nominated ICE pair and observed RTT are verified on every run.

See [the report](../benchmarks/session-experience/README.md) for results, raw data, network/device/credential scenarios, caveats and the exact reproduction command. The runner reads the baseline hook from Git without changing tracked source files. Its default output is `/tmp/session-experience-results.json`.
