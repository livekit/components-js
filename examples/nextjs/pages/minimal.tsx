'use client';

import { SessionProvider, useSession, VideoConference, setLogLevel } from '@livekit/components-react';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useMemo, useEffect } from 'react';
import { TokenSource } from 'livekit-client';

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  setLogLevel('debug', { liveKitClientLogLevel: 'info' });

  const userIdentity = useMemo(
    () => params?.get('user') ?? generateRandomUserId(),
    [params],
  );

  const tokenSource = useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  useEffect(() => {
    session.start({
      tracks: {
        microphone: { enabled: false },
      },
    });
    return () => {
      session.end();
    };
  }, [session]);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      <SessionProvider session={session}>
        <VideoConference />
      </SessionProvider>
    </div>
  );
};

export default MinimalExample;
