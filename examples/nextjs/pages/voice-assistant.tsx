'use client';

import {
  LiveKitRoom,
  useToken,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
} from '@cc-livekit/components-react';
import type { NextPage } from 'next';
import { useMemo, useState } from 'react';
import { MediaDeviceFailure } from 'livekit-client';
import styles from '../styles/VoiceAssistant.module.scss';
import { generateRandomUserId } from '../lib/helper';

function SimpleVoiceAssistant() {
  const { state, audioTrack } = useVoiceAssistant();
  return (
    <BarVisualizer
      state={state}
      barCount={7}
      trackRef={audioTrack}
      style={{ width: '75vw', height: '300px' }}
    />
  );
}

const VoiceAssistantExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = useMemo(
    () => params?.get('room') ?? 'test-room-' + Math.random().toFixed(5),
    [],
  );
  const [shouldConnect, setShouldConnect] = useState(false);

  const tokenOptions = useMemo(() => {
    const userId = params?.get('user') ?? generateRandomUserId();
    return {
      userInfo: {
        identity: userId,
        name: userId,
      },
    };
  }, []);

  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, tokenOptions);

  const onDeviceFailure = (e?: MediaDeviceFailure) => {
    console.error(e);
    alert(
      'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
    );
  };

  return (
    <main data-lk-theme="default" className={styles.main}>
      <LiveKitRoom
        audio={true}
        token={token}
        connect={shouldConnect}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => setShouldConnect(false)}
        className={styles.room}
      >
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
      </LiveKitRoom>
    </main>
  );
};

export default VoiceAssistantExample;
