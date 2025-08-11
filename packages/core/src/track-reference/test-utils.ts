/**
 * Internal test function.
 *
 * @internal
 */

import { Participant, RemoteTrackPublication, Track, TrackPublication } from 'livekit-client';
import type { UpdatableItem } from '../sorting/tile-array-update';
import type { TrackReference, TrackReferencePlaceholder } from './track-reference.types';
import { getTrackReferenceId } from './track-reference.utils';
import { TrackInfo } from '@livekit/protocol';

// Test function:
export const mockTrackReferencePlaceholder = (
  id: string,
  source: Track.Source,
): TrackReferencePlaceholder => {
  return { participant: new Participant(`${id}`, `${id}`), source };
};

export const mockTrackReferencePublished = (id: string, source: Track.Source): TrackReference => {
  const kind = [Track.Source.Camera, Track.Source.ScreenShare].includes(source)
    ? Track.Kind.Video
    : Track.Kind.Audio;
  const trackInfo = new TrackInfo({
    sid: `${id}`,
    name: `${id}`,
    muted: false,
  });
  return {
    participant: new Participant(`${id}`, `${id}`),
    publication: new RemoteTrackPublication(kind, trackInfo, true),
    source: source,
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
): TrackReference => {
  const kind = [Track.Source.Camera, Track.Source.ScreenShare].includes(source)
    ? Track.Kind.Video
    : Track.Kind.Audio;
  const trackInfo = new TrackInfo({
    sid: `${id}`,
    name: `${id}`,
    muted: false,
  });
  const publication = new RemoteTrackPublication(kind, trackInfo, true);
  // @ts-expect-error
  publication.track = {};
  return {
    participant: options.mockParticipant
      ? (mockParticipant(id, options.mockIsLocal ?? false) as Participant)
      : new Participant(`${id}`, `${id}`),
    publication: options.mockPublication
      ? (mockTrackPublication(`publicationId(${id})`, kind, source) as TrackPublication)
      : publication,
    source,
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
