/**
 * Internal test function.
 *
 * @internal
 */

import { Participant, Track, TrackPublication } from 'livekit-client';
import { UpdatableItem } from '../sorting/tile-array-update';
import {
  TrackBundlePlaceholder,
  TrackBundlePublished,
  TrackBundleSubscribed,
} from './track-bundle.types';
import { getTrackBundleId } from './track-bundle.utils';

// Test function:
export const mockTrackBundlePlaceholder = (
  id: string,
  source: Track.Source,
): TrackBundlePlaceholder => {
  return { participant: new Participant(`${id}`, `${id}`), source };
};

export const mockTrackBundlePublished = (
  id: string,
  source: Track.Source,
): TrackBundlePublished => {
  const kind = [Track.Source.Camera, Track.Source.ScreenShare].includes(source)
    ? Track.Kind.Video
    : Track.Kind.Audio;
  return {
    participant: new Participant(`${id}`, `${id}`),
    publication: new TrackPublication(kind, `${id}`, `${id}`),
  };
};

type mockTrackBundleSubscribedOptions = {
  mockPublication?: boolean;
  mockParticipant?: boolean;
  mockIsLocal?: boolean;
};

export const mockTrackBundleSubscribed = (
  id: string,
  source: Track.Source,
  options: mockTrackBundleSubscribedOptions = {},
): TrackBundleSubscribed => {
  const kind = [Track.Source.Camera, Track.Source.ScreenShare].includes(source)
    ? Track.Kind.Video
    : Track.Kind.Audio;
  return {
    participant: options.mockParticipant
      ? (mockParticipant(id, options.mockIsLocal ?? false) as Participant)
      : new Participant(`${id}`, `${id}`),
    publication: options.mockPublication
      ? (mockTrackPublication(id, kind, source) as TrackPublication)
      : new TrackPublication(kind, `${id}`, `${id}`),
    track: {} as Track,
  };
};

const mockTrackPublication = (
  id: string,
  kind: Track.Kind,
  source: Track.Source,
): Pick<TrackPublication, 'kind' | 'trackSid' | 'trackName' | 'source'> => {
  return {
    kind,
    trackSid: id,
    trackName: `name_${id}`,
    source: source,
  };
};

function mockParticipant(
  id: string,
  isLocal: boolean,
): Pick<Participant, 'sid' | 'identity' | 'isLocal'> {
  return {
    sid: `${id}_sid`,
    identity: `${id}`,
    isLocal: isLocal,
  };
}

export function flatTrackBundleArray<T extends UpdatableItem>(list: T[]): string[] {
  return list.map((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return `${item}`;
    } else {
      return getTrackBundleId(item);
    }
  });
}
