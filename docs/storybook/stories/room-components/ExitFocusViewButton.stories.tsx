import React from 'react';
import { StoryObj } from '@storybook/react';

import { ExitFocusViewButton, ExitFocusViewButtonProps } from '@livekit/components-react';
import { LkFocusContext, LkRoomContext } from '../../.storybook/lk-decorators';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  component: ExitFocusViewButton,
  decorators: [LkFocusContext, LkRoomContext],
  render: (args: ExitFocusViewButtonProps) => (
    <ExitFocusViewButton {...args}>Back to Grid</ExitFocusViewButton>
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

export const Connected: StoryObj<ExitFocusViewButtonProps> = {
  args: {},
  parameters: {
    roomContext: { audio: false, video: false, connect: true },
  },
};
