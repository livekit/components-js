import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { LocalAudioTrack, Room, RoomEvent, TokenSource, Track } from 'livekit-client';

/** Measures an already-loaded React Session UI against a deterministic browser agent. */
export async function runSessionExperience(config: {
  prepared: boolean;
  tokenEndpoint: string;
  serverUrl: string;
  agentToken: string;
  agentServerUrl: string;
  mediaRelayPort: number;
  captureDelayMs: number;
  agentReactionMs: number;
}) {
  const sessionModule = config.prepared
    ? '/src/hooks/useSession.ts'
    : '/src/hooks/__benchmark_baseline_session.ts';
  const { useSession } = (await import(/* @vite-ignore */ sessionModule)) as {
    useSession: typeof import('../packages/react/src/hooks/useSession').useSession;
  };
  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const metrics: Record<string, number> = {};
  let started = 0;
  const mark = (name: string) => {
    if (started && metrics[name] === undefined) metrics[name] = performance.now() - started;
  };
  const frame = (name: string) => {
    requestAnimationFrame(() => requestAnimationFrame(() => mark(name)));
  };
  const room = new Room({ audioCaptureDefaults: { channelCount: 1 } });
  const agent = new Room();
  type SignalResponse = {
    message: { case: string; value: { candidateInit?: string; sdp?: string } };
  };
  const engine = (
    room as unknown as {
      engine: {
        client: { handleSignalResponse(response: SignalResponse): void };
        pcManager: { publisher: { getStats(): Promise<RTCStatsReport> } };
      };
    }
  ).engine;
  const signal = engine.client;
  const handleSignalResponse = signal.handleSignalResponse.bind(signal);
  const candidate = (line: string) => {
    const fields = line.trim().split(/\s+/);
    if (fields[2]?.toLowerCase() !== 'udp') return undefined;
    fields[4] = '127.0.0.1';
    fields[5] = String(config.mediaRelayPort);
    return fields.join(' ');
  };
  signal.handleSignalResponse = (response) => {
    const { message } = response;
    if (message.case === 'trickle' && message.value.candidateInit) {
      const init = JSON.parse(message.value.candidateInit);
      if (init?.candidate) {
        const rewritten = candidate(init.candidate);
        if (!rewritten) return;
        init.candidate = rewritten;
        message.value.candidateInit = JSON.stringify(init);
      }
    } else if ((message.case === 'answer' || message.case === 'offer') && message.value.sdp) {
      message.value.sdp = message.value.sdp
        .split('\r\n')
        .flatMap((line) => {
          if (!line.startsWith('a=candidate:')) return [line];
          const rewritten = candidate(line.slice(2));
          return rewritten ? [`a=${rewritten}`] : [];
        })
        .join('\r\n');
    }
    handleSignalResponse(response);
  };

  const userAudio = new AudioContext();
  const agentAudio = new AudioContext();
  const destination = agentAudio.createMediaStreamDestination();
  const gains: GainNode[] = [];
  const oscillators: OscillatorNode[] = [];
  for (const frequency of [440, 1170]) {
    const oscillator = agentAudio.createOscillator();
    const gain = agentAudio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.value = 0;
    oscillator.connect(gain).connect(destination);
    oscillator.start();
    oscillators.push(oscillator);
    gains.push(gain);
  }
  const tasks: Promise<unknown>[] = [];
  const sources: MediaStreamAudioSourceNode[] = [];
  let running = true;
  let failure: unknown;
  let session: ReturnType<typeof useSession> | undefined;
  let sessionStarted: Promise<void> | undefined;
  let greetingScheduled = false;
  let responseScheduled = false;
  const onGreeting = async () => {
    if (greetingScheduled) return;
    greetingScheduled = true;
    await delay(config.agentReactionMs);
    if (!running) return;
    mark('greetingSentMs');
    gains[0].gain.value = 0.15;
    await delay(1000);
    gains[0].gain.value = 0;
  };
  agent.on(RoomEvent.ParticipantConnected, (participant) => {
    if (participant.identity === 'user') tasks.push(onGreeting());
  });
  agent.registerByteStreamHandler('lk.agent.pre-connect-audio-buffer', async (reader) => {
    try {
      for await (const _chunk of reader) {
        /* drain the ordinary preconnect stream */
      }
    } catch (error) {
      if (running) failure = error;
    }
  });
  agent.on(RoomEvent.TrackSubscribed, (track) => {
    if (track.kind !== Track.Kind.Audio || responseScheduled) return;
    responseScheduled = true;
    mark('agentTrackSubscribedMs');
    const audio = track.attach();
    audio.muted = true;
    document.body.appendChild(audio);
    void audio.play();
    tasks.push(
      (async () => {
        while (running && track.receiver) {
          const stats = await track.receiver.getStats();
          let decoded = false;
          stats.forEach((stat) => {
            if (stat.type === 'inbound-rtp' && stat.totalSamplesReceived > 0) decoded = true;
          });
          if (decoded) {
            mark('micDecodedAtAgentMs');
            await delay(config.agentReactionMs);
            if (running) {
              mark('responseSentMs');
              gains[1].gain.value = 0.15;
            }
            break;
          }
          await delay(10);
        }
      })().catch((error) => {
        if (running) failure = error;
      }),
    );
  });
  room.on(RoomEvent.Connected, () => mark('roomConnectedMs'));
  room.on(RoomEvent.LocalTrackPublished, (publication) => {
    if (publication.source === Track.Source.Microphone) mark('micPublishedMs');
  });
  room.on(RoomEvent.TrackSubscribed, (track) => {
    if (track.kind !== Track.Kind.Audio) return;
    mark('userTrackSubscribedMs');
    const audio = track.attach();
    audio.muted = true;
    document.body.appendChild(audio);
    void audio.play();
    const source = userAudio.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
    const analyser = userAudio.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    const sink = userAudio.createGain();
    sink.gain.value = 0;
    source.connect(analyser).connect(sink).connect(userAudio.destination);
    sources.push(source);
    const bins = new Float32Array(analyser.frequencyBinCount);
    tasks.push(
      (async () => {
        while (running && metrics.responseAudioMs === undefined) {
          analyser.getFloatFrequencyData(bins);
          for (const [frequency, name] of [
            [440, 'greetingAudioMs'],
            [1170, 'responseAudioMs'],
          ] as const) {
            if (name === 'responseAudioMs' && metrics.responseSentMs === undefined) continue;
            const bin = Math.round((frequency * analyser.fftSize) / userAudio.sampleRate);
            const peak = Math.max(bins[bin - 1], bins[bin], bins[bin + 1]);
            if (peak > -40) mark(name);
          }
          await delay(5);
        }
        source.disconnect();
        analyser.disconnect();
        sink.disconnect();
      })(),
    );
  });
  const originalCapture = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    await delay(config.captureDelayMs);
    const stream = await originalCapture(constraints);
    mark('captureReadyMs');
    return stream;
  };
  let resolveCredentials!: (credentials: { serverUrl: string; participantToken: string }) => void;
  let rejectCredentials!: (error: unknown) => void;
  const credentials = new Promise<{ serverUrl: string; participantToken: string }>(
    (resolve, reject) => {
      resolveCredentials = resolve;
      rejectCredentials = reject;
    },
  );
  const tokenSource = TokenSource.literal({ serverUrl: config.serverUrl, participantToken: '' });
  tokenSource.fetch = () => credentials;
  const element = document.createElement('main');
  document.body.appendChild(element);
  const root = createRoot(element);
  function App() {
    const current = useSession(tokenSource, { room });
    session = current;
    const [clicked, setClicked] = React.useState(false);
    const ready = current.isConnected && !!current.local.microphoneTrack?.publication;
    React.useLayoutEffect(() => {
      if (clicked) frame('feedbackUiMs');
    }, [clicked]);
    React.useLayoutEffect(() => {
      if (current.isConnected) frame('connectedUiMs');
    }, [current.isConnected]);
    React.useLayoutEffect(() => {
      if (ready) frame('readyToTalkUiMs');
    }, [ready]);
    return React.createElement(
      'div',
      {},
      React.createElement(
        'p',
        { id: 'status' },
        ready
          ? 'Ready to talk'
          : current.isConnected
            ? 'Connected · microphone starting'
            : clicked
              ? 'Connecting…'
              : 'Ready to connect',
      ),
      React.createElement(
        'button',
        {
          id: 'connect',
          disabled: clicked,
          onClick() {
            started = performance.now();
            setClicked(true);
            void userAudio.resume();
            void agentAudio.resume();
            void fetch(config.tokenEndpoint)
              .then((response) => response.json())
              .then((value) => {
                mark('credentialsMs');
                resolveCredentials(value);
              }, rejectCredentials);
            sessionStarted = current.start().then(
              () => {
                mark('sessionStartResolvedMs');
              },
              (error) => {
                failure = error;
              },
            );
          },
        },
        'Connect',
      ),
    );
  }
  try {
    await userAudio.resume();
    await agentAudio.resume();
    await agent.connect(config.agentServerUrl, config.agentToken);
    await agent.localParticipant.publishTrack(
      new LocalAudioTrack(destination.stream.getAudioTracks()[0]),
      {
        source: Track.Source.Microphone,
        red: false,
        dtx: false,
      },
    );
    root.render(React.createElement(App));
    while (!document.getElementById('connect') || !session) await delay(5);
    // Let mount effects install listeners and begin the same credential prefetch in both variants.
    await delay(30);
    (document.getElementById('connect') as HTMLButtonElement).click();
    const deadline = performance.now() + 15000;
    const required = [
      'feedbackUiMs',
      'credentialsMs',
      'roomConnectedMs',
      'connectedUiMs',
      'captureReadyMs',
      'micPublishedMs',
      'readyToTalkUiMs',
      'sessionStartResolvedMs',
      'micDecodedAtAgentMs',
      'greetingAudioMs',
      'responseSentMs',
      'responseAudioMs',
    ];
    while (required.some((name) => metrics[name] === undefined)) {
      if (failure) throw failure;
      if (performance.now() > deadline)
        throw new Error(
          `Missing UX milestones: ${required.filter((name) => metrics[name] === undefined).join(', ')}; got ${JSON.stringify(metrics)}`,
        );
      await delay(10);
    }
    if (userAudio.state !== 'running') throw new Error('Audio playout context is suspended');
    const stats = await engine.pcManager.publisher.getStats();
    let relayed = false;
    const remoteCandidates = new Map<string, { port?: number; protocol?: string }>();
    stats.forEach((stat) => {
      if (stat.type === 'remote-candidate') remoteCandidates.set(stat.id, stat);
    });
    stats.forEach((stat) => {
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded' && stat.nominated) {
        const remote = remoteCandidates.get(stat.remoteCandidateId);
        if (remote?.port === config.mediaRelayPort && remote.protocol === 'udp') {
          relayed = true;
          metrics.observedMediaRttMs = stat.currentRoundTripTime * 1000;
        }
      }
    });
    if (!relayed) throw new Error('Selected ICE pair bypassed the media-latency relay');
    return metrics;
  } finally {
    running = false;
    navigator.mediaDevices.getUserMedia = originalCapture;
    await room.disconnect();
    await agent.disconnect();
    await sessionStarted;
    root.unmount();
    element.remove();
    await Promise.allSettled(tasks);
    sources.forEach((source) => source.disconnect());
    oscillators.forEach((oscillator) => oscillator.stop());
    destination.stream.getTracks().forEach((track) => track.stop());
    await userAudio.close();
    await agentAudio.close();
    await room.dispose();
    await agent.dispose();
  }
}
