import {
  LiveKitRoom,
  useToken,
  setLogLevel,
  useVoiceAssistant,
  AgentBarVisualizer,
  // VoiceAssistantControlBar,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useEffect, useMemo } from 'react';

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = useMemo(
    () => params?.get('room') ?? 'test-room-' + Math.random().toFixed(5),
    [],
  );
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

  function AgentTile() {
    const { state, audioTrack } = useVoiceAssistant();
    useEffect(() => {
      console.log(state);
    }, [state]);

    return (
      <div>
        <AgentBarVisualizer state={state} barCount={5} audioTrack={audioTrack} />
      </div>
    );
  }

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        connect={true}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        onMediaDeviceFailure={(e) => {
          console.error(e);
          alert(
            'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
          );
        }}
      >
        {/* <VoiceAssistantControlBar /> */}
        <AgentTile />
      </LiveKitRoom>
    </div>
  );
};

export default MinimalExample;
