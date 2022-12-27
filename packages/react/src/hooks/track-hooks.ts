import {
  isParticipantTrackPinned,
  setupMediaTrack,
  trackObservable,
  TrackParticipantPair,
} from '@livekit/components-core';
import { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import { useMaybePinContext } from '../contexts';
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

export type TracksFilter = Parameters<TrackParticipantPair[]['filter']>['0'];
type UseTracksProps = {
  sources: Track.Source[];
  excludePinnedTracks?: boolean;
  filter?: TracksFilter;
  filterDependencies?: Array<any>;
};

/**
 * The useTracks hook returns Array<TrackParticipantPair> which combine the track and the corresponding participant of the track.
 * Only tracks with a the same source specified via the sources property get included in the loop.
 * Further narrowing the loop items is possible by providing a `filter` function or setting the `excludePinnedTrack` property.
 *
 * @example
 * ```ts
 * const pairs = useTracks({sources: [Track.Source.Camera], excludePinnedTracks: false})
 * ```
 */
export function useTracks({
  sources,
  excludePinnedTracks = true,
  filter,
  filterDependencies = [],
}: UseTracksProps) {
  const participants = useParticipants();
  const pinContext = useMaybePinContext();

  const pairs: TrackParticipantPair[] = React.useMemo(() => {
    let sourceParticipantPairs: TrackParticipantPair[] = [];
    if (sources.length === 0) {
      console.warn(`You used the 'useTracks' hook with an empty sources array – no tracks will be returned.
    This is probably not intended. Make sure you pass all the wanted tracks to the sources array.
    `);
      return [];
    }

    participants.forEach((p) => {
      // Add camera track
      if (sources.includes(Track.Source.Camera) && p.isCameraEnabled) {
        const track = p.getTrack(Track.Source.Camera);
        if (track) {
          sourceParticipantPairs.push({ track: track, participant: p });
        }
      }
      // Add screen share track
      if (sources.includes(Track.Source.ScreenShare) && p.isScreenShareEnabled) {
        const track = p.getTrack(Track.Source.ScreenShare);
        if (track) {
          sourceParticipantPairs.push({ track: track, participant: p });
        }
      }
      // Add microphone track
      if (sources.includes(Track.Source.Microphone) && p.isMicrophoneEnabled) {
        const track = p.getTrack(Track.Source.Microphone);
        if (track) {
          sourceParticipantPairs.push({ track: track, participant: p });
        }
      }
      // Add screen share audio track
      if (sources.includes(Track.Source.ScreenShareAudio) && p.isScreenShareEnabled) {
        const track = p.getTrack(Track.Source.ScreenShareAudio);
        if (track) {
          sourceParticipantPairs.push({ track: track, participant: p });
        }
      }
      // Add unknown track
      if (sources.includes(Track.Source.Unknown)) {
        const track = p.getTrack(Track.Source.Unknown);
        if (track) {
          sourceParticipantPairs.push({ track: track, participant: p });
        }
      }
    });

    if (excludePinnedTracks && pinContext) {
      sourceParticipantPairs = sourceParticipantPairs.filter((trackParticipantPair) =>
        isParticipantTrackPinned(trackParticipantPair, pinContext.state),
      );
    }

    if (filter) {
      sourceParticipantPairs = sourceParticipantPairs.filter(filter);
    }

    return sourceParticipantPairs;
  }, [participants, pinContext, excludePinnedTracks, sources, filter, ...filterDependencies]);

  return pairs;
}
