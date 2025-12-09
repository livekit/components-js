'use client';

import {
  SessionProvider,
  useSession,
  VideoConference,
  setLogLevel,
  SessionEvent,
  useEvents,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useMemo, useEffect, useState } from 'react';
import { TokenSource, MediaDeviceFailure } from 'livekit-client';

const tokenSource = TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);

const MinimalExample: NextPage = () => {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const roomName = params?.get('room') ?? 'test-room';
  setLogLevel('debug', { liveKitClientLogLevel: 'info' });

  const [userIdentity] = useState(() => params?.get('user') ?? generateRandomUserId());

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  useEffect(() => {
    session
      .start({
        tracks: {
          microphone: { enabled: false },
        },
      })
      .catch((err) => {
        console.error('Failed to start session:', err);
      });
    return () => {
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.start, session.end]);

  useEvents(session, SessionEvent.MediaDevicesError, (error) => {
    const failure = MediaDeviceFailure.getFailure(error);
    console.error(failure);
    alert(
      'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
    );
  }, []);

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      {session.isConnected && (
        <SessionProvider session={session}>
          <VideoConference />
        </SessionProvider>
      )}
    </div>
  );
};

export default MinimalExample;
