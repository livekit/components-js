import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { ReactShaderToy, ReactShaderToyProps } from '@agents-ui';

export default {
  component: ReactShaderToy,
  decorators: [AgentSessionProvider],
  render: (args: ReactShaderToyProps) => {
    return (
      <div className="aspect-square w-96">
        <ReactShaderToy {...args} />
      </div>
    );
  },
  args: {},
  argTypes: {},
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<ReactShaderToyProps> = {
  args: {},
};

export const Basic: StoryObj<ReactShaderToyProps> = {
  args: {
    fs: `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,
  },
};