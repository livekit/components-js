import { setLogLevel } from '@livekit/components-core';
import { LiveKitRoom, useToken, VideoConference } from '@livekit/components-react';
import { RoomConnectOptions } from 'livekit-client';
import type { NextPage } from 'next';

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';
  setLogLevel('info', { liveKitClientLogLevel: 'warn' });

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  const options: RoomConnectOptions = {
    autoSubscribe: false,
  };

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        connectOptions={options}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default MinimalExample;
