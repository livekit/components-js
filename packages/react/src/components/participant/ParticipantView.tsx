import * as React from 'react';
import { Participant, Track, TrackPublication } from 'livekit-client';
import { setupParticipantView } from '@livekit/components-core';
import { mergeProps } from '../../utils';
import {
  ParticipantContext,
  useEnsureParticipant,
  useMaybeParticipantContext,
  useMaybeFocusContext,
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

export type ParticipantViewProps = React.HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
};

function useParticipantView<T extends React.HTMLAttributes<HTMLElement>>(
  participant: Participant,
  props: T,
) {
  const mergedProps = React.useMemo(() => {
    const { className } = setupParticipantView();
    return mergeProps(props, { className });
  }, [props]);
  const isVideoMuted = useIsMuted(Track.Source.Camera, participant);
  const isAudioMuted = useIsMuted(Track.Source.Microphone, participant);
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

function ParticipantContextIfNeeded(props: {
  children?: React.ReactNode | React.ReactNode[];
  participant?: Participant;
}) {
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
 * The ParticipantView component is the base component or wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `ParticipantsLoop` component or independently if a participant is passed as a property.
 * You can use a combination of LiveKit components and normal HTML elements to design the Participant Representation as you wish.
 *
 * @example
 * ```tsx
 * {...}
 *   <ParticipantView>
 *     {...}
 *   </ParticipantView>
 * {...}
 * ```
 *
 * @see `ParticipantsLoop` component
 */
export const ParticipantView = ({
  participant,
  children,
  onParticipantClick,
  trackSource,
  ...htmlProps
}: ParticipantViewProps) => {
  const p = useEnsureParticipant(participant);
  const { elementProps } = useParticipantView(p, htmlProps);

  const pinContext = useMaybeFocusContext();

  const clickHandler = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    elementProps.onClick?.(evt);
    onParticipantClick?.({ participant: p });
    if (pinContext && pinContext.dispatch) {
      console.log('handleParticipantClick', p);
      pinContext.dispatch({
        msg: 'set_focus',
        participant: p,
        source: trackSource || Track.Source.Camera,
      });
    }
  };

  return (
    <div {...elementProps} onClick={clickHandler}>
      <ParticipantContextIfNeeded participant={participant}>
        {children ?? (
          <>
            <MediaTrack source={trackSource ?? Track.Source.Camera}></MediaTrack>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '.5rem',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex' }}>
                <TrackMutedIndicator source={Track.Source.Microphone}></TrackMutedIndicator>
                <TrackMutedIndicator source={Track.Source.Camera}></TrackMutedIndicator>
              </div>
              <ParticipantName />
              <ConnectionQualityIndicator />
            </div>
          </>
        )}
      </ParticipantContextIfNeeded>
    </div>
  );
};
