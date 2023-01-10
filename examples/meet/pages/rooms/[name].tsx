import {
  LiveKitRoom,
  PreJoin,
  LocalUserChoices,
  useToken,
  VideoConference,
  Chat,
} from '@livekit/components-react';
import { AudioCaptureOptions, VideoCaptureOptions } from 'livekit-client';

import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

const Home: NextPage = () => {
  const router = useRouter();
  const { name: roomName } = router.query;

  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  if (!roomName || Array.isArray(roomName)) {
    return <h2>no room param passed</h2>;
  }
  return (
    <>
      <Head>
        <title>LiveKit Meet</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {preJoinChoices ? (
          <ActiveRoom
            roomName={roomName}
            userChoices={preJoinChoices}
            onLeave={() => setPreJoinChoices(undefined)}
          ></ActiveRoom>
        ) : (
          <PreJoin
            defaults={{
              username: '',
              videoEnabled: true,
              audioEnabled: true,
            }}
            onSubmit={(values) => {
              console.log('Joining with: ', values);
              setPreJoinChoices(values);
            }}
          ></PreJoin>
        )}
      </main>
    </>
  );
};

export default Home;

type ActiveRoomProps = {
  userChoices: LocalUserChoices;
  roomName: string;
  onLeave?: () => void;
};
const ActiveRoom = ({ roomName, userChoices, onLeave }: ActiveRoomProps) => {
  const [showChat, setShowChat] = useState(false);
  const token = useToken({
    tokenEndpoint: process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT,
    roomName,
    userInfo: {
      identity: userChoices.username,
      name: userChoices.username,
    },
  });

  const videoOptions = useMemo((): VideoCaptureOptions => {
    return {
      deviceId: userChoices.videoDeviceId ?? undefined,
    };
  }, [userChoices]);

  const audioOptions = useMemo((): AudioCaptureOptions => {
    return {
      deviceId: userChoices.audioDeviceId ?? undefined,
    };
  }, [userChoices]);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
      // options={{ videoCaptureDefaults: videoOptions, audioCaptureDefaults: audioOptions }}
      video={userChoices.videoEnabled}
      audio={userChoices.audioEnabled}
      onDisconnected={onLeave}
    >
      <button onClick={() => setShowChat(!showChat)}>{showChat ? 'Hide Chat' : 'Show Chat'}</button>
      <div style={{ display: 'flex' }}>
        <Chat style={{ display: showChat ? 'block' : 'none', width: '20rem' }}></Chat>
        <VideoConference />
      </div>
    </LiveKitRoom>
  );
};
