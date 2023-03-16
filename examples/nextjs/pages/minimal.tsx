import { LiveKitRoom, useToken, VideoConference } from '@livekit/components-react';
import { ExternalE2EEKeyProvider } from 'livekit-client';
import type { NextPage } from 'next';
import { useMemo } from 'react';

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  const keyProvider = useMemo(() => new ExternalE2EEKeyProvider(), []);
  keyProvider.setKey('password');

  return (
    <div data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        options={{
          e2ee: {
            keyProvider: new ExternalE2EEKeyProvider(),
            // @ts-ignore
            worker:
              typeof window !== 'undefined' &&
              new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)),
          },
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default MinimalExample;
