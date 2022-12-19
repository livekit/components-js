import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantName,
  ParticipantsLoop,
  ParticipantView,
  RoomName,
  TrackMutedIndicator,
  useIsMuted,
  useIsSpeaking,
  useParticipantContext,
  useToken,
} from '@livekit/components-react';
import styles from '../styles/Clubhouse.module.scss';
import { Track } from 'livekit-client';
import { useMemo, useState } from 'react';

const Clubhouse = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? 'test-identity';

  const token = useToken({
    tokenEndpoint: process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT,
    roomName: roomName,
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  const [tryToConnect, setTryToConnect] = useState(false);
  const [connected, setConnected] = useState(false);

  return (
    <div className={styles.container}>
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
            <RoomName></RoomName>
          </h1>
          <GridLayout className={styles.grid}>
            <ParticipantsLoop>
              <CustomParticipantView></CustomParticipantView>
            </ParticipantsLoop>
          </GridLayout>
          <ControlBar></ControlBar>
        </div>
      </LiveKitRoom>
    </div>
  );
};

const CustomParticipantView = () => {
  const participant = useParticipantContext();
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = useIsMuted({ source: Track.Source.Microphone, participant: participant });

  const id = useMemo(() => participant.identity, [participant]);

  return (
    <section className={styles['participant-view']} title={participant.name}>
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
            src={`https://avatars.dicebear.com/api/avataaars/${id}.svg`}
            className="fade-in"
            width={150}
            height={150}
            alt={`Avatar of user: ${participant.identity}`}
          />
        </div>
      </div>

      <div
        style={{ opacity: isMuted ? 1 : 0 }}
        className={styles['mic-container']}
        // className={`absolute bottom-[7%] right-[7%] h-[17%] min-h-[1.3rem] w-[17%] min-w-[1.3rem]  rounded-full bg-btnColor transition-opacity`}
      >
        <div
        // className="translate grid h-full place-items-center py-[15%]"
        >
          <TrackMutedIndicator
            className={styles.mic}
            source={Track.Source.Microphone}
          ></TrackMutedIndicator>
        </div>
      </div>
    </section>
  );
};
export default Clubhouse;
