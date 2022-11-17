import * as React from 'react';
import { Participant, Track, TrackPublication } from 'livekit-client';
import {
  mutedObserver,
  createIsSpeakingObserver,
  setupParticipantView,
  setupMediaTrack,
} from '@livekit/components-core';
import { mergeProps } from '../../utils';
import {
  ParticipantContext,
  useEnsureParticipant,
  useMaybeParticipantContext,
  useMaybePinContext,
} from '../../contexts';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { MediaMutedIndicator } from './MediaMutedIndicator';
import { MediaTrack } from './MediaTrack';
import { ParticipantName } from './ParticipantName';

export interface ParticipantClickEvent {
  participant?: Participant;
  publication?: TrackPublication;
}

export type ParticipantProps = React.HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
};

export const useMediaTrack = (
  participant: Participant,
  source: Track.Source,
  element?: React.RefObject<HTMLMediaElement>,
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>,
) => {
  const [publication, setPublication] = React.useState(participant.getTrack(source));
  const [isMuted, setMuted] = React.useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = React.useState(publication?.isSubscribed);
  const [track, setTrack] = React.useState(publication?.track);
  const previousElement = React.useRef<HTMLMediaElement | undefined | null>();

  const { className, trackObserver } = React.useMemo(() => {
    return setupMediaTrack(participant, source);
  }, [participant, source]);

  React.useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [trackObserver]);

  React.useEffect(() => {
    if (track) {
      if (previousElement.current) {
        track.detach(previousElement.current);
      }
      if (element?.current) {
        track.attach(element.current);
      }
    }
    previousElement.current = element?.current;
  }, [track, element]);

  return {
    publication,
    isMuted,
    isSubscribed,
    track,
    elementProps: mergeProps(props, {
      className,
      'data-lk-local-participant': participant.isLocal,
      'data-lk-source': source,
    }),
  };
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

export function useIsSpeaking(participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const [isSpeaking, setIsSpeaking] = React.useState(p.isSpeaking);

  React.useEffect(() => {
    const subscription = createIsSpeakingObserver(p).subscribe(setIsSpeaking);
    return () => subscription.unsubscribe();
  });

  return isSpeaking;
}

export function useIsMuted(source: Track.Source, participant?: Participant) {
  const p = useEnsureParticipant(participant);
  const [isMuted, setIsMuted] = React.useState(!!p.getTrack(source)?.isMuted);

  React.useEffect(() => {
    const listener = mutedObserver(p, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  });

  return isMuted;
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
 * This component can be used as a child of the `Participants` component or independently if a participant is passed as a property.
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
 * @see `Participants` component
 */
export const ParticipantView = ({
  participant,
  children,
  onParticipantClick,
  trackSource,
  ...htmlProps
}: ParticipantProps) => {
  const p = useEnsureParticipant(participant);
  const { elementProps } = useParticipantView(p, htmlProps);

  const pinContext = useMaybePinContext();

  const clickHandler = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    elementProps.onClick?.(evt);
    onParticipantClick?.({ participant: p });
    if (pinContext && pinContext.dispatch) {
      console.log('handleParticipantClick', p);
      pinContext.dispatch({
        msg: 'set_pin',
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
                gap: '8px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex' }}>
                <MediaMutedIndicator source={Track.Source.Microphone}></MediaMutedIndicator>
                <MediaMutedIndicator source={Track.Source.Camera}></MediaMutedIndicator>
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
