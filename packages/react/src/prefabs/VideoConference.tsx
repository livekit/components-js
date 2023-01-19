import * as React from 'react';
import { LayoutContextProvider } from '../components/LayoutContextProvider';
import { RoomAudioRenderer } from '../components/RoomAudioRenderer';
import { ControlBar } from './ControlBar';
import { FocusLayoutContainer } from '../components/layout/FocusLayout';
import { GridLayout } from '../components/layout/GridLayout';
import { PinState, WidgetState } from '@livekit/components-core';
import { TileLoop } from '../components/TileLoop';
import { Chat } from './Chat';
import { ConnectionStateToast } from '../components/Toast';
import { useMediaQuery } from '../hooks/utiltity-hooks';
import { MessageFormatter } from './ChatEntry';

export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  formatChatMessage?: MessageFormatter;
}

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
export function VideoConference({ formatChatMessage, ...props }: VideoConferenceProps) {
  type Layout = 'grid' | 'focus';
  const [layout, setLayout] = React.useState<Layout>('grid');
  const [widgetState, setWidgetState] = React.useState<WidgetState>({ showChat: false });

  const handleFocusStateChange = (pinState: PinState) => {
    setLayout(pinState.length >= 1 ? 'focus' : 'grid');
  };

  const isMobile = useMediaQuery(`(max-width: 660px)`);

  return (
    <div className="lk-video-conference" {...props}>
      <LayoutContextProvider onPinChange={handleFocusStateChange} onWidgetChange={setWidgetState}>
        <div className="lk-video-conference-inner">
          {layout === 'grid' ? (
            <GridLayout>
              <TileLoop />
            </GridLayout>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer />
            </div>
          )}
          <ControlBar variation={isMobile ? 'minimal' : 'verbose'} controls={{ chat: true }} />
        </div>
        <Chat
          style={{ display: widgetState.showChat ? 'flex' : 'none' }}
          formatMessage={formatChatMessage}
        />
      </LayoutContextProvider>
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}
