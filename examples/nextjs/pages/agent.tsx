'use client';

import {
  useAgent,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  SessionProvider,
  useSession,
  useSessionMessages,
  SessionEvent,
  useEvents,
  TEXT_CHAT_ROLE_ATTRIBUTE,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import { useMemo, useState, useEffect } from 'react';
import { MediaDeviceFailure, TokenSource } from 'livekit-client';
import styles from '../styles/VoiceAssistant.module.scss';
import { generateRandomUserId } from '../lib/helper';

type SessionMode = 'rtc' | 'text';

const TEXT_MODE_BASE_URL =
  process.env.NEXT_PUBLIC_LK_TEXT_BASE_URL ?? 'http://localhost:8787/fare-desk/v1';

function SimpleAgent() {
  const agent = useAgent();

  useEffect(() => {
    if (agent.state === 'failed') {
      alert(`Agent error: ${agent.failureReasons.join(', ')}`);
    }
  }, [agent.state, agent.failureReasons]);

  return (
    <BarVisualizer
      state={agent.state}
      barCount={7}
      track={agent.microphoneTrack}
      style={{ width: '75vw', height: '300px' }}
    />
  );
}

function TextChat() {
  const { messages, send, isSending } = useSessionMessages();
  const [draft, setDraft] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    setDraft('');
    send(text).catch((err) => console.error('Failed to send text message:', err));
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 480, height: 800, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexGrow: 1,
            flexShrink: 1,
          }}
        >
          {messages.length === 0 ? (
            <span style={{ opacity: 0.6 }}>No messages yet. Say hello 👋</span>
          ) : (
            messages.map((message) => {
              const role = message.attributes?.[TEXT_CHAT_ROLE_ATTRIBUTE] ?? 'agent';
              const isUser = role === 'user';
              return (
                <div
                  key={message.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    background: isUser ? '#1f6feb' : 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    maxWidth: '80%',
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{role}</div>
                  <div>{'message' in message ? message.message : ''}</div>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            className="lk-form-control"
            style={{ flex: 1 }}
            value={draft}
            placeholder="Type a message (e.g. how much to SFO?)"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="lk-button" type="submit" disabled={isSending}>
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

// const tokenSource = TokenSource.endpoint(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT!);
const tokenSource = TokenSource.endpoint('/api/livekit/token');

const AgentExample: NextPage = () => {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(location.search) : null),
    [],
  );
  const [roomName, setRoomName] = useState(() => params?.get('room') ?? 'test');

  useEffect(() => {
    if (!roomName) {
      setRoomName('test-room-' + Math.random().toFixed(5));
    }
  }, []);
  const [userIdentity] = useState(() => params?.get('user') ?? generateRandomUserId());

  // NOTE: `mode` selects between the RTC and text-mode implementations. Switching mode is treated as
  // a fresh start (there is no conversation migration yet), so the toggle is disabled once started.
  const session = useSession(
    tokenSource,
    { mode: 'text', baseUrl: TEXT_MODE_BASE_URL, roomName, participantIdentity: userIdentity }
  );

  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (started) {
      session.start().catch((err) => {
        console.error('Failed to start session:', err);
      });
    } else {
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, session.start, session.end]);

  useEffect(() => {
    if (session.connectionState === 'disconnected') {
      setStarted(false);
    }
  }, [session.connectionState]);

  useEvents(
    session,
    SessionEvent.MediaDevicesError,
    (error) => {
      const failure = MediaDeviceFailure.getFailure(error);
      console.error(failure);
      alert(
        'Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab',
      );
    },
    [],
  );

  return (
    <main data-lk-theme="default" className={styles.main}>
      <SessionProvider session={session}>
        <div className={styles.room}>
          <div className={styles.inner}>
            {started ? (
              <div>
                <TextChat />
                {/* <SimpleAgent /> */}
              </div>
            ) : (
              <div style={{ marginTop: 24 }}>
                <button className="lk-button" onClick={() => setStarted(true)}>
                  Connect
                </button>
              </div>
            )}
          </div>
          {/* {mode === 'rtc' && ( */}
          {/*   <> */}
          {/*     <VoiceAssistantControlBar /> */}
          {/*     <RoomAudioRenderer /> */}
          {/*   </> */}
          {/* )} */}
        </div>
      </SessionProvider>
    </main>
  );
};

export default AgentExample;
