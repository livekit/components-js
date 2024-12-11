import type {
  MessageDecoder,
  MessageEncoder,
  TrackReferenceOrPlaceholder,
  WidgetState,
} from '@cc-livekit/components-core';
import { isEqualTrackRef, isTrackReference, isWeb, log } from '@cc-livekit/components-core';
import { RemoteParticipant, RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import type { MessageFormatter } from '../components';
import {
  CarouselLayout,
  ConnectionStateToast,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  ParticipantTile,
  RoomAudioRenderer,
} from '../components';
import { useCreateLayoutContext, useFeatureContext, useRoomContext } from '../context';
import { usePinnedTracks, useTracks } from '../hooks';
import { Chat } from './Chat';
import { ControlBar, ControlBarProps } from './ControlBar';
import { useWarnAboutMissingStyles } from '../hooks/useWarnAboutMissingStyles';

/**
 * @public
 */
export interface NewVideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  onScreenShareClick?: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
  /** @alpha */
  SettingsComponent?: React.ComponentType;
  controls?: ControlBarProps['controls'];
  onAddMember?: () => void;
  onMemberList?: () => void;
  filterLocalTracks?: boolean;
}

/**
 * The `VideoConference` ready-made component is your drop-in solution for a classic video conferencing application.
 * It provides functionality such as focusing on one participant, grid view with pagination to handle large numbers
 * of participants, basic non-persistent chat, screen sharing, and more.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 * You can use these components as a starting point for your own custom video conferencing application.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <VideoConference />
 * <LiveKitRoom>
 * ```
 * @public
 */
export function NewVideoConference({
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  SettingsComponent,
  onScreenShareClick,
  onAddMember,
  onMemberList,
  filterLocalTracks,
  controls,
  ...props
}: NewVideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });
  const room = useRoomContext();
  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false, filterLocalTracks },
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
  const featureFlags = useFeatureContext();

  // auto pin remote participant when 1on1
  React.useEffect(() => {
    if (featureFlags?.type === 'instant') {
      // instant mode must be converted from 1on1
      return layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
    }
    if (!room || featureFlags?.type !== '1on1') {
      return;
    }

    const onLocalConnected = () => {
      const participants = room.remoteParticipants;
      if (participants.size > 1) {
        return;
      }
      for (let [_, participant] of participants) {
        layoutContext.pin.dispatch?.({
          msg: 'set_pin',
          trackReference: {
            participant,
            publication: participant.getTrackPublication(Track.Source.Camera),
            source: Track.Source.Camera,
          },
        });
      }
    };

    const onRemoteConnected = (p: RemoteParticipant) => {
      // convert to instant
      if (room.remoteParticipants.size > 1) {
        return;
      }
      console.warn('on remote connected, current remote size:', room.remoteParticipants.size);
      layoutContext.pin.dispatch?.({
        msg: 'set_pin',
        trackReference: {
          participant: p,
          publication: p.getTrackPublication(Track.Source.Camera),
          source: Track.Source.Camera,
        },
      });
    };

    room.on(RoomEvent.Connected, onLocalConnected);
    room.on(RoomEvent.ParticipantConnected, onRemoteConnected);

    return () => {
      room.off(RoomEvent.Connected, onLocalConnected);
      room.off(RoomEvent.ParticipantConnected, onRemoteConnected);
    };
  }, [room, featureFlags?.type]);

  React.useEffect(() => {
    // If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
    if (
      screenShareTracks.some((track) => track.publication.isSubscribed) &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      log.debug('Auto set screen share focus:', { newScreenShareTrack: screenShareTracks[0] });
      console.warn('set pin 5');
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track) =>
          track.publication.trackSid ===
          lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
      )
    ) {
      log.debug('Auto clearing screen share focus.');
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
      lastAutoFocusedScreenShareTrack.current = null;
    }
    if (focusTrack && !isTrackReference(focusTrack)) {
      const updatedFocusTrack = tracks.find(
        (tr) =>
          tr.participant.identity === focusTrack.participant.identity &&
          tr.source === focusTrack.source,
      );
      if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
        console.warn('set pin 6');
        layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
      }
    }
  }, [
    screenShareTracks
      .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
      .join(),
    focusTrack?.publication?.trackSid,
    tracks,
  ]);

  useWarnAboutMissingStyles();

  return (
    <div className={`lk-video-conference conference-type-${featureFlags?.type}`} {...props}>
      {isWeb() && (
        <LayoutContextProvider
          value={layoutContext}
          // onPinChange={handleFocusStateChange}
          onWidgetChange={widgetUpdate}
        >
          <div className="lk-video-conference-inner">
            {!focusTrack ? (
              <div className="lk-grid-layout-wrapper">
                <GridLayout tracks={tracks}>
                  <ParticipantTile />
                </GridLayout>
              </div>
            ) : (
              <div className="lk-focus-layout-wrapper">
                <FocusLayoutContainer>
                  <CarouselLayout tracks={carouselTracks}>
                    <ParticipantTile />
                  </CarouselLayout>
                  {focusTrack && <FocusLayout trackRef={focusTrack} />}
                </FocusLayoutContainer>
              </div>
            )}
            <ControlBar
              variation="minimal"
              onAddMember={onAddMember}
              onMemberList={onMemberList}
              controls={{ chat: true, settings: !!SettingsComponent, ...controls }}
              onScreenShareClick={onScreenShareClick}
            />
          </div>
          <Chat
            style={{ display: widgetState.showChat ? 'grid' : 'none' }}
            messageFormatter={chatMessageFormatter}
            messageEncoder={chatMessageEncoder}
            messageDecoder={chatMessageDecoder}
          />
          {SettingsComponent && (
            <div
              className="lk-settings-menu-modal"
              style={{ display: widgetState.showSettings ? 'block' : 'none' }}
            >
              <SettingsComponent />
            </div>
          )}
        </LayoutContextProvider>
      )}
      <RoomAudioRenderer filterLocalTracks={filterLocalTracks} />
      <ConnectionStateToast />
    </div>
  );
}
