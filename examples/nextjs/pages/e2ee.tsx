'use client';

import { SessionProvider, useSession, VideoConference, setLogLevel } from '@livekit/components-react';
import type { NextPage } from 'next';
import * as React from 'react';
import { Room, ExternalE2EEKeyProvider, TokenSource } from 'livekit-client';
import { generateRandomUserId } from '../lib/helper';

const E2EEExample: NextPage = () => {
  const params = React.useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = React.useMemo(() => params?.get('user') ?? generateRandomUserId(), [params]);
  setLogLevel('warn', { liveKitClientLogLevel: 'debug' });

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

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
    room,
  });

  React.useEffect(() => {
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
  }, [session.start, session.end]);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <SessionProvider session={session}>
        <VideoConference />
      </SessionProvider>
    </div>
  );
};

export default E2EEExample;
