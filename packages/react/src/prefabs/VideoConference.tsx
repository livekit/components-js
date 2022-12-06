import * as React from 'react';
import { FocusContextProvider } from '../components/FocusContextProvider';
import { RoomAudioRenderer } from '../components/RoomAudioRenderer';
import { ControlBar } from './ControlBar';
import { FocusLayoutContainer } from '../layout/FocusLayout';
import { GridLayout } from '../layout/GridLayout';
import { FocusState } from '@livekit/components-core';

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

  const handleFocusStateChange = (focusState: FocusState) => {
    setLayout(focusState.participantInFocus ? 'focus' : 'grid');
  };

  return (
    <div {...props}>
      <FocusContextProvider onChange={handleFocusStateChange}>
        {layout === 'grid' ? <GridLayout /> : <FocusLayoutContainer />}
      </FocusContextProvider>
      <ControlBar />
      <RoomAudioRenderer />
    </div>
  );
}
