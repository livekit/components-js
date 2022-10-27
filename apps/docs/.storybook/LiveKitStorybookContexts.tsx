import React, { useEffect, useState } from 'react';
import { LiveKitRoom, Participants } from '@livekit/components-react';
import { DecoratorFn } from '@storybook/react';
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
export const LkRoomContext: DecoratorFn = (Story, args) => {
  const roomContextSettings: RoomContextSettings = args.parameters.roomContext;
  const [connect, setConnect] = useState(roomContextSettings?.connect);
  const [connected, setConnected] = useState(false);

  const room = new Room({});
  const token = process.env.TEST_TOKEN;
  const serverUrl = process.env.NEXT_PUBLIC_LK_SERVER_URL;

  useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, []);

  return (
    <>
      <div
        style={{
          fontSize: '12px',
          lineHeight: '1rem',
          background: '',
          border: '1px dashed gray',
          display: 'flex',
          flexDirection: 'column',
          padding: '0.2rem',
          marginBottom: '1rem',
          gap: '.2rem',
        }}
      >
        <strong>LiveKit Room Controls</strong>
        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <span>Connection status: {`${connected ? 'connected' : 'not connected'}`}</span>
            <button onClick={() => setConnect(!connect)}>Toggle Connection</button>
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
        <Story />
      </LiveKitRoom>
    </>
  );
};

/**
 * Wraps a Storybook Story into a LiveKit participant context.
 *
 * Note: When used as a Storybook decorator, this component has to be used in combination with LkRoomContext.
 * The decorator order matters: `decorators: [LkParticipantContext, LkRoomContext]`
 */
export const LkParticipantContext: DecoratorFn = (Story, args) => {
  return (
    <Participants>
      <Story />
    </Participants>
  );
};
