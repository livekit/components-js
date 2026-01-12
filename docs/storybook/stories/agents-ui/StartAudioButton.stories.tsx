import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { StartAudioButton, type StartAudioButtonProps } from '@agents-ui';

// TODO: Add argTypes for 'room' prop - Room instance (difficult to control in Storybook but could document)
// TODO: Add argTypes for 'disabled' prop - boolean to disable the button (inherited from ButtonHTMLAttributes)

export default {
  component: StartAudioButton,
  decorators: [AgentSessionProvider],
  render: (args: StartAudioButtonProps) => {
    return (
      <>
        <p>A button will be rendered below if audio playback is blocked.</p>
        <StartAudioButton {...args} />
      </>
    );
  },
  args: {
    label: 'Click to allow audio playback',
  },
  argTypes: {
    label: { control: { type: 'text' } },
    onClick: { action: 'onClick' },
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<StartAudioButtonProps> = {
  args: {},
};
