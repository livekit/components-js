import React from 'react';

import { DefaultRoomView, DefaultRoomViewProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/LiveKitStorybookContexts';

export default {
  component: DefaultRoomView,
  decorators: [LkRoomContext],
  render: (args: DefaultRoomViewProps) => <DefaultRoomView {...args} />,
  argTypes: {},
};

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
