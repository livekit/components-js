'use client';

import {
  ConnectionState,
  ControlBar,
  GridLayout,
  SessionProvider,
  useSession,
  ParticipantTile,
  RoomAudioRenderer,
  RoomName,
  TrackRefContext,
  useTracks,
  SessionEvent,
  useEvents,
} from '@livekit/components-react';
import { Track, TokenSource, MediaDeviceFailure } from 'livekit-client';
import type { NextPage } from 'next';
import { useMemo, useState, useEffect } from 'react';
import styles from '../styles/Simple.module.css';
import { generateRandomUserId } from '../lib/helper';

const tokenSource = TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);

const SimpleExample: NextPage = () => {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const roomName = params?.get('room') ?? 'test-room';
  const [userIdentity] = useState(() => params?.get('user') ?? generateRandomUserId());
  const [connect, setConnect] = useState(false);

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  useEffect(() => {
    if (connect) {
      session
        .start({
          tracks: {
            microphone: { enabled: true },
            camera: { enabled: true },
          },
        })
        .catch((err) => {
          console.error('Failed to start session:', err);
        });
    } else {
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, session.start, session.end]);

  useEffect(() => {
    if (session.connectionState === 'disconnected') {
      setConnect(false);
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
    <div className={styles.container} data-lk-theme="default">
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://livekit.io">LiveKit</a>
        </h1>
        {!session.isConnected && (
          <button className="lk-button" onClick={() => setConnect(!connect)}>
            {connect ? 'Disconnect' : 'Connect'}
          </button>
        )}
        <SessionProvider session={session}>
          <RoomName />
          <ConnectionState />
          <RoomAudioRenderer />
          {session.isConnected && <Stage />}
          <ControlBar />
        </SessionProvider>
      </main>
    </div>
  );
};

function Stage() {
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTrackRef = useTracks([Track.Source.ScreenShare])[0];

  return (
    <>
      {screenShareTrackRef && <ParticipantTile trackRef={screenShareTrackRef} />}
      <GridLayout tracks={cameraTracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => <ParticipantTile trackRef={trackRef} />}
        </TrackRefContext.Consumer>
      </GridLayout>
    </>
  );
}

export default SimpleExample;
