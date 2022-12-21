import { setupMediaTrack, trackObservable } from '@livekit/components-core';
import { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { usePinContext } from '../contexts';
import { mergeProps } from '../utils';
import { useParticipants } from './participant-hooks';

interface UseMediaTrackProps {
  participant: Participant;
  source: Track.Source;
  element?: React.RefObject<HTMLMediaElement>;
  props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}

export const useMediaTrack = ({ participant, source, element, props }: UseMediaTrackProps) => {
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

interface UseTrackProps {
  pub?: TrackPublication;
}

export function useTrack({ pub }: UseTrackProps) {
  const [publication, setPublication] = React.useState(pub);
  const [track, setTrack] = React.useState(pub?.track);
  React.useEffect(() => {
    if (!pub) return;
    const listener = trackObservable(pub).subscribe((p) => {
      if (p.track !== track) {
        track?.detach();
      }
      setPublication(p);
      setTrack(p.isSubscribed ? p.track : undefined);
    });
    setTrack(pub?.track);
    setPublication(pub);
    return () => listener.unsubscribe();
  }, [pub, track]);

  return { publication, track };
}

export type TrackSourceParticipantPair = { source: Track.Source; participant: Participant };
export type TracksFilter = Parameters<TrackSourceParticipantPair[]['filter']>['0'];
type UseTracksProps = {
  sources: Track.Source[];
  excludePinnedTracks?: boolean;
  filter?: TracksFilter;
  filterDependencies?: Array<any>;
};

/**
 * The useVideoTracks hook returns a array of objects containing the track source `camera` or `screen_share` and the participant.
 * This is helpful for looping over all camera and screen_share tracks.
 *
 * @example
 * ```ts
 * const pairs = useVideoTracks({excludePinnedTracks: false})
 * ```
 */
export function useTracks({
  sources,
  excludePinnedTracks = true,
  filter,
  filterDependencies = [],
}: UseTracksProps) {
  const participants = useParticipants();
  const pinContext = usePinContext();

  const pairs: TrackSourceParticipantPair[] = React.useMemo(() => {
    let sourceParticipantPairs: TrackSourceParticipantPair[] = [];
    console.log('sources', { sources });
    if (sources.length === 0) {
      console.warn(`You used the 'useTracks' hook with an empty sources array – no tracks will be returned.
    This is probably not intended. Make sure you pass all the wanted tracks to the sources array.
    `);
      return [];
    }

    participants.forEach((p) => {
      // Add camera track
      if (sources.includes(Track.Source.Camera) && p.isCameraEnabled) {
        sourceParticipantPairs.push({ source: Track.Source.Camera, participant: p });
      }
      // Add screen share track
      if (sources.includes(Track.Source.ScreenShare) && p.isScreenShareEnabled) {
        sourceParticipantPairs.push({ source: Track.Source.ScreenShare, participant: p });
      }
      // Add microphone track
      if (sources.includes(Track.Source.Microphone) && p.isMicrophoneEnabled) {
        sourceParticipantPairs.push({ source: Track.Source.Microphone, participant: p });
      }
      // Add screen share audio track
      if (sources.includes(Track.Source.ScreenShareAudio) && p.isScreenShareEnabled) {
        sourceParticipantPairs.push({ source: Track.Source.ScreenShareAudio, participant: p });
      }
      // Add unknown track
      if (sources.includes(Track.Source.Unknown)) {
        sourceParticipantPairs.push({ source: Track.Source.Unknown, participant: p });
      }
    });

    if (excludePinnedTracks) {
      sourceParticipantPairs = sourceParticipantPairs.filter(({ source, participant }) =>
        pinContext.state?.pinnedSource === source &&
        participant === pinContext.state.pinnedParticipant
          ? false
          : true,
      );
    }

    if (filter) {
      sourceParticipantPairs = sourceParticipantPairs.filter(filter);
    }

    return sourceParticipantPairs;
  }, [participants, pinContext, excludePinnedTracks, sources, filter, ...filterDependencies]);

  return pairs;
}
