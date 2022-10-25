import React, { useEffect, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { DecoratorFn } from '@storybook/react';

/**
 *
 */
export const LkRoomContext: DecoratorFn = (Story, args) => {
  const [connect, setConnect] = useState(args.parameters.connect);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    return () => {
      setConnect(false);
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
            {connect === false && (
              <button onClick={() => setConnect(!connect)}>Connect to room</button>
            )}
          </div>
        </div>
      </div>

      <LiveKitRoom
        connect={connect}
        token={process.env.TEST_TOKEN}
        serverUrl={process.env.NEXT_PUBLIC_LK_SERVER_URL}
        video={true}
        onConnected={() => {
          setConnected(true);
        }}
        onDisconnected={() => {
          console.log('onDisconnected');
          setConnect(false);
        }}
      >
        <Story />
      </LiveKitRoom>
    </>
  );
};
