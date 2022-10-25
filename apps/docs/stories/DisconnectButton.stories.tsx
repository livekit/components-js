import React, { useState } from 'react';

import { ComponentMeta } from '@storybook/react';

import { DisconnectButton, LiveKitRoom, useToken } from '@livekit/components-react';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Prefabs/MediaControlButton',
  component: DisconnectButton,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  decorators: [
    (Story, args) => {
      const params = args.parameters;
      console.log({ params });
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
    },
  ],
} as ComponentMeta<typeof DisconnectButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args: typeof DisconnectButton) => <DisconnectButton>Leave</DisconnectButton>;

export const Connected = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
// Connected.args = {};
Connected.parameters = {
  connect: true,
};

export const NotConnected = Template.bind({});
NotConnected.args = {};
