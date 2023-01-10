import * as React from 'react';
import { LayoutContextProvider } from '../components/LayoutContextProvider';
import { RoomAudioRenderer } from '../components/RoomAudioRenderer';
import { ControlBar } from './ControlBar';
import { FocusLayoutContainer } from '../layout/FocusLayout';
import { GridLayout } from '../layout/GridLayout';
import { PinState } from '@livekit/components-core';
import { TileLoop } from '../components/TileLoop';
import { ConnectionStateToast } from '../components/Toast';

export type VideoConferenceProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * This component is the default setup of a classic LiveKit video conferencing app.
 * It provides functionality like switching between participant grid view and focus view.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <VideoConference />
 * <LiveKitRoom>
 * ```
 */
export function VideoConference({ ...props }: VideoConferenceProps) {
  type Layout = 'grid' | 'focus';
  const [layout, setLayout] = React.useState<Layout>('grid');

  const handleFocusStateChange = (pinState: PinState) => {
    setLayout(pinState.length >= 1 ? 'focus' : 'grid');
  };

  return (
    <div className="lk-video-conference" {...props}>
      <LayoutContextProvider onPinChange={handleFocusStateChange}>
        {layout === 'grid' ? (
          <GridLayout>
            <TileLoop />
          </GridLayout>
        ) : (
          <FocusLayoutContainer />
        )}
      </LayoutContextProvider>
      <ControlBar />
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}
