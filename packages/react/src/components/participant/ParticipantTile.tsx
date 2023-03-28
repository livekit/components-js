import * as React from 'react';
import { Participant, Track, TrackPublication } from 'livekit-client';
import {
  isParticipantSourcePinned,
  ParticipantClickEvent,
  setupParticipantTile,
} from '@livekit/components-core';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { MediaTrack } from './MediaTrack';
import { ParticipantName } from './ParticipantName';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import {
  useMaybeParticipantContext,
  ParticipantContext,
  useEnsureParticipant,
  useMaybeLayoutContext,
} from '../../context';
import { useIsMuted, useIsSpeaking } from '../../hooks';
import { mergeProps } from '../../utils';
import { FocusToggle } from '../controls/FocusToggle';
import { ParticipantPlaceholder } from '../../assets/images';
import { ScreenShareIcon } from '../../assets/icons';

export type ParticipantTileProps = React.HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  source?: Track.Source;
  publication?: TrackPublication;
  onParticipantClick?: (event: ParticipantClickEvent) => void;
};

export function useParticipantTile<T extends React.HTMLAttributes<HTMLElement>>({
  participant,
  source,
  publication,
  onParticipantClick,
  props,
}: {
  participant: Participant;
  source: Track.Source;
  publication?: TrackPublication;
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
          const track = publication ?? p.getTrack(source);
          onParticipantClick({ participant: p, track });
        }
      },
    });
  }, [props, source, onParticipantClick, p, publication]);
  const isVideoMuted = useIsMuted(Track.Source.Camera, { participant });
  const isAudioMuted = useIsMuted(Track.Source.Microphone, { participant });
  const isSpeaking = useIsSpeaking(participant);
  return {
    elementProps: {
      'data-lk-audio-muted': isAudioMuted,
      'data-lk-video-muted': isVideoMuted,
      'data-lk-speaking': isSpeaking,
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': source,
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
  source = Track.Source.Camera,
  onParticipantClick,
  publication,
  ...htmlProps
}: ParticipantTileProps) => {
  const p = useEnsureParticipant(participant);

  const { elementProps } = useParticipantTile({
    participant: p,
    props: htmlProps,
    source,
    publication,
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
        isParticipantSourcePinned(p, source, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' });
      }
    },
    [p, layoutContext, source],
  );

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <ParticipantContextIfNeeded participant={p}>
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
      </ParticipantContextIfNeeded>
    </div>
  );
};
