import * as React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';

import { ChatEntry, ChatEntryProps, formatChatMessageLinks } from '@livekit/components-react';
import { LkRoomContext } from '../../.storybook/lk-decorators';
import { Participant } from 'livekit-client';

const participant = new Participant('dummy-sid', 'dummy-identity', 'dummy-name', 'dummy-metadata');

const Story: Meta<typeof ChatEntry> = {
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

export default Story;

export const Default: StoryObj<ChatEntryProps> = {
  args: { entry: { timestamp: 1, id: '234', message: 'Hello world!', from: participant } },
  parameters: { roomContext: { audio: false, video: false, connect: true } },
};

export const LongMessage: StoryObj<ChatEntryProps> = {
  ...Default,
  args: {
    entry: {
      id: '234',
      timestamp: 1,
      message:
        'Niklas tog tag i datorn och lyfte den mot himmeln. Så nu tar vi en paus och inväntar resultatet av dagens skrivande. Sociala nätverk kan aldrig fånga en fisk. Kan vi få fram något resultat på hur många som kom idag? En annan sak är att man ibland går ensam till de olika festerna.',
      from: participant,
    },
    messageFormatter: formatChatMessageLinks,
  },
};

export const MessageWithLinks: StoryObj<ChatEntryProps> = {
  ...Default,
  args: {
    entry: {
      id: '234',
      timestamp: 1,
      message: 'a google.com message with links support@livekit.io.',
      from: participant,
    },
    messageFormatter: formatChatMessageLinks,
  },
};
