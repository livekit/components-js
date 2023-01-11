import * as React from 'react';
import { StoryObj } from '@storybook/react';

import { ClearPinButton, ClearPinButtonProps } from '@livekit/components-react';
import { LkLayoutContext, LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  component: ClearPinButton,
  decorators: [LkLayoutContext, LkRoomContext],
  render: (args: ClearPinButtonProps) => <ClearPinButton {...args}>Back to Grid</ClearPinButton>,
  argTypes: {
    inFocus: {
      control: { type: 'boolean' },
      default: true,
    },
  },
  parameters: {
    actions: {
      handles: ['click'],
    },
  },
};

export const Default: StoryObj<ClearPinButtonProps> = {
  args: {},
  parameters: {
    roomContext: { audio: false, video: false, connect: true },
  },
};
