import {
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  RoomName,
  TrackLoop,
  TrackMutedIndicator,
  useIsMuted,
  useIsSpeaking,
  useToken,
  useTrackContext,
  useTracks,
} from '@livekit/components-react';
import styles from '../styles/Clubhouse.module.scss';
import { Track } from 'livekit-client';
import { useMemo, useState } from 'react';

const Clubhouse = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  const [tryToConnect, setTryToConnect] = useState(false);
  const [connected, setConnected] = useState(false);

  return (
    <div data-lk-theme="default" className={styles.container}>
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        connect={tryToConnect}
        video={false}
        audio={true}
        // simulateParticipants={15}
        onConnected={() => setConnected(true)}
        onDisconnected={() => {
          setTryToConnect(false);
          setConnected(false);
        }}
      >
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

        <div className={styles.slider} style={{ bottom: connected ? '0px' : '-100%' }}>
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
      </LiveKitRoom>
    </div>
  );
};

const Stage = () => {
  const tracksReferences = useTracks([Track.Source.Microphone]);
  return (
    <div className="">
      <div className={styles.stageGrid}>
        <TrackLoop tracks={tracksReferences}>
          <CustomParticipantTile></CustomParticipantTile>
        </TrackLoop>
      </div>
    </div>
  );
};

const CustomParticipantTile = () => {
  const { participant, source } = useTrackContext();
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = useIsMuted(source);

  const id = useMemo(() => participant.identity, [participant]);

  return (
    <section className={styles['participant-tile']} title={participant.name}>
      <div
        // className={`rounded-full border-2 p-0.5 transition-colors duration-1000 ${
        className={styles['avatar-container']}
        style={{ borderColor: isSpeaking ? 'greenyellow' : 'transparent' }}
      >
        <div
          className={styles.avatar}
          // className="z-10 grid aspect-square items-center overflow-hidden rounded-full bg-beige transition-all will-change-transform"
        >
          <img
            src={`https://avatars.dicebear.com/api/avataaars/${id}.svg?mouth=default,smile,tongue&eyes=default,happy,hearts&eyebrows=default,defaultNatural,flatNatural`}
            className="fade-in"
            width={150}
            height={150}
            alt={`Avatar of user: ${participant.identity}`}
          />
        </div>
      </div>

      <div style={{ opacity: isMuted ? 1 : 0 }} className={styles['mic-container']}>
        <div>
          <TrackMutedIndicator className={styles.mic} source={source}></TrackMutedIndicator>
        </div>
      </div>
    </section>
  );
};
export default Clubhouse;
