import * as React from 'react';
import { StoryObj } from '@storybook/react-vite';
import {
  AgentSessionProvider,
  useMicrophone,
} from '../../.storybook/lk-decorators/AgentSessionProvider';
import { AudioVisualizerGrid, AudioVisualizerGridProps } from '@agents-ui';

type SVGIconProps = React.SVGProps<SVGSVGElement>;

function SVGIcon({ className, children, ...props }: SVGIconProps) {
  return (
    <>
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        {children}
      </svg>
    </>
  );
}

function EyeSVG(props: SVGIconProps) {
  return (
    <SVGIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.6288 11.0551C20.0662 6.43919 16.0964 3.99997 12.0007 4C7.90507 4.00003 3.93525 6.4393 1.3727 11.0552C1.04764 11.6407 1.04764 12.3594 1.3727 12.9449C3.93525 17.5608 7.90508 20 12.0007 20C16.0964 20 20.0662 17.5607 22.6288 12.9448C22.9538 12.3593 22.9538 11.6406 22.6288 11.0551ZM11.5528 8.89443L10.7412 10.5176C10.6928 10.6144 10.6144 10.6928 10.5176 10.7412L8.89443 11.5528C8.5259 11.737 8.5259 12.263 8.89443 12.4472L10.5176 13.2588C10.6144 13.3072 10.6928 13.3856 10.7412 13.4824L11.5528 15.1056C11.737 15.4741 12.263 15.4741 12.4472 15.1056L13.2588 13.4824C13.3072 13.3856 13.3856 13.3072 13.4824 13.2588L15.1056 12.4472C15.4741 12.263 15.4741 11.737 15.1056 11.5528L13.4824 10.7412C13.3856 10.6928 13.3072 10.6144 13.2588 10.5176L12.4472 8.89443C12.263 8.5259 11.737 8.5259 11.5528 8.89443Z"
        fill="currentColor"
      />
    </SVGIcon>
  );
}

function PlusSVG(props: SVGIconProps) {
  return (
    <SVGIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 7V12M12 12V17M12 12H7M12 12H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </SVGIcon>
  );
}

export default {
  component: AudioVisualizerGrid,
  decorators: [AgentSessionProvider],
  render: (args: AudioVisualizerGridProps) => {
    const audioTrack = useMicrophone();

    return <AudioVisualizerGrid {...args} audioTrack={audioTrack} />;
  },
  args: {
    default: 'lg',
    state: 'connecting',
    radius: 5,
    interval: 100,
    rowCount: 10,
    columnCount: 10,
  },
  argTypes: {
    size: {
      options: ['icon', 'sm', 'md', 'lg', 'xl'],
      control: { type: 'select' },
    },
    state: {
      options: ['connecting', 'initializing', 'listening', 'thinking', 'speaking', 'idle'],
      control: { type: 'select' },
    },
    radius: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
    },
    interval: {
      control: { type: 'range', min: 1, max: 1000, step: 1 },
    },
    rowCount: {
      control: { type: 'range', min: 1, max: 40, step: 1 },
    },
    columnCount: {
      control: { type: 'range', min: 1, max: 40, step: 1 },
    },
    className: { control: { type: 'text' } },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Demo1: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-4 [&_>_*]:size-1 [&_>_*]:rounded-full [&_>_*]:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-foreground [&_>_[data-lk-highlighted=true]]:scale-125 [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_10px_2px_rgba(255,255,255,0.4)]',
  },
};

export const Demo2: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-2 [&_>_*]:w-4 [&_>_*]:h-1 [&_>_*]:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-[#F9B11F] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_14.8px_2px_#F9B11F]',
  },
};

export const Demo3: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-4 [&_>_*]:size-2 [&_>_*]:rounded-full [&_>_*]:bg-foreground/10 [&_>_[data-lk-highlighted=true]]:bg-[#1F8CF9] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_14.8px_2px_#1F8CF9]',
    transformer: (index: number, rowCount: number, columnCount: number) => {
      const rowMidPoint = Math.floor(rowCount / 2);
      const distanceFromCenter = Math.sqrt(
        Math.pow(rowMidPoint - (index % columnCount), 2) +
          Math.pow(rowMidPoint - Math.floor(index / columnCount), 2),
      );

      return {
        opacity: 1 - distanceFromCenter / columnCount,
        transform: `scale(${1 - (distanceFromCenter / (columnCount * 2)) * 1.75})`,
      };
    },
  },
};

export const Demo4: StoryObj<AudioVisualizerGridProps> = {
  args: {
    className:
      'gap-x-2.5 gap-y-1 [&_>_*]:w-3 [&_>_*]:h-px [&_>_*]:my-2 [&_>_*]:rotate-45 [&_>_*]:bg-foreground/10 [&_>_*]:rotate-45 [&_>_*]:scale-100 [&_>_[data-lk-highlighted=true]]:bg-[#FFB6C1] [&_>_[data-lk-highlighted=true]]:shadow-[0px_0px_8px_2px_rgba(255,182,193,0.4)] [&_>_[data-lk-highlighted=true]]:rotate-[405deg] [&_>_[data-lk-highlighted=true]]:scale-200',
  },
};
