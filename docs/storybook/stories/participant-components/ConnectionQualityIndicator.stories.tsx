import React from 'react';
import { StoryObj } from '@storybook/react';

import {
  ConnectionQualityIndicator,
  ConnectionQualityIndicatorProps,
} from '@livekit/components-react';
import { LkParticipantContext, LkRoomContext } from '../../.storybook/LiveKitStorybookContexts';
import { Track } from 'livekit-client';

export default {
  component: ConnectionQualityIndicator,
  decorators: [LkParticipantContext, LkRoomContext],
  render: (args: ConnectionQualityIndicatorProps) => (
    <>
      <ConnectionQualityIndicator {...args}></ConnectionQualityIndicator>
    </>
  ),
  argTypes: {
    source: {
      control: { type: 'select' },
      options: [Track.Source.Camera, Track.Source.Microphone],
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<ConnectionQualityIndicatorProps> = {
  args: {},
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};
