import React, { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { DecoratorFn } from '@storybook/react';

/**
 *
 */
export const LkRoomContext: DecoratorFn = (Story, args) => {
  const [connect, setConnect] = useState(args.parameters.connect);

  return (
    <>
      {connect === false && <button onClick={() => setConnect(!connect)}>Connect</button>}

      <LiveKitRoom
        connect={connect}
        token={process.env.TEST_TOKEN}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        video={true}
        onDisconnected={() => setConnect(false)}
      >
        <Story />
      </LiveKitRoom>
    </>
  );
};
