'use client';

import { AudioConference, SessionProvider, useSession } from '@livekit/components-react';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useMemo, useState, useEffect } from 'react';
import { TokenSource } from 'livekit-client';

const AudioExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const [userIdentity] = useState(params?.get('user') ?? generateRandomUserId());

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
        microphone: { enabled: true },
      },
      roomConnectOptions: {
        autoSubscribe: true,
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
    <div data-lk-theme="default">
      <SessionProvider session={session}>
        <AudioConference />
      </SessionProvider>
    </div>
  );
};

export default AudioExample;
