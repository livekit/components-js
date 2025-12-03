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
} from '@livekit/components-react';
import { Track, TokenSource } from 'livekit-client';
import type { NextPage } from 'next';
import { useMemo, useState, useEffect } from 'react';
import styles from '../styles/Simple.module.css';
import { generateRandomUserId } from '../lib/helper';

const SimpleExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const tokenSource = useMemo(() => {
    return TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
  }, []);

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  useEffect(() => {
    if (connect) {
      session.start({
        tracks: {
          microphone: { enabled: true },
        },
      }).catch((err) => {
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
    if (session.connectionState === 'connected') {
      setIsConnected(true);
    } else {
      setIsConnected(false);
      if (session.connectionState === 'disconnected') {
        setConnect(false);
      }
    }
  }, [session.connectionState]);

  return (
    <div className={styles.container} data-lk-theme="default">
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://livekit.io">LiveKit</a>
        </h1>
        {!isConnected && (
          <button className="lk-button" onClick={() => setConnect(!connect)}>
            {connect ? 'Disconnect' : 'Connect'}
          </button>
        )}
        <SessionProvider session={session}>
          <RoomName />
          <ConnectionState />
          <RoomAudioRenderer />
          {isConnected && <Stage />}
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
