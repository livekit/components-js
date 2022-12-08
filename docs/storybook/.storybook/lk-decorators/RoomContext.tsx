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
export const LkRoomContext: Decorator = (Story, { globals, args }) => {
  const roomContextSettings: RoomContextSettings = args;

  const room = new Room({});
  // const token = import.meta.env.VITE_PUBLIC_TEST_TOKEN;
  // const serverUrl = import.meta.env.VITE_PUBLIC_LK_SERVER_URL;

  // console.log({ connect, connected, token, serverUrl });

  React.useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, []);

  return (
    <>
      <LiveKitRoom
        room={room}
        token={undefined}
        serverUrl={undefined}
        simulateParticipants={globals.participantCount}
        video={roomContextSettings?.video || false}
        audio={false}
      >
        {Story()}
      </LiveKitRoom>
    </>
  );
};
