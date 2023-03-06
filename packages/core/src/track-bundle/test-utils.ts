import { Participant, Track, TrackPublication } from 'livekit-client';
import { UpdatableItem } from '../sorting/tile-array-update';
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

export function flatTrackBundleArray<T extends UpdatableItem>(list: T[]): string[] {
  return list.map((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return `${item}`;
    } else {
      return trackBundleId(item);
    }
  });
}
