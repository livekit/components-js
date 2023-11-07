import { LiveKitRoom, useToken, VideoConference, setLogLevel } from '@livekit/components-react';
import type { NextPage } from 'next';
import * as React from 'react';
import { Room, ExternalE2EEKeyProvider } from 'livekit-client';
import { generateRandomUserId } from '../lib/helper';

const E2EEExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();
  setLogLevel('warn', { liveKitClientLogLevel: 'debug' });

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  const keyProvider = React.useMemo(() => new ExternalE2EEKeyProvider(), []);

  keyProvider.setKey('password');

  const room = React.useMemo(
    () =>
      new Room({
        e2ee:
          typeof window !== 'undefined'
            ? {
                keyProvider,
                worker: new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)),
              }
            : undefined,
      }),
    [],
  );

  room.setE2EEEnabled(true);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <LiveKitRoom
        room={room}
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default E2EEExample;
