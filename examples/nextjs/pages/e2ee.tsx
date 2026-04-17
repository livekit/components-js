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
import { useMemo, useEffect, useState } from 'react';
import { TokenSource, MediaDeviceFailure } from 'livekit-client';
import { generateRandomUserId } from '../lib/helper';

const tokenSource = TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);

const E2EEExample: NextPage = () => {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const roomName = params?.get('room') ?? 'test-room';
  const [userIdentity] = useState(() => params?.get('user') ?? generateRandomUserId());
  setLogLevel('warn', { liveKitClientLogLevel: 'debug' });

  const [e2eeWebworker] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  });

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,

    encryption: e2eeWebworker
      ? {
          worker: e2eeWebworker,
          key: 'test',
        }
      : undefined,
  });

  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true);
  const [isTogglingEncryption, setIsTogglingEncryption] = useState(false);

  const toggleEncryption = async () => {
    setIsTogglingEncryption(true);
    try {
      const next = !isEncryptionEnabled;
      await session.setEncryptionEnabled(next);
      setIsEncryptionEnabled(next);
    } catch (err) {
      console.error('Failed to toggle encryption:', err);
    } finally {
      setIsTogglingEncryption(false);
    }
  };

  useEffect(() => {
    session
      .start({
        tracks: {
          camera: { enabled: true },
          microphone: { enabled: true },
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

  useEvents(
    session,
    SessionEvent.MediaDevicesError,
    (error) => {
      const failure = MediaDeviceFailure.getFailure(error);
      console.error(failure);
      alert(
        'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
      );
    },
    [],
  );

  return (
    <div data-lk-theme="default" style={{ height: '100vh' }}>
      {session.isConnected && (
        <SessionProvider session={session}>
          <button
            onClick={toggleEncryption}
            disabled={isTogglingEncryption}
            style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
          >
            {isEncryptionEnabled ? 'Disable encryption' : 'Enable encryption'}
          </button>
          <VideoConference />
        </SessionProvider>
      )}
    </div>
  );
};

export default E2EEExample;
