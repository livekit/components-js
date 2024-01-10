import {
  ConnectionState,
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomName,
  TrackRefContext,
  useToken,
  useTracks,
  useParticipantTracks,
  useRemoteParticipant,
  useParticipantTracksByName,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useState } from 'react';
import styles from '../styles/Simple.module.css';
import { generateRandomUserId } from '../lib/helper';

export default function GetTracksExamplePage() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const userIdentity = params?.get('user') ?? generateRandomUserId();
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userIdentity,
      name: userIdentity,
    },
  });

  const handleDisconnect = () => {
    setConnect(false);
    setIsConnected(false);
  };

  return (
    <div className={styles.container} data-lk-theme="default">
      <main className={styles.main}>
        {!isConnected && (
          <button className="lk-button" onClick={() => setConnect(!connect)}>
            {connect ? 'Disconnect' : 'Connect'}
          </button>
        )}
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
          connect={connect}
          onConnected={() => setIsConnected(true)}
          onDisconnected={handleDisconnect}
          audio={true}
          video={true}
        >
          <RoomName />
          <ConnectionState />
          {/* <RoomAudioRenderer /> */}
          {isConnected && <Stage />}
          <ControlBar />
        </LiveKitRoom>
      </main>
    </div>
  );
}

function Stage() {
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTrack = useTracks([Track.Source.ScreenShare])[0];

  const specialParticipant = useRemoteParticipant('special-participant-id');

  // Get tracks of source(s) from a specific participant.
  const _cameraTracks = useParticipantTracks([Track.Source.Camera], specialParticipant);
  const _cameraTracks2 = useParticipantTracks([Track.Source.Camera]);
  const _allTracks = useParticipantTracks([], specialParticipant); // is this true ??
  const _allTracks2 = useParticipantTracks([]); // is this true ??

  // Get tracks with a specific name from a specific participant.
  const specialTracks2 = useParticipantTracksByName('track-name');
  const specialTracks3 = useParticipantTracksByName('track-name', specialParticipant);

  return (
    <>
      {screenShareTrack && <ParticipantTile {...screenShareTrack} />}
      <GridLayout tracks={cameraTracks}>
        <TrackRefContext.Consumer>
          {(track) => <ParticipantTile {...track} />}
        </TrackRefContext.Consumer>
      </GridLayout>
    </>
  );
}
