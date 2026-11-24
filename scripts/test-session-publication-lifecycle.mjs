// Cross-repository integration: build SDK #2292, then run against a local test SFU.
// LIVEKIT_JS_SDK_DIR=/path/to/client-sdk-js LIVEKIT_URL=ws://localhost:7880 node scripts/test-session-publication.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const sdk = path.resolve(
  process.env.LIVEKIT_SDK_DIR ?? process.env.LIVEKIT_JS_SDK_DIR ?? '../client-sdk-js',
);
execFileSync(
  process.execPath,
  [new URL('./check-session-publication-contract.mjs', import.meta.url).pathname],
  {
    env: { ...process.env, LIVEKIT_SDK_DIR: sdk },
    stdio: 'inherit',
  },
);
const requireSDK = createRequire(path.join(sdk, 'package.json'));
const { chromium } = requireSDK('playwright');
const { AccessToken } = requireSDK('livekit-server-sdk');
const ts = requireSDK('typescript');
const bundle = await readFile(path.join(sdk, 'dist/livekit-client.esm.mjs'));
const source = await readFile(
  new URL('../packages/react/src/hooks/sessionPublication.ts', import.meta.url),
  'utf8',
);
const helper = ts
  .transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  })
  .outputText.replace(/from ['"]livekit-client['"]/g, "from '/sdk.js'");
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/' ? 'text/html' : 'text/javascript');
  response.end(
    request.url === '/sdk.js'
      ? bundle
      : request.url === '/session.js'
        ? helper
        : '<!doctype html><body></body>',
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    headless: true,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  });
  for (const scenario of [
    ...[true, false].flatMap((singlePeerConnection) =>
      ['audio', 'video', 'both'].map((kind) => ({ singlePeerConnection, kind })),
    ),
    { singlePeerConnection: true, kind: 'video', h264Backup: true },
    { singlePeerConnection: true, kind: 'video', mismatchedCamera: true },
    { singlePeerConnection: true, kind: 'audio', preparationFailure: true },
    { singlePeerConnection: true, kind: 'audio', legacy: true },
    { singlePeerConnection: true, kind: 'audio', cancel: true },
  ]) {
    const roomName = `session-review-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tokens = await Promise.all(
      ['publisher', 'subscriber'].map(async (identity) => {
        const token = new AccessToken(
          process.env.LIVEKIT_API_KEY ?? 'devkey',
          process.env.LIVEKIT_API_SECRET ?? 'secret',
          { identity },
        );
        token.addGrant({ room: roomName, roomJoin: true });
        return token.toJwt();
      }),
    );
    const page = await browser.newPage();
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const result = await page.evaluate(
        async ({ scenario, tokens, url }) => {
          const { Room, RoomEvent, Track } = await import('/sdk.js');
          const { connectSessionWithTracks } = await import('/session.js');
          const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const waitFor = async (predicate) => {
            for (let i = 0; i < 500; i++) {
              if (await predicate()) return;
              await delay(20);
            }
            throw new Error('received media timed out');
          };
          const options = {
            singlePeerConnection: scenario.singlePeerConnection,
            videoCaptureDefaults: { resolution: { width: 640, height: 480, frameRate: 30 } },
          };
          const publisher = new Room(options);
          const subscriber = new Room(options);
          const remote = [];
          subscriber.on(RoomEvent.TrackSubscribed, (track) => {
            remote.push(track);
            const el = track.attach();
            el.muted = true;
            document.body.appendChild(el);
            void el.play();
          });
          const captured = [];
          const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
          let firstCapture;
          navigator.mediaDevices.getUserMedia = async (...args) => {
            await delay(650);
            if (scenario.mismatchedCamera && args[0].video)
              args[0].video = { width: { exact: 480 }, height: { exact: 640 } };
            const stream = await gum(...args);
            firstCapture ??= performance.now();
            captured.push(...stream.getTracks());
            return stream;
          };
          if (scenario.legacy)
            Object.defineProperty(publisher, Symbol.for('livekit.internal.sessionPublication.v1'), {
              value: undefined,
            });
          const signalTypes = [];
          const registeredCodecs = [];
          const send = publisher.engine.client.sendRequest.bind(publisher.engine.client);
          publisher.engine.client.sendRequest = (message, ...args) => {
            signalTypes.push(message.case);
            if (message.case === 'addTrack')
              registeredCodecs.push(message.value.simulcastCodecs.map((codec) => codec.codec));
            return send(message, ...args);
          };
          const setCodecs = RTCRtpTransceiver.prototype.setCodecPreferences;
          let injectedFailure = false;
          if (scenario.preparationFailure) {
            RTCRtpTransceiver.prototype.setCodecPreferences = function (...args) {
              if (!injectedFailure && this.direction === 'sendonly' && !this.sender.track) {
                injectedFailure = true;
                throw new Error('injected trackless sender preparation failure');
              }
              return setCodecs.apply(this, args);
            };
          }
          const controller = new AbortController();
          try {
            await subscriber.connect(url, tokens[1]);
            let connected;
            const starting = connectSessionWithTracks(
              publisher,
              async (connectRoom) => {
                await connectRoom(url, tokens[0]);
                connected = performance.now();
              },
              {
                microphone: { enabled: scenario.kind !== 'video', publishOptions: { red: false } },
                camera: {
                  enabled: scenario.kind !== 'audio',
                  publishOptions: scenario.h264Backup
                    ? { videoCodec: 'h264', backupCodec: true }
                    : { videoCodec: 'vp8', backupCodec: false },
                },
              },
              controller.signal,
            );
            if (scenario.cancel) {
              await delay(100);
              controller.abort();
              let rejected = false;
              try {
                await starting;
              } catch {
                rejected = true;
              }
              await waitFor(() => captured.length > 0);
              await waitFor(() => captured.every((track) => track.readyState === 'ended'));
              return {
                ...scenario,
                rejected,
                connected: publisher.state,
                stoppedLateCapture: true,
              };
            }
            await starting;
            const expected = scenario.kind === 'both' ? 2 : 1;
            await waitFor(
              async () =>
                remote.length === expected &&
                (
                  await Promise.all(
                    remote.map(async (track) => {
                      const stats = await track.receiver.getStats();
                      return [...stats.values()].some(
                        (stat) =>
                          stat.type === 'inbound-rtp' &&
                          (track.kind === Track.Kind.Video
                            ? stat.framesDecoded > 0
                            : stat.totalSamplesReceived > 0),
                      );
                    }),
                  )
                ).every(Boolean),
            );
            return {
              ...scenario,
              connectedBeforeCapture: connected < firstCapture,
              publications: publisher.localParticipant.trackPublications.size,
              received: remote.length,
              addTracks: signalTypes.filter((type) => type === 'addTrack').length,
              registeredCodecs,
              injectedFailure,
              stateCallback: typeof publisher.engine.pcManager.onStateChange === 'function',
              cameraSettings: captured.find((track) => track.kind === 'video')?.getSettings(),
              publicPreparation: 'preparePublication' in publisher,
            };
          } finally {
            await publisher.dispose();
            await subscriber.dispose();
            captured.forEach((track) => track.stop());
            navigator.mediaDevices.getUserMedia = gum;
            RTCRtpTransceiver.prototype.setCodecPreferences = setCodecs;
          }
        },
        { scenario, tokens, url: process.env.LIVEKIT_URL ?? 'ws://127.0.0.1:7880' },
      );
      console.log(JSON.stringify(result));
      if (scenario.cancel) {
        assert.equal(result.rejected, true);
        assert.equal(result.connected, 'disconnected');
      } else {
        assert.equal(result.connectedBeforeCapture, true);
        assert.equal(result.publications, scenario.kind === 'both' ? 2 : 1);
        assert.equal(result.received, result.publications);
        assert.equal(result.publicPreparation, false);
        if (scenario.h264Backup) assert.deepEqual(result.registeredCodecs, [['h264', 'vp8']]);
        if (scenario.preparationFailure) {
          assert.equal(result.injectedFailure, true);
          assert.equal(result.stateCallback, true);
        }
        if (scenario.mismatchedCamera) {
          assert.equal(result.cameraSettings.width, 480);
          assert.equal(result.cameraSettings.height, 640);
        }
        assert.equal(
          result.addTracks === 0,
          scenario.singlePeerConnection &&
            !scenario.legacy &&
            !scenario.preparationFailure &&
            scenario.kind === 'audio',
        );
      }
    } finally {
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
