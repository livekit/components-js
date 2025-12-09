'use client';

import {
  useAgent,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  SessionProvider,
  useSession,
  SessionEvent,
  useEvents,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import { useMemo, useState, useEffect } from 'react';
import { MediaDeviceFailure, TokenSource } from 'livekit-client';
import styles from '../styles/VoiceAssistant.module.scss';
import { generateRandomUserId } from '../lib/helper';

function SimpleVoiceAssistant() {
  const agent = useAgent();
  return (
    <BarVisualizer
      state={agent.state}
      barCount={7}
      trackRef={agent.microphoneTrack}
      style={{ width: '75vw', height: '300px' }}
    />
  );
}

const AgentExample: NextPage = () => {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const roomName = useMemo(
    () => params?.get('room') ?? 'test-room-' + Math.random().toFixed(5),
    [params],
  );
  const [userIdentity] = useState(() => params?.get('user') ?? generateRandomUserId());
  const [shouldConnect, setShouldConnect] = useState(false);

  const tokenSource = useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
  });

  useEffect(() => {
    if (shouldConnect) {
      session.start().catch((err) => {
        console.error('Failed to start session:', err);
      });
    } else {
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldConnect, session.start, session.end]);

  useEffect(() => {
    if (session.connectionState === 'disconnected') {
      setShouldConnect(false);
    }
  }, [session.connectionState]);

  useEvents(session, SessionEvent.MediaDevicesError, (error) => {
    const failure = MediaDeviceFailure.getFailure(error);
    console.error(failure);
    alert(
      'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
    );
  }, []);

  return (
    <main data-lk-theme="default" className={styles.main}>
      <SessionProvider session={session}>
        <div className={styles.room}>
          <div className={styles.inner}>
            {shouldConnect ? (
              <SimpleVoiceAssistant />
            ) : (
              <button className="lk-button" onClick={() => setShouldConnect(true)}>
                Connect
              </button>
            )}
          </div>
          <VoiceAssistantControlBar />
          <RoomAudioRenderer />
        </div>
      </SessionProvider>
    </main>
  );
};

export default AgentExample;
