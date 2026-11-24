// Measures click-to-ready milestones in the actual React useSession hook.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import net from 'node:net';
import dgram from 'node:dgram';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const sdk = resolve(root, process.env.LIVEKIT_SDK_DIR ?? '../client-sdk-js');
const sdkRequire = createRequire(resolve(sdk, 'package.json'));
const reactRequire = createRequire(resolve(root, 'packages/react/package.json'));
const { chromium } = sdkRequire('playwright');
const { AccessToken } = sdkRequire('livekit-server-sdk');
const { createServer } = await import(pathToFileURL(reactRequire.resolve('vite')).href);
const upstream = new URL(process.env.LIVEKIT_URL ?? 'ws://127.0.0.1:7880');
if (upstream.protocol !== 'ws:' || upstream.hostname !== '127.0.0.1')
  throw new Error('Use a local ws://127.0.0.1 SFU for the TCP/UDP latency relays');
const baselineRef =
  process.env.BASELINE_REF ??
  execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
const baseline = execFileSync(
  'git',
  ['show', `${baselineRef}:packages/react/src/hooks/useSession.ts`],
  { cwd: root, encoding: 'utf8' },
);
if (!process.env.BASELINE_REF && baseline.includes('connectSessionWithTracks')) {
  throw new Error(
    'Baseline already uses prepared publications; set BASELINE_REF to a pre-feature Session revision',
  );
}
const reactRoot = resolve(root, 'packages/react');
const baselineId = resolve(reactRoot, 'src/hooks/__benchmark_baseline_session.ts');
const runs = new Map();
const scenarios = [
  { name: 'nearby-fast-device', networkRttMs: 20, tokenDelayMs: 80, captureDelayMs: 0 },
  { name: 'remote-fast-device', networkRttMs: 150, tokenDelayMs: 80, captureDelayMs: 0 },
  { name: 'remote-slow-device', networkRttMs: 150, tokenDelayMs: 80, captureDelayMs: 800 },
  { name: 'slow-credentials', networkRttMs: 150, tokenDelayMs: 1000, captureDelayMs: 0 },
  { name: 'permission-prompt', networkRttMs: 150, tokenDelayMs: 80, captureDelayMs: 2000 },
];
const repetitions = Number(process.env.REPETITIONS ?? 10);
assert.ok(Number.isInteger(repetitions) && repetitions > 0);
if (process.env.SCENARIO && !scenarios.some((scenario) => scenario.name === process.env.SCENARIO)) {
  throw new Error(`Unknown SCENARIO: ${process.env.SCENARIO}`);
}

async function createLatencyProxy(rttMs) {
  const sockets = new Set();
  const timers = new Set();
  const server = net.createServer((client) => {
    const target = net.connect(Number(upstream.port || 80), upstream.hostname);
    sockets.add(client);
    sockets.add(target);
    const forward = (source, destination) => {
      let queued = 0;
      source.on('data', (chunk) => {
        queued += chunk.byteLength;
        if (queued + destination.writableLength > 1024 * 1024) source.pause();
        const timer = setTimeout(() => {
          timers.delete(timer);
          queued -= chunk.byteLength;
          if (!destination.destroyed) destination.write(chunk);
          if (queued + destination.writableLength < 512 * 1024 && !source.destroyed)
            source.resume();
        }, rttMs / 2);
        timers.add(timer);
      });
      destination.on('drain', () => {
        if (queued < 512 * 1024 && !source.destroyed) source.resume();
      });
    };
    forward(client, target);
    forward(target, client);
    for (const [socket, peer] of [
      [client, target],
      [target, client],
    ]) {
      socket.on('error', () => peer.destroy());
      socket.on('close', () => {
        sockets.delete(socket);
        peer.destroy();
      });
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `ws://127.0.0.1:${server.address().port}`,
    async close() {
      timers.forEach(clearTimeout);
      timers.clear();
      sockets.forEach((socket) => socket.destroy());
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
// One relay per client PC. Rewrite only the client's SFU candidates to this port.
// STUN transaction IDs route checks back to the correct local candidate; DTLS then
// identifies the selected socket used for SRTP, RTCP and data channels.
async function createMediaRelay(rttMs) {
  const socket = dgram.createSocket('udp4');
  const timers = new Set();
  const checks = new Map();
  let selected;
  const serverPort = Number(process.env.LIVEKIT_UDP_PORT ?? Number(upstream.port || 7880) + 2);
  socket.on('message', (packet, remote) => {
    const stun = packet.length >= 20 && packet.readUInt32BE(4) === 0x2112a442;
    const transaction = stun ? packet.subarray(8, 20).toString('hex') : undefined;
    const fromServer = remote.port === serverPort && remote.address === upstream.hostname;
    let destination;
    if (fromServer) destination = (transaction && checks.get(transaction)) || selected;
    else {
      if (transaction) {
        if (checks.size >= 128) checks.delete(checks.keys().next().value);
        checks.set(transaction, { address: remote.address, port: remote.port });
        let nominated = false;
        for (let offset = 20; offset + 4 <= packet.length;) {
          const type = packet.readUInt16BE(offset),
            length = packet.readUInt16BE(offset + 2);
          if (type === 0x0025) nominated = true; // STUN USE-CANDIDATE
          offset += 4 + ((length + 3) & ~3);
        }
        if (nominated || !selected) selected = { address: remote.address, port: remote.port };
      } else selected = { address: remote.address, port: remote.port };
      destination = { address: upstream.hostname, port: serverPort };
    }
    if (!destination) return;
    const timer = setTimeout(() => {
      timers.delete(timer);
      socket.send(packet, destination.port, destination.address);
    }, rttMs / 2);
    timers.add(timer);
  });
  await new Promise((resolve) => socket.bind(0, '127.0.0.1', resolve));
  return {
    port: socket.address().port,
    async close() {
      timers.forEach(clearTimeout);
      timers.clear();
      checks.clear();
      await new Promise((resolve) => socket.close(resolve));
    },
  };
}
const vite = await createServer({
  configFile: false,
  root: reactRoot,
  resolve: {
    alias: [
      { find: /^livekit-client$/, replacement: resolve(sdk, 'dist/livekit-client.esm.mjs') },
      { find: /^react$/, replacement: reactRequire.resolve('react') },
      { find: /^react-dom\/client$/, replacement: reactRequire.resolve('react-dom/client') },
      { find: /^react-dom$/, replacement: reactRequire.resolve('react-dom') },
    ],
    dedupe: ['react', 'react-dom', 'livekit-client'],
  },
  server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root, sdk] } },
  plugins: [
    {
      name: 'session-ux-fixture',
      resolveId(id) {
        if (id === '/src/hooks/__benchmark_baseline_session.ts' || id === baselineId)
          return baselineId;
      },
      load(id) {
        if (id === baselineId) return baseline;
      },
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const url = new URL(request.url, 'http://localhost');
          if (url.pathname === '/') {
            response.setHeader('Content-Type', 'text/html');
            response.end('<!doctype html><body></body>');
          } else if (url.pathname === '/favicon.ico') {
            response.statusCode = 204;
            response.end();
          } else if (url.pathname === '/benchmark-token') {
            const run = runs.get(url.searchParams.get('id'));
            if (!run) {
              response.statusCode = 404;
              response.end();
              return;
            }
            const timer = setTimeout(() => {
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(run.credentials));
            }, run.tokenDelayMs);
            response.once('close', () => clearTimeout(timer));
          } else next();
        });
      },
    },
  ],
});
await vite.listen();
const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
let browser;
const samples = [];
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
  for (const scenario of scenarios.filter(
    (s) => !process.env.SCENARIO || s.name === process.env.SCENARIO,
  )) {
    const proxy = await createLatencyProxy(scenario.networkRttMs);
    try {
      for (let repetition = -1; repetition < repetitions; repetition++) {
        // Alternate A/B order to reduce drift; the first pair is excluded as warmup.
        for (const prepared of repetition % 2 === 0 ? [true, false] : [false, true]) {
          const id = `ux-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const tokens = await Promise.all(
            ['user', 'agent'].map(async (identity) => {
              const token = new AccessToken(
                process.env.LIVEKIT_API_KEY ?? 'devkey',
                process.env.LIVEKIT_API_SECRET ?? 'secret',
                {
                  identity,
                  attributes: identity === 'agent' ? { 'lk.agent.state': 'listening' } : undefined,
                },
              );
              if (identity === 'agent') token.kind = 'agent';
              token.addGrant({ roomJoin: true, room: id, agent: identity === 'agent' });
              return token.toJwt();
            }),
          );
          runs.set(id, {
            tokenDelayMs: scenario.tokenDelayMs,
            credentials: { serverUrl: proxy.url, participantToken: tokens[0] },
          });
          const media = await createMediaRelay(scenario.networkRttMs);
          const page = await browser.newPage();
          try {
            page.on('pageerror', (error) => console.error(error.message));
            await page.goto(origin);
            const metrics = await page.evaluate(
              async (config) => {
                const { runSessionExperience } = await import(config.fixture);
                return runSessionExperience(config);
              },
              {
                prepared,
                fixture: `/@fs/${resolve(root, 'scripts/session-experience-browser.ts')}`,
                serverUrl: proxy.url,
                agentToken: tokens[1],
                agentServerUrl: upstream.toString(),
                mediaRelayPort: media.port,
                tokenEndpoint: `${origin}/benchmark-token?id=${id}`,
                captureDelayMs: scenario.captureDelayMs,
                agentReactionMs: 50,
              },
            );
            assert.ok(
              metrics.observedMediaRttMs >= scenario.networkRttMs * 0.8,
              'ICE RTT must include the configured UDP delay',
            );
            const sample = { scenario: scenario.name, prepared, repetition, ...metrics };
            if (repetition >= 0) samples.push(sample);
            console.log(JSON.stringify(sample));
          } finally {
            runs.delete(id);
            await page.close();
            await media.close();
          }
        }
      }
    } finally {
      await proxy.close();
    }
  }
  const percentile = (values, p) => {
    values.sort((a, b) => a - b);
    return values[Math.max(0, Math.ceil(values.length * p) - 1)];
  };
  const summary = scenarios.flatMap((scenario) =>
    [false, true]
      .map((prepared) => {
        const selected = samples.filter(
          (s) => s.scenario === scenario.name && s.prepared === prepared,
        );
        if (!selected.length) return undefined;
        const metrics = Object.fromEntries(
          Object.keys(selected[0])
            .filter((key) => key.endsWith('Ms'))
            .map((key) => [
              key,
              {
                p50: Math.round(
                  percentile(
                    selected.map((s) => s[key]),
                    0.5,
                  ),
                ),
                p95: Math.round(
                  percentile(
                    selected.map((s) => s[key]),
                    0.95,
                  ),
                ),
              },
            ]),
        );
        return { ...scenario, prepared, count: selected.length, metrics };
      })
      .filter(Boolean),
  );
  const result = {
    baselineRef,
    sdkCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: sdk, encoding: 'utf8' }).trim(),
    componentsCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    runtime: process.version,
    platform: `${process.platform}/${process.arch}`,
    agentReactionMs: 50,
    agentPlacement: 'direct local SFU connection',
    browserVersion: browser.version(),
    repetitions,
    methodology:
      'Actual React useSession, same companion SDK build; delayed credential HTTP response and getUserMedia, client TCP signaling + UDP ICE/DTLS/SRTP/RTCP/SCTP RTT relays; agent directly connected to local SFU. Warm agent returns deterministic tones, no STT/LLM/TTS; loaded app, no production authentication or bundle-load measurement.',
    samples,
    summary,
  };
  const output = process.env.OUTPUT ?? '/tmp/session-experience-results.json';
  await writeFile(output, JSON.stringify(result, null, 2));
  console.log(`Saved ${output}`);
} finally {
  await browser?.close();
  await vite.close();
}
