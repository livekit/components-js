'use client';

import { SessionProvider, useSession, VideoConference, setLogLevel } from '@livekit/components-react';
import type { NextPage } from 'next';
import * as React from 'react';
import { Room, ExternalE2EEKeyProvider, TokenSource } from 'livekit-client';
import { generateRandomUserId } from '../lib/helper';

const E2EEExample: NextPage = () => {
  const [roomName, setRoomName] = React.useState('test-room');
  const [userIdentity, setUserIdentity] = React.useState(() => generateRandomUserId());
  const [isReady, setIsReady] = React.useState(false);

  setLogLevel('warn', { liveKitClientLogLevel: 'debug' });

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room = params.get('room');
    const user = params.get('user');
    if (room) {
      setRoomName(room);
    }
    if (user) {
      setUserIdentity(user);
    }
    setIsReady(true);
  }, []);

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
    [keyProvider],
  );

  room.setE2EEEnabled(true);

  const tokenSource = React.useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const sessionOptions = React.useMemo(
    () => ({
      roomName,
      participantIdentity: userIdentity,
      participantName: userIdentity,
      room,
    }),
    [roomName, userIdentity, room],
  );

  const session = useSession(tokenSource, sessionOptions);

  React.useEffect(() => {
    if (!isReady) return;
    session.start({
      tracks: {
        camera: { enabled: true },
        microphone: { enabled: true },
      },
    }).catch((err) => {
      console.error('Failed to start session:', err);
    });
    return () => {
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, session.start, session.end]);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      {isReady && (
        <SessionProvider session={session}>
          <VideoConference />
        </SessionProvider>
      )}
    </div>
  );
};

export default E2EEExample;
