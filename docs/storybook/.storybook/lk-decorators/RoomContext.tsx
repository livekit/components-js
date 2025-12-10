import * as React from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { Decorator } from '@storybook/react-vite';
import { Room } from 'livekit-client';

export type RoomContextSettings = Partial<{
  audio: boolean;
  video: boolean;
  connect: boolean;
}>;

/**
 * Wraps a Storybook Story into a simulated LiveKit room context.
 */
export const LkRoomContext: Decorator = (Story, { globals, args }) => {
  const roomContextSettings: RoomContextSettings = args;
  const room = new Room({});

  React.useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, []);

  return (
    <>
      <LiveKitRoom
        data-lk-theme="default"
        room={room}
        token={undefined}
        serverUrl={undefined}
        simulateParticipants={globals.participantCount}
        video={roomContextSettings?.video || false}
        audio={false}
        style={{ height: '100vh', width: '100vw' }}
      >
        {Story()}
      </LiveKitRoom>
    </>
  );
};

/**
 * Wraps a Storybook Story into a live LiveKit room context.
 * This will connect to a actual LiveKit server.
 * This context is intended for local testing, for stories use `LkRoomContext` instead.
 *
 * Note: This context requires some environment variables to be set. Make sure that they are set correctly in your .env file.
 */
export const LkRoomContextLive: Decorator = (Story, args) => {
  const roomContextSettings: RoomContextSettings = args.parameters.roomContext;
  const [connect, setConnect] = React.useState(roomContextSettings?.connect);
  const [connected, setConnected] = React.useState(false);

  const room = new Room({});
  const token = import.meta.env.VITE_PUBLIC_TEST_TOKEN;
  const serverUrl = import.meta.env.VITE_PUBLIC_LK_SERVER_URL;

  React.useEffect(() => {
    room.on('connected', () => setConnected(true));
    room.on('disconnected', () => setConnected(false));
    return () => {
      room.removeAllListeners();
      room.disconnect();
    };
  }, []);

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          margin: '-1rem -1rem 1rem',
          fontSize: '.75rem',
          backgroundColor: 'var(--lk-bg2)',
        }}
      >
        <strong>LiveKit Room Controls</strong>
        <div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            Connection status
            <button onClick={() => setConnect(!connect)}>{`${
              connected ? 'Connected' : 'Not connected'
            }`}</button>
          </div>
        </div>
      </div>
      <LiveKitRoom
        data-lk-theme="default"
        room={room}
        connect={connect}
        token={token}
        serverUrl={serverUrl}
        video={roomContextSettings?.video || false}
        audio={roomContextSettings?.audio || false}
        onConnected={() => {
          setConnected(true);
        }}
        onDisconnected={() => {
          setConnect(false);
        }}
      >
        {Story()}
      </LiveKitRoom>
    </>
  );
};
