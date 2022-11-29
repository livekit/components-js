import * as React from 'react';
import { PinContextProvider } from '../components/PinContextProvider';
import { RoomAudioRenderer } from '../components/RoomAudioRenderer';
import { DefaultControls } from './DefaultControls';
import { FocusViewContainer } from '../components/layout/FocusView';
import { GridView } from '../components/layout/GridView';
import { PinState } from '@livekit/components-core';

export type DefaultRoomViewProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * This component is the default setup of a classic LiveKit video conferencing app.
 * It provides functionality like switching between participant grid view and focus view.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `PinContextProvider`,
 * `GridView`, `DefaultControls`, `FocusViewContainer` and `FocusView`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <DefaultRoomView />
 * <LiveKitRoom>
 * ```
 */
export function DefaultRoomView({ ...props }: DefaultRoomViewProps) {
  type Layout = 'grid' | 'focus';
  const [layout, setLayout] = React.useState<Layout>('grid');

  const handlePinStateChange = (pinState: PinState) => {
    setLayout(pinState.pinnedParticipant ? 'focus' : 'grid');
  };

  return (
    <div {...props}>
      <PinContextProvider onChange={handlePinStateChange}>
        {layout === 'grid' ? <GridView /> : <FocusViewContainer />}
      </PinContextProvider>
      <DefaultControls />
      <RoomAudioRenderer />
    </div>
  );
}
