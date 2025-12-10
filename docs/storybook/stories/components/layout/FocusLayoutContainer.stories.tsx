import * as React from 'react';

import { FocusLayoutContainerProps, FocusLayoutContainer } from '@livekit/components-react';
import { LkLayoutContext, LkRoomContext } from '../../../.storybook/lk-decorators';
import { Meta } from '@storybook/react-vite';

const Story: Meta<typeof FocusLayoutContainer> = {
  component: FocusLayoutContainer,
  decorators: [LkLayoutContext, LkRoomContext],
  render: (args: FocusLayoutContainerProps) => <FocusLayoutContainer {...args} />,
  argTypes: {
    hasFocus: {
      control: { type: 'boolean' },
      default: true,
    },
  },
};

export default Story;

export const Default = {
  args: {},
  parameters: { roomContext: { audio: true, video: true, connect: true } },
};
