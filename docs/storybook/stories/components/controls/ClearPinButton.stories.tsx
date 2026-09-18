import * as React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';

import { ClearPinButton, ClearPinButtonProps } from '@livekit/components-react';
import { LkLayoutContext, LkRoomContext } from '../../../.storybook/lk-decorators';

const Story: Meta<typeof ClearPinButton> = {
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

export default Story;

export const Default: StoryObj<ClearPinButtonProps> = {
  args: {},
  parameters: {
    roomContext: { audio: false, video: false, connect: true },
  },
};
