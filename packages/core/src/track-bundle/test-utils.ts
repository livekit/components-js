import { Participant, Track, TrackPublication } from 'livekit-client';
import {
  trackBundleId,
  TrackBundlePlaceholder,
  TrackBundlePublished,
  TrackBundleSubscribed,
  TrackBundleWithPlaceholder,
} from './track-bundle.types';

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

export const mockTrackBundleSubscribed = (
  id: string,
  source: Track.Source,
): TrackBundleSubscribed => {
  const kind = [Track.Source.Camera, Track.Source.ScreenShare].includes(source)
    ? Track.Kind.Video
    : Track.Kind.Audio;
  return {
    participant: new Participant(`${id}`, `${id}`),
    publication: new TrackPublication(kind, `${id}`, `${id}`),
    track: {} as Track,
  };
};

export function flatTrackBundleArray(list: TrackBundleWithPlaceholder[]): string[] {
  return list.map((trackBundle) => trackBundleId(trackBundle));
}
