import {
  LiveKitRoom,
  PreJoin,
  LocalUserChoices,
  useToken,
  DefaultRoomView,
  Chat,
} from '@livekit/components-react';
import { AudioCaptureOptions, VideoCaptureOptions } from 'livekit-client';

import type { NextPage } from 'next';
import Head from 'next/head';
import { useMemo, useState } from 'react';

const Home: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = params?.get('room') ?? 'test-room';
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);

  return (
    <div>
      <Head>
        <title>LiveKit Meet</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {preJoinChoices ? (
          <ActiveRoom roomName={roomName} userChoices={preJoinChoices}></ActiveRoom>
        ) : (
          <PreJoin
            defaults={{
              username: '',
              videoEnabled: true,
              audioEnabled: true,
              videoDeviceId: 'b7f4d1b0500e15d02da15fd8d0f174c0a029944f5d1c5216bdf2bb14cb6ec0cf',
            }}
            onSubmit={(values) => {
              console.log('Joining with: ', values);
              setPreJoinChoices(values);
            }}
          ></PreJoin>
        )}
      </main>
    </div>
  );
};

export default Home;

type ActiveRoomProps = {
  userChoices: LocalUserChoices;
  roomName: string;
};
const ActiveRoom = ({ roomName, userChoices }: ActiveRoomProps) => {
  const [showChat, setShowChat] = useState(false);
  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    identity: userChoices.username,
    name: userChoices.username,
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
      options={{ videoCaptureDefaults: videoOptions, audioCaptureDefaults: audioOptions }}
      video={userChoices.videoEnabled}
      audio={userChoices.audioEnabled}
    >
      <button onClick={() => setShowChat(!showChat)}>{showChat ? 'Hide Chat' : 'Show Chat'}</button>
      <div style={{ display: 'flex' }}>
        <DefaultRoomView />
        {showChat && <Chat style={{ width: '20rem' }}></Chat>}
      </div>
    </LiveKitRoom>
  );
};
