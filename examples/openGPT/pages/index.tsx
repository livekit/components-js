'use client';

import {
  LiveKitRoom,
  setLogLevel,
  useConnectionState,
  Chat,
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
  useRoomContext,
  RoomAudioRenderer,
  useConnectCredentials,
} from '@livekit/components-react';
import { ChatText, Headphones } from '@phosphor-icons/react';
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';

import type { NextPage } from 'next';
import { generateRandomUserId } from '../lib/helper';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ConnectionState, Track } from 'livekit-client';

function GptUi() {
  const connectionState = useConnectionState();
  const room = useRoomContext();

  const [audioMode, setAudioMode] = useState(false);
  const [isSwitchingModes, setIsSwitchingModes] = useState(false);

  const agent = useVoiceAssistant();

  const krisp = useKrispNoiseFilter();

  const handleModeSwitch = async () => {
    setIsSwitchingModes(true);
    try {
      let nextMode = !audioMode;
      setAudioMode(nextMode);
      await room.localParticipant.setMicrophoneEnabled(nextMode);
      krisp.setNoiseFilterEnabled(true);
    } finally {
      setIsSwitchingModes(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateColumns: '260px 1fr' }}>
      {connectionState === ConnectionState.Connected && agent.state !== 'connecting' ? (
        <>
          <div
            style={{ padding: '0.75rem', background: 'rgb(249, 249, 249)', position: 'relative' }}
          >
            <button
              disabled={isSwitchingModes}
              id="mode-toggle"
              className="lk-button"
              style={{
                position: 'absolute',
                fontSize: '1.5rem',
                top: '0.75rem',
                right: '0.75rem',
                cursor: 'pointer',
              }}
              onClick={handleModeSwitch}
            >
              {audioMode ? <ChatText /> : <Headphones />}
            </button>
            <p style={{ padding: '2rem' }}>
              <img src="/logo.png" style={{ width: '0.75rem', marginRight: '0.5rem' }} />
              hackGPT
            </p>
            {/* <label className="switch">
              <input
                type="checkbox"
                disabled={isSwitchingModes}
                onInput={()) => handleModeSwitch()}
              />
              <span className="slider"></span>
            </label> */}
          </div>
          <div style={{ height: '100%', position: 'relative' }}>
            <Chat style={{ display: !audioMode ? 'block' : 'none' }} />
            <div style={{ display: audioMode ? 'grid' : 'none', width: '100%', height: '100%' }}>
              <RoomAudioRenderer muted={!audioMode} />

              <BarVisualizer
                trackRef={agent.audioTrack}
                style={{ width: '500px', height: '300px', placeSelf: 'center' }}
              />
              <VoiceAssistantControlBar
                style={{ position: 'absolute', bottom: '0', width: '100%' }}
                controls={{ microphone: !isSwitchingModes }}
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', height: '100vh', gridColumn: 'span 2' }}>
          <div className="lds-ring" style={{ placeSelf: 'center' }}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
}

const MinimalExample: NextPage = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const roomName = useMemo(() => params?.get('room') ?? 'test-room' + generateRandomUserId(), []);
  setLogLevel('info', { liveKitClientLogLevel: 'debug' });

  const tokenOptions = useMemo(() => {
    const userId = params?.get('user') ?? generateRandomUserId();
    return {
      userInfo: {
        identity: userId,
        name: userId,
      },
    };
  }, []);

  const { token, url } = useConnectCredentials(
    process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT,
    roomName,
    tokenOptions,
  );

  return (
    <div data-lk-theme="gpt" style={{ height: '100vh' }}>
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={url}
        onMediaDeviceFailure={(e) => {
          console.error(e);
          alert(
            'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
          );
        }}
      >
        <GptUi />
      </LiveKitRoom>
    </div>
  );
};

export default MinimalExample;
