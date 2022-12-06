import React from 'react';
import { StoryObj } from '@storybook/react';

import { ChatEntry, ChatEntryProps } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';
import { Participant } from 'livekit-client';

const participant = new Participant('dummy-sid', 'dummy-identity', 'dummy-name', 'dummy-metadata');

export default {
  component: ChatEntry,
  decorators: [LkRoomContext],
  render: (args: ChatEntryProps) => <ChatEntry {...args}></ChatEntry>,
  argTypes: {},
  parameters: {
    actions: {
      handles: [],
    },
  },
};

// FIXME: Fix type error for participant.
export const Default: StoryObj<ChatEntryProps> = {
  args: { entry: { timestamp: 1, message: 'Hello world!', from: participant } },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

export const LongMessage: StoryObj<ChatEntryProps> = {
  ...Default,
  args: {
    entry: {
      timestamp: 1,
      message:
        'Niklas tog tag i datorn och lyfte den mot himmeln. Så nu tar vi en paus och inväntar resultatet av dagens skrivande. Sociala nätverk kan aldrig fånga en fisk. Kan vi få fram något resultat på hur många som kom idag? En annan sak är att man ibland går ensam till de olika festerna.',
      from: participant,
    },
  },
};
