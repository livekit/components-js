import * as React from 'react';
import { StoryObj } from '@storybook/react';

import { AudioVisualizer, AudioVisualizerProps } from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../.storybook/lk-decorators';

export default {
  /*
   * This is some docs for connection quality
   */
  component: AudioVisualizer,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: AudioVisualizerProps) => <AudioVisualizer {...args} />,
  argTypes: {},
  parameters: {
    actions: {
      handles: [],
    },
    docs: {
      page: null,
    },
  },
};

export const Default: StoryObj<AudioVisualizerProps> = {};
