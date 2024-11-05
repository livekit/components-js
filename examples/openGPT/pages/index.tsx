'use client';

import {
  LiveKitRoom,
  useToken,
  setLogLevel,
  RichUserInput,
  useConnectionState,
  Chat,
  useVoiceAssistant,
  BarVisualizer,
  TrackToggle,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useMemo, useState } from 'react';
import { ConnectionState, Track } from 'livekit-client';

function GptUi() {
  const connectionState = useConnectionState();

  const [mode, setMode] = useState<'audio' | 'text'>('text');

  const agent = useVoiceAssistant();

  return (
    <div style={{ height: '100vh' }}>
      <select defaultValue={mode} onChange={(ev) => setMode(ev.target.value as 'audio' | 'text')}>
        <option value={'text'}>Text</option>
        <option value={'audio'}>Audio</option>
      </select>
      {connectionState === ConnectionState.Connected && (
        <div style={{ height: '100%' }}>
          <Chat style={{ display: mode === 'text' ? 'block' : 'none' }} />
          <div style={{ display: mode === 'audio' ? 'block' : 'none' }}>
            <BarVisualizer trackRef={agent.audioTrack} />
            <TrackToggle source={Track.Source.Microphone} />
          </div>
        </div>
      )}
    </div>
  );
}

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  setLogLevel('info', { liveKitClientLogLevel: 'debug' });

  const tokenOptions = useMemo(() => {
    const userId = params?.get('user') ?? generateRandomUserId();
    return {
      userInfo: {
        identity: userId,
        name: userId,
      },
    };
  }, []);

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, tokenOptions);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        onMediaDeviceFailure={(e) => {
          console.error(e);
          alert(
            'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
          );
        }}
      >
        <GptUi />
      </LiveKitRoom>
    </div>
  );
};

export default MinimalExample;
