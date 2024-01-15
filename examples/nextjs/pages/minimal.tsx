import { LiveKitRoom, useToken, VideoConference, setLogLevel } from '@livekit/components-react';
import { RoomConnectOptions } from 'livekit-client';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useMemo } from 'react';

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  setLogLevel('info', { liveKitClientLogLevel: 'warn' });

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
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default MinimalExample;
