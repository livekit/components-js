/**
 * Internal test function.
 *
 * @internal
 */

import { Participant, Track, TrackPublication } from 'livekit-client';
import { UpdatableItem } from '../sorting/tile-array-update';
import {
  TrackReferencePlaceholder,
  TrackReferencePublished,
  TrackReferenceSubscribed,
} from './track-reference.types';
import { getTrackReferenceId } from './track-reference.utils';

// Test function:
export const mockTrackReferencePlaceholder = (
  id: string,
  source: Track.Source,
): TrackReferencePlaceholder => {
  return { participant: new Participant(`${id}`, `${id}`), source };
};

export const mockTrackReferencePublished = (
  id: string,
  source: Track.Source,
): TrackReferencePublished => {
  const kind = [Track.Source.Camera, Track.Source.ScreenShare].includes(source)
    ? Track.Kind.Video
    : Track.Kind.Audio;
  return {
    participant: new Participant(`${id}`, `${id}`),
    publication: new TrackPublication(kind, `${id}`, `${id}`),
  };
};

type mockTrackReferenceSubscribedOptions = {
  mockPublication?: boolean;
  mockParticipant?: boolean;
  mockIsLocal?: boolean;
};

export const mockTrackReferenceSubscribed = (
  id: string,
  source: Track.Source,
  options: mockTrackReferenceSubscribedOptions = {},
): TrackReferenceSubscribed => {
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

export function flatTrackReferenceArray<T extends UpdatableItem>(list: T[]): string[] {
  return list.map((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return `${item}`;
    } else {
      return getTrackReferenceId(item);
    }
  });
}
