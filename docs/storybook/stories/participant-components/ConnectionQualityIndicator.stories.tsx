import React from 'react';
import { StoryObj } from '@storybook/react';

import {
  ConnectionQualityIndicator,
  ConnectionQualityIndicatorProps,
} from '@livekit/components-react';
import { MockParticipantContext, MockParticipantProps } from '../../.storybook/participantMock';
import { ConnectionQuality } from 'livekit-client';

export default {
  /*
   * This is some docs for connection quality
   */
  component: ConnectionQualityIndicator,
  decorators: [],

  argTypes: {
    connectionQuality: {
      control: { type: 'select' },
      options: [ConnectionQuality.Excellent, ConnectionQuality.Good],
    },
  },
  parameters: {
    actions: {
      handles: [],
    },
    docs: {
      description: {
        component: 'Some component _markdown_',
      },
    },
  },
};

export const Default: StoryObj<ConnectionQualityIndicatorProps> = {
  render: (args: Partial<MockParticipantProps>) => (
    <MockParticipantContext sid="12345678" identity="my-mock-id" {...args}>
      <ConnectionQualityIndicator></ConnectionQualityIndicator>
    </MockParticipantContext>
  ),
  parameters: {
    roomContext: { audio: false, video: false, connect: true },
  },
};
