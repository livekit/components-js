import * as React from 'react';
import { LayoutContextProvider } from '../components/layout/LayoutContextProvider';
import { RoomAudioRenderer } from '../components/RoomAudioRenderer';
import { ControlBar } from './ControlBar';
import { FocusLayout, FocusLayoutContainer } from '../components/layout/FocusLayout';
import { GridLayout } from '../components/layout/GridLayout';
import type { WidgetState } from '@livekit/components-core';
import { isEqualTrackRef, isTrackReference, log } from '@livekit/components-core';
import { Chat } from './Chat';
import { ConnectionStateToast } from '../components/Toast';
import type { MessageFormatter } from '../components/ChatEntry';
import { RoomEvent, Track } from 'livekit-client';
import { useTracks } from '../hooks/useTracks';
import { usePinnedTracks } from '../hooks/usePinnedTracks';
import { CarouselView } from '../components/layout/CarouselView';
import { useCreateLayoutContext } from '../context/layout-context';

export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
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
export function VideoConference({ chatMessageFormatter, ...props }: VideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({ showChat: false });

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged] },
  );

  const widgetUpdate = (state: WidgetState) => {
    log.debug('updating widget state', state);
    setWidgetState(state);
  };

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  React.useEffect(() => {
    if (!layoutContext.pin.state) {
      return;
    }
    const pinState = layoutContext.pin.state;
    const pinnedTrack = pinState.length > 0 ? pinState[0] : undefined;
    // if screen share tracks are published, and no pin is set explicitly, auto set the screen share
    if (screenShareTracks.length > 0 && pinnedTrack === undefined) {
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
    } else if (
      (screenShareTracks.length === 0 && pinnedTrack?.source === Track.Source.ScreenShare) ||
      tracks.length <= 1
    ) {
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
    }
  }, [
    JSON.stringify(screenShareTracks.map((ref) => ref.publication.trackSid)),
    layoutContext.pin,
    tracks.length,
  ]);

  return (
    <div className="lk-video-conference" {...props}>
      <LayoutContextProvider
        value={layoutContext}
        // onPinChange={handleFocusStateChange}
        onWidgetChange={widgetUpdate}
      >
        <div className="lk-video-conference-inner">
          {!focusTrack ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={tracks} />
            </div>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                <CarouselView tracks={carouselTracks} />
                {focusTrack && <FocusLayout track={focusTrack} />}
              </FocusLayoutContainer>
            </div>
          )}
          <ControlBar controls={{ chat: true }} />
        </div>
        <Chat
          style={{ display: widgetState.showChat ? 'flex' : 'none' }}
          messageFormatter={chatMessageFormatter}
        />
      </LayoutContextProvider>
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}
