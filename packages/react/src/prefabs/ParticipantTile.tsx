import * as React from 'react';
import { Participant, Track } from 'livekit-client';
import {
  isParticipantSourcePinned,
  ParticipantClickEvent,
  setupParticipantTile,
} from '@livekit/components-core';
import { ConnectionQualityIndicator } from '../components/participant/ConnectionQualityIndicator';
import { MediaTrack } from '../components/participant/MediaTrack';
import { ParticipantName } from '../components/participant/ParticipantName';
import { TrackMutedIndicator } from '../components/participant/TrackMutedIndicator';
import {
  useMaybeParticipantContext,
  ParticipantContext,
  useEnsureParticipant,
  useMaybeLayoutContext,
} from '../context';
import { useIsMuted, useIsSpeaking } from '../hooks';
import { mergeProps } from '../utils';
import { FocusToggle } from '../components/controls/FocusToggle';
import { ParticipantPlaceholder } from '../assets/images';
import { ScreenShareIcon } from '../assets/icons';

export type ParticipantTileProps = React.HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
};

export function useParticipantTile<T extends React.HTMLAttributes<HTMLElement>>({
  participant,
  trackSource,
  onParticipantClick,
  props,
}: {
  participant: Participant;
  trackSource: Track.Source;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
  props: T;
}) {
  const p = useEnsureParticipant(participant);
  const mergedProps = React.useMemo(() => {
    const { className } = setupParticipantTile();
    return mergeProps(props, {
      className,
      onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        props.onClick?.(event);
        if (typeof onParticipantClick === 'function') {
          const track = p.getTrack(trackSource);
          onParticipantClick({ participant: p, track });
        }
      },
    });
  }, [props]);
  const isVideoMuted = useIsMuted({ source: Track.Source.Camera, participant });
  const isAudioMuted = useIsMuted({ source: Track.Source.Microphone, participant });
  const isSpeaking = useIsSpeaking(participant);
  return {
    elementProps: {
      'data-lk-audio-muted': isAudioMuted,
      'data-lk-video-muted': isVideoMuted,
      'data-lk-speaking': isSpeaking,
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': trackSource,
      ...mergedProps,
    },
  };
}

export function ParticipantContextIfNeeded(
  props: React.PropsWithChildren<{
    participant?: Participant;
  }>,
) {
  const hasContext = !!useMaybeParticipantContext();
  return props.participant && !hasContext ? (
    <ParticipantContext.Provider value={props.participant}>
      {props.children}
    </ParticipantContext.Provider>
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
 * {...}
 *   <ParticipantTile>
 *     {...}
 *   </ParticipantTile>
 * {...}
 * ```
 *
 * @see `ParticipantLoop` component
 */
export const ParticipantTile = ({
  participant,
  children,
  trackSource = Track.Source.Camera,
  onParticipantClick,
  ...htmlProps
}: ParticipantTileProps) => {
  const trackSource_ = trackSource;
  const p = useEnsureParticipant(participant);

  const { elementProps } = useParticipantTile({
    participant: p,
    props: htmlProps,
    trackSource: trackSource_,
    onParticipantClick,
  });

  const layoutContext = useMaybeLayoutContext();

  const handleSubscribe = React.useCallback(
    (subscribed: boolean) => {
      if (
        trackSource &&
        !subscribed &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isParticipantSourcePinned(p, trackSource, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' });
      }
    },
    [p, layoutContext, trackSource],
  );

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <ParticipantContextIfNeeded participant={participant}>
        {children ?? (
          <>
            <MediaTrack source={trackSource_} onSubscriptionStatusChanged={handleSubscribe} />
            <div className="lk-participant-placeholder">
              <ParticipantPlaceholder />
            </div>
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                {trackSource_ === Track.Source.Camera ? (
                  <>
                    <TrackMutedIndicator
                      source={Track.Source.Microphone}
                      showMutedOnly={true}
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
        <FocusToggle trackSource={trackSource_} />
      </ParticipantContextIfNeeded>
    </div>
  );
};
