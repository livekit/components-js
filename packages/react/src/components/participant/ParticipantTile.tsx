import * as React from 'react';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { trackReference } from '@livekit/components-core';
import { isParticipantSourcePinned, setupParticipantTile } from '@livekit/components-core';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { MediaTrack } from './MediaTrack';
import { ParticipantName } from './ParticipantName';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import {
  useMaybeLayoutContext,
  useEnsureTrackReference,
  TrackContext,
  useMaybeTrackContext,
} from '../../context';
import { useIsMuted, useIsSpeaking } from '../../hooks';
import { mergeProps } from '../../utils';
import { FocusToggle } from '../controls/FocusToggle';
import { ParticipantPlaceholder } from '../../assets/images';
import { ScreenShareIcon } from '../../assets/icons';

export type ParticipantTileProps = React.HTMLAttributes<HTMLDivElement> & {
  disableSpeakingIndicator?: boolean;
  participant?: Participant;
  source?: Track.Source;
  publication?: TrackPublication;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
};

export type UseParticipantTileProps<T extends React.HTMLAttributes<HTMLElement>> =
  TrackReferenceOrPlaceholder & {
    disableSpeakingIndicator?: boolean;
    publication?: TrackPublication;
    onParticipantClick?: (event: ParticipantClickEvent) => void;
    htmlProps: T;
  };

export function useParticipantTile<T extends React.HTMLAttributes<HTMLElement>>({
  participant,
  source,
  publication,
  onParticipantClick,
  disableSpeakingIndicator,
  htmlProps,
}: UseParticipantTileProps<T>) {
  const trackRef = useEnsureTrackReference({ participant, source, publication });
  const mergedProps = React.useMemo(() => {
    const { className } = setupParticipantTile();
    return mergeProps(htmlProps, {
      className,
      onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        htmlProps.onClick?.(event);
        if (typeof onParticipantClick === 'function') {
          onParticipantClick(trackRef);
        }
      },
    });
  }, [htmlProps, onParticipantClick, trackRef]);
  const isVideoMuted = useIsMuted(Track.Source.Camera, { participant });
  const isAudioMuted = useIsMuted(Track.Source.Microphone, { participant });
  const isSpeaking = useIsSpeaking(participant);
  return {
    elementProps: {
      'data-lk-audio-muted': isAudioMuted,
      'data-lk-video-muted': isVideoMuted,
      'data-lk-speaking': disableSpeakingIndicator === true ? false : isSpeaking,
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': source,
      ...mergedProps,
    },
  };
}

export function TrackRefContextIfNeeded(
  props: React.PropsWithChildren<{
    trackRef: TrackReferenceOrPlaceholder;
  }>,
) {
  const hasContext = !!useMaybeTrackContext();
  return props.trackRef && !hasContext ? (
    <TrackContext.Provider value={props.trackRef}>{props.children}</TrackContext.Provider>
  ) : (
    <>{props.children}</>
  );
}

/**
 * The ParticipantTile component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `ParticipantLoop` component or independently if a participant is passed as a property.
 *
 * @example
 * ```tsx
 * <ParticipantTile source={Track.Source.Camera} />
 * ```
 */
export const ParticipantTile = ({
  participant,
  children,
  source = Track.Source.Camera,
  onParticipantClick,
  publication,
  disableSpeakingIndicator,
  ...htmlProps
}: ParticipantTileProps) => {
  const maybeTrackRef = participant ? trackReference(participant, source, publication) : undefined;
  const trackRef = useEnsureTrackReference(maybeTrackRef);

  const { elementProps } = useParticipantTile({
    participant: trackRef.participant,
    htmlProps,
    source,
    publication,
    disableSpeakingIndicator,
    onParticipantClick,
  });

  const layoutContext = useMaybeLayoutContext();

  const handleSubscribe = React.useCallback(
    (subscribed: boolean) => {
      if (
        source &&
        !subscribed &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isParticipantSourcePinned(trackRef.participant, source, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' });
      }
    },
    [layoutContext, source, trackRef.participant],
  );

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <TrackRefContextIfNeeded trackRef={trackRef}>
        {children ?? (
          <>
            {/** TODO remove MediaTrack in favor of the equivalent Audio/Video Track. need to figure out how to differentiate here */}
            <MediaTrack
              source={source}
              publication={publication}
              participant={participant}
              onSubscriptionStatusChanged={handleSubscribe}
            />
            <div className="lk-participant-placeholder">
              <ParticipantPlaceholder />
            </div>
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                {source === Track.Source.Camera ? (
                  <>
                    <TrackMutedIndicator
                      source={Track.Source.Microphone}
                      show={'muted'}
                    ></TrackMutedIndicator>
                    <ParticipantName />
                  </>
                ) : (
                  <>
                    <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
                    <ParticipantName>&apos;s screen</ParticipantName>
                  </>
                )}
              </div>
              <ConnectionQualityIndicator className="lk-participant-metadata-item" />
            </div>
          </>
        )}
        <FocusToggle trackSource={source} />
      </TrackRefContextIfNeeded>
    </div>
  );
};
