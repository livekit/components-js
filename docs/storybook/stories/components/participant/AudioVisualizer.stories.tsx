import * as React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';

import { AudioVisualizer, AudioVisualizerProps } from '@livekit/components-react';
import { LkLocalMicTrackContext, LkRoomContext } from '../../../.storybook/lk-decorators';

const Story: Meta<typeof AudioVisualizer> = {
  /*
   * This is some docs for connection quality
   */
  component: AudioVisualizer,
  decorators: [LkLocalMicTrackContext, LkRoomContext],
  render: (args: AudioVisualizerProps) => <AudioVisualizer {...args} />,
  argTypes: {
    barCount: {
      name: 'Bar count',
      control: { type: 'range', min: 1, max: 1024, step: 1 },
      default: 32,
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
    docs: {
      page: null,
    },
  },
};

export default Story;

export const Default: StoryObj<AudioVisualizerProps> = { args: { barCount: 1024 } };
export const Abstract: StoryObj<AudioVisualizerProps> = {
  args: { barCount: 6, gap: '0.5rem', barWidth: '0.5rem', borderRadius: '1rem' },
};
