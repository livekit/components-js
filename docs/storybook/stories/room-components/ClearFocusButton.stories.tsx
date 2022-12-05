import React from 'react';
import { StoryObj } from '@storybook/react';

import { ClearFocusButton, ClearFocusButtonProps } from '@livekit/components-react';
import { LkFocusContext, LkRoomContext } from '../../.storybook/lk-decorators';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  component: ClearFocusButton,
  decorators: [LkFocusContext, LkRoomContext],
  render: (args: ClearFocusButtonProps) => (
    <ClearFocusButton {...args}>Back to Grid</ClearFocusButton>
  ),
  argTypes: {
    isPinned: {
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

export const Default: StoryObj<ClearFocusButtonProps> = {
  args: {},
  parameters: {
    roomContext: { audio: false, video: false, connect: true },
  },
};
