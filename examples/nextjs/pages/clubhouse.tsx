'use client';

import {
  ControlBar,
  SessionProvider,
  useSession,
  RoomAudioRenderer,
  RoomName,
  TrackLoop,
  TrackMutedIndicator,
  useIsMuted,
  useIsSpeaking,
  useTrackRefContext,
  useTracks,
  SessionEvent,
  useEvents,
} from '@livekit/components-react';
import styles from '../styles/Clubhouse.module.scss';
import { Track, TokenSource, MediaDeviceFailure } from 'livekit-client';
import { useMemo, useState, useEffect } from 'react';
import { generateRandomUserId } from '../lib/helper';
import type { NextPage } from 'next';

const tokenSource = TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);

const Clubhouse: NextPage = () => {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const roomName = params?.get('room') ?? 'test-room';
  const [userIdentity] = useState(() => params?.get('user') ?? generateRandomUserId());

  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  const [tryToConnect, setTryToConnect] = useState(false);

  useEffect(() => {
    if (tryToConnect) {
      session
        .start({
          tracks: {
            microphone: { enabled: true },
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
  }, [tryToConnect, session.start, session.end]);

  useEffect(() => {
    if (session.connectionState === 'disconnected') {
      setTryToConnect(false);
    }
  }, [session.connectionState]);

  useEvents(session, SessionEvent.MediaDevicesError, (error: Error) => {
    const failure = MediaDeviceFailure.getFailure(error);
    console.error(failure);
    alert(
      'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
    );
  }, []);

  return (
    <div data-lk-theme="default" className={styles.container}>
      <SessionProvider session={session}>
        <div style={{ display: 'grid', placeContent: 'center', height: '100%' }}>
          <button
            className="lk-button"
            onClick={() => {
              setTryToConnect(true);
            }}
          >
            Enter Room
          </button>
        </div>

        <div className={styles.slider} style={{ bottom: session.isConnected ? '0px' : '-100%' }}>
          <h1>
            <RoomName />
          </h1>
          <Stage />
          <ControlBar
            variation="minimal"
            controls={{ microphone: true, camera: false, screenShare: false }}
          />
          <RoomAudioRenderer />
        </div>
      </SessionProvider>
    </div>
  );
};

const Stage = () => {
  const tracksReferences = useTracks([Track.Source.Microphone]);
  return (
    <div>
      <div className={styles.stageGrid}>
        <TrackLoop tracks={tracksReferences}>
          <CustomParticipantTile></CustomParticipantTile>
        </TrackLoop>
      </div>
    </div>
  );
};

const CustomParticipantTile = () => {
  const trackRef = useTrackRefContext();
  const isSpeaking = useIsSpeaking(trackRef.participant);
  const isMuted = useIsMuted(trackRef);

  const id = useMemo(() => trackRef.participant.identity, [trackRef.participant.identity]);

  return (
    <section className={styles['participant-tile']} title={trackRef.participant.name}>
      <div
        className={styles['avatar-container']}
        style={{ borderColor: isSpeaking ? 'greenyellow' : 'transparent' }}
      >
        <div className={styles.avatar}>
          <img
            src={`https://avatars.dicebear.com/api/avataaars/${id}.svg?mouth=default,smile,tongue&eyes=default,happy,hearts&eyebrows=default,defaultNatural,flatNatural`}
            className="fade-in"
            width={150}
            height={150}
            alt={`Avatar of user: ${trackRef.participant.identity}`}
          />
        </div>
      </div>

      <div style={{ opacity: isMuted ? 1 : 0 }} className={styles['mic-container']}>
        <div>
          <TrackMutedIndicator className={styles.mic} trackRef={trackRef}></TrackMutedIndicator>
        </div>
      </div>
    </section>
  );
};
export default Clubhouse;
