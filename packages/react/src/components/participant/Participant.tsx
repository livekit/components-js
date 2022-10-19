import React, {
  HTMLAttributes,
  RefObject,
  useEffect,
  useState,
  useMemo,
  useRef,
  ReactNode,
  useContext,
} from 'react';
import { Participant, ParticipantEvent, Track, TrackPublication } from 'livekit-client';
import {
  mutedObserver,
  createIsSpeakingObserver,
  setupParticipantView,
  setupMediaTrack,
} from '@livekit/components-core';
import { mergeProps } from '../../utils';
import {
  ParticipantContext,
  PinContext,
  useMaybeParticipantContext,
  useParticipantContext,
} from '../../contexts';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { MediaMutedIndicator } from './MediaMutedIndicator';
import { MediaTrack } from './MediaTrack';
import { ParticipantName } from './ParticipantName';

export interface ParticipantClickEvent {
  participant?: Participant;
  publication?: TrackPublication;
}

export type ParticipantProps = HTMLAttributes<HTMLDivElement> & {
  participant?: Participant;
  trackSource?: Track.Source;
  onParticipantClick?: (evt: ParticipantClickEvent) => void;
};

export const useMediaTrack = (
  participant: Participant,
  source: Track.Source,
  element?: RefObject<HTMLMediaElement>,
  props?: HTMLAttributes<HTMLVideoElement | HTMLAudioElement>,
) => {
  const [publication, setPublication] = useState(participant.getTrack(source));
  const [isMuted, setMuted] = useState(publication?.isMuted);
  const [isSubscribed, setSubscribed] = useState(publication?.isSubscribed);
  const [track, setTrack] = useState(publication?.track);
  const previousElement = useRef<HTMLMediaElement | undefined | null>();

  const { className, trackObserver } = useMemo(() => {
    return setupMediaTrack(participant, source);
  }, [participant, source]);

  useEffect(() => {
    const subscription = trackObserver.subscribe((publication) => {
      setPublication(publication);
      setMuted(publication?.isMuted);
      setSubscribed(publication?.isSubscribed);
      setTrack(publication?.track);
    });
    return () => subscription?.unsubscribe();
  }, [trackObserver]);

  useEffect(() => {
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
    elementProps: mergeProps(props, { className }),
  };
};

function useParticipantView<T extends HTMLAttributes<HTMLElement>>(
  participant: Participant,
  props: T,
) {
  const mergedProps = useMemo(() => {
    const { className } = setupParticipantView();
    return mergeProps(props, { className });
  }, [props]);
  const isVideoMuted = useIsMuted(Track.Source.Camera, participant);
  const isAudioMuted = useIsMuted(Track.Source.Microphone, participant);
  const isSpeaking = useIsSpeaking(participant);
  const isLocal = useIsLocalParticipant(participant);
  return {
    elementProps: {
      'data-lk-audio-muted': isAudioMuted,
      'data-lk-video-muted': isVideoMuted,
      'data-lk-speaking': isSpeaking,
      'data-lk-local-participant': isLocal,
      ...mergedProps,
    },
  };
}

export function useIsSpeaking(participant?: Participant) {
  const p = participant ?? useParticipantContext();
  const [isSpeaking, setIsSpeaking] = useState(p.isSpeaking);

  useEffect(() => {
    const subscription = createIsSpeakingObserver(p).subscribe(setIsSpeaking);
    return () => subscription.unsubscribe();
  });

  return isSpeaking;
}

export function useIsMuted(source: Track.Source, participant?: Participant) {
  const p = participant ?? useParticipantContext();
  const [isMuted, setIsMuted] = useState(!!p.getTrack(source)?.isMuted);

  useEffect(() => {
    const listener = mutedObserver(p, source).subscribe(setIsMuted);
    return () => listener.unsubscribe();
  });

  return isMuted;
}

export function useIsLocalParticipant(participant?: Participant) {
  const p = participant ?? useParticipantContext();
  const isLocal = useMemo(() => p.isLocal, [p]);
  return isLocal;
}

function ParticipantContextIfNeeded(props: {
  children?: ReactNode | ReactNode[];
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

export const ParticipantView = ({
  participant,
  children,
  onParticipantClick,
  trackSource,
  ...htmlProps
}: ParticipantProps) => {
  const p = participant ?? useParticipantContext();
  const { elementProps } = useParticipantView(p, htmlProps);

  const pinContext = useContext(PinContext);

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
