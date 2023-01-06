import * as React from 'react';
import { Participant, Track, TrackPublication } from 'livekit-client';
import { setupParticipantTile } from '@livekit/components-core';
import { mergeProps } from '../../utils';
import {
  ParticipantContext,
  useEnsureParticipant,
  useMaybeParticipantContext,
  useMaybePinContext,
} from '../../contexts';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { TrackMutedIndicator } from './TrackMutedIndicator';
import { MediaTrack } from './MediaTrack';
import { ParticipantName } from './ParticipantName';
import { useIsMuted, useIsSpeaking } from '../../hooks';

export interface ParticipantClickEvent {
  participant?: Participant;
  publication?: TrackPublication;
}

export type ParticipantTileProps = React.HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
};

function useParticipantTile<T extends React.HTMLAttributes<HTMLElement>>({
  participant,
  props,
}: {
  participant: Participant;
  props: T;
}) {
  const mergedProps = React.useMemo(() => {
    const { className } = setupParticipantTile();
    return mergeProps(props, { className });
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
      ...mergedProps,
    },
  };
}

function ParticipantContextIfNeeded(
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
  onParticipantClick,
  trackSource,
  ...htmlProps
}: ParticipantTileProps) => {
  const p = useEnsureParticipant(participant);
  const { elementProps } = useParticipantTile({ participant: p, props: htmlProps });

  const pinContext = useMaybePinContext();

  const clickHandler = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    elementProps.onClick?.(evt);
    onParticipantClick?.({ participant: p });
    if (pinContext.dispatch && trackSource) {
      const track = p.getTrack(trackSource);
      if (track) {
        pinContext.dispatch({
          msg: 'set_pin',
          trackParticipantPair: {
            participant: p,
            track,
          },
        });
      }
    }
  };

  return (
    <div style={{ position: 'relative' }} {...elementProps} onClick={clickHandler}>
      <ParticipantContextIfNeeded participant={participant}>
        {children ?? (
          <>
            <MediaTrack source={trackSource ?? Track.Source.Camera}></MediaTrack>
            <div
              style={{
                position: 'absolute',
                right: '.25rem',
                bottom: '.25rem',
                left: '.25rem',
                display: 'flex',
                flexDirection: 'row',
                gap: '.5rem',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '.25rem .375rem .25rem .25rem',
                  backgroundColor: 'rgba(0,0,0,.15)',
                  borderRadius: '.25rem',
                }}
              >
                <TrackMutedIndicator source={Track.Source.Microphone}></TrackMutedIndicator>
                <ParticipantName />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '.25rem',
                  backgroundColor: 'rgba(0,0,0,.15)',
                  borderRadius: '.25rem',
                }}
              >
                <ConnectionQualityIndicator />
              </div>
            </div>
          </>
        )}
      </ParticipantContextIfNeeded>
    </div>
  );
};
