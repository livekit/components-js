import React from 'react';
import { StoryObj } from '@storybook/react-vite';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import { ReactShader, ReactShaderProps } from '@agents-ui';

export default {
  component: ReactShader,
  decorators: [AgentSessionProvider],
  render: (args: ReactShaderProps) => {
    return (
      <div className="aspect-square w-96">
        <ReactShader {...args} />
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

export const Default: StoryObj<ReactShaderProps> = {
  args: {},
};

export const Basic: StoryObj<ReactShaderProps> = {
  args: {
    fs: `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,
  },
};
