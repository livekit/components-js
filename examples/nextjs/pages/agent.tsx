'use client';

import {
  useAgent,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  ThreadProvider,
  RoomContext,
  useThread,
  useSession,
  useThreadMessages,
  SessionEvent,
  useEvents,
  UseThreadReturn,
  type ReceivedMessage,
} from '@livekit/components-react';
import type { NextPage } from 'next';
import { useMemo, useState, useEffect } from 'react';
import { MediaDeviceFailure, TokenSource } from 'livekit-client';
import styles from '../styles/VoiceAssistant.module.scss';
import { generateRandomUserId } from '../lib/helper';

// The A2A interface base URL (everything up to, but not including, `/v1`). The callback receives
// the project id (the first DNS label of the token's server url), which lets the same code target a
// real staging/prod agent or the local mock.
//
// Defaults to the staging `frontdesk` example agent (agent `dentist`, endpoint `frontend`). To use
// the local mock instead, set NEXT_PUBLIC_LK_TEXT_BASE_URL=http://localhost:8787/fare-desk.
const A2A_AGENT = process.env.NEXT_PUBLIC_LK_A2A_AGENT ?? 'dentist';
const A2A_ENDPOINT = process.env.NEXT_PUBLIC_LK_A2A_ENDPOINT ?? 'frontend';
const A2A_ENV = process.env.NEXT_PUBLIC_LK_A2A_ENV ?? 'staging';
const textModeBaseUrl = (projectId: string): string => {
  const override = process.env.NEXT_PUBLIC_LK_TEXT_BASE_URL;
  if (override) {
    return override; // e.g. the local mock: http://localhost:8787/fare-desk
  }
  return `https://${projectId}.${A2A_ENV}.livekit.cloud/agents/${A2A_AGENT}/default/${A2A_ENDPOINT}`;
};

// The voice half: agent state is derived from the call's room, so pass the call to useAgent directly.
function SimpleAgent({ thread }: { thread: UseThreadReturn }) {
  const agent = useAgent(thread);

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

// How each kind of message renders. Text and transcripts show their text; the rest of the agent's
// chat context (tool calls, their output, handoffs, config updates) shows a compact one-line summary.
function MessageBody({ message }: { message: ReceivedMessage }) {
  switch (message.type) {
    case 'functionCall':
      return (
        <code style={{ fontSize: 12 }}>
          🔧 {message.name}({message.arguments})
        </code>
      );
    case 'functionCallOutput':
      return (
        <code style={{ fontSize: 12, color: message.isError ? '#ff7b72' : undefined }}>
          ↳ {message.name}: {message.output}
        </code>
      );
    case 'agentHandoff':
      return (
        <span style={{ fontSize: 12, opacity: 0.8 }}>
          handoff: {message.oldAgentId ?? '(start)'} → {message.newAgentId}
        </span>
      );
    case 'agentConfigUpdate':
      return (
        <span style={{ fontSize: 12, opacity: 0.8 }}>
          config updated
          {message.toolsAdded.length > 0 ? ` +${message.toolsAdded.join(', +')}` : ''}
          {message.toolsRemoved.length > 0 ? ` -${message.toolsRemoved.join(', -')}` : ''}
          {message.instructions !== null ? ' (new instructions)' : ''}
        </span>
      );
    default:
      // chatMessage (the default when `type` is absent), userTranscript and agentTranscript.
      return <div>{message.message}</div>;
  }
}

// The text half: reads and sends messages on the thread resolved from ThreadProvider. The agent's
// text-mode state (idle → thinking → typing → idle) is driven by send() and surfaced via useAgent,
// which works here even though no call is connected.
//
// Mounting this is what loads the thread's history: the latest page first, older pages on demand.
function TextChat() {
  const chat = useThreadMessages();
  const { messages, send, isSending, loadOlder, refresh } = chat;
  const [draft, setDraft] = useState('');
  const [showSystem, setShowSystem] = useState(false);

  const visibleMessages = showSystem
    ? messages
    : messages.filter((message) => message.origin !== 'system');

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    setDraft('');
    send(text).catch((err) => console.error('Failed to send text message:', err));
  };

  const historyBusy =
    chat.status === 'loading' || chat.status === 'loading-older' || chat.status === 'refreshing';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <span style={{ opacity: 0.7, flexGrow: 1 }}>
          History: {chat.status}
          {chat.status === 'error' ? ` (${chat.error.message})` : ''}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={showSystem}
            onChange={(e) => setShowSystem(e.target.checked)}
          />
          system messages
        </label>
        <button
          className="lk-button"
          disabled={historyBusy || chat.status === 'disabled'}
          onClick={() => refresh().catch((err) => console.error('Failed to refresh:', err))}
        >
          Refresh
        </button>
        <button
          className="lk-button"
          disabled={historyBusy || chat.status === 'disabled'}
          onClick={() =>
            refresh({ mode: 'latest' }).catch((err) => console.error('Failed to refresh:', err))
          }
        >
          Reset to latest
        </button>
      </div>

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
        {chat.hasOlder ? (
          <button
            className="lk-button"
            style={{ alignSelf: 'center' }}
            disabled={chat.status === 'loading-older'}
            onClick={() => loadOlder().catch((err) => console.error('Failed to load older:', err))}
          >
            {chat.status === 'loading-older' ? 'Loading older...' : 'Load older'}
          </button>
        ) : null}

        {chat.status === 'loading' ? (
          <span style={{ opacity: 0.6 }}>Loading history...</span>
        ) : visibleMessages.length === 0 ? (
          <span style={{ opacity: 0.6 }}>No messages yet. Say hello 👋</span>
        ) : (
          visibleMessages.map((message) => {
            const isUser = message.origin === 'user';
            const label = message.origin === 'system' ? message.role : (message.origin ?? 'agent');
            const isText = !message.type || 'message' in message;
            return (
              <div
                key={message.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  background: isUser
                    ? '#1f6feb'
                    : isText
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  maxWidth: '80%',
                  opacity: message.origin === 'system' ? 0.7 : 1,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
                <MessageBody message={message} />
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
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </>
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

  const [threadId, setThreadId] = useState('');

  // History page size, e.g. ?historyPageSize=5 to try "Load older" on a short thread (0 turns history
  // off). Unset uses the default (100).
  const historyPageSize = params?.get('historyPageSize')
    ? Number(params.get('historyPageSize'))
    : undefined;

  // The durable conversation (text + history). Usable on its own for text-only.
  const thread = useThread(tokenSource, {
    threadId: threadId.length > 0 ? threadId : undefined,
    textBaseUrl: textModeBaseUrl,
    roomName,
    participantIdentity: userIdentity,
    agentName: 'dentist',
    history: { pageSize: historyPageSize },
  });

  // A voice session attached to the thread. Created up front; connected only while "started".
  const call = useSession(thread);

  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (started) {
      call.start().catch((err) => {
        console.error('Failed to start call:', err);
      });
    } else {
      call.end().catch((err) => {
        console.error('Failed to end call:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, call.start, call.end]);

  const agent = useAgent(thread);

  useEffect(() => {
    if (call.connectionState === 'disconnected') {
      setStarted(false);
    }
  }, [call.connectionState]);

  useEvents(
    call,
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
      <ThreadProvider thread={thread}>
        <div className={styles.room}>
          <div className={styles.inner}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 480, height: 64 }}>
              <input type="text" value={threadId} onChange={(e) => setThreadId(e.target.value)} placeholder="Thread ID" />
              {started ? (
                <div>
                  <button className="lk-button" onClick={() => setStarted(false)}>
                    End call
                  </button>
                </div>
              ) : (
                <button className="lk-button" onClick={() => setStarted(true)}>
                  Start call
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 480, height: 800, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  Agent:{' '}
                  {agent.state === 'thinking'
                    ? 'thinking...'
                    : agent.state === 'typing'
                      ? 'typing...'
                      : agent.state},
                  Reported thread id:{' '}{thread.threadId ?? 'N/A'}
                </div>
                {started ? (
                  <RoomContext.Provider value={call.room}>
                    <SimpleAgent thread={thread} />
                    <VoiceAssistantControlBar />
                    <RoomAudioRenderer />
                  </RoomContext.Provider>
                ) : (
                  <TextChat />
                )}
              </div>
            </div>
          </div>
        </div>
      </ThreadProvider>
    </main>
  );
};

export default AgentExample;
