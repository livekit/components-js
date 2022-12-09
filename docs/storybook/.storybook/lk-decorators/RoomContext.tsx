import * as React from 'react';
import { LiveKitRoom, ParticipantsLoop } from '@livekit/components-react';
import { Decorator } from '@storybook/react';
import { Room } from 'livekit-client';

export type RoomContextSettings = Partial<{
  audio: boolean;
  video: boolean;
  connect: boolean;
}>;

/**
 * Wraps a Storybook Story into a LiveKit room context.
 *
 * Note: This component requires some environment variables. Make sure that they are set correctly in your .env file.
 */
export const LkRoomContext: Decorator = (Story, args) => {
  const roomContextSettings: RoomContextSettings = args.parameters.roomContext;
  const [connect, setConnect] = React.useState(roomContextSettings?.connect);
  const [connected, setConnected] = React.useState(false);

  const room = new Room({});
  const token = import.meta.env.VITE_PUBLIC_TEST_TOKEN;
  const serverUrl = import.meta.env.VITE_PUBLIC_LK_SERVER_URL;

  console.log({ connect, connected, token, serverUrl });

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
          backgroundColor: 'var(--lk-bg-secondary)',
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
