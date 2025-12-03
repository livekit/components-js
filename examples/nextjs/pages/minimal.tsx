'use client';

import { SessionProvider, useSession, VideoConference, setLogLevel, SessionEvent } from '@livekit/components-react';
import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { useMemo, useEffect, useState } from 'react';
import { TokenSource, MediaDeviceFailure } from 'livekit-client';

const MinimalExample: NextPage = () => {
  const [roomName, setRoomName] = useState('test-room');
  const [userIdentity, setUserIdentity] = useState(() => generateRandomUserId());
  const [isReady, setIsReady] = useState(false);

  setLogLevel('debug', { liveKitClientLogLevel: 'info' });

  useEffect(() => {
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

  const tokenSource = useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const sessionOptions = useMemo(
    () => ({
      roomName,
      participantIdentity: userIdentity,
      participantName: userIdentity,
    }),
    [roomName, userIdentity],
  );

  const session = useSession(tokenSource, sessionOptions);

  useEffect(() => {
    if (!isReady) return;
    session.start({
      tracks: {
        microphone: { enabled: false },
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

  useEffect(() => {
    const handleMediaDevicesError = (error: Error) => {
      const failure = MediaDeviceFailure.getFailure(error);
      console.error(failure);
      alert(
        'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
      );
    };

    session.internal.emitter.on(SessionEvent.MediaDevicesError, handleMediaDevicesError);
    return () => {
      session.internal.emitter.off(SessionEvent.MediaDevicesError, handleMediaDevicesError);
    };
  }, [session]);

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

export default MinimalExample;
