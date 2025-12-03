'use client';

import { SessionProvider, useSession, VideoConference, setLogLevel, SessionEvent } from '@livekit/components-react';
import type { NextPage } from 'next';
import * as React from 'react';
import { Room, ExternalE2EEKeyProvider, TokenSource, MediaDeviceFailure } from 'livekit-client';
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
    if (typeof window !== 'undefined') {
      room.setE2EEEnabled(true);
    }
  }, [room]);

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

  React.useEffect(() => {
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
      {session.isConnected && (
        <SessionProvider session={session}>
          <VideoConference />
        </SessionProvider>
      )}
    </div>
  );
};

export default E2EEExample;
