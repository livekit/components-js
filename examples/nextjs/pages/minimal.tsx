import { LiveKitRoom, useToken, VideoConference, setLogLevel } from '@livekit/components-react';
import { RoomConnectOptions } from 'livekit-client';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();
  setLogLevel('info', { liveKitClientLogLevel: 'warn' });

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

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
