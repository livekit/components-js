import { Participant, Track, TrackPublication } from 'livekit-client';
import {
  trackBundleId,
  TrackBundlePlaceholder,
  TrackBundlePublished,
  TrackBundleSubscribed,
} from './track-bundle.types';

// Test function:
export const mockTrackBundlePlaceholder = (
  id: string,
  source: Track.Source,
): TrackBundlePlaceholder => {
  return { participant: new Participant(`sid_${id}`, `identity_${id}`), source };
};

export const mockTrackBundlePublished = (id: string, kind: Track.Kind): TrackBundlePublished => {
  return {
    participant: new Participant(`sid_${id}`, `identity_${id}`),
    publication: new TrackPublication(kind, `id_${id}`, `name_${id}`),
  };
};
export const mockTrackBundleSubscribed = (id: string, kind: Track.Kind): TrackBundleSubscribed => {
  return {
    participant: new Participant(`sid_${id}`, `identity_${id}`),
    publication: new TrackPublication(kind, `id_${id}`, `name_${id}`),
    track: {} as Track,
  };
};

export function flatTrackBundleArray(list: TrackBundlePlaceholder[]): string[] {
  return list.map((trackBundle) => trackBundleId(trackBundle));
}
