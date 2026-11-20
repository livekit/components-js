// Build the companion SDK first. Requires a local real SFU (`livekit-server --dev`).
// LIVEKIT_SDK_DIR=../client-sdk-js node scripts/test-session-publication.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const sdk = resolve(root, process.env.LIVEKIT_SDK_DIR ?? '../client-sdk-js');
const sdkRequire = createRequire(resolve(sdk, 'package.json'));
const reactRequire = createRequire(resolve(root, 'packages/react/package.json'));
const { chromium } = sdkRequire('playwright');
const { AccessToken } = sdkRequire('livekit-server-sdk');
const { createServer } = await import(pathToFileURL(reactRequire.resolve('vite')).href);
const url = process.env.LIVEKIT_URL ?? 'ws://127.0.0.1:7880';
const vite = await createServer({
  configFile: false,
  root: resolve(root, 'packages/react'),
  resolve: { alias: { 'livekit-client': resolve(sdk, 'dist/livekit-client.esm.mjs') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root, sdk] } },
  plugins: [
    {
      name: 'test-page',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === '/') {
            response.setHeader('Content-Type', 'text/html');
            response.end('<!doctype html><body></body>');
          } else if (request.url === '/favicon.ico') {
            response.statusCode = 204;
            response.end();
          } else next();
        });
      },
    },
  ],
});
await vite.listen();
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
  for (const early of [false, true]) {
    const room = `session-publication-${Date.now()}`;
    const tokens = await Promise.all(
      ['publisher', 'agent'].map(async (identity) => {
        const token = new AccessToken(
          process.env.LIVEKIT_API_KEY ?? 'devkey',
          process.env.LIVEKIT_API_SECRET ?? 'secret',
          { identity },
        );
        if (identity === 'agent') token.kind = 'agent';
        token.addGrant({ roomJoin: true, room, agent: identity === 'agent' });
        return token.toJwt();
      }),
    );
    const page = await browser.newPage();
    try {
      await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}`);
      const result = await page.evaluate(
        async ({ tokens, early, url, sdkModule }) => {
          const { Room, RoomEvent, Track } = await import(sdkModule);
          const { connectSessionWithTracks } = await import('/src/hooks/sessionPublication.ts');
          const delay = (ms) => new Promise((r) => setTimeout(r, ms));
          const room = new Room({
            videoCaptureDefaults: { resolution: { width: 640, height: 480 } },
          });
          const agent = new Room();
          let bufferBytes = 0,
            bufferEnded = false;
          agent.registerByteStreamHandler('lk.agent.pre-connect-audio-buffer', async (reader) => {
            try {
              for await (const chunk of reader) bufferBytes += chunk.byteLength;
              bufferEnded = true;
            } catch (e) {
              console.error(e);
            }
          });
          const remotes = new Map();
          agent.on(RoomEvent.TrackSubscribed, (track) => {
            remotes.set(track.kind, track);
            const e = track.attach();
            e.muted = true;
            document.body.appendChild(e);
            void e.play();
          });
          await agent.connect(url, tokens[1]);
          let connectedAt;
          room.on(RoomEvent.Connected, () => (connectedAt = performance.now()));
          let captureAt;
          const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
          navigator.mediaDevices.getUserMedia = async (c) => {
            await delay(early ? 0 : 750);
            const stream = await gum(c);
            captureAt = performance.now();
            return stream;
          };
          const trace = [];
          const client = room.engine.client;
          const send = client.sendRequest.bind(client);
          client.sendRequest = (m, ...a) => {
            trace.push({ type: m.case, at: performance.now() });
            return send(m, ...a);
          };
          try {
            const controller = new AbortController();
            await connectSessionWithTracks(
              room,
              async (plans) => {
                if (early) await delay(900);
                return room.connect(url, tokens[0], { initialPublications: plans });
              },
              {
                microphone: { enabled: true, publishOptions: { preConnectBuffer: true } },
                camera: { enabled: true },
              },
              controller.signal,
            );
            const deadline = performance.now() + 5000;
            let decoded = false;
            while (performance.now() < deadline) {
              const results = await Promise.all(
                [...remotes.values()].map(async (t) => {
                  if (!t.receiver) return false;
                  const s = await t.receiver.getStats();
                  return [...s.values()].some(
                    (s) =>
                      s.type === 'inbound-rtp' &&
                      (t.kind === Track.Kind.Video
                        ? s.framesDecoded > 0
                        : s.totalSamplesReceived > 0),
                  );
                }),
              );
              decoded = results.length === 2 && results.every(Boolean);
              if (decoded && bufferEnded) break;
              await delay(30);
            }
            return {
              joinedBeforeCapture: connectedAt < captureAt,
              decoded,
              bufferEnded,
              bufferBytes,
              signals: trace
                .filter((m) => m.type === 'addTrack' || m.type === 'offer')
                .map((m) => ({
                  type: m.type,
                  afterReady: m.at >= Math.max(captureAt, connectedAt),
                })),
              agentKind: [...room.remoteParticipants.values()][0]?.kind,
            };
          } finally {
            navigator.mediaDevices.getUserMedia = gum;
            await room.disconnect();
            await agent.disconnect();
            await room.dispose();
            await agent.dispose();
          }
        },
        { tokens, early, url, sdkModule: `/@fs/${resolve(sdk, 'dist/livekit-client.esm.mjs')}` },
      );
      console.log(JSON.stringify({ capture: early ? 'before-join' : 'after-join', ...result }));
      assert.equal(result.joinedBeforeCapture, !early);
      assert.ok(result.decoded, 'agent receives both microphone and camera media');
      assert.ok(result.bufferEnded, 'preconnect stream closes when the agent subscribes');
      if (early) assert.ok(result.bufferBytes > 0, 'early microphone samples reach the agent');
      assert.ok(
        result.signals.every((signal) => !signal.afterReady),
        'attachment must not register or renegotiate',
      );
    } finally {
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await vite.close();
}
