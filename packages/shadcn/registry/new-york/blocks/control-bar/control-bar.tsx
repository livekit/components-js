import * as React from 'react';
import {
  Toolbar,
  ToolbarButton,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  ToolbarSeparator,
} from '@radix-ui/react-toolbar';
import { TrackToggle } from '../../ui/track-toggle';
import { Track } from 'livekit-client';
import { DeviceSelect } from '../device-select/device-select';

export const ControlBar = () => (
  <Toolbar
    className="flex w-full min-w-max rounded-md bg-white p-2.5 shadow-[0_2px_10px] shadow-blackA4"
    aria-label="options"
  >
    <ToolbarToggleGroup
      type="multiple"
      aria-label="Publishing controls"
      className="flex items-center gap-2"
    >
      <ToolbarToggleItem asChild value="microphone">
        <TrackToggle source={Track.Source.Microphone} />
      </ToolbarToggleItem>
      <ToolbarToggleItem asChild value="audioinput">
        <DeviceSelect kind={'audioinput'} />
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
    <ToolbarSeparator className="mx-2.5 w-px bg-mauve6" />
    <ToolbarToggleGroup
      type="multiple"
      aria-label="Publishing controls"
      className="flex items-center gap-2"
    >
      <ToolbarToggleItem asChild value="camera">
        <TrackToggle source={Track.Source.Camera} />
      </ToolbarToggleItem>
      <ToolbarToggleItem asChild value="videoinput">
        <DeviceSelect kind={'videoinput'} />
      </ToolbarToggleItem>
    </ToolbarToggleGroup>

    <ToolbarButton
      className="inline-flex h-[25px] flex-shrink-0 flex-grow-0 basis-auto items-center justify-center rounded bg-violet9 px-2.5 text-[13px] leading-none text-white outline-none hover:bg-violet10 focus:relative focus:shadow-[0_0_0_2px] focus:shadow-violet7"
      style={{ marginLeft: 'auto' }}
    >
      Share
    </ToolbarButton>
  </Toolbar>
);
